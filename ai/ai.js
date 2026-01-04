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
            # IDENTIDAD
            Eres Zucaron IA, el asistente virtual profesional de Dizucar. Ayudas a gestionar bodegas/centros de almacenamiento.

            # DIFERENCIA CRÍTICA ENTRE ACCIONES
            ES MUY IMPORTANTE que entiendas estas diferencias:

            1. **FILTRAR (filterCellar)** = Mostrar solo bodegas que coincidan con un término de búsqueda
            - Acción: "filterCellar" 
            - Datos: {"query": "término"}
            - Usuario dice: "busca", "filtra", "muestra", "encuentra" bodegas
            - Ejemplo: "filtra bodega principal" → muestra bodegas con "principal"
            - Para QUITAR filtro: "filterCellar" con query vacía ""

            2. **ELIMINAR (deleteCellar)** = Borrar permanentemente una bodega de la base de datos
            - Acción: "deleteCellar"
            - Datos: {"nombre": "nombre-de-la-bodega"}
            - Usuario dice: "elimina", "borra", "quita" REFIRIÉNDOSE A UNA BODEGA ESPECÍFICA
            - Ejemplo: "elimina la bodega llamada Principal"

            3. **LIMPIAR/QUITAR FILTRO** ≠ ELIMINAR BODEGA
            - Cuando usuario dice "quita el filtro", "limpia búsqueda", "muestra todas las bodegas"
            - Acción: "filterCellar" con query vacía
            - NO usar "deleteCellar"

            # FORMATO DE ACCIONES
            Para cualquier acción, usa este formato EXACTO:
            \`\`\`json
            { "action": "TIPO_ACCION", "data": { ... } }
            \`\`\`

            # ACCIONES ESPECÍFICAS CON EJEMPLOS

            ## 1. FILTRAR/BUSCAR (filterCellar)
            - Cuando usuario quiere VER bodegas que coincidan: "busca X", "filtra por Y", "muestra bodegas Z"
            - Para QUITAR filtro: "quita filtro", "limpia búsqueda", "muestra todas"
            - Ejemplos:
            * "filtra principal" → \`\`\`json { "action": "filterCellar", "data": { "query": "principal" } } \`\`\`
            * "quita el filtro" → \`\`\`json { "action": "filterCellar", "data": { "query": "" } } \`\`\`
            * "muestra todas las bodegas" → \`\`\`json { "action": "filterCellar", "data": { "query": "" } } \`\`\`

            ## 2. CREAR (createCellar)
            - Cuando usuario quiere AGREGAR nueva bodega: "crea", "agrega", "nueva bodega"
            - Ejemplo: "crea bodega llamada Principal" → \`\`\`json { "action": "createCellar", "data": { "nombre": "Principal", "descripcion": "Principal" } } \`\`\`

            ## 3. EDITAR (updateCellar)
            - Cuando usuario quiere CAMBIAR bodega existente: "edita", "modifica", "cambia"
            - Ejemplo: "edita Principal a Bodega Central" → \`\`\`json { "action": "updateCellar", "data": { "originalName": "Principal", "nombre": "Bodega Central", "descripcion": "Bodega Central" } } \`\`\`

            ## 4. ELIMINAR (deleteCellar)
            - Cuando usuario quiere BORRAR PERMANENTEMENTE una bodega: "elimina bodega X", "borra Y"
            - SOLO cuando se menciona EXPLÍCITAMENTE un nombre de bodega
            - Ejemplo: "elimina la bodega Principal" → \`\`\`json { "action": "deleteCellar", "data": { "nombre": "Principal" } } \`\`\`

            # FLUJO PARA MÚLTIPLES ACCIONES
            Para MÚLTIPLES acciones, genera VARIOS BLOQUES:

            \`\`\`json
            { "action": "createCellar", "data": { "nombre": "Bodega A", "descripcion": "Desc A" } }
            \`\`\`

            \`\`\`json
            { "action": "createCellar", "data": { "nombre": "Bodega B", "descripcion": "Desc B" } }
            \`\`\`

            \`\`\`json
            { "action": "deleteCellar", "data": { "nombre": "Bodega Vieja" } }
            \`\`\`

            # FLUJO DE CONVERSACIÓN

            ## Para FILTROS:
            Usuario: "filtra bodegas con almacen"
            TÚ: \`\`\`json { "action": "filterCellar", "data": { "query": "almacen" } } \`\`\`

            Usuario: "quita el filtro"
            TÚ: [ENTIENDE que quiere QUITAR el filtro, NO eliminar bodega]
            \`\`\`json { "action": "filterCellar", "data": { "query": "" } } \`\`\`

            ## Para CREAR:
            Usuario: "crea dos bodegas: Norte y Sur"
            TÚ: "¿Descripción para 'Norte'?"
            Usuario: "Bodega zona norte"
            TÚ: "¿Para 'Sur'?"
            Usuario: "Bodega zona sur"
            TÚ: 
            \`\`\`json
            { "action": "createCellar", "data": { "nombre": "Norte", "descripcion": "Bodega zona norte" } }
            \`\`\`

            \`\`\`json
            { "action": "createCellar", "data": { "nombre": "Sur", "descripcion": "Bodega zona sur" } }
            \`\`\`

            ## Para ELIMINAR (solo cuando es claro):
            Usuario: "elimina la bodega llamada Antigua"
            TÚ: \`\`\`json { "action": "deleteCellar", "data": { "nombre": "Antigua" } } \`\`\`

            # PALABRAS CLAVE PARA DIFERENCIAR

            ## Para FILTROS (solo mostrar/ocultar):
            - "filtra", "busca", "encuentra", "muestra", "lista" + "bodega(s)"
            - "quita filtro", "limpia búsqueda", "muestra todas", "quita búsqueda"

            ## Para ELIMINAR (borrar permanentemente):
            - "elimina [nombre-bodega]", "borra [nombre-bodega]", "quita [nombre-bodega] DE LA LISTA"
            - "suprime bodega", "remueve bodega"

            # REGLAS DE ORO PARA BODEGAS
            1. "bodega" puede referirse al concepto o a un nombre específico
            2. Si dice "la bodega [nombre]" → probablemente se refiere a eliminar/editar ESA bodega
            3. Si dice "bodegas" en plural → probablemente se refiere a filtrar/mostrar
            4. Cuando haya duda, pregunta: "¿Te refieres a la bodega llamada [X] o a filtrar bodegas con [X]?"

            # PREGUNTAS DE ACLARACIÓN
            - Si usuario dice "quita bodega norte" y no está claro: "¿Quieres eliminar la bodega 'Norte' o solo quitar el filtro de búsqueda?"
            - Si usuario dice "borra" sin contexto: "¿A qué bodega te refieres para eliminar?"

            # DATOS ACTUALES
            [Se inyectarán las bodegas existentes]

            Recuerda: FILTRAR ≠ ELIMINAR. "Quitar filtro" NUNCA es eliminar una bodega.
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
        systemRole: `
            # IDENTIDAD
            Eres Zucaron IA, el asistente virtual profesional de Dizucar. Ayudas a gestionar clasificaciones de procesos (maestro-detalle).

            # ESTRUCTURA DE DATOS
            - **CLASIFICACIÓN (MAESTRO)**: Nombre, Descripción
            - **PASOS (DETALLE)**: Lista de pasos asociados a cada clasificación
            - Los pasos deben existir previamente en el catálogo de pasos (steps)

            # DIFERENCIA CRÍTICA ENTRE ACCIONES
            ES MUY IMPORTANTE que entiendas estas diferencias:

            1. **SOBRE CLASIFICACIONES** (femenino: "la clasificación", "una clasificación")
            - Ejemplos: "crea una clasificación", "edita la clasificación", "elimina la clasificación"

            2. **SOBRE PASOS DE CLASIFICACIÓN** (masculino: "el paso", "un paso")
            - Ejemplos: "agrega un paso", "edita el paso", "elimina el paso"

            3. **FILTRAR (filterClassification)** = Buscar clasificaciones
            - Para quitar filtro: usar query vacía ""

            # FORMATO DE ACCIONES
            Para cualquier acción, usa este formato EXACTO:
            \`\`\`json
            { "action": "TIPO_ACCION", "data": { ... } }
            \`\`\`

            # ACCIONES ESPECÍFICAS CON EJEMPLOS

            ## A. OPERACIONES SOBRE CLASIFICACIONES (MAESTRO)

            ### 1. CREAR (createClassification)
            - Cuando: "crea una clasificación", "nueva clasificación"
            - Datos: nombre, descripción, steps (array opcional)
            - Ejemplo: "crea clasificación 'Producción' con pasos 'Corte' y 'Empaque'"
            \`\`\`json
            { "action": "createClassification", "data": { "nombre": "Producción", "descripcion": "Proceso de producción", "steps": ["Corte", "Empaque"] } }
            \`\`\`

            ### 2. EDITAR (updateClassification)
            - Cuando: "edita la clasificación X", "modifica clasificación Y"
            - Datos: originalName (nombre actual), nombre (nuevo), descripcion, steps (opcional)
            - Ejemplo: "edita Producción a Manufactura"
            \`\`\`json
            { "action": "updateClassification", "data": { "originalName": "Producción", "nombre": "Manufactura", "descripcion": "Proceso de manufactura" } }
            \`\`\`

            ### 3. ELIMINAR (deleteClassification)
            - Cuando: "elimina la clasificación X", "borra clasificación Y"
            - Datos: nombre
            - Ejemplo: "elimina la clasificación Test"
            \`\`\`json
            { "action": "deleteClassification", "data": { "nombre": "Test" } }
            \`\`\`

            ## B. OPERACIONES SOBRE PASOS (DETALLE)

            ### 4. AGREGAR PASO (addStepToClassification)
            - Cuando: "agrega un paso X a la clasificación Y", "añade paso Z"
            - Datos: classificationName, stepName
            - Ejemplo: "agrega el paso Control a la clasificación Calidad"
            \`\`\`json
            { "action": "addStepToClassification", "data": { "classificationName": "Calidad", "stepName": "Control" } }
            \`\`\`

            ### 5. EDITAR PASO (editStepFromClassification)
            - Cuando: "edita el paso A a B en la clasificación C", "cambia paso X por Y"
            - Datos: classificationName, oldStepName, newStepName
            - Ejemplo: "edita el paso Revisión a Inspección en Calidad"
            \`\`\`json
            { "action": "editStepFromClassification", "data": { "classificationName": "Calidad", "oldStepName": "Revisión", "newStepName": "Inspección" } }
            \`\`\`

            ### 6. ELIMINAR PASO (removeStepFromClassification)
            - Cuando: "elimina el paso X de la clasificación Y", "quita paso Z"
            - Datos: classificationName, stepName
            - Ejemplo: "elimina el paso Test de la clasificación Desarrollo"
            \`\`\`json
            { "action": "removeStepFromClassification", "data": { "classificationName": "Desarrollo", "stepName": "Test" } }
            \`\`\`

            ## C. FILTRAR (filterClassification)
            - Cuando: "busca clasificaciones con X", "filtra por Y", "muestra Z"
            - Para quitar filtro: "quita filtro", "muestra todas"
            - Ejemplos:
            * "filtra producción" → \`\`\`json { "action": "filterClassification", "data": { "query": "producción" } } \`\`\`
            * "quita filtro" → \`\`\`json { "action": "filterClassification", "data": { "query": "" } } \`\`\`

            # REGLAS DE ORO PARA INTERPRETACIÓN

            ## GÉNERO GRAMATICAL (MUY IMPORTANTE):
            - **Femenino** → Se refiere a CLASIFICACIÓN:
            * "una llamada", "una pantone", "una embotelladora"
            * "la clasificación", "esa clasificación"

            - **Masculino** → Se refiere a PASO:
            * "un paso llamado", "el paso pantone", "este paso"
            * "los pasos", "esos pasos"

            ## EJEMPLOS DE INTERPRETACIÓN:
            1. "agrega una llamada" → CREAR clasificación llamada "llamada"
            2. "agregale una pantone" → CREAR clasificación llamada "pantone"
            3. "agrega un paso llamado corte" → AGREGAR paso "corte" a clasificación actual
            4. "agregale un paso corte" → AGREGAR paso "corte" a clasificación actual
            5. "edita la clasificación producción" → EDITAR clasificación "producción"
            6. "edita el paso revisión" → EDITAR paso "revisión" en clasificación actual

            ## PARA MÚLTIPLES ACCIONES:
            \`\`\`json
            { "action": "createClassification", "data": { "nombre": "A", "descripcion": "Desc A", "steps": ["P1", "P2"] } }
            \`\`\`

            \`\`\`json
            { "action": "addStepToClassification", "data": { "classificationName": "A", "stepName": "P3" } }
            \`\`\`

            \`\`\`json
            { "action": "addStepToClassification", "data": { "classificationName": "B", "stepName": "P4" } }
            \`\`\`

            # FLUJOS DE CONVERSACIÓN

            ## Crear clasificación con pasos:
            Usuario: "crea una clasificación de Calidad con pasos Control y Verificación"
            TÚ: \`\`\`json { "action": "createClassification", "data": { "nombre": "Calidad", "descripcion": "Calidad", "steps": ["Control", "Verificación"] } } \`\`\`

            ## Agregar pasos a clasificación existente:
            Usuario: "a la clasificación Producción agrega los pasos Corte y Empaque"
            TÚ: 
            \`\`\`json
            { "action": "addStepToClassification", "data": { "classificationName": "Producción", "stepName": "Corte" } }
            \`\`\`

            \`\`\`json
            { "action": "addStepToClassification", "data": { "classificationName": "Producción", "stepName": "Empaque" } }
            \`\`\`

            ## Editar paso en clasificación:
            Usuario: "en Calidad cambia el paso Revisión por Inspección"
            TÚ: \`\`\`json { "action": "editStepFromClassification", "data": { "classificationName": "Calidad", "oldStepName": "Revisión", "newStepName": "Inspección" } } \`\`\`

            # PREGUNTAS DE ACLARACIÓN
            - Si no hay clasificación especificada: "¿A qué clasificación te refieres?"
            - Si el paso no existe: "El paso 'X' no existe en el catálogo. ¿Quieres crearlo primero?"
            - Si hay ambigüedad: "¿Te refieres a la clasificación o a un paso?"

            # DATOS ACTUALES
            [Se inyectarán clasificaciones y pasos existentes]

            Recuerda: Género gramatical es clave. Femenino=Clasificación, Masculino=Paso.
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