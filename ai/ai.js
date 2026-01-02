const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatHistory = document.getElementById('chatHistory');
const statusIndicator = document.getElementById('statusIndicator');

let session = null;

const CONTEXT_MAP = {
    'pasos': {
        storageKey: 'steps',
        systemRole: 'Eres un experto en gestión de procesos y pasos de Dizucar. Tienes acceso a la lista actual de pasos del usuario. Responde preguntas sobre ellos, ayuda a optimizarlos o sugiere mejoras. Usa Markdown para dar formato.'
    },
    'coa': {
        storageKey: 'coa',
        systemRole: 'Eres un experto en Certificados de Análisis (COA) de Dizucar. Tienes acceso a la lista de parámetros COA actual, incluyendo nombre, descripción, método de análisis y unidades. Ayuda al usuario a entender estos parámetros o a gestionarlos. Usa Markdown.'
    },
    'customer': {
        storageKey: 'customer',
        systemRole: 'Eres un experto en gestión de clientes de Dizucar. Tienes acceso a la lista actual de clientes (nombre, dirección, departamento, municipio, clasificación y correos electrónicos). Toma en cuenta que un cliente puede tener múltiples correos registrados. Ayuda al usuario a analizar su cartera de clientes o a buscar información específica. Usa Markdown.'
    },
    'notes': {
        storageKey: 'notes',
        systemRole: 'Eres un experto en notas de Certificados de Análisis (COA) de Dizucar. Tienes acceso a la lista de notas aclaratorias del COA (orden y descripción). Ayuda al usuario a gestionar estas notas o a ordenarlas correctamente. Usa Markdown.'
    },
    'product': {
        storageKey: 'product',
        systemRole: 'Eres un experto en productos de Dizucar. Tienes acceso al catálogo actual (nombre, descripción y presentación). Ayuda al usuario a buscar productos o a gestionar la lista. Usa Markdown.'
    },
    'cellar': {
        storageKey: 'cellar',
        systemRole: 'Eres un experto en gestión de bodegas de Dizucar. Tienes acceso a la lista de bodegas (nombre y descripción). Ayuda al usuario a organizar sus centros de almacenamiento. Usa Markdown.'
    },
    'presentation': {
        storageKey: 'presentation',
        systemRole: 'Eres un experto en presentaciones de productos de Dizucar. Tienes acceso a la lista de presentaciones (nombre y descripción). Ayuda al usuario a gestionar cómo se ofrecen los productos. Usa Markdown.'
    },
    'coas': {
        storageKey: 'coas',
        systemRole: 'Eres un experto en Certificados de Análisis (COA) de Dizucar. Tienes acceso a los certificados emitidos (maestro-detalle). El maestro incluye cliente, dirección, fechas, producto, bodega, etc. El detalle incluye parámetros y resultados. Ayuda al usuario a analizar certificados o a buscar datos específicos. Tienes acceso a los campos: cliente, producto, fecha de revision, emision, vencimiento, lote, etc. Usa Markdown.'
    },
    'default': {
        storageKey: null,
        systemRole: 'Eres un asistente útil que habla con el usuario en su día a día. Tu tono es amigable y profesional. Responde de manera concisa pero informativa. Usa Markdown para dar formato a tus respuestas.'
    }
};

// Initialize AI
async function init() {
    try {
        statusIndicator.innerText = "Verificando disponibilidad...";

        if (typeof window.ai === 'undefined' || typeof window.ai.languageModel === 'undefined') {
            if (typeof LanguageModel === 'undefined') {
                statusIndicator.innerText = "API no disponible";
                console.error("LanguageModel API not found.");
                return;
            }
        }

        // Use the available global or window.ai
        const AIClass = (typeof window.ai !== 'undefined' && window.ai.languageModel) ? window.ai.languageModel : LanguageModel;

        const availability = await AIClass.availability();
        console.log("Disponibilidad:", availability);

        if (availability === 'available' || availability === 'after-download') {
            statusIndicator.innerText = "En línea";
            statusIndicator.classList.add('ready');

            // --- CONTEXT LOGIC ---
            const urlParams = new URLSearchParams(window.location.search);
            const contextKey = urlParams.get('context') || 'default';
            const contextConfig = CONTEXT_MAP[contextKey] || CONTEXT_MAP['default'];

            let systemPrompt = contextConfig.systemRole;

            if (contextConfig.storageKey) {
                const data = localStorage.getItem(contextConfig.storageKey) || '[]';
                if (data !== '[]') {
                    systemPrompt += `\n\nAquí tienes la información actual del contexto ("${contextKey}") en formato JSON:\n${data}\n\nUsa esta información para responder las preguntas del usuario sobre sus datos de manera precisa.`;
                } else {
                    systemPrompt += `\n\n(No se encontró información en localStorage para la clave "${contextConfig.storageKey}").`;
                }
            }

            console.log("System Prompt:", systemPrompt);

            // Create session immediately with the personalized prompt
            try {
                session = await AIClass.create({
                    initialPrompts: [
                        { role: "system", content: systemPrompt }
                    ]
                });
            } catch (createError) {
                console.error("Error creating session:", createError);
                statusIndicator.innerText = "Error creando sesión";
            }

        } else {
            statusIndicator.innerText = "No disponible (" + availability + ")";
        }

    } catch (e) {
        console.error(e);
        statusIndicator.innerText = "Error: " + e.message;
    }
}

// Function to add message to UI
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (sender === 'ai') {
        contentDiv.innerHTML = marked.parse(text);
    } else {
        contentDiv.textContent = text;
    }

    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);

    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return contentDiv;
}

// Send Message Logic
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    if (!session) {
        alert("La IA no está lista o no disponible.");
        return;
    }

    // Add User Message
    addMessage(text, 'user');
    userInput.value = '';

    // Create placeholder for AI response
    const aiContentDiv = addMessage("...", 'ai');

    try {
        const stream = session.promptStreaming(text);
        let fullResponse = "";

        for await (const chunk of stream) {
            fullResponse += chunk;
            aiContentDiv.innerHTML = marked.parse(fullResponse);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

    } catch (err) {
        console.error("Error generating response:", err);
        aiContentDiv.textContent = "Error: " + err.message;
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Start
init();