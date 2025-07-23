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
    submitReport,
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

// Função auxiliar para converter Firestore Timestamp para ISO string
const convertFirestoreTimestampToISO = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        try {
            const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
            return new Date(milliseconds).toISOString();
        } catch (e) {
            console.error("Erro ao converter timestamp:", timestamp, e);
            return null; // Retorna null ou uma string vazia em caso de erro
        }
    }
    return timestamp; // Retorna o valor original se já for uma string ou outro tipo
};

// Cache para perfis de usuário para reduzir leituras repetidas do Firestore
const userProfileCache = {};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userLikedPosts, setUserLikedPosts] = useState({});
    const [userFollowing, setUserFollowing] = useState({});
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [networkError, setNetworkError] = useState(false); // NOVO: Estado para sinalizar erro de rede

    // Função auxiliar para buscar múltiplos perfis de usuário
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
            console.log('AuthContext: getMultipleUserProfilesById - Todos os UIDs já em cache ou UIDs inválidos.');
            return profiles;
        }

        console.log('AuthContext: getMultipleUserProfilesById - Iniciado para UIDs:', uidsToFetch.size);
        try {
            const profilePromises = Array.from(uidsToFetch).map(uid => getDoc(doc(db, 'users', uid)));
            const docSnaps = await Promise.all(profilePromises);

            docSnaps.forEach(docSnap => {
                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    // Garante que os campos numéricos são números e que profileCompleted é booleano
                    profileData.followersCount = typeof profileData.followersCount === 'number' ? profileData.followersCount : 0;
                    profileData.followingCount = typeof profileData.followingCount === 'number' ? profileData.followingCount : 0;
                    profileData.profileCompleted = profileData.profileCompleted === true;
                    if (profileData.createdAt) {
                        profileData.createdAt = convertFirestoreTimestampToISO(profileData.createdAt);
                    }
                    profiles[docSnap.id] = profileData;
                    userProfileCache[docSnap.id] = profileData; // Armazena no cache
                } else {
                    // Perfil padrão para usuários não encontrados
                    profiles[docSnap.id] = {
                        uid: docSnap.id,
                        username: 'Usuário Desconhecido', bio: '', userProfileImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
                        followersCount: 0, followingCount: 0, profileCompleted: false, createdAt: null, email: null,
                    };
                }
            });
            console.log(`AuthContext: Perfis de usuário carregados do Firestore (novos: ${uidsToFetch.size}).`);
            setNetworkError(false); // Limpa o estado de erro de rede se a operação for bem-sucedida
            return profiles;
        } catch (profileError) {
            console.error('AuthContext: Erro ao carregar múltiplos perfis de usuário do Firestore:', profileError);
            if (profileError.code === 'unavailable' || profileError.code === 'internal' || profileError.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
            }
            return profiles; // Retorna os perfis que conseguiu carregar (do cache ou antes do erro)
        }
    }, []);

    // Função para buscar perfil de usuário por UID
    const getUserProfileById = useCallback(async (uid) => {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.warn("AuthContext: getUserProfileById - UID não fornecido ou inválido.");
            return null;
        }
        // Tenta retornar do cache primeiro
        if (userProfileCache[uid]) {
            console.log('AuthContext: getUserProfileById - Retornando do cache para UID:', uid);
            setNetworkError(false); // Limpa o estado de erro de rede
            return userProfileCache[uid];
        }
        console.log('AuthContext: getUserProfileById - Iniciado para UID:', uid);
        try {
            const userDocRef = doc(db, 'users', uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const profile = { uid: docSnap.id, ...docSnap.data() };
                // Garante que os campos numéricos são números e que profileCompleted é booleano
                profile.followersCount = typeof profile.followersCount === 'number' ? profile.followersCount : 0;
                profile.followingCount = typeof profile.followingCount === 'number' ? profile.followingCount : 0;
                profile.profileCompleted = profile.profileCompleted === true;
                if (profile.createdAt) {
                    profile.createdAt = convertFirestoreTimestampToISO(profile.createdAt);
                }
                userProfileCache[uid] = profile; // Armazena no cache
                console.log('AuthContext: Perfil carregado para', uid, '. Username:', `"${profile.username}"`, ', ProfileCompleted:', profile.profileCompleted);
                setNetworkError(false); // Limpa o estado de erro de rede
                return profile;
            } else {
                // Se não encontrado, cria um perfil incompleto e armazena no cache
                const incompleteProfile = { uid, username: '', profileCompleted: false, userProfileImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', bio: '', followersCount: 0, followingCount: 0, email: '' };
                userProfileCache[uid] = incompleteProfile;
                setNetworkError(false); // Limpa o estado de erro de rede
                return incompleteProfile;
            }
        } catch (error) {
            console.error('AuthContext: Erro ao buscar perfil de usuário do Firestore:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
            }
            // Em caso de erro, tenta retornar do cache ou um perfil incompleto
            return userProfileCache[uid] || { uid, username: '', profileCompleted: false, userProfileImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', bio: '', followersCount: 0, followingCount: 0, email: '' };
        }
    }, []);

    // Função para buscar usuários que o usuário atual segue
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
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error("AuthContext: Erro ao buscar usuários seguidos:", error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
            }
            setUserFollowing({});
        }
    }, []);

    // Função para buscar posts curtidos pelo usuário
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
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error("AuthContext: Erro ao buscar posts curtidos pelo usuário:", error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
            }
            setUserLikedPosts({});
        }
    }, []);

    // Listener principal de autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('AuthContext: onAuthStateChanged - Callback disparado. User:', user ? user.uid : 'null');
            try {
                if (user) {
                    console.log('AuthContext: onAuthStateChanged - Usuário Firebase detectado:', user.uid);
                    // Busca o perfil do usuário
                    const profileData = await getUserProfileById(user.uid);
                    console.log('AuthContext: onAuthStateChanged - Perfil do usuário buscado.');

                    // Busca posts curtidos e usuários seguidos
                    await fetchUserLikedPosts(user.uid);
                    await fetchUserFollowing(user.uid);

                    // Define o usuário atual no estado global
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
                    setNetworkError(false); // Limpa o estado de erro de rede se tudo carregou com sucesso
                } else {
                    // Se não houver usuário, limpa todos os estados relacionados ao usuário
                    console.log('AuthContext: onAuthStateChanged - Nenhum usuário Firebase detectado.');
                    setCurrentUser(null);
                    setUserLikedPosts({});
                    setUserFollowing({});
                    setUnreadNotificationsCount(0);
                    setNetworkError(false); // Limpa o estado de erro de rede
                }
            } catch (error) {
                console.error('AuthContext: Erro no onAuthStateChanged:', error);
                if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                    setNetworkError(true); // Define o estado de erro de rede
                }
                // Garante que o usuário é nulo em caso de erro de carregamento inicial
                setCurrentUser(null);
            } finally {
                setAuthLoading(false); // Garante que o carregamento termina, independentemente do sucesso
                console.log('AuthContext: onAuthStateChanged - authLoading definido como false no finally.');
            }
        });

        return () => unsubscribe(); // Função de limpeza para o listener
    }, [getUserProfileById, fetchUserLikedPosts, fetchUserFollowing]);

    // Listener para notificações não lidas (em tempo real)
    useEffect(() => {
        let unsubscribeNotifications = () => {};
        console.log('AuthContext: useEffect - Listener de notificações configurado. CurrentUser:', currentUser ? currentUser.uid : 'null');

        if (currentUser && currentUser.uid) {
            const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
            const q = query(notificationsRef, where('read', '==', false));

            unsubscribeNotifications = onSnapshot(q, (snapshot) => {
                setUnreadNotificationsCount(snapshot.size);
                console.log(`AuthContext: Notificações não lidas atualizadas: ${snapshot.size}`);
                setNetworkError(false); // Limpa o estado de erro de rede se o listener estiver ativo
            }, (error) => {
                console.error("AuthContext: Erro ao escutar notificações não lidas:", error);
                if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                    setNetworkError(true); // Define o estado de erro de rede
                }
            });
        } else {
            setUnreadNotificationsCount(0);
        }

        return () => {
            console.log('AuthContext: useEffect - Listener de notificações desconfigurado.');
            unsubscribeNotifications(); // Limpa o listener ao desmontar ou mudar o usuário
        };
    }, [currentUser]);


    // Função de registo
    const signup = useCallback(async (email, password, username, dateOfBirth) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: username });
            console.log('AuthContext: DisplayName do Firebase Auth atualizado com username.');

            // Cria um documento de usuário no Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                username: username,
                // --- A CORREÇÃO ESTÁ AQUI ---
                // Converte a string da data de volta para um objeto Date antes de criar o Timestamp
                dateOfBirth: Timestamp.fromDate(new Date(dateOfBirth)),
                userProfileImage: '', 
                bio: '',
                profileCompleted: false,
                followersCount: 0,
                followingCount: 0,
                createdAt: Timestamp.now(),
            });
            console.log('AuthContext: Usuário registrado no Firebase e doc Firestore criado.');
            setNetworkError(false);
            return user;
        } catch (error) {
            console.error('AuthContext: Erro no signup:', error);
            // Os alertas de erro já são mostrados aqui
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Erro de Registo', 'Este email já está em uso.');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Erro de Registo', 'O endereço de email é inválido.');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Erro de Registo', 'A password é muito fraca. Deve ter pelo menos 6 caracteres.');
            } else if (error.code !== 'auth/email-already-in-use') { // Evita alerta duplicado
                Alert.alert('Erro de Registo', 'Ocorreu um erro ao registar: ' + error.message);
            }
            throw error;
        }
    }, []);

    // Função de login
    const login = useCallback(async (email, password) => {
        console.log('AuthContext: login - Iniciado.');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('AuthContext: Usuário logado no Firebase:', userCredential.user.uid);
            setNetworkError(false); // Limpa o estado de erro de rede
            return userCredential.user;
        } catch (error) {
            console.error('AuthContext: Erro no login:', error);
            if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                Alert.alert('Erro de Login', 'Email ou password inválidos.');
            } else if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível fazer login. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro de Login', 'Ocorreu um erro ao fazer login: ' + error.message);
            }
            throw error;
        }
    }, []);

    // Função de logout
    const logout = useCallback(async () => {
        console.log('AuthContext: logout - Iniciado.');
        try {
            await signOut(auth);
            setCurrentUser(null);
            setUserLikedPosts({});
            setUserFollowing({});
            setUnreadNotificationsCount(0);
            // Limpa o cache de perfis de usuário
            for (const key in userProfileCache) {
                if (userProfileCache.hasOwnProperty(key)) {
                    delete userProfileCache[key];
                }
            }
            console.log('AuthContext: Logout bem-sucedido. O listener do Firebase fará o resto.');
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error('AuthContext: Erro no logout:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível fazer logout. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro de Logout', 'Ocorreu um erro ao fazer logout: ' + error.message);
            }
            throw error;
        }
    }, []);

    // Função para redefinir a password
    const resetPassword = useCallback(async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Email Enviado', 'Verifique o seu email para redefinir a password.');
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error('AuthContext: Erro ao redefinir password:', error);
            if (error.code === 'auth/invalid-email') {
                Alert.alert('Erro', 'O endereço de email é inválido.');
            } else if (error.code === 'auth/user-not-found') {
                Alert.alert('Erro', 'Não existe conta com este email.');
            } else if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível redefinir a password. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Ocorreu um erro ao redefinir a password: ' + error.message);
            }
            throw error;
        }
    }, []);

    // Função para atualizar o perfil do usuário
    const updateUserProfile = useCallback(async (userId, data) => {
        if (!userId) {
            Alert.alert('Erro', 'ID do usuário ausente para atualizar o perfil.');
            throw new Error('ID do usuário ausente.');
        }

        try {
            const userRef = doc(db, 'users', userId);
            const updateData = { ...data };

            if (updateData.profileCompleted === undefined) {
                updateData.profileCompleted = true; // Define como true se não for especificado
            }

            console.log('AuthContext: Dados finais para atualização do perfil:', updateData);

            await setDoc(userRef, updateData, { merge: true });

            // Invalida o cache para este usuário e busca o perfil atualizado
            if (userProfileCache[userId]) {
                delete userProfileCache[userId];
                console.log(`AuthContext: Cache para o perfil do usuário ${userId} invalidado.`);
            }

            // Atualiza o perfil do Firebase Auth (displayName e photoURL)
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

            const updatedProfileData = await getUserProfileById(userId); // Re-fetch para atualizar o cache e o estado local

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
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar perfil:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível atualizar o perfil. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Falha ao atualizar perfil: ' + error.message);
            }
            throw error;
        }
    }, [getUserProfileById]);

    const uploadImageToFirebase = useCallback(async (uri, path) => {
        if (!uri) {
            console.warn('AuthContext: uploadImageToFirebase - URI da imagem é nula ou indefinida.');
            return null;
        }
        try {
            console.log('🚀 Iniciando fetch da imagem com URI:', uri);

            // A abordagem mais robusta e recomendada para Expo/React Native
            // O fetch pode lidar com URIs de arquivo local (file://) diretamente.
            const response = await fetch(uri);
            const blob = await response.blob(); // Obtém o blob diretamente da URI

            const storageRef = ref(storage, path);
            console.log(`AuthContext: Iniciando upload para ${path}`);

            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log(`AuthContext: Upload concluído. URL: ${downloadURL}`);
            setNetworkError(false);
            return downloadURL;
        } catch (error) {
            console.error('AuthContext: Erro ao fazer upload da imagem:', error);
            if (
                error.code === 'storage/unauthorized' ||
                error.code === 'storage/canceled'
            ) {
                Alert.alert(
                    'Erro de Permissão',
                    'Você não tem permissão para fazer upload de imagens ou a operação foi cancelada.'
                );
            } else if (
                error.code === 'unavailable' ||
                error.code === 'internal' ||
                error.message.includes('offline')
            ) {
                setNetworkError(true);
                Alert.alert(
                    'Erro de Conexão',
                    'Não foi possível fazer upload da imagem. Verifique sua conexão com a internet.'
                );
            } else {
                Alert.alert('Erro de Upload', 'Não foi possível fazer upload da imagem. Tente novamente.');
            }
            throw error;
        }
    }, []);

    // Função para criar um novo post ou story
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

        const finalImageUrl = mediaType === 'image' ? mediaUrl : null;
        const finalVideoUrl = mediaType === 'video' ? mediaUrl.url : null;

        const postData = {
            userId: currentUser.uid,
            username: currentUser.profileData.username,
            userProfileImage: currentUser.profileData.userProfileImage,
            mediaUrl: mediaType === 'video' ? finalVideoUrl : finalImageUrl, // URL principal
            imageUrl: finalImageUrl,
            videoUrl: finalVideoUrl,
            mediaType: mediaType,
            caption: caption,
            createdAt: Timestamp.now(),
            likes: 0,
            comments: 0,
            isStory: isStory,
        };

        try {
            const newDocRef = doc(postsCollectionRef);
            await setDoc(newDocRef, postData);

            console.log(`AuthContext: ${isStory ? 'Story' : 'Post'} criado com sucesso com ID: ${newDocRef.id}!`);
            setNetworkError(false); // Limpa o estado de erro de rede
            return { id: newDocRef.id, ...postData, createdAt: convertFirestoreTimestampToISO(Timestamp.now()) };
        } catch (error) {
            console.error(`AuthContext: Erro ao criar ${isStory ? 'story' : 'post'}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', `Não foi possível criar ${isStory ? 'a story' : 'o post'}. Verifique sua conexão com a internet.`);
            } else {
                Alert.alert('Erro', `Não foi possível criar ${isStory ? 'a story' : 'o post'}. Tente novamente.`);
            }
            throw error;
        }
    }, [currentUser]);

    // Função para atualizar a legenda de uma postagem
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar legenda da postagem:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível atualizar a legenda. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível atualizar a legenda da postagem. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser]);

    // Função para deletar um post
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

            // Deleta todos os comentários associados
            const commentsSnapshot = await getDocs(commentsCollectionRef);
            commentsSnapshot.docs.forEach((commentDoc) => {
                batch.delete(commentDoc.ref);
            });

            // Remove o like do usuário se ele curtiu o post
            const userLikeDocRef = doc(userLikesCollectionRef, postId);
            const userLikeDocSnap = await getDoc(userLikeDocRef);
            if (userLikeDocSnap.exists()) {
                batch.delete(userLikeDocRef);
            }

            // Deleta o post principal
            batch.delete(postRef);

            await batch.commit();

            console.log(`AuthContext: Postagem ${postId} e seus comentários/likes associados deletados com sucesso.`);
            setNetworkError(false); // Limpa o estado de erro de rede
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao deletar postagem:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível deletar a postagem. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível deletar a postagem. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser]);

    // Função para obter posts
    const getPosts = useCallback(async () => {
        // Passo 0: Se não houver utilizador logado, busca todos os posts sem filtro.
        if (!currentUser || !currentUser.uid) {
            console.log('AuthContext: Buscando todos os posts (usuário não logado).');
            try {
                const postsCollectionRef = collection(db, 'posts');
                const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return postsList;
            } catch (error) {
                console.error('AuthContext: Erro ao buscar posts (não logado):', error);
                return [];
            }
        }

        try {
            console.log('AuthContext: Buscando posts com filtro de bloqueio...');
            
            // Passo 1: Obter a lista de UIDs que o utilizador atual bloqueou.
            const blockedUsersRef = collection(db, 'users', currentUser.uid, 'blockedUsers');
            const blockedSnapshot = await getDocs(blockedUsersRef);
            const blockedUserIds = blockedSnapshot.docs.map(doc => doc.id);
            console.log('AuthContext: Utilizadores bloqueados encontrados:', blockedUserIds.length > 0 ? blockedUserIds : 'Nenhum');

            // Passo 2: Buscar posts, excluindo os autores bloqueados.
            const postsCollectionRef = collection(db, 'posts');
            let q;

            if (blockedUserIds.length > 0) {
                // Se houver utilizadores bloqueados, usa um filtro 'not-in'.
                // Nota: O Firestore tem um limite de 10 itens para consultas 'not-in'.
                // Para uma app em grande escala, seria necessária uma abordagem diferente.
                q = query(postsCollectionRef, where('userId', 'not-in', blockedUserIds), orderBy('userId'), orderBy('createdAt', 'desc'));
            } else {
                // Se não houver bloqueados, busca todos os posts normalmente.
                q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
            }
            
            const querySnapshot = await getDocs(q);

            // O resto da função continua igual...
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
                post.username = userProfile?.username || 'Usuário Desconhecido';
                post.userProfileImage = userProfile?.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                post.isLiked = userLikedPosts[post.id] === true;

                postsList.push(post);
            }
            console.log('AuthContext: Posts carregados e filtrados com sucesso.');
            setNetworkError(false);
            return postsList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar posts:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true);
                Alert.alert('Erro de Conexão', 'Não foi possível carregar os posts. Verifique sua conexão com a internet.');
            }
            return [];
        }
       }, [currentUser, getMultipleUserProfilesById, userLikedPosts]);

    // Função para obter um post por ID
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return post;

        } catch (error) {
            console.error(`AuthContext: Erro ao buscar post ${postId}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar o post. Verifique sua conexão com a internet.');
            }
            return null;
        }
    }, [currentUser, getUserProfileById, userLikedPosts]);

    // Função para obter posts de um usuário específico
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return userPostsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar posts para o usuário ${userId}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar as publicações do usuário. Verifique sua conexão com a internet.');
            }
            return [];
        }
    }, []);

    // Função para obter destaques do usuário
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return userHighlightsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar highlights para o usuário ${userId}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar os destaques. Verifique sua conexão com a internet.');
            }
            return [];
        }
    }, []);

    // Função para obter stories (com mock de dados se não houver stories reais)
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
                setNetworkError(false); // Limpa o estado de erro de rede
                return [
                    { id: 'mock-story-1', username: 'UsuárioStory1', userProfileImage: 'https://placehold.co/150x150/FF0000/FFFFFF?text=S1', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                    { id: 'mock-story-2', username: 'UsuárioStory2', userProfileImage: 'https://placehold.co/150x150/00FF00/FFFFFF?text=S2', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                    { id: 'mock-story-3', username: 'UsuárioStory3', userProfileImage: 'https://placehold.co/150x150/0000FF/FFFFFF?text=S3', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
                ];
            }
            console.log('AuthContext: Stories carregadas com sucesso.');
            setNetworkError(false); // Limpa o estado de erro de rede
            return storiesList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar stories:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar as stories. Verifique sua conexão com a internet.');
            }
            return [
                { id: 'mock-story-error', username: 'ErroStory', userProfileImage: 'https://placehold.co/150x150/800000/FFFFFF?text=E1', mediaUrl: 'https://via.placeholder.com/150', mediaType: 'image', createdAt: new Date().toISOString() },
            ];
        }
    }, []);

    // Função para curtir/descurtir um post
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

                // Adicionar notificação de like (se não for o próprio usuário curtindo seu post)
                if (currentUser.uid !== postOwnerId) {
                    addNotification({
                        targetUserId: postOwnerId,
                        type: 'like',
                        sourceUserId: currentUser.uid,
                        postId: postId,
                    });
                }
            }
            setNetworkError(false); // Limpa o estado de erro de rede
            return newLikedStatus;

        } catch (error) {
            console.error("AuthContext: Erro ao alternar like:", error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível curtir/descurtir o post. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível curtir/descurtir o post. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser, addNotification]);

    // Função para verificar se um post foi curtido pelo usuário atual
    const checkIfPostIsLiked = useCallback((postId) => {
        return userLikedPosts[postId] === true;
    }, [userLikedPosts]);

    // Função para adicionar um comentário a um post
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

            // Adicionar notificação de comentário (se não for o próprio usuário comentando seu post)
            if (currentUser.uid !== postOwnerId) {
                addNotification({
                    targetUserId: postOwnerId,
                    type: 'comment',
                    sourceUserId: currentUser.uid,
                    postId: postId,
                    commentText: commentText,
                });
            }

            console.log(`AuthContext: Comentário adicionado ao post ${postId} por ${currentUser.uid}`);
            setNetworkError(false); // Limpa o estado de erro de rede

            return {
                ...commentData,
                createdAt: convertFirestoreTimestampToISO(commentTimestamp),
            };

        } catch (error) {
            console.error('AuthContext: Erro ao adicionar comentário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível adicionar o comentário. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível adicionar o comentário. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser, addNotification]);

    // Função para deletar um comentário de um post
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
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error('AuthContext: Erro ao deletar comentário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível deletar o comentário. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível deletar o comentário. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser]);


    // Função para obter comentários de um post
    const getCommentsForPost = useCallback(async (postId) => {
        try {
            console.log(`AuthContext: Buscando comentários para o post ${postId}.`);
            const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
            const q = query(commentsCollectionRef, orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);

            const commentsList = [];
            const userIds = new Set(); // Para coletar UIDs dos autores dos comentários

            querySnapshot.docs.forEach(docSnap => {
                const commentData = docSnap.data();
                userIds.add(commentData.userId); // Adiciona o userId do autor do comentário
            });

            const profilesMap = await getMultipleUserProfilesById(Array.from(userIds)); // Busca todos os perfis de uma vez

            for (const docSnapshot of querySnapshot.docs) {
                const commentData = docSnapshot.data();
                const commentUserProfile = profilesMap[commentData.userId]; // Obtém o perfil do mapa

                commentsList.push({
                    id: docSnapshot.id,
                    ...commentData,
                    username: commentUserProfile?.username || 'Usuário Desconhecido',
                    userProfileImage: commentUserProfile?.userProfileImage || 'https://placehold.co/150x150/AAAAAA/000000?text=SP',
                    createdAt: convertFirestoreTimestampToISO(commentData.createdAt)
                });
            }
            console.log(`AuthContext: Comentários carregados para o post ${postId}.`);
            setNetworkError(false); // Limpa o estado de erro de rede
            return commentsList;
        } catch (error) {
            console.error(`AuthContext: Erro ao buscar comentários para o post ${postId}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar os comentários. Verifique sua conexão com a internet.');
            }
            return [];
        }
    }, [getMultipleUserProfilesById]);

    // Função para seguir um usuário
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

            // Atualiza a contagem de 'following' no currentUser local
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao seguir usuário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível seguir o usuário. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível seguir o usuário. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser, addNotification]);

    // Função para bloquear um usuário
    const blockUser = useCallback(async (targetUserId) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para bloquear um usuário.');
            throw new Error('Nenhum usuário logado.');
        }
        if (currentUser.uid === targetUserId) {
            Alert.alert('Erro', 'Você não pode bloquear a si mesmo.');
            throw new Error('Não pode bloquear a si mesmo.');
        }

        try {
            const myBlockedRef = doc(db, 'users', currentUser.uid, 'blockedUsers', targetUserId);
            
            await setDoc(myBlockedRef, {
                blockedAt: Timestamp.now(),
            });

            console.log(`AuthContext: ${currentUser.uid} bloqueou ${targetUserId}.`);
            Alert.alert('Utilizador Bloqueado', 'Você não verá mais posts ou o perfil deste utilizador.');
            
            // Opcional: Forçar o unfollow se o utilizador estava a ser seguido
            // if (checkIfFollowing(targetUserId)) {
            //     await unfollowUser(targetUserId);
            //     console.log(`AuthContext: Forçado unfollow de ${targetUserId} após bloqueio.`);
            // }

            setNetworkError(false);
            return true;
        } catch (error) {
            console.error('AuthContext: Erro ao bloquear usuário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true);
                Alert.alert('Erro de Conexão', 'Não foi possível bloquear o utilizador. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível bloquear o utilizador. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser, checkIfFollowing, unfollowUser]);

    // Função para deixar de seguir um usuário
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

            // Atualiza a contagem de 'following' no currentUser local
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return false;
        } catch (error) {
            console.error('AuthContext: Erro ao deixar de seguir usuário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível deixar de seguir o usuário. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível deixar de seguir o usuário. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser]);

    // Função para verificar se o usuário atual está seguindo outro usuário
    const checkIfFollowing = useCallback((targetUserId) => {
        return userFollowing[targetUserId] === true;
    }, [userFollowing]);

    // Função para obter contagens de seguidores e seguindo
    const getFollowCounts = useCallback(async (userId) => {
        if (!userId) {
            console.warn("AuthContext: userId não fornecido para getFollowCounts.");
            return { followers: 0, following: 0 };
        }
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef, { source: 'server' }); // Força a leitura do servidor
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const followers = typeof data.followersCount === 'number' ? data.followersCount : 0;
                const following = typeof data.followingCount === 'number' ? data.followingCount : 0;
                setNetworkError(false); // Limpa o estado de erro de rede
                return { followers, following };
            }
            setNetworkError(false); // Limpa o estado de erro de rede
            return { followers: 0, following: 0 };
        } catch (error) {
            console.error(`AuthContext: Erro ao obter contagens de seguidores para ${userId}:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar as contagens de seguidores. Verifique sua conexão com a internet.');
            }
            return { followers: 0, following: 0 };
        }
    }, []);

    // Função para adicionar uma notificação
    const addNotification = useCallback(async ({ targetUserId, type, sourceUserId, postId = null, commentText = null, chatId = null, messageText = null }) => {
        if (!targetUserId || !sourceUserId || !type) {
            console.error('AuthContext: addNotification - Parâmetros essenciais ausentes.');
            return;
        }
        if (targetUserId === sourceUserId) {
            console.log('AuthContext: Não adicionando notificação para o próprio usuário.');
            return; // Não notificar a si mesmo
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
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error('AuthContext: Erro ao adicionar notificação:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível enviar a notificação. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível adicionar a notificação. Tente novamente.');
            }
        }
    }, []);

    // Função para obter notificações
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return fetchedNotifications;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar notificações:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar as notificações. Verifique sua conexão com a internet.');
            }
            return [];
        }
    }, [currentUser, getMultipleUserProfilesById]);

    // Função para marcar notificação como lida
    const markNotificationAsRead = useCallback(async (notificationId) => {
        if (!currentUser || !currentUser.uid || !notificationId) {
            console.warn('AuthContext: markNotificationAsRead - Parâmetros ausentes ou usuário não autenticado.');
            return;
        }
        try {
            const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notificationId);
            await updateDoc(notificationRef, { read: true });
            console.log(`AuthContext: Notificação ${notificationId} marcada como lida.`);
            setNetworkError(false); // Limpa o estado de erro de rede
        } catch (error) {
            console.error(`AuthContext: Erro ao marcar notificação ${notificationId} como lida:`, error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível marcar a notificação como lida. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro', 'Não foi possível marcar a notificação como lida. Tente novamente.');
            }
        }
    }, [currentUser]);

    // Função para atualizar as preferências de notificação
    const updateNotificationSettings = useCallback(async (settings) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Utilizador não autenticado.');
            throw new Error('Utilizador não autenticado.');
        }
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            // Usamos set com merge:true para criar ou atualizar o campo 'notificationSettings'
            await setDoc(userRef, {
                notificationSettings: settings
            }, { merge: true });

            console.log('AuthContext: Preferências de notificação atualizadas com sucesso.');
            // Opcional: pode-se dar um feedback ao utilizador, mas geralmente é uma ação silenciosa
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar preferências de notificação:', error);
            Alert.alert('Erro', 'Não foi possível salvar as suas preferências. Tente novamente.');
            throw error;
        }
    }, [currentUser]);

    // Função para atualizar as preferências de privacidade
    const updatePrivacySettings = useCallback(async (settings) => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Utilizador não autenticado.');
            throw new Error('Utilizador não autenticado.');
        }
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                privacySettings: settings
            }, { merge: true });

            console.log('AuthContext: Preferências de privacidade atualizadas com sucesso.');
        } catch (error) {
            console.error('AuthContext: Erro ao atualizar preferências de privacidade:', error);
            Alert.alert('Erro', 'Não foi possível salvar as suas preferências. Tente novamente.');
            throw error;
        }
    }, [currentUser]);

    // Função para pesquisar usuários
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
                    // Não incluir o próprio usuário na busca
                    if (currentUser && userData.uid === currentUser.uid) {
                        continue;
                    }

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
            setNetworkError(false); // Limpa o estado de erro de rede
            return usersList;
        } catch (error) {
            console.error('AuthContext: Erro ao pesquisar usuários:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível pesquisar usuários. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro na Busca', 'Não foi possível buscar usuários. Tente novamente.');
            }
            return [];
        }
    }, [currentUser, checkIfFollowing]);


    // #####################################################################
    // ## FUNÇÃO createOrGetChat CORRIGIDA
    // #####################################################################
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
            // Garante uma ordem consistente para o chatId
            const chatParticipantsSorted = [currentUser.uid, otherUserId].sort();
            const chatId = chatParticipantsSorted.join('_');

            const chatRef = doc(db, 'chats', chatId);

            // Em vez de ler primeiro (getDoc), vamos escrever diretamente com 'merge'.
            // Se o chat não existir, ele será criado (disparando a regra 'create').
            // Se o chat já existir, a regra 'update' será usada e os dados serão mesclados.
            const chatData = {
                participants: chatParticipantsSorted,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                lastMessage: {
                    text: 'Chat iniciado.',
                    createdAt: Timestamp.now(),
                    senderId: 'system'
                }
            };

            // Usamos { merge: true } para que a operação seja segura.
            // Ele cria o documento se não existir, ou atualiza se existir,
            // sem sobrescrever os campos existentes, a menos que sejam especificados aqui.
            // Neste caso, ele vai garantir que o chat exista e atualizar o `updatedAt`.
            await setDoc(chatRef, {
                participants: chatParticipantsSorted,
                updatedAt: Timestamp.now(),
            }, { merge: true });

            console.log(`AuthContext: Chat com ID ${chatId} garantido com sucesso.`);
            setNetworkError(false); // Limpa o estado de erro de rede
            return chatId;

        } catch (error) {
            console.error('AuthContext: Erro ao criar ou obter chat:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true);
                Alert.alert('Erro de Conexão', 'Não foi possível iniciar o chat. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro no Chat', 'Não foi possível iniciar o chat. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser]);

    // Função para enviar uma mensagem em um chat
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
            const newMessageRef = doc(messagesRef); // Cria um novo documento de mensagem
            const messageTimestamp = Timestamp.now();

            const messageData = {
                senderId: currentUser.uid,
                text: text,
                createdAt: messageTimestamp,
                read: false, // Mensagem não lida pelo destinatário
            };

            await setDoc(newMessageRef, messageData); // Salva a nova mensagem

            // Atualizar o lastMessage no documento do chat principal
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: text,
                    createdAt: messageTimestamp,
                    senderId: currentUser.uid,
                    readBy: [currentUser.uid], // O remetente já leu a mensagem
                },
                updatedAt: messageTimestamp,
            });

            // Adicionar notificação para o outro participante do chat
            const chatDoc = await getDoc(chatRef);
            if (chatDoc.exists()) {
                const participants = chatDoc.data().participants;
                const recipientId = participants.find(pId => pId !== currentUser.uid); // Encontra o outro participante

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
            setNetworkError(false); // Limpa o estado de erro de rede
            return { id: newMessageRef.id, ...messageData, createdAt: convertFirestoreTimestampToISO(messageTimestamp) };
        } catch (error) {
            console.error('AuthContext: Erro ao enviar mensagem:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível enviar a mensagem. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro no Envio', 'Não foi possível enviar a mensagem. Tente novamente.');
            }
            throw error;
        }
    }, [currentUser, addNotification]);

    // Função para obter mensagens de um chat em tempo real
    const getMessages = useCallback((chatId, callback) => {
        if (!chatId) {
            console.warn('AuthContext: getMessages - ID do chat não fornecido.');
            return () => {}; // Retorna uma função vazia para unsubscribe
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc')); // Ordena por data de criação crescente para exibir na ordem correta

       // onSnapshot para ouvir em tempo real as mensagens
const unsubscribe = onSnapshot(q, async (snapshot) => {
  const senderIds = new Set();
  snapshot.docs.forEach(docSnap => {
    const senderId = docSnap.data().senderId;
    if (
      senderId &&
      typeof senderId === 'string' &&
      senderId.trim() !== '' &&
      senderId !== 'system'
    ) {
      senderIds.add(senderId);
    }
  });

  // Aqui você pode buscar os perfis dos remetentes, se necessário
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
                    senderProfileImage: senderProfile?.userProfileImage || null, // Pode ser uma imagem padrão para sistema ou nula
                });
            }
            callback(messagesList); // Chama o callback com a lista de mensagens
            setNetworkError(false); // Limpa o estado de erro de rede
        }, (error) => {
            console.error('AuthContext: Erro ao escutar mensagens:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar as mensagens. Verifique sua conexão com a internet.');
            } else {
                Alert.alert('Erro de Chat', 'Não foi possível carregar as mensagens em tempo real.');
            }
            callback([]); // Retorna uma lista vazia em caso de erro
        });

        return unsubscribe; // Retorna a função de unsubscribe para limpeza
    }, [getMultipleUserProfilesById]);

    // Função para obter todos os chats de um usuário
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
                where('participants', 'array-contains', currentUser.uid), // Busca chats onde o usuário é participante
                orderBy('updatedAt', 'desc') // Ordena os chats pelo timestamp da última atualização
            );
            const querySnapshot = await getDocs(q);

            const otherParticipantIds = new Set();
            querySnapshot.docs.forEach(docSnap => {
                const participants = docSnap.data().participants;
                const otherId = participants.find(uid => uid !== currentUser.uid); // Encontra o ID do outro participante
                if (otherId && typeof otherId === 'string' && otherId.trim() !== '') {
                    otherParticipantIds.add(otherId);
                }
            });

            // Busca os perfis dos outros participantes
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

                // GARANTA A CONVERSÃO DO TIMESTAMP AQUI PARA lastMessage.createdAt
                const lastMessageCreatedAtISO = chatData.lastMessage?.createdAt ? convertFirestoreTimestampToISO(chatData.lastMessage.createdAt) : null;

                chatsList.push({
                    id: docSnapshot.id,
                    participants: chatData.participants,
                    lastMessage: chatData.lastMessage ? {
                        ...chatData.lastMessage,
                        createdAt: lastMessageCreatedAtISO // Converte aqui
                    } : null,
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
            setNetworkError(false); // Limpa o estado de erro de rede
            return chatsList;
        } catch (error) {
            console.error('AuthContext: Erro ao buscar chats do usuário:', error);
            if (error.code === 'unavailable' || error.code === 'internal' || error.message.includes('offline')) {
                setNetworkError(true); // Define o estado de erro de rede
                Alert.alert('Erro de Conexão', 'Não foi possível carregar seus chats. Verifique sua conexão com a internet.');
            }
            return [];
        }
    }, [currentUser, getMultipleUserProfilesById]);

    // Objeto de valor para o contexto de autenticação
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
        updatePostCaption,
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
        updatePrivacySettings,
        updateNotificationSettings,
        blockUser,
        submitReport
    };

    // Renderiza um indicador de carregamento enquanto a autenticação está a ser processada
    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando autenticação...</Text>
                {networkError && ( // Exibe mensagem de erro de rede se o estado for true
                    <Text style={styles.networkErrorText}>
                        Erro de conexão. Verifique sua internet ou tente novamente mais tarde.
                    </Text>
                )}
            </View>
        );
    }

    // Renderiza os componentes filhos quando a autenticação estiver completa
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Estilos para a tela de carregamento
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
    networkErrorText: {
        marginTop: 10,
        color: Colors.danger,
        textAlign: 'center',
        marginHorizontal: 20,
    }
});