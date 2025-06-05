// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
// Importe o initializeAuth e getReactNativePersistence
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore'; // Adicionado addDoc
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Garanta que esta linha está presente

// Sua configuração do Firebase (do seu projeto no console do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAv4DOv6yoI9QcGGyITHimmuZJQb58Ptig", // Seu API Key do Firebase
  authDomain: "sparkr-app.firebaseapp.com",
  projectId: "sparkr-app", // Seu Project ID do Firebase
  storageBucket: "sparkr-app.appspot.com",
  messagingSenderId: "278148826560",
  appId: "1:278148826560:web:43d9b53177651a134a6d71", // Seu App ID do Firebase
  measurementId: "G-XXXXXXXXXX" // Opcional, se usar Google Analytics
};

// Inicializa o Firebase
// Evita inicializar múltiplas vezes se o app já estiver rodando
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa o serviço de autenticação com persistência do AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializa os outros serviços
const db = getFirestore(app);
const storage = getStorage(app); // Se você for usar o Firebase Storage

console.log("Firebase SDK inicializado.");

// --- Funções de Autenticação ---

export async function signup(email, password, username) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salvar dados adicionais do usuário no Firestore
        // Usamos setDoc para criar o documento com o UID do usuário
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            username: username, // O username inicial
            profileCompleted: false, // Marcamos como falso para ir para CreateProfileScreen
            createdAt: serverTimestamp(), // Usa o timestamp do servidor
        });

        // Retorna um objeto de usuário que seu AuthContext espera
        return {
            uid: user.uid,
            email: user.email,
            username: username,
            profileCompleted: false,
            // Não precisamos gerenciar idToken e refreshToken aqui, o SDK faz isso
        };
    } catch (error) {
        console.error("Firebase signup error:", error);
        throw error;
    }
}

export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Buscar dados adicionais do usuário no Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userDataFromFirestore = userDoc.data();
            return {
                uid: user.uid,
                email: user.email,
                ...userDataFromFirestore, // Inclui username, bio, profileImage, profileCompleted
            };
        } else {
            // Caso o documento do usuário não exista (cenário raro após login)
            // Retornar dados básicos e profileCompleted como falso para forçar a criação de perfil
            return {
                uid: user.uid,
                email: user.email,
                profileCompleted: false,
            };
        }
    } catch (error) {
        console.error("Firebase login error:", error);
        throw error;
    }
}

export async function logout() {
    try {
        await signOut(auth);
        // AsyncStorage será limpo no AuthContext (em um próximo passo)
        return true;
    } catch (error) {
        console.error("Firebase logout error:", error);
        throw error;
    }
}

// --- Funções de Perfil ---

export async function updateUserProfile(uid, profileData) {
    try {
        // Atualizar documento do usuário no Firestore
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...profileData, // username, bio, profileImage, profileCompleted
            updatedAt: serverTimestamp(),
        });

        // Se você quiser atualizar o display name/photo URL diretamente no Firebase Auth
        // (Isso é opcional, mas útil para o console do Firebase Auth)
        if (auth.currentUser && auth.currentUser.uid === uid) {
            const updateAuthProfile = {};
            if (profileData.username) updateAuthProfile.displayName = profileData.username;
            if (profileData.profileImage) updateAuthProfile.photoURL = profileData.profileImage;
            if (Object.keys(updateAuthProfile).length > 0) {
                await updateProfile(auth.currentUser, updateAuthProfile);
            }
        }

        // Retorna os dados atualizados
        return { uid, ...profileData };

    } catch (error) {
        console.error("Firebase updateUserProfile error:", error);
        throw error;
    }
}

export async function getUserProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return { uid, ...userDoc.data() };
        }
        return null; // Usuário não encontrado no Firestore
    } catch (error) {
        console.error("Firebase getUserProfile error:", error);
        throw error;
    }
}

// --- Funções de Postagens (Exemplos, você pode expandir) ---

export async function createPost(postData) {
    try {
        const docRef = await addDoc(collection(db, "posts"), { // Usando addDoc
            ...postData,
            createdAt: serverTimestamp(),
        });
        return { id: docRef.id, ...postData };
    } catch (error) {
        console.error("Firebase createPost error:", error);
        throw error;
    }
}

export async function getPosts(isStories = false) {
    try {
        const postsCollectionRef = collection(db, "posts");
        let q;
        if (isStories) {
            q = query(postsCollectionRef, where("isStory", "==", true), orderBy("createdAt", "desc"), limit(20));
        } else {
            q = query(postsCollectionRef, where("isStory", "==", false), orderBy("createdAt", "desc"), limit(20));
        }

        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return posts;
    } catch (error) {
        console.error("Firebase getPosts error:", error);
        throw error;
    }
}

// --- Funções de Busca (Exemplo) ---

export async function searchUsers(queryText) {
    try {
        const usersCollectionRef = collection(db, "users");
        // Nota: Queries LIKE não são suportadas diretamente no Firestore.
        // Para "GREATER_THAN_OR_EQUAL", o Firestore exige um índice para 'username'
        // e talvez precise de um `endAt` para um range mais preciso para simular 'startsWith'.
        // Para busca de "username" simples que começa com a query:
        const q = query(
            usersCollectionRef,
            where("username", ">=", queryText),
            where("username", "<=", queryText + '\uf8ff'), // \uf8ff é um caractere unicode que permite prefix matching
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return users;
    } catch (error) {
        console.error("Firebase searchUsers error:", error);
        throw error;
    }
}

// Exporta instâncias para uso direto se necessário
export { auth, db, storage, onAuthStateChanged };