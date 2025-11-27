document.addEventListener('DOMContentLoaded', () => {
    const assistantToggleBtn = document.getElementById('assistant-toggle-btn');
    const chatPanel = document.getElementById('assistantChatPanel');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    if (assistantToggleBtn) {
        assistantToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatPanel.classList.add('open');
            setTimeout(() => chatInput.focus(), 300);
        });
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            chatPanel.classList.remove('open');
        });
    }

    function formatarTextoBot(text) {
        let formatted = text.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        return formatted;
    }

    function addMessageToScreen(text, sender) {
        const div = document.createElement('div');

        div.classList.add(sender === 'user' ? 'chat-message-user' : 'chat-message-ai');

        if (sender === 'ai') {
            div.innerHTML = formatarTextoBot(text);
        } else {
            div.textContent = text;
        }

        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight; // Rola para o final
    }

    async function sendMessage() {
        const userText = chatInput.value.trim();
        if (userText === "")
            return;
        addMessageToScreen(userText, 'user');
        chatInput.value = '';

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message-ai');
        typingIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <em>Processando...</em>';
        chatBody.appendChild(typingIndicator);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const role = localStorage.getItem("userRole");
            const filtroId = localStorage.getItem("superAdminGabineteFilter");
            const gabineteIdToSend = (role === "SUPER_ADMIN" && filtroId) ? filtroId : null;

            const payload = {
                pergunta: userText,
                gabineteId: gabineteIdToSend
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Erro na resposta da API');

            const data = await response.json();

            typingIndicator.remove();
            addMessageToScreen(data.resposta, 'ai');

        } catch (error) {
            typingIndicator.remove();
            console.error(error);
            addMessageToScreen("Desculpe, tive um erro de conexão.", 'ai');
        }
    }

    // ===EVENTOS ===
    if (sendChatBtn) sendChatBtn.addEventListener('click', sendMessage);

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});