// firebase-messaging-sw.js

// 1. Importe o SDK do Firebase (Versões compatíveis com Service Worker)
// Nota: Você pode precisar ajustar a versão (ex: 9.x, 10.x, etc.)
// dependendo do setup do seu projeto.
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// ***************************************************************
// CONFIGURAÇÃO DO FIREBASE (DESCOMMENTADA)
// ***************************************************************

// CERTIFIQUE-SE DE SUBSTITUIR ESTAS CONFIGURAÇÕES PELAS SUAS CREDENCIAIS REAIS DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD5u7IkNNqpQzwbW86paI3a4pZBPO_yjwk",
    authDomain: "sistema-ce534.firebaseapp.com",
    projectId: "sistema-ce534",
    storageBucket: "sistema-ce534.appspot.com",
    messagingSenderId: "839435076253",
    appId: "1:839435076253:web:92e9485fe2ed9c95364a74"
};
// Inicializa o Firebase no Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();


// ***************************************************************
// MANUSEIO DE MENSAGENS PUSH (BACKGROUND)
// ***************************************************************

/**
 * Escuta mensagens push que chegam quando o aplicativo está em segundo plano 
 * ou fechado.
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem Background Recebida: ', payload);

    // Seleciona uma mensagem lúdica aleatória
    const MENSAGENS_NOTIFICACAO = [
        "Psst... que tal transformar alguns minutos em conhecimento? Sua jornada para a aprovação continua! ✨",
        "O universo do saber está te chamando! Uma aula rápida pode fazer toda a diferença no seu futuro. 🚀",
        "Hora de dar um up nos estudos! Que tal desbloquear a próxima aula e ficar mais perto da sua vaga?",
        "Lembrete cósmico: a constelação do seu sucesso é formada por cada aula que você estuda. Vamos para a próxima estrela?",
        "Seu cérebro pediu um exercício! Que tal resolver algumas questões e fortalecer seus conhecimentos? 💪",
        "Não perca o ritmo! Manter a constância é o segredo dos aprovados. Uma aulinha agora?"
    ];

    const indiceAleatorio = Math.floor(Math.random() * MENSAGENS_NOTIFICACAO.length);
    const bodyText = MENSAGENS_NOTIFICACAO[indiceAleatorio];

    // O objeto de notificação que será exibido
    const notificationTitle = 'Hora de Evoluir!';
    const notificationOptions = {
        body: bodyText,
        icon: '/20Educacional/assets/imagens/logo-192.png',
        badge: '/20Educacional/assets/imagens/logo-192.png',
        // Você pode adicionar um campo "data" para abrir uma URL específica
        data: {
            url: payload.data ? payload.data.url : '/' // Exemplo de URL de destino
        }
    };

    // Exibe a notificação
    self.registration.showNotification(notificationTitle, notificationOptions);
});


// ***************************************************************
// MANUSEIO DO CLIQUE NA NOTIFICAÇÃO
// ***************************************************************

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    const targetUrl = data && data.url ? data.url : '/'; // URL de destino padrão

    // Tenta focar em uma janela existente ou abre uma nova
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Se o aplicativo já estiver aberto, foca na aba
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Caso contrário, abre uma nova aba
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});