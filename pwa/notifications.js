// pwa/notifications.js

const WEBHOOK_URL = "https://discord.com/api/webhooks/1157105031972130826/PIsl6eM_fS2v276yWPZqXXvutaNTDYLh1rQUu8oap38Vedm0Y6w6E2ZxR-Tg1X_Jwrsx";

// Mensagens lúdicas para engajar o aluno
const MENSAGENS_NOTIFICACAO = [
    "Psst... que tal transformar alguns minutos em conhecimento? Sua jornada para a aprovação continua! ✨",
    "O universo do saber está te chamando! Uma aula rápida pode fazer toda a diferença no seu futuro. 🚀",
    "Hora de dar um up nos estudos! Que tal desbloquear a próxima aula e ficar mais perto da sua vaga?",
    "Lembrete cósmico: a constelação do seu sucesso é formada por cada aula que você estuda. Vamos para a próxima estrela?",
    "Seu cérebro pediu um exercício! Que tal resolver algumas questões e fortalecer seus conhecimentos? 💪",
    "Não perca o ritmo! Manter a constância é o segredo dos aprovados. Uma aulinha agora?"
];

const HORARIOS_NOTIFICACAO = [
    { hora: 9, minuto: 30 },
    { hora: 14, minuto: 0 },
    { hora: 15, minuto: 43 },
    { hora: 15, minuto: 46 },
    { hora: 16, minuto: 38 },
    { hora: 20, minuto: 15 }
];

/**
 * Pede permissão ao usuário para enviar notificações.
 */
export function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) {
        console.log("Este navegador não suporta notificações no desktop.");
        sendDiscordNotification('❌ Erro de Notificação', 'O navegador do usuário não suporta notificações no desktop.', 'error');
        return;
    }

    if (Notification.permission === "granted") {
        console.log("Permissão para notificações já concedida.");
        agendarNotificacoesRecorrentes();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                console.log("Permissão para notificações concedida!");
                sendDiscordNotification('✅ Permissão Concedida', 'O usuário autorizou o envio de notificações de estudo.', 'success');
                agendarNotificacoesRecorrentes();
            } else {
                sendDiscordNotification('⚠️ Permissão Negada', 'O usuário não autorizou o envio de notificações.', 'warning');
            }
        });
    }
}

/**
 * Envia uma mensagem formatada para o Discord via webhook para diferentes tipos de eventos.
 * @param {string} title O título da notificação (ex: "🔔 Notificação de Estudo", "❌ Erro no Login").
 * @param {string} description A descrição detalhada do evento.
 * @param {'info'|'success'|'warning'|'error'} type O tipo de notificação, que define a cor.
 * @param {Array<{name: string, value: string}>} fields Campos adicionais para o embed.
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
 * Mostra uma notificação e aciona o webhook do Discord.
 */
function mostrarNotificacao() {
    if (Notification.permission === "granted") {
        const indiceAleatorio = Math.floor(Math.random() * MENSAGENS_NOTIFICACAO.length);
        const mensagem = MENSAGENS_NOTIFICACAO[indiceAleatorio];

        const options = {
            body: mensagem,
            icon: '/20Educacional/assets/imagens/logo-192.png',
            badge: '/20Educacional/assets/imagens/logo-192.png'
        };

        // Envia a notificação para o Discord usando a nova função
        sendDiscordNotification(
            "🔔 Notificação de Estudo Enviada",
            "Um lembrete foi enviado para incentivar um aluno a manter o foco.",
            'info',
            [{ name: "Conteúdo da Mensagem", value: `> ${mensagem}` }]
        );

        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Hora de Evoluir!', options);
        });
    }
}

/**
 * Verifica a hora e o minuto atuais e dispara uma notificação nos horários agendados.
 */
function agendarNotificacoesRecorrentes() {
    console.log("Agendador de notificações iniciado.");
    setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        for (const horario of HORARIOS_NOTIFICACAO) {
            if (horaAtual === horario.hora && minutoAtual === horario.minuto) {
                console.log(`Disparando notificação agendada para as ${horario.hora}h${horario.minuto.toString().padStart(2, '0')}.`);
                mostrarNotificacao();
                break;
            }
        }
    }, 60000);
}