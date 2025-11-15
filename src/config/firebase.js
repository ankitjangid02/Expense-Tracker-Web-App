import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB33x-lBOuyn4rHa9y5k0_aoh3J9eqSyNs",
  authDomain: "expenset-a0fd2.firebaseapp.com",
  projectId: "expenset-a0fd2",
  storageBucket: "expenset-a0fd2.firebasestorage.app",
  messagingSenderId: "991048264293",
  appId: "1:991048264293:web:29174ef9bd97d6527e748c",
  measurementId: "G-SHPD2NKWVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;