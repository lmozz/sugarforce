document.addEventListener('DOMContentLoaded', () => {
    const commentInput = document.getElementById('commentInput');
    const sendBtn = document.getElementById('sendBtn');
    const charCount = document.getElementById('charCount');
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    const aiIframe = document.getElementById('aiChatIframe');

    // Prevent line breaks
    commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    // Handle input and validation
    commentInput.addEventListener('input', () => {
        // Remove line breaks just in case of paste
        commentInput.value = commentInput.value.replace(/[\r\n]/g, "");

        const len = commentInput.value.length;
        charCount.textContent = `${len} / 100`;

        if (len >= 15 && len <= 100) {
            sendBtn.disabled = false;
            charCount.classList.remove('error');
        } else {
            sendBtn.disabled = true;
            if (len > 0) charCount.classList.add('error');
            else charCount.classList.remove('error');
        }
    });

    // AI Validation and Send
    sendBtn.addEventListener('click', async () => {
        const text = commentInput.value.trim();

        // Disable button while checking
        sendBtn.disabled = true;
        sendBtn.textContent = 'Validando con IA...';

        try {
            // Signal AI if it's open or loaded
            if (aiIframe.contentWindow) {
                // We ask the AI to validate this specific text
                // Since our current AI structure is an iframe, we use postMessage
                aiIframe.contentWindow.postMessage({
                    type: 'validateComment',
                    text: text
                }, '*');
            }

            // For the purpose of this prototype and immediate feedback:
            // We listen for the response from the AI iframe
        } catch (err) {
            console.error(err);
            sendBtn.disabled = false;
            sendBtn.textContent = 'Enviar Comentario';
        }
    });

    // Receive messages from AI
    window.addEventListener('message', (event) => {
        if (event.data.type === 'commentValidationResult') {
            sendBtn.textContent = 'Enviar Comentario';

            if (event.data.isValid) {
                alert("¡Felicidades! Mensaje enviado con éxito.");
                commentInput.value = '';
                charCount.textContent = '0 / 100';
                sendBtn.disabled = true;
            } else {
                alert("⚠ Error: Tu mensaje contiene contenido que la IA clasifica como ofensivo, insultante o hiriente. Por favor, escribe un comentario positivo.");
                sendBtn.disabled = false;
            }
        }
    });

    // Toggle AI
    openAiBtn.onclick = () => {
        aiChatWidget.classList.toggle('open');
    };
});
