// AuthContext.js
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    increment,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    startAt,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import Colors from './constants/Colors';
import { auth, db, storage } from './firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const convertFirestoreTimestampToISO = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        try {
            const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
            return new Date(milliseconds).toISOString();
        } catch (e) {
            console.warn("AuthContext: Erro ao converter Timestamp de objeto puro para ISO:", timestamp, e);
            return null;
        }
    };
    return timestamp || null;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userLikedPosts, setUserLikedPosts] = useState({});
    const [userFollowing, setUserFollowing] = useState({});
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    const userProfileCache = {};

    const getMultipleUserProfilesById = useCallback(async (uids) => {
        const profiles = {};
        const uidsToFetch = new Set();

        uids.forEach(uid => {
            if (uid && typeof uid === 'string' && uid.trim() !== '') {
                if (userProfileCache[uid]) {
                    profiles[uid] = userProfileCache[uid];
                } else {
                    uidsToFetch.add(uid);
                }
            } else {
                console.warn("AuthContext: getMultipleUserProfilesById - UID inválido encontrado e ignorado:", uid);
            }
        });

        if (uidsToFetch.size === 0) {
            return profiles;
        }

        try {
            const profilePromises = Array.from(uidsToFetch).map(uid => getDoc(doc(db, 'users', uid)));
            const docSnaps = await Promise.all(profilePromises);

            docSnaps.forEach(docSnap => {
                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    profileData.followersCount = typeof profileData.followersCount === 'number' ? profileData.followersCount : 0;
                    profileData.followingCount = typeof profileData.followingCount === 'number' ? profileData.followingCount : 0;
                    profileData.profileCompleted = profileData.profileCompleted === true;
                    if (profileData.createdAt) {
                        profileData.createdAt = convertFirestoreTimestampToISO(profileData.createdAt);
                    }
                    profiles[docSnap.id] = profileData;
                    userProfileCache[docSnap.id] = profileData;
                } else {
                    profiles[docSnap.id] = {
                        username: 'Usuário Desconhecido', bio: '', userProfileImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
                        followersCount: 0, followingCount: 0, profileCompleted: false, createdAt: null, email: null,
                    };
                }
            });
            console.log(`AuthContext: Perfis de usuário carregados do Firestore (novos: ${uidsToFetch.size}).`);
            return profiles;
        } catch (profileError) {
            console.error('AuthContext: Erro ao carregar múltiplos perfis de usuário do Firestore:', profileError);
            return profiles;
        }
    }, []);

    const getUserProfileById = useCallback(async (uid) => {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.warn("AuthContext: getUserProfileById - UID não fornecido ou inválido.");
            return null;
        }
        if (userProfileCache[uid]) {
            return userProfileCache[uid];
        }
        const profiles = await getMultipleUserProfilesById([uid]);
        return profiles[uid] || null;
    }, [getMultipleUserProfilesById]);


    const fetchUserFollowing = useCallback(async (userId) => {
        if (!userId) {
            setUserFollowing({});
            return;
        }
        try {
            const followingRef = collection(db, 'users', userId, 'following');
            const q = query(followingRef);
            const querySnapshot = await getDocs(q);
            const followingMap = {};
            querySnapshot.forEach((doc) => {
                followingMap[doc.id] = true;
            });
            setUserFollowing(followingMap);
            console.log("AuthContext: Usuários seguidos pelo usuário carregados.");
        } catch (error) {
            console.error("AuthContext: Erro ao buscar usuários seguidos:", error);
            setUserFollowing({});
        }
    }, []);

    const fetchUserLikedPosts = useCallback(async (userId) => {
        if (!userId) {
            setUserLikedPosts({});
            return;
        }
        try {
            const likedPostsRef = collection(db, 'users', userId, 'likes');
            const q = query(likedPostsRef);
            const querySnapshot = await getDocs(q);
            const likedPostsMap = {};
            querySnapshot.forEach((doc) => {
                likedPostsMap[doc.id] = true;
            });
            setUserLikedPosts(likedPostsMap);
            console.log("AuthContext: Posts curtidos pelo usuário carregados.");
        } catch (error) {
            console.error("AuthContext: Erro ao buscar posts curtidos pelo usuário:", error);
            setUserLikedPosts({});
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('AuthContext: onAuthStateChanged - Usuário Firebase detectado:', user.uid);
                const profileData = await getUserProfileById(user.uid);

                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || profileData?.username || null,
                    photoURL: user.photoURL || profileData?.userProfileImage || null,
                    profileData: profileData || {},
                    profileCompleted: profileData ? profileData.profileCompleted : false,
                    userProfileImage: profileData?.userProfileImage || null,
                });
                console.log('AuthContext: currentUser atualizado pelo onAuthStateChanged:', {
                    uid: user.uid,
                    email: user.email,
                    profileCompleted: profileData ? profileData.profileCompleted : false,
                });

                await fetchUserLikedPosts(user.uid);
                await fetchUserFollowing(user.uid);

            } else {
                console.log('AuthContext: onAuthStateChanged - Nenhum usuário Firebase detectado.');
                setCurrentUser(null);
                setUserLikedPosts({});
                setUserFollowing({});
            }
            setAuthLoading(false);
            console.log('AuthContext: onAuthStateChanged - authLoading definido como false.');
        });

        return unsubscribe;
    }, [getUserProfileById, fetchUserLikedPosts, fetchUserFollowing]);

    useEffect(() => {
        let unsubscribeNotifications = () => {};

        if (currentUser && currentUser.uid) {
            const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
            const q = query(notificationsRef, where('read', '==', false));

            unsubscribeNotifications = onSnapshot(q, (snapshot) => {
                setUnreadNotificationsCount(snapshot.size);
                console.log(`AuthContext: Notificações não lidas atualizadas: ${snapshot.size}`);
            }, (error) => {
                console.error("AuthContext: Erro ao escutar notificações não lidas:", error);
            });
        } else {
            setUnreadNotificationsCount(0);
        }

        return () => unsubscribeNotifications();
    }, [currentUser]);


    const signup = useCallback(async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                profileCompleted: false,
                createdAt: Timestamp.now(),
                username: '', bio: '', userProfileImage: '',
                followersCount: 0,
                followingCount: 0,
            });
            console.log('AuthContext: Usuário registrado no Firebase e doc Firestore criado.');

            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                profileData: {
                    email: user.email,
                    profileCompleted: false,
                    createdAt: convertFirestoreTimestampToISO(Timestamp.now()),
                    username: '', bio: '', userProfileImage: '',
                    followersCount: 0,
                    followingCount: 0
                },
                profileCompleted: false,
                userProfileImage: null,
            });

            return user;
        } catch (error) {
            console.error('AuthContext: Erro no Cadastro:', error);
            Alert.alert('Erro no Cadastro', error.message);
            throw error;
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('AuthContext: Usuário logado no Firebase:', user.uid);

            const profileData = await getUserProfileById(user.uid);

            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || profileData?.username || null,
                photoURL: user.photoURL || profileData?.userProfileImage || null,
                profileData: profileData || {},
                profileCompleted: profileData ? profileData.profileCompleted : false,
                userProfileImage: profileData?.userProfileImage || null,
            });

            console.log('AuthContext: currentUser definido após login:', {
                uid: user.uid,
                email: user.email,
                profileCompleted: profileData ? profileData.profileCompleted : false,
            });

            await fetchUserLikedPosts(user.uid);
            await fetchUserFollowing(user.uid);

            return user;
        } catch (error) {
            console.error('AuthContext: Erro no Login:', error);
            Alert.alert('Erro no Login', error.message);
            throw error;
        }
    }, [getUserProfileById, fetchUserLikedPosts, fetchUserFollowing]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            console.log('AuthContext: Logout bem-sucedido. O listener do Firebase fará o resto.');
        } catch (error) {
            console.error('AuthContext: Erro ao fazer Logout:', error);
            Alert.alert('Erro ao fazer Logout', error.message);
            throw error;
        }
    }, []);

    const resetPassword = useCallback(async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Sucesso', 'Um e-mail de redefinição de senha foi enviado para ' + email);
        } catch (error) {
            console.error('AuthContext: Erro ao redefinir senha:', error);
            Alert.alert('Erro', 'Falha ao enviar e-mail de redefinição: ' + error.message);
            throw error;
        }
    }, []);

    const updateUserProfile = useCallback(async (userId, data) => {
        if (!userId) {
            Alert.alert('Erro', 'ID do usuário ausente para atualizar o perfil.');
            throw new Error('ID do usuário ausente.');
        }

        try {
            const userRef = doc(db, 'users', userId);
            const updateData = { ...data };

            if (updateData.profileCompleted === undefined) {
                updateData.profileCompleted = true;
            }

            console.log('AuthContext: Dados finais para atualização do perfil:', updateData);

            await setDoc(userRef, updateData, { merge: true });

            if (userProfileCache[userId]) {
                delete userProfileCache[userId];
                console.log(`AuthContext: Cache para o perfil do usuário ${userId} invalidado.`);
            }

            if (auth.currentUser && auth.currentUser.uid === userId) {
                const profileUpdates = {};
                if (data.username && auth.currentUser.displayName !== data.username) {
                    profileUpdates.displayName = data.username;
                }
                if (data.userProfileImage && auth.currentUser.photoURL !== data.userProfileImage) {
                    profileUpdates.photoURL = data.userProfileImage;
                }
                if (Object.keys(profileUpdates).length > 0) {
                    await updateProfile(auth.currentUser, profileUpdates);
                    console.log('AuthContext: Perfil do Firebase Auth atualizado.');
                }
            }

            const updatedProfileData = await getUserProfileById(userId);

            setCurrentUser(prevUser => {
                if (!prevUser || prevUser.uid !== userId) return prevUser;

                return {
                    ...prevUser,
                    displayName: updatedProfileData?.username || prevUser.displayName,
                    photoURL: updatedProfileData?.userProfileImage || prevUser.photoURL,
                    profileData: updatedProfileData || prevUser.profileData,
                    userProfileImage: updatedProfileData?.userProfileImage || null,
                    profileCompleted: updatedProfileData?.profileCompleted || false,
                };
            });

            console.log('AuthContext: Perfil do usuário atualizado no Firestore e localmente.');
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar perfil:', error);
            Alert.alert('Erro', 'Falha ao atualizar perfil: ' + error.message);
            throw error;
        }
    }, [getUserProfileById]);

    const uploadImageToFirebase = useCallback(async (uri, path) => {
        if (!uri) {
            console.warn('AuthContext: uploadImageToFirebase - URI da imagem é nula ou indefinida.');
            return null;
        }
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const storageRef = ref(storage, path);
            console.log(`AuthContext: Iniciando upload para ${path}`);
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log(`AuthContext: Upload concluído. URL: ${downloadURL}`);
            return downloadURL;
        } catch (error) {
            console.error('AuthContext: Erro ao fazer upload da imagem:', error);
            Alert.alert('Erro de Upload', 'Não foi possível fazer upload da imagem. Tente novamente.');
            throw error;
        }
    }, []);

    const getPosts = useCallback(async () => {
        try {
            console.log('AuthContext: Buscando posts...');
            const postsCollectionRef = collection(db, 'posts');
            const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const userIds = new Set();
            querySnapshot.docs.forEach(docSnap => userIds.add(docSnap.data().userId));

            const profilesMap = await getMultipleUserProfilesById(Array.from(userIds));

            const postsList = [];
            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data();
                const post = {
                    id: docSnapshot.id,
                    ...data,
                    createdAt: convertFirestoreTimestampToISO(data.createdAt),
                    likes: data.likes || 0,
                    comments: data.comments || 0, 
                };

                const userProfile = profilesMap[post.userId];
                if (userProfile) {
                    post.username = userProfile.username || 'Usuário Desconhecido';
                    post.userProfileImage = userProfile.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                } else {
                    post.username = 'Usuário Desconhecido';
                    post.userProfileImage = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                }

                let isLiked = false;
                if (currentUser && currentUser.uid) {
                    isLiked = userLikedPosts[post.id] === true;
                }
                post.isLiked = isLiked;

                postsList.push(post);
            }
            console.log('AuthContext: Posts carregados com sucesso.');
            return postsList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar posts:', error);
            return [];
        }
    }, [currentUser, getMultipleUserProfilesById, userLikedPosts]);

    const getPostById = useCallback(async (postId) => {
        if (!postId) {
            console.warn("AuthContext: getPostById - ID do post não fornecido.");
            return null;
        }
        try {
            console.log(`AuthContext: Buscando post com ID: ${postId}...`);
            const postRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postRef);

            if (!postDoc.exists()) {
                console.warn(`AuthContext: Post com ID ${postId} não encontrado.`);
                return null;
            }

            const data = postDoc.data();
            const post = {
                id: postDoc.id,
                ...data,
                createdAt: convertFirestoreTimestampToISO(data.createdAt),
                likes: data.likes || 0,
                comments: data.comments || 0,
            };

            const userProfile = await getUserProfileById(post.userId);
            if (userProfile) {
                post.username = userProfile.username || 'Usuário Desconhecido';
                post.userProfileImage = userProfile.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
            } else {
                post.username = 'Usuário Desconhecido';
                post.userProfileImage = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
            }

            let isLiked = false;
            if (currentUser && currentUser.uid) {
                isLiked = userLikedPosts[post.id] === true;
            }
            post.isLiked = isLiked;

            console.log(`AuthContext: Post ${postId} carregado com sucesso.`);
            return post;

        } catch (error) {
            console.error(`AuthContext: Erro ao buscar post ${postId}:`, error);
            return null;
        }
    }, [currentUser, getUserProfileById, userLikedPosts]);


    const getUserPosts = useCallback(async (userId) => {
        if (!userId) {
            console.warn("AuthContext: userId não fornecido para getUserPosts.");
            return [];
        }
        try {
            const postsCollectionRef = collection(db, 'posts');
            const q = query(postsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const userPostsList = [];
            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data();
                const post = {
                    id: docSnapshot.id,
                    ...data,
                    createdAt: data.createdAt ? convertFirestoreTimestampToISO(data.createdAt) : null,
                    likes: data.likes || 0,
                    comments: data.comments || 0, 
                };
                userPostsList.push(post);
            }
            console.log(`AuthContext: Posts do usuário ${userId} carregados com sucesso.`);
            return userPostsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar posts para o usuário ${userId}:`, error);
            return [];
        }
    }, []);


    const getUserHighlights = useCallback(async (userId) => {
        if (!userId) {
            console.warn("AuthContext: userId não fornecido para getUserHighlights.");
            return [];
        }
        try {
            const highlightsCollectionRef = collection(db, 'highlights');
            const q = query(highlightsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const userHighlightsList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? convertFirestoreTimestampToISO(data.createdAt) : null,
                };
            });
            console.log(`AuthContext: Highlights do usuário ${userId} carregados com sucesso.`);
            return userHighlightsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar highlights para o usuário ${userId}:`, error);
            return [];
        }
    }, []);

    const getStories = useCallback(async () => {
        try {
            const storiesCollectionRef = collection(db, 'stories');
            const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            const q = query(storiesCollectionRef, where('createdAt', '>=', twentyFourHoursAgo), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const storiesList = [];
            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data();
                const story = {
                    id: docSnapshot.id,
                    ...data,
                    createdAt: convertFirestoreTimestampToISO(data.createdAt),
                    mediaUrl: data.imageUrl || data.videoUrl || null,
                    mediaType: data.mediaType || (data.imageUrl ? 'image' : (data.videoUrl ? 'video' : null)),
                };
                storiesList.push(story);
            }

            if (storiesList.length === 0) {
                console.log('AuthContext: Nenhuma story real encontrada, retornando mocks.');
                return [
                    { id: 'mock-story-1', username: 'UsuárioStory1', userProfileImage: 'https://placehold.co/150x150/FF0000/FFFFFF?text=S1', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                    { id: 'mock-story-2', username: 'UsuárioStory2', userProfileImage: 'https://placehold.co/150x150/00FF00/FFFFFF?text=S2', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                    { id: 'mock-story-3', username: 'UsuárioStory3', userProfileImage: 'https://placehold.co/150x150/0000FF/FFFFFF?text=S3', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                ];
            }
            console.log('AuthContext: Stories carregadas com sucesso.');
            return storiesList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar stories:', error);
            return [
                { id: 'mock-story-error', username: 'ErroStory', userProfileImage: 'https://placehold.co/150x150/800000/FFFFFF?text=E1', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
            ];
        }
    }, []);

    const createPost = useCallback(async ({ mediaUrl, mediaType, caption, isStory }) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Nenhum usuário logado para criar uma publicação.');
            throw new Error('Nenhum usuário logado.');
        }

        if (!currentUser.profileData?.username || !currentUser.profileData?.userProfileImage) {
            Alert.alert('Erro', 'Perfil de usuário incompleto. Por favor, complete seu perfil (nome de usuário e imagem de perfil) primeiro.');
            throw new Error('Perfil de usuário incompleto.');
        }

        const collectionName = isStory ? 'stories' : 'posts';
        const postsCollectionRef = collection(db, collectionName);

        const postData = {
            userId: currentUser.uid,
            username: currentUser.profileData.username,
            userProfileImage: currentUser.profileData.userProfileImage,
            mediaUrl: mediaUrl,
            imageUrl: mediaType === 'image' ? mediaUrl : null,
            videoUrl: mediaType === 'video' ? mediaUrl : null,
            mediaType: mediaType,
            caption: caption,
            createdAt: Timestamp.now(),
            likes: 0,
            comments: 0,
            isStory: isStory,
        };

        const newDocRef = doc(postsCollectionRef);
        await setDoc(newDocRef, postData);

        console.log(`AuthContext: ${isStory ? 'Story' : 'Post'} criado com sucesso com ID: ${newDocRef.id}!`);
        return { id: newDocRef.id, ...postData, createdAt: convertFirestoreTimestampToISO(Timestamp.now()) };
    }, [currentUser]);

    // NOVO: Função para atualizar a legenda de uma postagem
    const updatePostCaption = useCallback(async (postId, newCaption) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para editar uma postagem.');
            throw new Error('Nenhum usuário logado.');
        }

        if (!newCaption || newCaption.trim() === '') {
            Alert.alert('Erro', 'A legenda não pode estar vazia.');
            throw new Error('Legenda vazia.');
        }

        try {
            const postRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postRef);

            if (!postDoc.exists()) {
                Alert.alert('Erro', 'Postagem não encontrada.');
                throw new Error('Postagem não encontrada.');
            }

            // Verifica se o usuário atual é o dono da postagem
            if (postDoc.data().userId !== currentUser.uid) {
                Alert.alert('Erro', 'Você só pode editar suas próprias postagens.');
                throw new Error('Permissão negada: Não é o dono da postagem.');
            }

            await updateDoc(postRef, { caption: newCaption });
            console.log(`AuthContext: Legenda da postagem ${postId} atualizada com sucesso.`);
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar legenda da postagem:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a legenda da postagem. Tente novamente.');
            throw error;
        }
    }, [currentUser]);


    const deletePost = useCallback(async (postId, postOwnerId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para deletar uma postagem.');
            throw new Error('Nenhum usuário logado.');
        }
        if (currentUser.uid !== postOwnerId) {
            Alert.alert('Erro', 'Você só pode deletar suas próprias postagens.');
            throw new Error('Permissão negada: Não é o dono da postagem.');
        }

        try {
            const postRef = doc(db, 'posts', postId);
            const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
            const userLikesCollectionRef = collection(db, 'users', currentUser.uid, 'likes');

            const batch = writeBatch(db);

            const commentsSnapshot = await getDocs(commentsCollectionRef);
            commentsSnapshot.docs.forEach((commentDoc) => {
                batch.delete(commentDoc.ref);
            });

            const userLikeDocRef = doc(userLikesCollectionRef, postId);
            const userLikeDocSnap = await getDoc(userLikeDocRef);
            if (userLikeDocSnap.exists()) {
                batch.delete(userLikeDocRef);
            }

            batch.delete(postRef);

            await batch.commit();

            console.log(`AuthContext: Postagem ${postId} e seus comentários/likes associados deletados com sucesso.`);
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao deletar postagem:', error);
            Alert.alert('Erro', 'Não foi possível deletar a postagem. Tente novamente.');
            throw error;
        }
    }, [currentUser]);


    const addNotification = useCallback(async ({ targetUserId, type, sourceUserId, postId = null, commentText = null, chatId = null, messageText = null }) => {
        if (!targetUserId || !sourceUserId || !type) {
            console.error('AuthContext: addNotification - Parâmetros essenciais ausentes.');
            return;
        }
        if (targetUserId === sourceUserId) {
            return;
        }

        try {
            const notificationsCollectionRef = collection(db, 'users', targetUserId, 'notifications');
            const newNotificationRef = doc(notificationsCollectionRef);

            const notificationData = {
                id: newNotificationRef.id,
                type: type,
                sourceUserId: sourceUserId,
                targetUserId: targetUserId,
                postId: postId,
                commentText: commentText,
                messageText: messageText,
                chatId: chatId,
                read: false,
                createdAt: Timestamp.now(),
            };

            await setDoc(newNotificationRef, notificationData);
            console.log(`AuthContext: Notificação de '${type}' adicionada para ${targetUserId} por ${sourceUserId}.`);
        } catch (error) {
            console.error('AuthContext: Erro ao adicionar notificação:', error);
        }
    }, []);

    const toggleLikePost = useCallback(async (postId, currentLikes, isCurrentlyLiked) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para curtir/descurtir.');
            throw new Error('Nenhum usuário logado.');
        }

        const postRef = doc(db, 'posts', postId);
        const userLikeRef = doc(db, 'users', currentUser.uid, 'likes', postId);

        try {
            const postDoc = await getDoc(postRef);
            if (!postDoc.exists()) {
                console.warn(`AuthContext: Post ${postId} não encontrado para alternar like.`);
                return isCurrentlyLiked;
            }
            const postOwnerId = postDoc.data().userId;

            let newLikedStatus = isCurrentlyLiked;

            if (isCurrentlyLiked) {
                await deleteDoc(userLikeRef);
                await updateDoc(postRef, { likes: Math.max(0, currentLikes - 1) });
                setUserLikedPosts(prevState => {
                    const newState = { ...prevState };
                    delete newState[postId];
                    return newState;
                });
                console.log(`AuthContext: Post ${postId} descurtido por ${currentUser.uid}`);
                newLikedStatus = false;
            } else {
                await setDoc(userLikeRef, { likedAt: Timestamp.now() });
                await updateDoc(postRef, { likes: currentLikes + 1 });
                setUserLikedPosts(prevState => ({
                    ...prevState,
                    [postId]: true
                }));
                console.log(`AuthContext: Post ${postId} curtido por ${currentUser.uid}`);
                newLikedStatus = true;

                addNotification({
                    targetUserId: postOwnerId,
                    type: 'like',
                    sourceUserId: currentUser.uid,
                    postId: postId,
                });
            }
            return newLikedStatus;

        } catch (error) {
            console.error("AuthContext: Erro ao alternar like:", error);
            Alert.alert('Erro', 'Não foi possível curtir/descurtir o post. Tente novamente.');
            throw error;
        }
    }, [currentUser, addNotification]);

    const checkIfPostIsLiked = useCallback((postId) => {
        return userLikedPosts[postId] === true;
    }, [userLikedPosts]);


    const addCommentToPost = useCallback(async (postId, commentText) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para comentar.');
            throw new Error('Nenhum usuário logado.');
        }
        if (!commentText || commentText.trim() === '') {
            Alert.alert('Erro', 'O comentário não pode estar vazio.');
            throw new Error('Comentário vazio.');
        }
        if (!currentUser.profileData?.username) {
            Alert.alert('Erro', 'Perfil de usuário incompleto. Por favor, complete seu perfil primeiro.');
            throw new Error('Perfil de usuário incompleto.');
        }

        try {
            const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
            const newCommentRef = doc(commentsCollectionRef);

            const commentTimestamp = Timestamp.now();
            const commentData = {
                id: newCommentRef.id,
                userId: currentUser.uid,
                username: currentUser.profileData.username,
                userProfileImage: currentUser.profileData.userProfileImage || 'https://placehold.co/150x150/AAAAAA/000000?text=SP',
                text: commentText,
                createdAt: commentTimestamp,
            };

            await setDoc(newCommentRef, commentData);

            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: increment(1),
            });

            const postDoc = await getDoc(postRef);
            const postOwnerId = postDoc.data().userId;

            addNotification({
                targetUserId: postOwnerId,
                type: 'comment',
                sourceUserId: currentUser.uid,
                postId: postId,
                commentText: commentText,
            });

            console.log(`AuthContext: Comentário adicionado ao post ${postId} por ${currentUser.uid}`);

            return {
                ...commentData,
                createdAt: convertFirestoreTimestampToISO(commentTimestamp),
            };

        } catch (error) {
            console.error('AuthContext: Erro ao adicionar comentário:', error);
            Alert.alert('Erro', 'Não foi possível adicionar o comentário. Tente novamente.');
            throw error;
        }
    }, [currentUser, addNotification]);

    const deleteCommentFromPost = useCallback(async (postId, commentId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para deletar um comentário.');
            throw new Error('Nenhum usuário logado.');
        }

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            const commentDoc = await getDoc(commentRef);

            if (!commentDoc.exists()) {
                console.warn(`AuthContext: Comentário ${commentId} no post ${postId} não encontrado para deletar.`);
                return;
            }

            if (commentDoc.data().userId !== currentUser.uid) {
                Alert.alert('Erro', 'Você só pode deletar seus próprios comentários.');
                throw new Error('Permissão negada: Não é o dono do comentário.');
            }

            await deleteDoc(commentRef);

            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: increment(-1),
            });

            console.log(`AuthContext: Comentário ${commentId} deletado do post ${postId} por ${currentUser.uid}`);
        } catch (error) {
            console.error('AuthContext: Erro ao deletar comentário:', error);
            Alert.alert('Erro', 'Não foi possível deletar o comentário. Tente novamente.');
            throw error;
        }
    }, [currentUser]);


    const getCommentsForPost = useCallback(async (postId) => {
        try {
            console.log(`AuthContext: Buscando comentários para o post ${postId}.`);
            const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
            const q = query(commentsCollectionRef, orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);

            const commentsList = [];
            for (const docSnapshot of querySnapshot.docs) {
                const commentData = docSnapshot.data();
                let username = commentData.username || 'Usuário Desconhecido';
                let userProfileImage = commentData.userProfileImage || 'https://placehold.co/150x150/AAAAAA/000000?text=SP';

                if (!commentData.username || !commentData.userProfileImage) {
                    const commentUserProfile = (await getMultipleUserProfilesById([commentData.userId]))[commentData.userId];
                    if (commentUserProfile) {
                        username = commentUserProfile.username || username;
                        userProfileImage = commentUserProfile.userProfileImage || userProfileImage;
                    }
                }

                commentsList.push({
                    id: docSnapshot.id,
                    ...commentData,
                    username,
                    userProfileImage,
                    createdAt: convertFirestoreTimestampToISO(commentData.createdAt)
                });
            }
            console.log(`AuthContext: Comentários carregados para o post ${postId}.`);
            return commentsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar comentários para o post ${postId}:`, error);
            return [];
        }
    }, [getMultipleUserProfilesById]);

    const followUser = useCallback(async (targetUserId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para seguir um usuário.');
            throw new Error('Nenhum usuário logado.');
        }
        if (currentUser.uid === targetUserId) {
            Alert.alert('Erro', 'Você não pode seguir a si mesmo.');
            throw new Error('Não pode seguir a si mesmo.');
        }

        try {
            const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
            const targetFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
            const myUserRef = doc(db, 'users', currentUser.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            const targetUserDocSnap = await getDoc(targetUserRef);
            if (!targetUserDocSnap.exists()) {
                console.error(`AuthContext: Usuário alvo ${targetUserId} não encontrado para seguir.`);
                Alert.alert('Erro', 'Usuário que você está tentando seguir não existe.');
                throw new Error('Usuário alvo não existe.');
            }

            await setDoc(myFollowingRef, { followedAt: Timestamp.now() });
            await setDoc(targetFollowersRef, { followerAt: Timestamp.now() });

            await updateDoc(myUserRef, { followingCount: increment(1) });
            await updateDoc(targetUserRef, { followersCount: increment(1) });

            setUserFollowing(prevState => ({
                ...prevState,
                [targetUserId]: true
            }));

            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                const newFollowingCount = (prevUser.profileData?.followingCount || 0) + 1;
                return {
                    ...prevUser,
                    profileData: {
                        ...prevUser.profileData,
                        followingCount: newFollowingCount
                    }
                };
            });

            addNotification({
                targetUserId: targetUserId,
                type: 'follow',
                sourceUserId: currentUser.uid,
            });

            console.log(`AuthContext: ${currentUser.uid} agora segue ${targetUserId}.`);
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao seguir usuário:', error);
            Alert.alert('Erro', 'Não foi possível seguir o usuário. Tente novamente.');
            throw error;
        }
    }, [currentUser, addNotification]);

    const unfollowUser = useCallback(async (targetUserId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para deixar de seguir um usuário.');
            throw new Error('Nenhum usuário logado.');
        }
        if (currentUser.uid === targetUserId) {
            Alert.alert('Erro', 'Você não pode deixar de seguir a si mesmo.');
            throw new Error('Não pode deixar de seguir a si mesmo.');
        }

        try {
            const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
            const targetFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
            const myUserRef = doc(db, 'users', currentUser.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            const targetUserDocSnap = await getDoc(targetUserRef);
            if (!targetUserDocSnap.exists()) {
                console.warn(`AuthContext: Usuário alvo ${targetUserId} não encontrado para deixar de seguir.`);
            }

            await deleteDoc(myFollowingRef);
            const followerDocSnap = await getDoc(targetFollowersRef);
            if (followerDocSnap.exists()) {
                await deleteDoc(targetFollowersRef);
            } else {
                console.warn(`AuthContext: Documento de seguidor para ${targetUserId} por ${currentUser.uid} não encontrado para deletar.`);
            }

            await updateDoc(myUserRef, { followingCount: increment(-1) });
            await updateDoc(targetUserRef, { followersCount: increment(-1) });

            setUserFollowing(prevState => {
                const newState = { ...prevState };
                delete newState[targetUserId];
                return newState;
            });

            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                const newFollowingCount = Math.max(0, (prevUser.profileData?.followingCount || 0) - 1);
                return {
                    ...prevUser,
                    profileData: {
                        ...prevUser.profileData,
                        followingCount: newFollowingCount
                    }
                };
            });

            console.log(`AuthContext: ${currentUser.uid} deixou de seguir ${targetUserId}.`);
            return false;
        } catch (error) {
            console.error('AuthContext: Erro ao deixar de seguir usuário:', error);
            Alert.alert('Erro', 'Não foi possível deixar de seguir o usuário. Tente novamente.');
            throw error;
        }
    }, [currentUser]);

    const checkIfFollowing = useCallback((targetUserId) => {
        return userFollowing[targetUserId] === true;
    }, [userFollowing]);

    const getFollowCounts = useCallback(async (userId) => {
        if (!userId) {
            console.warn("AuthContext: userId não fornecido para getFollowCounts.");
            return { followers: 0, following: 0 };
        }
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef, { source: 'server' });
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const followers = typeof data.followersCount === 'number' ? data.followersCount : 0;
                const following = typeof data.followingCount === 'number' ? data.followingCount : 0;
                return {
                    followers: followers,
                    following: following,
                };
            }
            return { followers: 0, following: 0 };
        } catch (error) {
            console.error(`AuthContext: Erro ao obter contagens de seguidores para ${userId}:`, error);
            return { followers: 0, following: 0 };
        }
    }, []);

    const getNotifications = useCallback(async () => {
        if (!currentUser || !currentUser.uid) {
            console.warn('AuthContext: getNotifications - Usuário não autenticado.');
            return [];
        }
        try {
            console.log(`AuthContext: Buscando notificações para ${currentUser.uid}...`);
            const notificationsCollectionRef = collection(db, 'users', currentUser.uid, 'notifications');
            const q = query(notificationsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const sourceUserIds = new Set();
            querySnapshot.docs.forEach(docSnap => {
                const sourceId = docSnap.data().sourceUserId;
                if (sourceId && typeof sourceId === 'string' && sourceId.trim() !== '') {
                    sourceUserIds.add(sourceId);
                } else {
                    console.warn(`AuthContext: Notificação com sourceUserId inválido encontrada e ignorada: ${sourceId}`);
                }
            });

            const profilesMap = await getMultipleUserProfilesById(Array.from(sourceUserIds));

            const fetchedNotifications = [];
            for (const docSnapshot of querySnapshot.docs) {
                const notification = { id: docSnapshot.id, ...docSnapshot.data() };

                const sourceUserProfile = profilesMap[notification.sourceUserId];
                if (sourceUserProfile) {
                    notification.sourceUsername = sourceUserProfile.username || 'Usuário Desconhecido';
                    notification.sourceUserProfileImage = sourceUserProfile.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                } else {
                    notification.sourceUsername = 'Usuário Desconhecido';
                    notification.sourceUserProfileImage = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                }

                notification.createdAt = convertFirestoreTimestampToISO(notification.createdAt);
                fetchedNotifications.push(notification);
            }
            console.log(`AuthContext: Notificações carregadas com sucesso para ${currentUser.uid}.`);
            return fetchedNotifications;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar notificações:', error);
            return [];
        }
    }, [currentUser, getMultipleUserProfilesById]);

    const markNotificationAsRead = useCallback(async (notificationId) => {
        if (!currentUser || !currentUser.uid || !notificationId) {
            console.warn('AuthContext: markNotificationAsRead - Parâmetros ausentes ou usuário não autenticado.');
            return;
        }
        try {
            const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notificationId);
            await updateDoc(notificationRef, { read: true });
            console.log(`AuthContext: Notificação ${notificationId} marcada como lida.`);
        } catch (error) {
            console.error(`AuthContext: Erro ao marcar notificação ${notificationId} como lida:`, error);
        }
    }, [currentUser]);

    const searchUsers = useCallback(async (queryText) => {
        if (!queryText || queryText.trim() === '') {
            return [];
        }
        try {
            console.log(`AuthContext: Buscando usuários por: "${queryText}"`);
            const usersCollectionRef = collection(db, 'users');
            const lowerCaseQuery = queryText.toLowerCase();

            const q = query(
                usersCollectionRef,
                orderBy('username'),
                startAt(queryText),
                endAt(queryText + '\uf8ff')
            );

            const querySnapshot = await getDocs(q);
            const usersList = [];
            
            for (const doc of querySnapshot.docs) {
                const userData = doc.data();
                if (userData.username && userData.username.toLowerCase().startsWith(lowerCaseQuery)) {
                    const userProfileImage = userData.userProfileImage && userData.userProfileImage.trim() !== ''
                        ? userData.userProfileImage
                        : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';

                    const isFollowing = checkIfFollowing(doc.id);

                    usersList.push({
                        uid: doc.id,
                        ...userData,
                        followersCount: typeof userData.followersCount === 'number' ? userData.followersCount : 0,
                        followingCount: typeof userData.followingCount === 'number' ? userData.followingCount : 0,
                        profileCompleted: userData.profileCompleted === true,
                        createdAt: userData.createdAt ? convertFirestoreTimestampToISO(userData.createdAt) : null,
                        userProfileImage: userProfileImage,
                        isFollowing: isFollowing
                    });
                }
            }
            console.log(`AuthContext: Busca de usuários concluída. Encontrados ${usersList.length} resultados.`);
            return usersList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar usuários:', error);
            Alert.alert('Erro na Busca', 'Não foi possível buscar usuários. Tente novamente.');
            return [];
        }
    }, [currentUser, checkIfFollowing]);


    const createOrGetChat = useCallback(async (otherUserId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para iniciar um chat.');
            throw new Error('Nenhum usuário logado.');
        }
        if (currentUser.uid === otherUserId) {
            Alert.alert('Erro', 'Você não pode iniciar um chat consigo mesmo.');
            throw new Error('Não pode iniciar chat consigo mesmo.');
        }

        try {
            const chatParticipantsSorted = [currentUser.uid, otherUserId].sort();
            const chatId = chatParticipantsSorted.join('_');

            const chatRef = doc(db, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists()) {
                console.log(`AuthContext: Chat existente encontrado com ID: ${chatId}`);
                return chatId;
            } else {
                const newChatData = {
                    participants: chatParticipantsSorted,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    lastMessage: {
                        text: 'Chat iniciado.',
                        createdAt: Timestamp.now(),
                        senderId: 'system',
                        readBy: [currentUser.uid],
                    }
                };
                await setDoc(chatRef, newChatData);
                console.log(`AuthContext: Novo chat criado com ID: ${chatId}`);
                return chatId;
            }
        } catch (error) {
            console.error('AuthContext: Erro ao criar ou obter chat:', error);
            Alert.alert('Erro no Chat', 'Não foi possível iniciar o chat. Tente novamente.');
            throw error;
        }
    }, [currentUser]);

    const sendMessage = useCallback(async (chatId, text) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para enviar mensagens.');
            throw new Error('Nenhum usuário logado.');
        }
        if (!chatId || !text || text.trim() === '') {
            Alert.alert('Erro', 'ID do chat ou texto da mensagem inválidos.');
            throw new Error('ID do chat ou texto da mensagem inválidos.');
        }

        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const newMessageRef = doc(messagesRef);
            const messageTimestamp = Timestamp.now();

            const messageData = {
                senderId: currentUser.uid,
                text: text,
                createdAt: messageTimestamp,
                read: false,
            };

            await setDoc(newMessageRef, messageData);

            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: text,
                    createdAt: messageTimestamp,
                    senderId: currentUser.uid,
                    readBy: [currentUser.uid],
                },
                updatedAt: messageTimestamp,
            });

            const chatDoc = await getDoc(chatRef);
            if (chatDoc.exists()) {
                const participants = chatDoc.data().participants;
                const recipientId = participants.find(pId => pId !== currentUser.uid);

                if (recipientId) {
                    addNotification({
                        targetUserId: recipientId,
                        type: 'chat_message',
                        sourceUserId: currentUser.uid,
                        chatId: chatId,
                        messageText: text,
                    });
                }
            }

            console.log(`AuthContext: Mensagem enviada para o chat ${chatId}.`);
            return { id: newMessageRef.id, ...messageData, createdAt: convertFirestoreTimestampToISO(messageTimestamp) };
        } catch (error) {
            console.error('AuthContext: Erro ao enviar mensagem:', error);
            Alert.alert('Erro no Envio', 'Não foi possível enviar a mensagem. Tente novamente.');
            throw error;
        }
    }, [currentUser, addNotification]);

    const getMessages = useCallback((chatId, callback) => {
        if (!chatId) {
            console.warn('AuthContext: getMessages - ID do chat não fornecido.');
            return () => {};
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const senderIds = new Set();
            snapshot.docs.forEach(docSnap => {
                const senderId = docSnap.data().senderId;
                if (senderId && typeof senderId === 'string' && senderId.trim() !== '' && senderId !== 'system') {
                    senderIds.add(senderId);
                }
            });

            const profilesMap = await getMultipleUserProfilesById(Array.from(senderIds));

            const messagesList = [];
            for (const docSnapshot of snapshot.docs) {
                const messageData = docSnapshot.data();
                let senderProfile = null;
                if (messageData.senderId !== 'system') {
                    senderProfile = profilesMap[messageData.senderId];
                }

                messagesList.push({
                    id: docSnapshot.id,
                    ...messageData,
                    createdAt: convertFirestoreTimestampToISO(messageData.createdAt),
                    senderUsername: senderProfile?.username || 'Sistema',
                    senderProfileImage: senderProfile?.userProfileImage || null,
                });
            }
            callback(messagesList);
        }, (error) => {
            console.error('AuthContext: Erro ao escutar mensagens:', error);
            Alert.alert('Erro de Chat', 'Não foi possível carregar as mensagens em tempo real.');
            callback([]);
        });

        return unsubscribe;
    }, [getMultipleUserProfilesById]);

    const getChatsForUser = useCallback(async () => {
        if (!currentUser || !currentUser.uid) {
            console.warn('AuthContext: getChatsForUser - Usuário não autenticado.');
            return [];
        }
        try {
            console.log(`AuthContext: Buscando chats para o usuário ${currentUser.uid}...`);
            const chatsRef = collection(db, 'chats');
            const q = query(
                chatsRef,
                where('participants', 'array-contains', currentUser.uid),
                orderBy('updatedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const otherParticipantIds = new Set();
            querySnapshot.docs.forEach(docSnap => {
                const participants = docSnap.data().participants;
                const otherId = participants.find(uid => uid !== currentUser.uid);
                if (otherId && typeof otherId === 'string' && otherId.trim() !== '') {
                    otherParticipantIds.add(otherId);
                }
            });

            const profilesMap = await getMultipleUserProfilesById(Array.from(otherParticipantIds));

            const chatsList = [];
            for (const docSnapshot of querySnapshot.docs) {
                const chatData = docSnapshot.data();
                const otherParticipantId = chatData.participants.find(
                    (uid) => uid !== currentUser.uid
                );
                let otherUserProfile = null;
                if (otherParticipantId) {
                    otherUserProfile = profilesMap[otherParticipantId];
                }

                chatsList.push({
                    id: docSnapshot.id,
                    participants: chatData.participants,
                    lastMessage: chatData.lastMessage || null,
                    createdAt: chatData.createdAt ? convertFirestoreTimestampToISO(chatData.createdAt) : null,
                    updatedAt: chatData.updatedAt ? convertFirestoreTimestampToISO(chatData.updatedAt) : null,
                    otherParticipant: otherUserProfile ? {
                        uid: otherUserProfile.uid,
                        username: otherUserProfile.username,
                        userProfileImage: otherUserProfile.userProfileImage,
                    } : null,
                });
            }
            console.log(`AuthContext: Chats carregados para o usuário ${currentUser.uid}.`);
            return chatsList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar chats do usuário:', error);
            return [];
        }
    }, [currentUser, getMultipleUserProfilesById]);


    const value = {
        currentUser,
        authLoading,
        signup,
        login,
        logout,
        resetPassword,
        updateUserProfile,
        uploadImageToFirebase,
        createPost,
        deletePost,
        updatePostCaption, // Adicionado aqui
        getUserProfileById,
        getPosts,
        getStories,
        toggleLikePost,
        checkIfPostIsLiked,
        addCommentToPost,
        deleteCommentFromPost,
        getCommentsForPost,
        getPostById,
        getUserPosts,
        getUserHighlights,
        followUser,
        unfollowUser,
        checkIfFollowing,
        getFollowCounts,
        addNotification,
        getNotifications,
        markNotificationAsRead,
        searchUsers,
        unreadNotificationsCount,
        createOrGetChat,
        sendMessage,
        getMessages,
        getChatsForUser,
    };

    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando autenticação...</Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.text,
    },
});