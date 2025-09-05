// ========================================================
// ==  ARQUIVO DE CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE ==
// ========================================================

// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD5u7IkNNqpQzwbW86paI3a4pZBPO_yjwk",
    authDomain: "sistema-ce534.firebaseapp.com",
    projectId: "sistema-ce534",
    storageBucket: "sistema-ce534.appspot.com",
    messagingSenderId: "839435076253",
    appId: "1:839435076253:web:92e9485fe2ed9c95364a74"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços do Firebase para serem usados em outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);