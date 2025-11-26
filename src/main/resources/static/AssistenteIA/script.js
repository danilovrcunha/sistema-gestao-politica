
const assistantToggleBtn = document.getElementById('assistant-toggle-btn');
const chatPanel = document.getElementById('assistantChatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

if (assistantToggleBtn) {
    assistantToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chatPanel.classList.toggle('open');
    });
}

if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => {
        chatPanel.classList.remove('open');
    });
}

function sendMessage() {
    const userText = chatInput.value.trim();
    if (userText === "") return;

    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('chat-message-user');
    userMessageDiv.style.backgroundColor = '#d3e0ff';
    userMessageDiv.style.marginLeft = 'auto';
    userMessageDiv.textContent = userText;
    chatBody.appendChild(userMessageDiv);

    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const aiResponseDiv = document.createElement('div');
        aiResponseDiv.classList.add('chat-message-ai');
        aiResponseDiv.textContent = `Entendi: "${userText}". Como posso ajudar você no financeiro?`;
        chatBody.appendChild(aiResponseDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 800);
}

if (sendChatBtn) sendChatBtn.addEventListener('click', sendMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}