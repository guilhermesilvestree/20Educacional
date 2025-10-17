// firebase/firebase-conta.js

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

function saveAppData(data) {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Falha ao salvar os dados da aplicação no localStorage", e);
  }
}

function getUserId() {
    const appData = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
    return appData?.userData?.uid;
}

export async function loginComGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    let userRole = "student";
    if (docSnap.exists()) {
      userRole = docSnap.data().role || "student";
    } else {
      await setDoc(userDocRef, {
        name: user.displayName, email: user.email, uid: user.uid,
        avatar: user.photoURL, role: "student", createdAt: serverTimestamp(),
      });
    }
    const newAppData = {
      userData: { name: user.displayName, avatar: user.photoURL, uid: user.uid, role: userRole },
      essaySession: null,
    };
    saveAppData(newAppData);
    window.location.href = "menu.html";
  } catch (error) {
    console.error("Erro no login com Google:", error.code, error.message);
  }
}

export function verificarLogin(onUserLoggedIn) {
  const appData = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
  if (!appData || !appData.userData) {
    window.location.href = "/"; 
    return;
  }
  if (onUserLoggedIn && typeof onUserLoggedIn === "function") {
    onUserLoggedIn(appData.userData);
  }
}

export function logout() {
  localStorage.removeItem(APP_STORAGE_KEY);
  window.location.href = "/";
}

export async function carregarProgresso(materia) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para carregar o progresso.");
        return {};
    }
    try {
        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        const docSnap = await getDoc(progressDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return {};
        }
    } catch (error) {
        console.error(`Erro ao carregar progresso de ${materia}:`, error);
        return {};
    }
}

export async function verificarAulaAtual(materia, numeroAulaAtual) {
    if (numeroAulaAtual === 1) {
        return;
    }
    const statusData = await carregarProgresso(materia);
    
    let ultimaAulaConcluida = 0;
    if (statusData && Object.keys(statusData).length > 0) {
        const lessonNumbers = Object.keys(statusData)
            .map(key => parseInt(key.split('-')[1]))
            .filter(num => !isNaN(num));
        if (lessonNumbers.length > 0) {
            ultimaAulaConcluida = Math.max(...lessonNumbers);
        }
    }
    const proximaAulaPermitida = ultimaAulaConcluida + 1;
    if (numeroAulaAtual > proximaAulaPermitida) {
        alert("Você precisa completar as aulas anteriores antes de acessar esta. Retornando à trilha de aprendizado.");
        window.location.href = '../index.html'; 
    }
}

/**
 * [NOVA FUNÇÃO] Registra a visita a uma aula, salvando o estado e um timestamp.
 * @param {string} materia - O nome da matéria (ex: 'matematica').
 * @param {string} lessonId - O ID da aula (ex: 'mat-1').
 */
export async function registrarVisitaAula(materia, lessonId) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para salvar o progresso.");
        return;
    }
    try {
        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        
        // Cria um objeto que atualiza apenas o campo da aula específica usando dot notation
        const updateData = {
            [lessonId]: {
                state: 'visited',
                lastVisited: serverTimestamp() // Usa o timestamp do servidor do Firebase
            }
        };

        // Usa setDoc com { merge: true } para atualizar ou criar o campo sem sobrescrever o resto
        await setDoc(progressDocRef, updateData, { merge: true });
        console.log(`Visita à aula ${lessonId} registrada com sucesso.`);

    } catch (error) {
        console.error(`Erro ao registrar visita à aula ${lessonId}:`, error);
    }
}