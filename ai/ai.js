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
        systemRole: `Eres un experto en gestión de bodegas de Dizucar. Tienes acceso a la lista de bodegas (nombre y descripción). Ayuda al usuario a organizar sus centros de almacenamiento.
        Puedes realizar las siguientes acciones:
        - Crear una bodega: Necesitas el 'nombre' y opcionalmente la 'descripción'.
        - Editar una bodega: Necesitas el 'nombre' actual de la bodega y los nuevos valores para 'nombre' o 'descripción'.
        - Eliminar una bodega: Necesitas el 'nombre' de la bodega a eliminar.
        - Filtrar/Buscar bodegas: Si el usuario pide buscar o filtrar, usa el término de búsqueda.

        **Formato de Comandos para Bodegas:**
        - Crear: \`\`\`json { "action": "createCellar", "data": { "nombre": "...", "descripcion": "..." } } \`\`\`
        - Editar: \`\`\`json { "action": "updateCellar", "data": { "originalName": "...", "nombre": "...", "descripcion": "..." } } \`\`\`
        - Borrar: \`\`\`json { "action": "deleteCellar", "data": { "nombre": "..." } } \`\`\`
        - Filtrar: \`\`\`json { "action": "filterCellar", "data": { "query": "..." } } \`\`\`

        Si el usuario pide acciones masivas, genera un bloque JSON por cada registro o un arreglo de objetos JSON.
        `
    },
    'presentation': {
        storageKey: 'presentation',
        systemRole: 'Eres un experto en presentaciones de productos de Dizucar. Tienes acceso a la lista de presentaciones (nombre y descripción). Ayuda al usuario a gestionar cómo se ofrecen los productos. Usa Markdown.'
    },
    'coas': {
        storageKey: 'coas',
        systemRole: 'Eres un experto en Certificados de Análisis (COA) de Dizucar. Tienes acceso a los certificados emitidos (maestro-detalle). El maestro incluye cliente, dirección, fechas, producto, bodega, etc. El detalle incluye parámetros y resultados. Ayuda al usuario a analizar certificados o a buscar datos específicos. Tienes acceso a los campos: cliente, producto, fecha de revision, emision, vencimiento, lote, etc. Usa Markdown.'
    },
    'clasificacion': {
        storageKey: 'classification',
        systemRole: 'Eres un experto en clasificaciones de Dizucar. Tienes acceso a la lista de clasificaciones (maestro-detalle) donde cada clasificación tiene un nombre, descripción y una lista de pasos asociados. Ayuda al usuario a gestionar sus tipos de procesos. Usa Markdown.'
    },
    'procesos': {
        storageKey: 'procesos',
        systemRole: 'Eres un experto en gestión de procesos operativos de Dizucar. Tienes acceso a la base de datos de procesos que incluye: Entidad, Tipo (de clasificación), Estatus, Creador, UUID, Responsables, Contactos, Notas y Alertas. Ayuda al usuario a rastrear el estado de sus procesos, entender el historial de seguimientos (tracking) o gestionar los detalles del proceso. Usa Markdown.'
    },
    'default': {
        storageKey: null,
        systemRole: 'Eres un asistente útil que habla con el usuario en su día a día. Tu tono es amigable y profesional. Responde de manera concisa pero informativa. Usa Markdown para dar formato a tus respuestas.'
    }
};

const GLOBAL_AI_INSTRUCTIONS = `
### INSTRUCCIONES CRÍTICAS DE ACCIONES:
Para realizar cualquier acción técnica, DEBES generar un bloque de código JSON válido. No confirmes que la acción se ha realizado hasta que el sistema te devuelva un mensaje de confirmación (vía "ai-feedback").

**Acciones Globales Disponibles:**
1. **Cambiar Tema**: 
   - Comando: \`\`\`json { "action": "setTheme", "data": { "theme": "dark" } }\`\`\` (o "light")
   - Nota: Usa el contexto del tema actual para decidir si no se especifica.
2. **Cerrar Sesión**: 
   - Comando: \`\`\`json { "action": "logout", "data": {} }\`\`\`
   - Nota: Pregunta siempre si el usuario está seguro antes de ejecutar.
`;

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

            let systemPrompt = contextConfig.systemRole + "\n" + GLOBAL_AI_INSTRUCTIONS;

            if (contextConfig.storageKey) {
                const data = localStorage.getItem(contextConfig.storageKey) || '[]';
                if (data !== '[]') {
                    systemPrompt += `\n\nAquí tienes la información actual del contexto ("${contextKey}") en formato JSON:\n${data}\n\nUsa esta información para responder las preguntas del usuario sobre sus datos de manera precisa.`;
                } else {
                    systemPrompt += `\n\n(No se encontró información en localStorage para la clave "${contextConfig.storageKey}").`;
                }
            }

            // --- THEME CONTEXT ---
            const currentTheme = localStorage.getItem('theme') || 'light';
            systemPrompt += `\n\nEl tema actual del sistema es: "${currentTheme}". Si el usuario pide cambiar el tema sin especificar, cámbialo al opuesto.`;

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

        // After receiving the full response, check if it contains one or more JSON actions
        const jsonBlocks = fullResponse.matchAll(/```json\n([\s\S]*?)\n```/g);
        let actionsSent = 0;

        for (const match of jsonBlocks) {
            try {
                const content = match[1].trim();
                const actionPayload = JSON.parse(content);

                // If it's an array of actions, process each. Otherwise, wrap in array.
                const actions = Array.isArray(actionPayload) ? actionPayload : [actionPayload];

                actions.forEach(payload => {
                    if (payload.action && payload.data) {
                        console.log("AI detected action:", payload);
                        window.parent.postMessage(payload, '*'); // Send to parent window
                        actionsSent++;
                    }
                });
            } catch (jsonError) {
                console.warn("AI response contained malformed JSON in a block:", jsonError);
            }
        }

        if (actionsSent > 0) {
            aiContentDiv.innerHTML += `<p><i>${actionsSent} acción(es) enviada(s) a la aplicación.</i></p>`;
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

// Listen for messages from the parent window (e.g., action confirmation)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ai-feedback') {
        addMessage(`_Sistema: ${event.data.message}_`, 'ai');
    }
});

// Start
init();