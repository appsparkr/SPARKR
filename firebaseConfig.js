// firebaseConfig.js
// Certifique-se de que os valores de API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID
// são os corretos do seu projeto Firebase.
// O appId para Android é diferente do Web/iOS.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app); // Se você usa Firestore

// --- CONSOLE.LOG DE DEBUG
console.log('Firebase SDK inicializado.');
// --- FIM DOS CONSOLE.LOGS DE DEBUG

export { app, auth, db };