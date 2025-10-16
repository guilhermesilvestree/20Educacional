// firebase/firebase-aula.js

import { db } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getUserId() {
    try {
        const appData = JSON.parse(localStorage.getItem("perfilUser"));
        return appData?.userData?.uid;
    } catch (error) {
        console.error("Erro ao obter dados do usuário do localStorage", error);
        return null;
    }
}

export async function enviarResultadoQuiz(materia, lessonId, resultado) {
    const userId = getUserId();
    if (!userId) {
        console.error("Nenhum usuário logado para salvar o resultado do quiz.");
        alert("Erro: Você não está logado. Não foi possível salvar seu progresso.");
        return;
    }

    try {
        const progressDocRef = doc(db, `users/${userId}/progress`, materia);
        
        const updateData = {
            [`${lessonId}.quiz`]: {
                acertos: resultado.acertos,
                totalQuestoes: resultado.totalQuestoes,
                // GARANTIA: Se 'questoesCorretas' for undefined, envia um array vazio.
                questoesCorretas: resultado.questoesCorretas || [], 
                timestamp: serverTimestamp()
            }
        };

        await setDoc(progressDocRef, updateData, { merge: true });
        
        console.log(`Resultado do quiz para a aula ${lessonId} salvo com sucesso!`);

    } catch (error) {
        console.error(`Erro ao salvar o resultado do quiz para a aula ${lessonId}:`, error);
        alert("Ocorreu um erro ao salvar o resultado do seu exercício.");
    }
}