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
  updateDoc,
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

// CORREÇÃO: Adicionada a palavra-chave "export" para tornar a função acessível
export function getUserId() {
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
    let userData = {};

    if (docSnap.exists()) {
      userData = docSnap.data();
      userRole = userData.role || "student";
    } else {
      userData = {
        name: user.displayName, email: user.email, uid: user.uid,
        avatar: user.photoURL, role: "student", createdAt: serverTimestamp(),
        streak: { count: 0, lastActivityDate: null }
      };
      await setDoc(userDocRef, userData);
    }
    
    await updateUserStreak(user.uid, userData.streak);

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

export async function registrarVisitaAula(materia, lessonId) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para salvar o progresso.");
        return;
    }
    try {
        await updateUserStreak();

        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        const updateData = {
            [lessonId]: {
                state: 'visited',
                lastVisited: serverTimestamp()
            }
        };
        await setDoc(progressDocRef, updateData, { merge: true });
        console.log(`Visita à aula ${lessonId} registrada com sucesso.`);

    } catch (error) {
        console.error(`Erro ao registrar visita à aula ${lessonId}:`, error);
    }
}

export async function updateUserStreak() {
    const userId = getUserId();
    if (!userId) return;

    const userDocRef = doc(db, "users", userId);
    
    try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) return;

        const userData = docSnap.data();
        const streakData = userData.streak || { count: 0, lastActivityDate: null };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!streakData.lastActivityDate) {
            await updateDoc(userDocRef, {
                'streak.count': 1,
                'streak.lastActivityDate': serverTimestamp()
            });
            console.log("Streak iniciado!");
            return;
        }

        const lastActivity = streakData.lastActivityDate.toDate();
        lastActivity.setHours(0, 0, 0, 0);

        if (today.getTime() === lastActivity.getTime()) {
            console.log("Streak já contado para hoje.");
            return;
        }

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (lastActivity.getTime() === yesterday.getTime()) {
            await updateDoc(userDocRef, {
                'streak.count': (streakData.count || 0) + 1,
                'streak.lastActivityDate': serverTimestamp()
            });
            console.log("Streak incrementado!");
        } else {
            await updateDoc(userDocRef, {
                'streak.count': 1,
                'streak.lastActivityDate': serverTimestamp()
            });
            console.log("Streak quebrado e reiniciado.");
        }
    } catch (error) {
        console.error("Erro ao atualizar o streak do usuário:", error);
    }
}