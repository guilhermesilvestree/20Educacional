// firebase/firebase-conta.js

// Importações do Firebase (mantenha como estava no seu firebase-config.js)
import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const APP_STORAGE_KEY = "perfilUser";

// Função para salvar os dados do usuário no localStorage
function saveAppData(data) {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Falha ao salvar os dados da aplicação no localStorage", e);
  }
}

/**
 * Função principal de Login com Google.
 * Cuida da autenticação, criação do usuário no Firestore e salvamento no localStorage.
 */
export async function loginComGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    let userRole = "student"; // Define um papel padrão
    if (docSnap.exists()) {
      userRole = docSnap.data().role || "student";
    } else {
      await setDoc(userDocRef, {
        name: user.displayName,
        email: user.email,
        uid: user.uid,
        avatar: user.photoURL,
        role: "student",
        createdAt: serverTimestamp(),
      });
    }

    const newAppData = {
      userData: {
        name: user.displayName,
        avatar: user.photoURL,
        uid: user.uid,
        role: userRole,
      },
      essaySession: null,
    };

    saveAppData(newAppData);
    window.location.href = "menu.html"; // Redireciona para o menu após o sucesso
  } catch (error) {
    console.error("Erro no login com Google:", error.code, error.message);
    alert(`Erro ao fazer login: ${error.message}`);
  }
}

/**
 * Verifica se o usuário está logado.
 * Se não estiver, redireciona para a página de login.
 * Se estiver, executa uma função de callback passando os dados do usuário.
 * @param {function} onUserLoggedIn - A função a ser executada se o usuário estiver logado.
 */
export function verificarLogin(onUserLoggedIn) {
  const appData = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));

  if (!appData || !appData.userData) {
    window.location.href = "/"; // Redireciona se não houver dados
    return;
  }

  // Se o usuário está logado, chama a função de callback com os dados dele
  if (onUserLoggedIn && typeof onUserLoggedIn === "function") {
    onUserLoggedIn(appData.userData);
  }
}

/**
 * Realiza o logout do usuário.
 */
export function logout() {
  localStorage.removeItem(APP_STORAGE_KEY);
  window.location.href = "/";
}
