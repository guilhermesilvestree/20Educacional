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
  updateDoc, // <- updateDoc foi importado aqui
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
    let userData = {}; // <- Variável para guardar os dados do user

    if (docSnap.exists()) {
      userData = docSnap.data(); // <- Guarda os dados existentes
      userRole = userData.role || "student";
    } else {
      // Cria os dados iniciais do usuário, incluindo o streak
      userData = {
        name: user.displayName, email: user.email, uid: user.uid,
        avatar: user.photoURL, role: "student", createdAt: serverTimestamp(),
        streak: { count: 0, lastActivityDate: null } // <- Inicializa o streak
      };
      await setDoc(userDocRef, userData);
    }

    // Atualiza o streak sempre que o usuário faz login
    await updateUserStreak(user.uid, userData.streak); // <- Passa o UID e os dados do streak

    const newAppData = {
      userData: { name: user.displayName, avatar: user.photoURL, uid: user.uid, role: userRole },
      essaySession: null,
    };
    saveAppData(newAppData);
    window.location.href = "menu.html";
  } catch (error) {
    console.error("Erro no login com Google:", error.code, error.message);
    // Removido o alert para não interromper o fluxo em caso de erro simples
    // alert(`Erro ao fazer login: ${error.message}`);
  }
}

export function verificarLogin(onUserLoggedIn) {
  const appData = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
  if (!appData || !appData.userData) {
    window.location.href = ""; // Redireciona para a raiz (index.html)
    return;
  }
  if (onUserLoggedIn && typeof onUserLoggedIn === "function") {
    onUserLoggedIn(appData.userData);
  }
}

export function logout() {
  localStorage.removeItem(APP_STORAGE_KEY);
  window.location.href = ""; // Redireciona para a raiz (index.html)
}

export async function carregarProgresso(materia) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para carregar o progresso.");
        return {}; // Retorna objeto vazio se não houver usuário
    }
    try {
        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        const docSnap = await getDoc(progressDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return {}; // Retorna objeto vazio se não houver progresso ainda
        }
    } catch (error) {
        console.error(`Erro ao carregar progresso de ${materia}:`, error);
        return {}; // Retorna objeto vazio em caso de erro
    }
}

export async function verificarAulaAtual(materia, numeroAulaAtual) {
    // Aulas com número 1 são sempre permitidas
    if (numeroAulaAtual === 1) {
        return;
    }
    const statusData = await carregarProgresso(materia);

    let ultimaAulaConcluida = 0;
    if (statusData && Object.keys(statusData).length > 0) {
        // Pega os números das aulas do ID (ex: 'mat-5' -> 5)
        const lessonNumbers = Object.keys(statusData)
            .map(key => parseInt(key.split('-')[1]))
            .filter(num => !isNaN(num)); // Garante que são números válidos
        if (lessonNumbers.length > 0) {
            ultimaAulaConcluida = Math.max(...lessonNumbers);
        }
    }
    // Permite acessar a próxima aula após a última concluída
    const proximaAulaPermitida = ultimaAulaConcluida + 1;
    if (numeroAulaAtual > proximaAulaPermitida) {
        alert("Você precisa completar as aulas anteriores antes de acessar esta. Retornando à trilha de aprendizado.");
        window.location.href = '../index.html'; // Redireciona para a página da matéria
    }
}

export async function registrarVisitaAula(materia, lessonId) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para salvar o progresso.");
        return;
    }
    try {
        // Atualiza o streak ANTES de registrar a visita
        await updateUserStreak(); // Não precisa passar parâmetros, ela busca o user ID

        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        // Cria um objeto que atualiza apenas o campo da aula específica
        const updateData = {
            [lessonId]: {
                state: 'visited', // Ou outro estado se necessário
                lastVisited: serverTimestamp() // Timestamp do servidor
            }
        };
        // Usa setDoc com merge: true para não sobrescrever outros progressos
        await setDoc(progressDocRef, updateData, { merge: true });
        console.log(`Visita à aula ${lessonId} registrada com sucesso.`);

    } catch (error) {
        console.error(`Erro ao registrar visita à aula ${lessonId}:`, error);
    }
}

// ========================================================
// ==  NOVA FUNÇÃO: ATUALIZAÇÃO DO STREAK (DIAS SEGUIDOS) ==
// ========================================================
/**
 * Atualiza o contador de dias seguidos (streak) do usuário.
 * Verifica a data da última atividade e incrementa ou reseta o contador.
 * Chamada automaticamente no login e ao registrar visita a uma aula.
 */
export async function updateUserStreak() {
    const userId = getUserId();
    if (!userId) return; // Se não tem usuário logado, não faz nada

    const userDocRef = doc(db, "users", userId);

    try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) return; // Se o documento do usuário não existe, não faz nada

        const userData = docSnap.data();
        const streakData = userData.streak || { count: 0, lastActivityDate: null };

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera horas, minutos, segundos e milissegundos para comparar só a data

        // Se nunca houve atividade (primeiro acesso ou reset)
        if (!streakData.lastActivityDate) {
            await updateDoc(userDocRef, {
                'streak.count': 1, // Começa o streak com 1
                'streak.lastActivityDate': serverTimestamp() // Marca a data de hoje
            });
            console.log("Streak iniciado!");
            return;
        }

        // Converte a data da última atividade do Firestore para um objeto Date
        const lastActivity = streakData.lastActivityDate.toDate();
        lastActivity.setHours(0, 0, 0, 0); // Zera as horas para comparar só a data

        // Se a última atividade foi hoje, não faz nada
        if (today.getTime() === lastActivity.getTime()) {
            console.log("Streak já contado para hoje.");
            return;
        }

        // Verifica se a última atividade foi ontem
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Define a data para ontem

        if (lastActivity.getTime() === yesterday.getTime()) {
            // Se foi ontem, incrementa o streak
            await updateDoc(userDocRef, {
                'streak.count': (streakData.count || 0) + 1, // Incrementa o contador
                'streak.lastActivityDate': serverTimestamp() // Atualiza a data para hoje
            });
            console.log("Streak incrementado!");
        } else {
            // Se não foi ontem (ou seja, houve um dia ou mais sem atividade), reseta o streak para 1
            await updateDoc(userDocRef, {
                'streak.count': 1, // Reseta para 1
                'streak.lastActivityDate': serverTimestamp() // Marca a data de hoje
            });
            console.log("Streak quebrado e reiniciado.");
        }
    } catch (error) {
        console.error("Erro ao atualizar o streak do usuário:", error);
    }
}