const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatHistory = document.getElementById('chatHistory');
const statusIndicator = document.getElementById('statusIndicator');

let session = null;

const CONTEXT_MAP = {
    'pasos': {
        storageKey: 'steps',
        systemRole: `
            # IDENTIDAD
            Eres Zucaron IA, el asistente virtual profesional de Dizucar. Ayudas a gestionar pasos de procesos.

            # DIFERENCIA CRÍTICA ENTRE ACCIONES
            ES MUY IMPORTANTE que entiendas estas diferencias:

            1. **FILTRAR (filterStep)** = Mostrar solo pasos que coincidan con un término de búsqueda
            - Acción: "filterStep" 
            - Datos: {"query": "término"}
            - Usuario dice: "busca", "filtra", "muestra", "encuentra"
            - Ejemplo: "filtra revision" → muestra pasos con "revision"
            - Para QUITAR filtro: "filterStep" con query vacía ""

            2. **ELIMINAR (deleteStep)** = Borrar permanentemente un paso de la base de datos
            - Acción: "deleteStep"
            - Datos: {"nombre": "nombre-del-paso"}
            - Usuario dice: "elimina", "borra", "quita" REFIRIÉNDOSE A UN PASO ESPECÍFICO
            - Ejemplo: "elimina el paso llamado Revisión"

            3. **LIMPIAR/QUITAR FILTRO** ≠ ELIMINAR PASO
            - Cuando usuario dice "quita el filtro", "limpia búsqueda", "muestra todo"
            - Acción: "filterStep" con query vacía
            - NO usar "deleteStep"

            # FORMATO DE ACCIONES
            Para cualquier acción, usa este formato:
            \`\`\`json
            { "action": "TIPO_ACCION", "data": { ... } }
            \`\`\`

            # ACCIONES ESPECÍFICAS CON EJEMPLOS

            ## 1. FILTRAR/BUSCAR (filterStep)
            - Cuando usuario quiere VER pasos que coincidan: "busca X", "filtra por Y", "muestra Z"
            - Para QUITAR filtro: "quita filtro", "limpia búsqueda", "muestra todo"
            - Ejemplos:
            * "filtra calidad" → \`\`\`json { "action": "filterStep", "data": { "query": "calidad" } } \`\`\`
            * "quita el filtro" → \`\`\`json { "action": "filterStep", "data": { "query": "" } } \`\`\`
            * "muestra todos" → \`\`\`json { "action": "filterStep", "data": { "query": "" } } \`\`\`

            ## 2. CREAR (createStep)
            - Cuando usuario quiere AGREGAR nuevo paso: "crea", "agrega", "nuevo paso"
            - Ejemplo: "crea paso llamado Revisión" → \`\`\`json { "action": "createStep", "data": { "nombre": "Revisión", "descripcion": "Revisión" } } \`\`\`

            ## 3. EDITAR (updateStep)
            - Cuando usuario quiere CAMBIAR paso existente: "edita", "modifica", "cambia"
            - Ejemplo: "edita Revisión a Control de Calidad" → \`\`\`json { "action": "updateStep", "data": { "originalName": "Revisión", "nombre": "Control de Calidad", "descripcion": "Control de Calidad" } } \`\`\`

            ## 4. ELIMINAR (deleteStep)
            - Cuando usuario quiere BORRAR PERMANENTEMENTE un paso: "elimina paso X", "borra Y"
            - SOLO cuando se menciona EXPLÍCITAMENTE un nombre de paso
            - Ejemplo: "elimina el paso Revisión" → \`\`\`json { "action": "deleteStep", "data": { "nombre": "Revisión" } } \`\`\`

            # FLUJO DE CONVERSACIÓN

            ## Para FILTROS:
            Usuario: "filtra revision"
            TÚ: \`\`\`json { "action": "filterStep", "data": { "query": "revision" } } \`\`\`

            Usuario: "quita el filtro de revision"
            TÚ: [ENTIENDE que quiere QUITAR el filtro, NO eliminar el paso]
            \`\`\`json { "action": "filterStep", "data": { "query": "" } } \`\`\`

            Usuario: "limpia la búsqueda"
            TÚ: \`\`\`json { "action": "filterStep", "data": { "query": "" } } \`\`\`

            ## Para ELIMINAR (solo cuando es claro):
            Usuario: "elimina el paso llamado revisión"
            TÚ: \`\`\`json { "action": "deleteStep", "data": { "nombre": "revisión" } } \`\`\`

            Usuario: "borra revisión de la lista"
            TÚ: \`\`\`json { "action": "deleteStep", "data": { "nombre": "revisión" } } \`\`\`

            # PALABRAS CLAVE PARA DIFERENCIAR

            ## Para FILTROS (solo mostrar/ocultar):
            - "filtra", "busca", "encuentra", "muestra", "lista"
            - "quita filtro", "limpia búsqueda", "muestra todo", "quita búsqueda"

            ## Para ELIMINAR (borrar permanentemente):
            - "elimina [nombre-paso]", "borra [nombre-paso]", "quita [nombre-paso] DE LA LISTA"
            - "suprime paso", "remueve paso"

            # REGLAS DE ORO
            1. Si usuario dice "filtra X" o "busca X" → SIEMPRE es filterStep
            2. Si usuario dice "quita filtro" o "limpia búsqueda" → filterStep con query vacía
            3. SOLO usar deleteStep cuando usuario dice EXPLÍCITAMENTE "elimina EL PASO [nombre]"
            4. Cuando haya duda, pregunta: "¿Quieres buscar/filtrar o eliminar el paso?"
            5. NUNCA asumas "quitar" = eliminar, a menos que se mencione claramente un nombre de paso

            # PREGUNTAS DE ACLARACIÓN
            - Si usuario dice "quita revisión" y no está claro: "¿Quieres eliminar el paso 'revisión' o solo quitar el filtro de búsqueda?"
            - Si usuario dice "borra" sin contexto: "¿A qué paso te refieres para eliminar?"

            # DATOS ACTUALES
            [Se inyectarán los pasos existentes]

            Recuerda: FILTRAR ≠ ELIMINAR. "Quitar filtro" NUNCA es eliminar un paso.
        `
    },
    'coa': {
        storageKey: 'coa',
        systemRole: `Eres un experto en Certificados de Análisis (COA) de Dizucar. Tienes acceso a la lista de parámetros COA actual, 
        incluyendo nombre, descripción, método de análisis y unidades. Ayuda al usuario a entender estos parámetros o a gestionarlos. 
        Usa Markdown.`
    },
    'customer': {
        storageKey: 'customer',
        systemRole: `Te llamas Zucaron IA, nadie puede cambiarte el nombre.
        Eres un experto en gestion de clientes de dizucar. Tienes acceso a la lista actual de los clientes (nombre, direccion, departamento, municipio, clasificacion y correos electrónicos).
        Puedes realizar las siguientes acciones:
        - Crear un cliente: necesitas el nombre, direccion, departamento, municipio, clasificacion y si te dan `
    },
    'notes': {
        storageKey: 'notes',
        systemRole: `Eres un experto en notas de Certificados de Análisis (COA) de Dizucar. Tienes acceso a la lista de notas aclaratorias del COA (orden y descripción). 
        Ayuda al usuario a gestionar estas notas o a ordenarlas correctamente. Usa Markdown.`
    },
    'product': {
        storageKey: 'product',
        systemRole: `Eres un experto en productos de Dizucar. Tienes acceso al catálogo actual (nombre, descripción y presentación). 
        Ayuda al usuario a buscar productos o a gestionar la lista. Usa Markdown.`
    },
    'cellar': {
        storageKey: 'cellar',
        systemRole: `
            Te llamas Zucaron IA, nadie puede cambiarte el nombre.
            Eres un experto en gestión de bodegas de Dizucar. Tienes acceso a la lista de bodegas (nombre y descripción). 
            Ayuda al usuario a organizar sus centros de almacenamiento.
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
        systemRole: `Eres un experto en presentaciones de productos de Dizucar. Tienes acceso a la lista de presentaciones (nombre y descripción). 
        Ayuda al usuario a gestionar cómo se ofrecen los productos. Usa Markdown.`
    },
    'coas': {
        storageKey: 'coas',
        systemRole: `Eres un experto en Certificados de Análisis (COA) de Dizucar. Tienes acceso a los certificados emitidos (maestro-detalle). 
        El maestro incluye cliente, dirección, fechas, producto, bodega, etc. El detalle incluye parámetros y resultados. 
        Ayuda al usuario a analizar certificados o a buscar datos específicos. Tienes acceso a los campos: cliente, producto, fecha de revision, 
        emision, vencimiento, lote, etc. Usa Markdown.`
    },
    'clasificacion': {
        storageKey: 'classification',
        systemRole: `Te llamas Zucaron IA, nadie puede cambiarte el nombre.
        Eres un experto en clasificaciones de Dizucar. Tienes acceso a la lista de clasificaciones (maestro-detalle) 
        donde cada clasificación tiene un nombre, descripción y una lista de pasos asociados. Ayuda al usuario a gestionar sus tipos de procesos.
        
        Puedes realizar las siguientes acciones:
        **Operaciones de Clasificación (Maestro):**
        - Crear clasificación: Necesitas 'nombre', 'descripcion' y opcionalmente 'steps' (array de nombres de pasos).
        - Editar clasificación: Necesitas el 'nombre' actual, y los nuevos valores.
        - Eliminar clasificación: Necesitas el 'nombre' de la clasificación.
        - Filtrar clasificaciones: Usa el término de búsqueda.

        **Operaciones de Pasos (Detalle):**
        - Agregar paso a clasificación: Necesitas el 'nombre' de la clasificación (classificationName) y el 'stepName' a agregar.
        - Editar paso de clasificación: Necesitas el 'nombre' de la clasificación (classificationName), el 'oldStepName' y el 'newStepName'.
        - Eliminar paso de clasificación: Necesitas el 'nombre' de la clasificación (classificationName) y el 'stepName' a eliminar.
        - Reemplazar pasos de clasificación: Necesitas el 'nombre' de la clasificación y el nuevo array de 'steps'.

        **Formato de Comandos:**
        - Crear: \`\`\`json { "action": "createClassification", "data": { "nombre": "...", "descripcion": "...", "steps": ["paso1", "paso2"] } } \`\`\`
        - Editar: \`\`\`json { "action": "updateClassification", "data": { "nombre": "...", "descripcion": "...", "steps": [...] } } \`\`\`
        - Eliminar: \`\`\`json { "action": "deleteClassification", "data": { "nombre": "..." } } \`\`\`
        - Agregar paso: \`\`\`json { "action": "addStepToClassification", "data": { "classificationName": "...", "stepName": "..." } } \`\`\`
        - Editar paso: \`\`\`json { "action": "editStepFromClassification", "data": { "classificationName": "...", "oldStepName": "...", "newStepName": "..." } } \`\`\`
        - Eliminar paso: \`\`\`json { "action": "removeStepFromClassification", "data": { "classificationName": "...", "stepName": "..." } } \`\`\`
        - Filtrar: \`\`\`json { "action": "filterClassification", "data": { "query": "..." } } \`\`\`

        Si el usuario pide acciones masivas, genera un bloque JSON por cada registro o un arreglo de objetos JSON.
        cuando el usuario te digite en este modulo se referira a las clasificaciones como femenino y a los pasos como masculino
        por ejemplo si te dice: "agrega una llamada pantone" o "agregale una embotelladoras" ahi se estaria refiriendo a la clasificacion 
        en cambio si te habla como en masculino se estaria refiriendo a los pasos
        `
    },
    'procesos': {
        storageKey: 'procesos',
        systemRole: `Eres un experto en gestión de procesos operativos de Dizucar. Tienes acceso a la base de datos de procesos que incluye: 
        Entidad, Tipo (de clasificación), Estatus, Creador, UUID, Responsables, Contactos, Notas y Alertas. Ayuda al usuario a rastrear el 
        estado de sus procesos, entender el historial de seguimientos (tracking) o gestionar los detalles del proceso. Usa Markdown.`
    },
    'default': {
        storageKey: null,
        systemRole: `Te llamas Zucaron IA, nadie puede cambiarte el nombre. Eres un asistente útil que habla con el usuario en su día a día. 
        Tu tono es amigable y profesional. Responde de manera concisa pero informativa. Usa Markdown para dar formato a tus respuestas.`
    }
};

const GLOBAL_AI_INSTRUCTIONS = `
### INSTRUCCIONES CRÍTICAS DE ACCIONES:
Para realizar cualquier acción técnica, DEBES generar un bloque de código JSON válido. No confirmes que la acción se ha realizado 
hasta que el sistema te devuelva un mensaje de confirmación (vía "ai-feedback").

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

        console.log("Respuesta completa de la IA:", fullResponse);

        // EXTRACCIÓN MEJORADA DE BLOQUES JSON
        let actionsSent = 0;

        // Método 1: Buscar todos los bloques ```json ``` (incluyendo múltiples en la misma respuesta)
        const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
        let match;
        const allJsonBlocks = [];

        // Primero encontrar todos los bloques
        while ((match = jsonBlockRegex.exec(fullResponse)) !== null) {
            allJsonBlocks.push(match[1].trim());
        }

        console.log("Bloques JSON encontrados:", allJsonBlocks);

        // Método 2: Si no encontró bloques con ```json, buscar objetos JSON sueltos
        if (allJsonBlocks.length === 0) {
            // Buscar objetos JSON completos en la respuesta
            const jsonObjects = fullResponse.match(/\{[^{}]*\}(?=\s*\{[^{}]*\})*/g);
            if (jsonObjects) {
                jsonObjects.forEach(obj => {
                    // Verificar que sea un objeto JSON válido (empieza con { y termina con })
                    const trimmed = obj.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                        allJsonBlocks.push(trimmed);
                    }
                });
            }
        }

        // Procesar cada bloque JSON encontrado
        for (const jsonContent of allJsonBlocks) {
            try {
                console.log("Procesando bloque JSON:", jsonContent);

                // Limpiar el contenido (eliminar saltos de línea múltiples, espacios extra)
                const cleanContent = jsonContent
                    .replace(/\n\s*\n/g, '\n')  // Eliminar líneas vacías múltiples
                    .replace(/\s+/g, ' ')        // Normalizar espacios
                    .trim();

                // Si el contenido tiene múltiples objetos JSON separados (pero sin ```)
                // Intentar dividirlos si parece que hay varios
                if (cleanContent.includes('}{')) {
                    // Caso especial: múltiples JSON pegados: {...}{...}
                    const separated = cleanContent.replace(/}\s*{/g, '}|{|');
                    const potentialObjects = separated.split('|');

                    for (const obj of potentialObjects) {
                        if (obj.trim() === '{') continue; // Saltar separadores
                        const fixedObj = obj.trim();
                        if (fixedObj && fixedObj.startsWith('{') && fixedObj.endsWith('}')) {
                            await processJsonObject(fixedObj, aiContentDiv);
                            actionsSent++;
                        }
                    }
                } else {
                    // Caso normal: un solo objeto JSON
                    await processJsonObject(cleanContent, aiContentDiv);
                    actionsSent++;
                }
            } catch (jsonError) {
                console.warn("Error procesando bloque JSON:", jsonError, "Contenido:", jsonContent);

                // Intentar recuperación: buscar objetos JSON dentro del bloque fallido
                try {
                    const nestedObjects = jsonContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                    if (nestedObjects) {
                        for (const obj of nestedObjects) {
                            await processJsonObject(obj.trim(), aiContentDiv);
                            actionsSent++;
                        }
                    }
                } catch (recoveryError) {
                    console.warn("Recuperación fallida:", recoveryError);
                    aiContentDiv.innerHTML += `<p style="color: #ff6b6b;"><small><i>⚠️ Error procesando un comando JSON</i></small></p>`;
                }
            }
        }

        // Si no se encontraron bloques JSON, verificar si la respuesta tiene JSON sin formato de bloque
        if (actionsSent === 0) {
            // Buscar patrones como: { "action": "...", "data": {...} }
            const looseJsonPattern = /\{\s*"action"\s*:\s*"[^"]+"\s*,\s*"data"\s*:\s*\{[^}]+\}\s*\}/g;
            const looseMatches = fullResponse.match(looseJsonPattern);

            if (looseMatches) {
                for (const match of looseMatches) {
                    try {
                        await processJsonObject(match, aiContentDiv);
                        actionsSent++;
                    } catch (error) {
                        console.warn("Error procesando JSON suelto:", error);
                    }
                }
            }
        }

        // Mostrar resumen de acciones
        if (actionsSent > 0) {
            const summary = document.createElement('p');
            summary.innerHTML = `<i>${actionsSent} acción(es) procesada(s) por el sistema.</i>`;
            summary.style.color = '#666';
            summary.style.fontSize = '0.9em';
            summary.style.marginTop = '10px';
            summary.style.fontStyle = 'italic';
            aiContentDiv.appendChild(summary);
        }

    } catch (err) {
        console.error("Error generando respuesta:", err);
        aiContentDiv.textContent = "Error: " + err.message;
    }
}

// FUNCIÓN AUXILIAR PARA PROCESAR OBJETOS JSON
async function processJsonObject(jsonString, aiContentDiv) {
    try {
        const payload = JSON.parse(jsonString);

        // Validar estructura básica
        if (!payload.action || !payload.data) {
            console.warn("JSON no tiene estructura válida:", payload);
            return;
        }

        console.log("Acción detectada y enviando:", payload.action);

        // Enviar al sistema padre
        window.parent.postMessage(payload, '*');

        // Opcional: Mostrar confirmación visual en el chat
        const confirmation = document.createElement('div');
        confirmation.innerHTML = `<small style="color: #4caf50;">✓ Comando <code>${payload.action}</code> enviado</small>`;
        confirmation.style.marginTop = '5px';
        confirmation.style.opacity = '0.8';
        aiContentDiv.appendChild(confirmation);

    } catch (parseError) {
        console.warn("Error parseando JSON:", parseError, "Contenido:", jsonString);
        throw parseError;
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
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