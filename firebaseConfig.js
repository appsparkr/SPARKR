// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Importações para persistência de autenticação
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // <-- IMPORTAR ESTE
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'; // <-- IMPORTAR ESTES

const firebaseConfig = {
  apiKey: "AIzaSyAv4DOv6yoI9QcGGyITHimmuZJQb58Ptig",
  authDomain: "sparkr-app.firebaseapp.com",
  projectId: "sparkr-app",
  storageBucket: "sparkr-app.firebasestorage.app",
  messagingSenderId: "278148826560",
  appId: "1:278148826560:web:4a85a7501d7870439cf425",
  measurementId: 'SEU_ID_DE_MEDICAO'
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize os serviços que você usa
// Mude a linha do 'auth' para usar initializeAuth com persistência
const auth = initializeAuth(app, { // <-- MUDANÇA AQUI
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

// --- CONSOLE.LOG DE DEBUG
console.log('Firebase SDK inicializado.');
// --- FIM DOS CONSOLE.LOGS DE DEBUG

export { app, auth, db, storage };

