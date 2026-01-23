document.addEventListener('DOMContentLoaded', () => {
    // --- State & Elements ---
    let isEditing = false;
    let currentTargetRow = null;

    const classificationTableBody = document.getElementById('classificationTableBody');
    const classificationModal = document.getElementById('classificationModal');
    const classificationForm = document.getElementById('classificationForm');
    const modalTitle = document.getElementById('modalTitle');
    const detailTableBody = document.getElementById('detailTableBody');

    // Search Modal Elements
    const searchModal = document.getElementById('searchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchModalResults = document.getElementById('searchModalResults');

    // --- LocalStorage Helpers ---
    const getData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // --- Sidebar Menu ---
    const sidebar = document.getElementById('sidebar');
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    if (openMenuBtn) openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    // --- User Info & Logout ---
    const userInfo = document.getElementById('userInfo');
    let user = { name: "Usuario" };
    try {
        const storedUser = "Usuario: " + localStorage.getItem('currentUser');
        if (storedUser) {
            // Check if it's already a JSON string or a raw string
            if (storedUser.startsWith('{')) {
                user = JSON.parse(storedUser);
            } else {
                user = { name: storedUser };
            }
        }
    } catch (e) {
        console.error("Error parsing user info", e);
    }
    if (userInfo) userInfo.textContent = user.name || user;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });

    // --- Table Rendering ---
    const renderTable = (filterText = '') => {
        const classifications = getData('classification');
        classificationTableBody.innerHTML = '';

        const filtered = classifications.filter(c =>
            (c.nombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
            (c.descripcion || '').toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            classificationTableBody.innerHTML = `<tr><td colspan="5"><div class="no-data-container"><img src="../imgs/empty.png" class="no-data-img"><div class="no-data">Sin información</div></div></td></tr>`;
            return;
        }

        filtered.forEach(item => {
            const row = document.createElement('tr');
            const stepsCount = (item.steps || []).length;

            row.innerHTML = `
                <td data-label="Nombre">${item.nombre}</td>
                <td data-label="Descripción">${item.descripcion}</td>
                <td data-label="Color">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${item.color || '#000000'}; border: 1px solid rgba(0,0,0,0.1);"></span>
                        <span style="font-size: 0.85em; opacity: 0.8;">${item.color || '#000000'}</span>
                    </div>
                </td>
                <td data-label="Pasos">${stepsCount} paso(s)</td>
                <td class="actions-cell" data-label="Acción">
                    <button class="action-btn edit-btn" data-id="${item.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${item.id}">Eliminar</button>
                </td>
            `;
            classificationTableBody.appendChild(row);
        });

        // Add Listeners
        classificationTableBody.querySelectorAll('.edit-btn').forEach(btn =>
            btn.addEventListener('click', () => openModal(true, btn.dataset.id))
        );
        classificationTableBody.querySelectorAll('.delete-btn').forEach(btn =>
            btn.addEventListener('click', () => {
                if (confirm('¿Eliminar esta clasificación?')) {
                    const data = getData('classification').filter(c => c.id !== btn.dataset.id);
                    saveData('classification', data);
                    renderTable(document.getElementById('searchInput').value);
                }
            })
        );
    };

    // --- Detail Row Helper ---
    const createDetailRow = (stepName = '') => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <input type="text" class="step-input" readonly placeholder="Click para seleccionar..." value="${stepName}" 
                    style="width: 100%; border: none; background: transparent; cursor: pointer; color: var(--text-color);">
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <button type="button" class="remove-detail-btn" style="background: none; border: none; color: #d93025; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </td>
        `;

        const input = tr.querySelector('.step-input');
        input.addEventListener('click', () => {
            currentTargetRow = tr;
            openSearchModal();
        });

        tr.querySelector('.remove-detail-btn').addEventListener('click', () => tr.remove());
        return tr;
    };

    // --- Modal Logic ---
    const openModal = (editing = false, id = null) => {
        isEditing = editing;
        classificationForm.reset();
        detailTableBody.innerHTML = '';

        if (editing) {
            const item = getData('classification').find(c => c.id === id);
            if (item) {
                document.getElementById('classificationId').value = item.id;
                document.getElementById('className').value = item.nombre;
                document.getElementById('classDesc').value = item.descripcion;
                document.getElementById('classColor').value = item.color || '#000000';
                item.steps.forEach(step => detailTableBody.appendChild(createDetailRow(step)));
                modalTitle.textContent = 'Editar Clasificación';
            }
        } else {
            document.getElementById('classificationId').value = '';
            document.getElementById('classColor').value = '#000000';
            modalTitle.textContent = 'Nueva Clasificación';
        }
        classificationModal.classList.add('open');
    };

    // --- Search Modal (Steps) ---
    const openSearchModal = () => {
        searchModalInput.value = '';
        renderSearchResults('');
        searchModal.classList.add('open');
    };

    const renderSearchResults = (query) => {
        const steps = getData('steps');
        searchModalResults.innerHTML = '';

        // Get already selected steps to avoid duplicates (optional visual feedback, but we check on selection)
        const selectedSteps = Array.from(detailTableBody.querySelectorAll('.step-input')).map(i => i.value);

        const filtered = steps.filter(s =>
            (s.nombre || '').toLowerCase().includes(query.toLowerCase()) ||
            (s.descripcion || '').toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            searchModalResults.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No hay pasos creados o no coinciden.</div>';
            return;
        }

        filtered.forEach(step => {
            const isSelected = selectedSteps.includes(step.nombre);
            const div = document.createElement('div');
            div.className = 'search-item';
            div.style.padding = '12px';
            div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            div.style.cursor = isSelected ? 'default' : 'pointer';
            div.style.opacity = isSelected ? '0.5' : '1';

            div.innerHTML = `
                <div style="font-weight: 500; color: var(--text-color);">${step.nombre}</div>
                <div style="font-size: 12px; color: #666;">${step.descripcion || ''}</div>
                ${isSelected ? '<div style="font-size: 10px; color: #d93025;">Ya agregado</div>' : ''}
            `;

            if (!isSelected) {
                div.addEventListener('click', () => {
                    if (currentTargetRow) {
                        currentTargetRow.querySelector('.step-input').value = step.nombre;
                        searchModal.classList.remove('open');
                    }
                });
                div.addEventListener('mouseenter', () => div.style.background = 'rgba(0,122,255,0.05)');
                div.addEventListener('mouseleave', () => div.style.background = 'transparent');
            }
            searchModalResults.appendChild(div);
        });
    };

    // --- Event Listeners ---
    document.getElementById('addClassBtn').addEventListener('click', () => openModal(false));
    document.getElementById('cancelBtn').addEventListener('click', () => classificationModal.classList.remove('open'));
    document.getElementById('addStepDetailBtn').addEventListener('click', () => detailTableBody.appendChild(createDetailRow()));
    document.getElementById('closeSearchBtn').addEventListener('click', () => searchModal.classList.remove('open'));
    searchModalInput.addEventListener('keyup', (e) => renderSearchResults(e.target.value));

    // Form Submit
    classificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('classificationId').value || Date.now().toString();
        const nombre = document.getElementById('className').value;
        const descripcion = document.getElementById('classDesc').value;
        const color = document.getElementById('classColor').value;

        // Collect steps and validate duplicates
        const stepInputs = Array.from(detailTableBody.querySelectorAll('.step-input'));
        const steps = [];
        for (const input of stepInputs) {
            const val = input.value.trim();
            if (!val) continue;
            if (steps.includes(val)) {
                alert(`El paso "${val}" ya está incluido en esta clasificación.`);
                return;
            }
            steps.push(val);
        }

        const data = getData('classification');
        const classification = { id, nombre, descripcion, color, steps };

        if (isEditing) {
            const index = data.findIndex(c => c.id === id);
            data[index] = classification;
        } else {
            data.push(classification);
        }

        saveData('classification', data);
        classificationModal.classList.remove('open');
        renderTable(document.getElementById('searchInput').value);
    });

    document.getElementById('searchInput').addEventListener('keyup', (e) => renderTable(e.target.value));

    // --- AI Widget Controls ---
    const aiChatWidget = document.getElementById('aiChatWidget');
    const openAiBtn = document.getElementById('openAiBtn');
    if (openAiBtn) {
        openAiBtn.addEventListener('click', () => {
            aiChatWidget.style.display = aiChatWidget.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // AI CRUD Handler
    // AI CRUD Handler - MEJORADO PARA CLASIFICACIONES (maestro-detalle)
    window.addEventListener('message', (event) => {
        // Validar que sea un mensaje válido
        if (!event.data || typeof event.data !== 'object') {
            console.warn('Mensaje AI inválido recibido');
            return;
        }

        const { action, data } = event.data;

        // Validaciones básicas
        if (!action || !data || typeof data !== 'object') {
            console.warn('Mensaje AI con formato inválido:', event.data);
            return;
        }

        let classifications = getData('classification');
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let dataChanged = false;

        console.log(`Procesando acción en clasificaciones: ${action}`, data);

        switch (action) {
            case 'createClassification':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre de la clasificación es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreClasif = data.nombre.trim();
                const descripcionClasif = (data.descripcion || nombreClasif).trim();
                const colorClasif = data.color || '#000000';

                // Verificar que no exista (case insensitive)
                const existeClasif = classifications.some(c =>
                    c.nombre.toLowerCase() === nombreClasif.toLowerCase()
                );
                if (existeClasif) {
                    message = `❌ Error: Ya existe una clasificación llamada "${nombreClasif}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Validar pasos si se proporcionan
                    const availableSteps = getData('steps');
                    let validatedSteps = [];
                    let invalidSteps = [];

                    if (data.steps && Array.isArray(data.steps)) {
                        data.steps.forEach(stepName => {
                            const stepExists = availableSteps.some(s =>
                                s.nombre.toLowerCase() === stepName.trim().toLowerCase()
                            );
                            if (stepExists) {
                                // Usar el nombre exacto del catálogo
                                const exactName = availableSteps.find(s =>
                                    s.nombre.toLowerCase() === stepName.trim().toLowerCase()
                                ).nombre;
                                validatedSteps.push(exactName);
                            } else {
                                invalidSteps.push(stepName.trim());
                            }
                        });
                    }

                    // Crear nueva clasificación
                    const newClassification = {
                        id: Date.now().toString(),
                        nombre: nombreClasif,
                        descripcion: descripcionClasif,
                        color: colorClasif,
                        steps: validatedSteps
                    };

                    classifications.push(newClassification);

                    if (invalidSteps.length > 0) {
                        const stepNames = availableSteps.map(s => s.nombre).join(', ');
                        message = `✅ Clasificación "${nombreClasif}" creada. ` +
                            `⚠️ Pasos omitidos (no existen): ${invalidSteps.join(', ')}. ` +
                            `Pasos válidos agregados: ${validatedSteps.length}`;
                    } else {
                        message = `✅ Clasificación "${nombreClasif}" creada con ${validatedSteps.length} paso(s)`;
                    }

                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'updateClassification':
                // Validar datos requeridos
                if (!data.originalName || data.originalName.trim() === '' ||
                    !data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesitan ambos nombres (original y nuevo)";
                    success = false;
                    messages.push(message);
                    break;
                }

                const originalName = data.originalName.trim();
                const nuevoNombre = data.nombre.trim();
                const nuevaDesc = (data.descripcion || nuevoNombre).trim();

                // Buscar clasificación para obtener color actual si no se provee
                const idxRef = classifications.findIndex(c => c.nombre.toLowerCase() === originalName.toLowerCase());
                const currentRef = idxRef !== -1 ? classifications[idxRef] : {};
                const nuevoColor = data.color || currentRef.color || '#000000';

                // Buscar clasificación (case insensitive)
                const indexUpdate = classifications.findIndex(c =>
                    c.nombre.toLowerCase() === originalName.toLowerCase()
                );

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró la clasificación "${originalName}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
                    const nombreYaExiste = classifications.some((c, idx) =>
                        idx !== indexUpdate && c.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                    );

                    if (nombreYaExiste) {
                        message = `❌ Error: Ya existe otra clasificación llamada "${nuevoNombre}"`;
                        success = false;
                        messages.push(message);
                    } else {
                        // Validar pasos si se proporcionan
                        const availableSteps = getData('steps');
                        let validatedSteps = classifications[indexUpdate].steps;

                        if (data.steps !== undefined) {
                            validatedSteps = [];
                            let invalidSteps = [];

                            if (Array.isArray(data.steps)) {
                                data.steps.forEach(stepName => {
                                    const stepExists = availableSteps.some(s =>
                                        s.nombre.toLowerCase() === stepName.trim().toLowerCase()
                                    );
                                    if (stepExists) {
                                        // Usar el nombre exacto del catálogo
                                        const exactName = availableSteps.find(s =>
                                            s.nombre.toLowerCase() === stepName.trim().toLowerCase()
                                        ).nombre;
                                        validatedSteps.push(exactName);
                                    } else {
                                        invalidSteps.push(stepName.trim());
                                    }
                                });
                            }

                            if (invalidSteps.length > 0) {
                                const stepNames = availableSteps.map(s => s.nombre).join(', ');
                                messages.push(`⚠️ Pasos omitidos (no existen): ${invalidSteps.join(', ')}`);
                            }
                        }

                        const nombreAnterior = classifications[indexUpdate].nombre;
                        classifications[indexUpdate] = {
                            ...classifications[indexUpdate],
                            nombre: nuevoNombre,
                            descripcion: nuevaDesc,
                            color: nuevoColor,
                            steps: validatedSteps
                        };

                        message = `✅ Clasificación "${nombreAnterior}" actualizada a "${nuevoNombre}"`;
                        actionPerformed = true;
                        dataChanged = true;
                        messages.push(message);
                    }
                }
                break;

            case 'deleteClassification':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre de la clasificación";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar clasificación (case insensitive)
                const deleteIndex = classifications.findIndex(c =>
                    c.nombre.toLowerCase() === nombreEliminar.toLowerCase()
                );

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró la clasificación "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminada = classifications[deleteIndex].nombre;
                    classifications.splice(deleteIndex, 1);
                    message = `✅ Clasificación "${eliminada}" eliminada correctamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'addStepToClassification':
                // Validar datos requeridos
                if (!data.classificationName || data.classificationName.trim() === '' ||
                    !data.stepName || data.stepName.trim() === '') {
                    message = "❌ Error: Se necesita nombre de clasificación y paso";
                    success = false;
                    messages.push(message);
                    break;
                }

                const className = data.classificationName.trim();
                const stepToAdd = data.stepName.trim();

                // Buscar clasificación
                const addIdx = classifications.findIndex(c =>
                    c.nombre.toLowerCase() === className.toLowerCase()
                );

                if (addIdx === -1) {
                    message = `❌ Error: No se encontró la clasificación "${className}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Verificar que el paso exista en el catálogo
                const availableSteps = getData('steps');
                const matchedStep = availableSteps.find(s =>
                    s.nombre.toLowerCase() === stepToAdd.toLowerCase()
                );

                if (!matchedStep) {
                    const stepNames = availableSteps.map(s => s.nombre).join(', ');
                    message = `❌ Error: El paso "${stepToAdd}" no existe. ` +
                        `Pasos disponibles: ${stepNames || 'ninguno'}`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Usar el nombre exacto del catálogo
                const exactStepName = matchedStep.nombre;

                // Verificar que no esté ya agregado
                if (classifications[addIdx].steps.includes(exactStepName)) {
                    message = `⚠️ El paso "${exactStepName}" ya existe en "${classifications[addIdx].nombre}"`;
                    success = false;
                    messages.push(message);
                } else {
                    classifications[addIdx].steps.push(exactStepName);
                    message = `✅ Paso "${exactStepName}" agregado a "${classifications[addIdx].nombre}"`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'editStepFromClassification':
                // Validar datos requeridos
                if (!data.classificationName || data.classificationName.trim() === '' ||
                    !data.oldStepName || data.oldStepName.trim() === '' ||
                    !data.newStepName || data.newStepName.trim() === '') {
                    message = "❌ Error: Se necesita clasificación, paso actual y paso nuevo";
                    success = false;
                    messages.push(message);
                    break;
                }

                const editClassName = data.classificationName.trim();
                const oldStep = data.oldStepName.trim();
                const newStep = data.newStepName.trim();

                // Buscar clasificación
                const editIdx = classifications.findIndex(c =>
                    c.nombre.toLowerCase() === editClassName.toLowerCase()
                );

                if (editIdx === -1) {
                    message = `❌ Error: No se encontró la clasificación "${editClassName}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Verificar que el paso viejo exista en la clasificación
                const stepIndex = classifications[editIdx].steps.indexOf(oldStep);
                if (stepIndex === -1) {
                    // Intentar case insensitive
                    const stepInsensitive = classifications[editIdx].steps.find(s =>
                        s.toLowerCase() === oldStep.toLowerCase()
                    );
                    if (stepInsensitive) {
                        message = `⚠️ El paso existe pero con diferente capitalización: "${stepInsensitive}"`;
                        success = false;
                        messages.push(message);
                        break;
                    } else {
                        message = `❌ Error: El paso "${oldStep}" no existe en "${classifications[editIdx].nombre}"`;
                        success = false;
                        messages.push(message);
                        break;
                    }
                }

                // Verificar que el nuevo paso exista en el catálogo
                const newStepExists = availableSteps.some(s =>
                    s.nombre.toLowerCase() === newStep.toLowerCase()
                );

                if (!newStepExists) {
                    const stepNames = availableSteps.map(s => s.nombre).join(', ');
                    message = `❌ Error: El paso "${newStep}" no existe en el catálogo. ` +
                        `Pasos disponibles: ${stepNames || 'ninguno'}`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Usar nombre exacto del catálogo
                const exactNewStepName = availableSteps.find(s =>
                    s.nombre.toLowerCase() === newStep.toLowerCase()
                ).nombre;

                // Verificar que no esté duplicado
                if (classifications[editIdx].steps.includes(exactNewStepName)) {
                    message = `❌ Error: El paso "${exactNewStepName}" ya existe en esta clasificación`;
                    success = false;
                    messages.push(message);
                    break;
                }

                classifications[editIdx].steps[stepIndex] = exactNewStepName;
                message = `✅ Paso "${oldStep}" actualizado a "${exactNewStepName}" en "${classifications[editIdx].nombre}"`;
                actionPerformed = true;
                dataChanged = true;
                messages.push(message);
                break;

            case 'removeStepFromClassification':
                // Validar datos requeridos
                if (!data.classificationName || data.classificationName.trim() === '' ||
                    !data.stepName || data.stepName.trim() === '') {
                    message = "❌ Error: Se necesita nombre de clasificación y paso";
                    success = false;
                    messages.push(message);
                    break;
                }

                const removeClassName = data.classificationName.trim();
                const stepToRemove = data.stepName.trim();

                // Buscar clasificación
                const removeIdx = classifications.findIndex(c =>
                    c.nombre.toLowerCase() === removeClassName.toLowerCase()
                );

                if (removeIdx === -1) {
                    message = `❌ Error: No se encontró la clasificación "${removeClassName}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Buscar paso (case insensitive)
                const stepToRemoveIndex = classifications[removeIdx].steps.findIndex(s =>
                    s.toLowerCase() === stepToRemove.toLowerCase()
                );

                if (stepToRemoveIndex === -1) {
                    message = `❌ Error: El paso "${stepToRemove}" no existe en "${classifications[removeIdx].nombre}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                const removedStep = classifications[removeIdx].steps[stepToRemoveIndex];
                classifications[removeIdx].steps.splice(stepToRemoveIndex, 1);
                message = `✅ Paso "${removedStep}" eliminado de "${classifications[removeIdx].nombre}"`;
                actionPerformed = true;
                dataChanged = true;
                messages.push(message);
                break;

            case 'filterClassification':
                // Validar datos
                const query = data.query ? data.query.trim() : '';
                const searchInput = document.getElementById('searchInput');

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todas las clasificaciones";
                    } else {
                        message = `🔍 Clasificaciones filtradas por: "${query}"`;
                    }
                    actionPerformed = true;
                    messages.push(message);
                } else {
                    message = "❌ Error: Elemento de búsqueda no encontrado";
                    success = false;
                    messages.push(message);
                }
                break;

            case 'setTheme':
                if (data.theme === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
                localStorage.setItem('theme', data.theme);
                message = `🎨 Tema cambiado a modo ${data.theme === 'dark' ? 'oscuro' : 'claro'}`;
                actionPerformed = true;
                messages.push(message);
                break;

            case 'logout':
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = '../index.html';
                }
                return;

            default:
                console.log('Acción no reconocida en clasificaciones:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los datos
        if (dataChanged) {
            saveData('classification', classifications);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createClassification', 'updateClassification', 'deleteClassification',
            'addStepToClassification', 'editStepFromClassification', 'removeStepFromClassification',
            'filterClassification'].includes(action)) {
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                renderTable(searchInput ? searchInput.value : '');
            }, 100);
        }

        // Enviar retroalimentación a la IA
        if (event.source) {
            // Enviar cada mensaje individualmente
            messages.forEach(msg => {
                event.source.postMessage({
                    type: 'ai-feedback',
                    message: msg,
                    success: success,
                    action: action
                }, event.origin);
            });
        }

        // Mostrar notificación visual si hay error
        if (!success && messages.some(m => m.includes('❌'))) {
            const errorMessages = messages.filter(m => m.includes('❌'));
            if (errorMessages.length > 0) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-notification';
                errorMsg.textContent = errorMessages[0].replace('❌ ', '');
                errorMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
                document.body.appendChild(errorMsg);
                setTimeout(() => errorMsg.remove(), 3000);
            }
        }

        // Mostrar notificación de éxito
        if (success && actionPerformed && messages.some(m => m.includes('✅'))) {
            const successMessages = messages.filter(m => m.includes('✅'));
            if (successMessages.length > 0) {
                const successMsg = document.createElement('div');
                successMsg.className = 'success-notification';
                successMsg.textContent = successMessages[0].replace('✅ ', '');
                successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 2000);
            }
        }
    });

    // Initial Render
    renderTable();
});
