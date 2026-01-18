document.addEventListener('DOMContentLoaded', () => {
    const commentInput = document.getElementById('commentInput');
    const sendBtn = document.getElementById('sendBtn');
    const charCount = document.getElementById('charCount');
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    const aiIframe = document.getElementById('aiChatIframe');

    const commentContainer = document.getElementById('commentContainer');
    const blockedContainer = document.getElementById('blockedContainer');
    const blockedMessage = document.getElementById('blockedMessage');

    // Initialize stats in localStorage
    const getStats = () => {
        const stats = localStorage.getItem('comment_stats');
        return stats ? JSON.parse(stats) : { strikes: 0, blockCount: 0, isBlocked: false, lastOffense: '' };
    };

    const saveStats = (stats) => {
        localStorage.setItem('comment_stats', JSON.stringify(stats));
        // Also provide a way for the AI to "see" these stats by injecting them into its context
        // This is handled in ai.js by reading 'comment_stats' storage key
    };

    // Check UI State
    const updateUIState = () => {
        const stats = getStats();
        if (stats.isBlocked) {
            commentContainer.style.display = 'none';
            blockedContainer.style.display = 'block';
            blockedMessage.innerHTML = `Tu usuario ha sido bloqueado por tratar de enviar: <br><strong style="color: #ff3b30; font-style: italic;">"${stats.lastOffense}"</strong>`;
        } else {
            commentContainer.style.display = 'block';
            blockedContainer.style.display = 'none';
        }
    };

    updateUIState();

    // Prevent line breaks
    commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    // Handle input and validation
    commentInput.addEventListener('input', () => {
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
        sendBtn.disabled = true;
        sendBtn.textContent = 'Validando con IA...';

        if (aiIframe.contentWindow) {
            aiIframe.contentWindow.postMessage({
                type: 'validateComment',
                text: text
            }, '*');
        }
    });

    // Receive messages from AI
    window.addEventListener('message', (event) => {
        // 1. Validation Logic
        if (event.data.type === 'commentValidationResult') {
            sendBtn.textContent = 'Enviar Comentario';
            const status = event.data.status;
            const text = event.data.originalText;
            const stats = getStats();

            if (status === 'SANO') {
                alert("¡Felicidades! Mensaje enviado con éxito.");
                commentInput.value = '';
                charCount.textContent = '0 / 100';
                sendBtn.disabled = true;
            } else if (status === 'SIN_SENTIDO') {
                alert("⚠ El mensaje no parece tener sentido. Por favor, escribe un comentario positivo y coherente.");
                sendBtn.disabled = false;
            } else if (status === 'OFENSIVO') {
                stats.strikes++;
                stats.lastOffense = text;

                if (stats.strikes === 1) {
                    alert("⚠ Amonestación leve: Tu mensaje ha sido catalogado como ofensivo. Por favor, mantén un lenguaje respetuoso.");
                    sendBtn.disabled = false;
                } else if (stats.strikes === 2) {
                    alert("⚠️ ADVERTENCIA: Esta es tu segunda falta. Un tercer intento de mensaje ofensivo resultará en el bloqueo de tu cuenta.");
                    sendBtn.disabled = false;
                } else {
                    stats.isBlocked = true;
                    stats.blockCount++;
                    stats.strikes = 0; // Reset strikes for the next potential unlock
                    alert("🚫 ACCESO RESTRINGIDO: Has intentado enviar mensajes ofensivos repetidamente. Se ha notificado al equipo de IT y tu acceso a comentarios ha sido bloqueado.");
                }
                saveStats(stats);
                updateUIState();
            }
        }

        // 2. AI Actions
        if (event.data.action === 'writeComment') {
            const stats = getStats();
            if (!stats.isBlocked) {
                commentInput.value = event.data.data.text;
                commentInput.dispatchEvent(new Event('input'));
            }
        }

        if (event.data.action === 'unlockComments') {
            const stats = getStats();
            stats.isBlocked = false;
            stats.strikes = 0;
            saveStats(stats);
            updateUIState();
        }
    });

    // Toggle AI
    openAiBtn.onclick = () => {
        aiChatWidget.classList.toggle('open');
    };
});
