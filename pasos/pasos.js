document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // --- AI Widget Activation (Immediate) ---
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            aiChatWidget.classList.toggle('open');
        });
    }

    // --- State & DOM Elements ---
    const stepsTableBody = document.getElementById('stepsTableBody');
    const searchInput = document.getElementById('searchInput');
    const addStepBtn = document.getElementById('addStepBtn');
    const stepModal = document.getElementById('stepModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const stepForm = document.getElementById('stepForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Inputs
    const stepIdInput = document.getElementById('stepId');
    const stepNameInput = document.getElementById('stepName');
    const stepDescInput = document.getElementById('stepDesc');
    const stepPercentInput = document.getElementById('stepPercent');

    let isEditing = false;
    let editIndex = -1;

    // --- Helper Functions ---
    const getCellars = () => {
        try {
            return JSON.parse(localStorage.getItem('cellar') || '[]');
        } catch (e) {
            console.error("Error reading cellar", e);
            return [];
        }
    };

    const getSteps = () => {
        try {
            return JSON.parse(localStorage.getItem('steps') || '[]');
        } catch (e) {
            console.error("Error reading steps", e);
            return [];
        }
    };

    const saveSteps = (steps) => {
        localStorage.setItem('steps', JSON.stringify(steps));
    };

    const renderTable = (filterText = '') => {
        const steps = getSteps();
        stepsTableBody.innerHTML = '';

        const filteredSteps = steps.filter(step => {
            const term = filterText.toLowerCase();
            return (step.nombre || '').toLowerCase().includes(term) ||
                (step.descripcion || '').toLowerCase().includes(term);
        });

        if (filteredSteps.length === 0) {
            stepsTableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="no-data-container">
                            <img src="../imgs/empty.png" class="no-data-img" alt="Sin datos">
                            <div class="no-data">Sin información disponible</div>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        filteredSteps.forEach((step, index) => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = step.nombre;
            nameCell.dataset.label = "Nombre";

            const descCell = document.createElement('td');
            descCell.textContent = step.descripcion;
            descCell.dataset.label = "Descripción";

            const percentCell = document.createElement('td');
            percentCell.textContent = (step.porcentual !== undefined && step.porcentual !== null) ? `${step.porcentual}%` : '-';
            percentCell.dataset.label = "Porcentual";

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.dataset.label = "Acción";

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.name = step.nombre;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.dataset.name = step.nombre;

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(nameCell);
            row.appendChild(descCell);
            row.appendChild(percentCell);
            row.appendChild(actionsCell);

            stepsTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, step = null) => {
        isEditing = editing;
        stepModal.classList.add('open');
        if (isEditing && step) {
            modalTitle.textContent = 'Editar Paso';
            stepNameInput.value = step.nombre;
            stepDescInput.value = step.descripcion;
            stepPercentInput.value = step.porcentual || '';
            // Store original name to find it later (simple approach)
            stepIdInput.value = step.nombre;
        } else {
            modalTitle.textContent = 'Nuevo Paso';
            stepForm.reset();
            stepIdInput.value = '';
            stepPercentInput.value = '';
        }
    };

    const closeModal = () => {
        stepModal.classList.remove('open');
    };

    // --- Event Listeners ---

    // Search
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    // Add Button
    addStepBtn.addEventListener('click', () => {
        openModal(false);
    });

    // Cancel Button
    cancelBtn.addEventListener('click', closeModal);

    // Save (Form Submit)
    stepForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = stepNameInput.value;
        const descripcion = stepDescInput.value;
        const porcentual = stepPercentInput.value;
        const originalName = stepIdInput.value;

        let steps = getSteps();

        if (isEditing) {
            // Update
            const index = steps.findIndex(s => s.nombre === originalName);
            if (index !== -1) {
                steps[index] = { nombre, descripcion, porcentual };
            }
        } else {
            // Create
            steps.push({ nombre, descripcion, porcentual });
        }

        saveSteps(steps);
        closeModal();
        renderTable(searchInput.value);
    });

    // Table Actions (Delegation)
    stepsTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const name = btn.dataset.name;
        let steps = getSteps();

        if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de eliminar este paso?')) {
                const newSteps = steps.filter(s => s.nombre !== name);
                saveSteps(newSteps);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const step = steps.find(s => s.nombre === name);
            if (step) {
                openModal(true, step);
            }
        }
    });

    // Initial Render
    renderTable();

    // --- Mobile Menu Logic ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (openMenuBtn && sidebar) {
        openMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (closeMenuBtn && sidebar) {
        closeMenuBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // --- Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
                window.location.href = '../index.html';
            }
        });
    }



    // AI CRUD Handler
    // AI CRUD Handler - MODIFICADO// AI CRUD Handler - COMPLETO Y MEJORADO PARA MÚLTIPLES ACCIONES
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

        let steps = getSteps();
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = []; // Para múltiples mensajes
        let stepsChanged = false;

        console.log(`Procesando acción: ${action}`, data);

        switch (action) {
            case 'createStep':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre del paso es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreCrear = data.nombre.trim();
                const descripcionCrear = (data.descripcion || nombreCrear).trim();
                const porcentualCrear = data.porcentual || '';

                // Verificar que no exista (case insensitive)
                const existeCrear = steps.some(s => s.nombre.toLowerCase() === nombreCrear.toLowerCase());
                if (existeCrear) {
                    message = `❌ Error: Ya existe un paso llamado "${nombreCrear}"`;
                    success = false;
                    messages.push(message);
                } else {
                    steps.push({ nombre: nombreCrear, descripcion: descripcionCrear, porcentual: porcentualCrear });
                    message = `✅ Paso "${nombreCrear}" creado exitosamente`;
                    actionPerformed = true;
                    stepsChanged = true;
                    messages.push(message);
                }
                break;

            case 'updateStep':
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

                // Buscar paso (case insensitive)
                const indexUpdate = steps.findIndex(s => s.nombre.toLowerCase() === originalName.toLowerCase());

                const nuevoPorcentual = (data.porcentual !== undefined) ? data.porcentual : (steps[indexUpdate]?.porcentual || '');

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró el paso "${originalName}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
                    const nombreYaExiste = steps.some((s, i) =>
                        i !== indexUpdate && s.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                    );

                    if (nombreYaExiste) {
                        message = `❌ Error: Ya existe otro paso llamado "${nuevoNombre}"`;
                        success = false;
                        messages.push(message);
                    } else {
                        const nombreAnterior = steps[indexUpdate].nombre;
                        steps[indexUpdate] = { nombre: nuevoNombre, descripcion: nuevaDesc, porcentual: nuevoPorcentual };
                        message = `✅ Paso "${nombreAnterior}" actualizado a "${nuevoNombre}"`;
                        actionPerformed = true;
                        stepsChanged = true;
                        messages.push(message);
                    }
                }
                break;

            case 'deleteStep':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre del paso";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar paso (case insensitive)
                const deleteIndex = steps.findIndex(s => s.nombre.toLowerCase() === nombreEliminar.toLowerCase());

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró el paso "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminado = steps[deleteIndex].nombre;
                    steps.splice(deleteIndex, 1);
                    message = `✅ Paso "${eliminado}" eliminado correctamente`;
                    actionPerformed = true;
                    stepsChanged = true;
                    messages.push(message);
                }
                break;

            case 'filterStep':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);
                    message = query ? `🔍 Tabla filtrada por: "${query}"` : "📋 Mostrando todos los pasos";
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
                console.log('Acción no reconocida:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los pasos
        if (stepsChanged) {
            saveSteps(steps);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createStep', 'updateStep', 'deleteStep', 'filterStep'].includes(action)) {
            setTimeout(() => {
                renderTable(searchInput ? searchInput.value : '');
            }, 100);
        }

        // Enviar retroalimentación a la IA - PARA MÚLTIPLES MENSAJES
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
});
