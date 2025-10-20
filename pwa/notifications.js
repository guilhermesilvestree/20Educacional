// pwa/notifications.js

// Certifique-se de que os SDKs do Firebase foram importados no seu arquivo principal (ex: main.js)
// Ex: import firebase from 'firebase/app';
// Ex: import 'firebase/messaging';

// Use as variáveis de configuração do seu projeto Firebase
// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...", // ESTE É CRUCIAL PARA O FCM
//   appId: "..."
// };
// firebase.initializeApp(firebaseConfig);

const WEBHOOK_URL = "https://discord.com/api/webhooks/1157105031972130826/PIsl6eM_fS2v276yWPZtXXvutaNTDYLh1rQUu8oap38Vedm0Y6w6E2ZxR-Tg1X_Jwrsx";

// Mensagens lúdicas para engajar o aluno
const MENSAGENS_NOTIFICACAO = [
    "Psst... que tal transformar alguns minutos em conhecimento? Sua jornada para a aprovação continua! ✨",
    "O universo do saber está te chamando! Uma aula rápida pode fazer toda a diferença no seu futuro. 🚀",
    "Hora de dar um up nos estudos! Que tal desbloquear a próxima aula e ficar mais perto da sua vaga?",
    "Lembrete cósmico: a constelação do seu sucesso é formada por cada aula que você estuda. Vamos para a próxima estrela?",
    "Seu cérebro pediu um exercício! Que tal resolver algumas questões e fortalecer seus conhecimentos? 💪",
    "Não perca o ritmo! Manter a constância é o segredo dos aprovados. Uma aulinha agora?"
];

// ***************************************************************
// FUNÇÕES DE SERVIÇO (NOTIFICAÇÃO PUSH)
// ***************************************************************

/**
 * Pede permissão e obtém o Token de Inscrição (Registration Token) do FCM.
 * @param {firebase.app.App} firebaseApp A instância do Firebase inicializada.
 */
export async function solicitarPermissaoEObterToken(firebaseApp) {
    if (!("Notification" in window)) {
        console.log("Este navegador não suporta notificações no desktop.");
        sendDiscordNotification('❌ Erro de Notificação', 'O navegador do usuário não suporta notificações no desktop.', 'error');
        return;
    }

    // 1. Pede a permissão padrão do navegador
    if (Notification.permission === "granted") {
        console.log("Permissão para notificações já concedida.");
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            sendDiscordNotification('⚠️ Permissão Negada', 'O usuário não autorizou o envio de notificações.', 'warning');
            return;
        }
        sendDiscordNotification('✅ Permissão Concedida', 'O usuário autorizou o envio de notificações de estudo.', 'success');
    }
    
    // 2. Obtém o Service Worker
    const registration = await navigator.serviceWorker.ready;
    
    try {
        // 3. Obtém o token FCM
        const messaging = firebaseApp.messaging();
        const token = await messaging.getToken({ 
            vapidKey: "BPVszTROCNz5By668AzoqIzQotXI84RivCTX8mc9dKlgnNqiL-hFh8B0_fJC-fH8-gOItjjkff5h4Gl65fNG9Zg", // Chave VAPID do seu projeto Firebase
            serviceWorkerRegistration: registration 
        });

        if (token) {
            console.log("Token FCM obtido:", token);
            // 4. Envie este token para o seu banco de dados (Firestore, Realtime DB, etc.)
            // para que seu backend (Cloud Functions) possa usá-lo para enviar pushes.
            // Exemplo de como você pode salvar:
            // await saveTokenToFirestore(token, firebaseApp); 
            
            return token;
        } else {
            console.error("Nenhum token de inscrição FCM disponível.");
            sendDiscordNotification('❌ Erro FCM', 'Não foi possível obter o token de inscrição FCM.', 'error');
            return null;
        }
    } catch (error) {
        console.error("Erro ao obter token FCM:", error);
        sendDiscordNotification('❌ Erro FCM', `Erro ao obter token: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Envia uma mensagem formatada para o Discord via webhook.
 */
export async function sendDiscordNotification(title, description, type = 'info', fields = []) {
    if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/")) {
        console.warn("Webhook do Discord não configurado. O envio foi ignorado.");
        return;
    }

    const colors = {
        info: 3447003,    // Azul
        success: 3066993,  // Verde
        warning: 15105570, // Amarelo
        error: 15158332    // Vermelho
    };

    const payload = {
        username: "Monitor Evolução Educacional",
        avatar_url: "https://raw.githubusercontent.com/guilhermesilvestree/20educacional/main/assets/imagens/logo-192.png",
        embeds: [{
            title: title,
            description: description,
            fields: fields,
            color: colors[type] || colors['info'],
            timestamp: new Date().toISOString(),
            footer: {
                text: "Evolução Educacional"
            }
        }]
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Falha ao enviar webhook para o Discord:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Erro de rede ao tentar enviar o webhook:", error);
    }
}

/**
 * Esta função deve ser chamada dentro do Service Worker quando ele receber um PUSH.
 * Ela usa uma mensagem aleatória e exibe a notificação.
 */
export function mostrarNotificacaoPush(payloadData) {
    if (Notification.permission === "granted") {
        
        // Se a notificação não vier com um corpo (payload), usa-se as mensagens lúdicas locais
        let mensagem = payloadData?.body || MENSAGENS_NOTIFICACAO[Math.floor(Math.random() * MENSAGENS_NOTIFICACAO.length)];
        let title = payloadData?.title || 'Hora de Evoluir!';

        const options = {
            body: mensagem,
            icon: payloadData?.icon || '/20Educacional/assets/imagens/logo-192.png',
            badge: payloadData?.badge || '/20Educacional/assets/imagens/logo-192.png',
            data: payloadData?.data // Para passar dados adicionais (como URL de destino)
        };

        // Envia a notificação para o Discord (Registra o sucesso do envio)
        sendDiscordNotification(
            "🔔 Notificação de Estudo Enviada (PUSH)",
            "Um lembrete foi enviado via FCM.",
            'info',
            [{ name: "Conteúdo da Mensagem", value: `> ${mensagem}` }]
        );
        
        // A notificação será exibida pelo Service Worker
        self.registration.showNotification(title, options);
    }
}


// *********************************************************************************
// FUNÇÃO AGORA OBSOLETA E REMOVIDA
// *********************************************************************************
// function agendarNotificacoesRecorrentes() { /* REMOVIDA */ }