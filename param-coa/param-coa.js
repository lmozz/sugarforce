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
    const coaTableBody = document.getElementById('coaTableBody');
    const searchInput = document.getElementById('searchInput');
    const addCoaBtn = document.getElementById('addCoaBtn');
    const coaModal = document.getElementById('coaModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const coaForm = document.getElementById('coaForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Inputs
    const coaIdInput = document.getElementById('coaId');
    const coaNameInput = document.getElementById('coaName');
    const coaDescInput = document.getElementById('coaDesc');
    const coaMethodInput = document.getElementById('coaMethod');
    const coaUnitsInput = document.getElementById('coaUnits');

    let isEditing = false;

    // --- Helper Functions ---
    const getPresentations = () => {
        try {
            return JSON.parse(localStorage.getItem('presentation') || '[]');
        } catch (e) {
            console.error("Error reading presentations", e);
            return [];
        }
    };

    const getCoaParams = () => {
        try {
            return JSON.parse(localStorage.getItem('coa') || '[]');
        } catch (e) {
            console.error("Error reading coa params", e);
            return [];
        }
    };

    const saveCoaParams = (coa) => {
        localStorage.setItem('coa', JSON.stringify(coa));
    };

    const renderTable = (filterText = '') => {
        const coaParams = getCoaParams();
        coaTableBody.innerHTML = '';

        const filteredParams = coaParams.filter(param => {
            const term = filterText.toLowerCase();
            return (param.nombre || '').toLowerCase().includes(term) ||
                (param.descripcion || '').toLowerCase().includes(term);
        });

        if (filteredParams.length === 0) {
            coaTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="no-data-container">
                            <img src="../imgs/empty.png" class="no-data-img" alt="Sin datos">
                            <div class="no-data">Sin información disponible</div>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        filteredParams.forEach((param) => {
            const row = document.createElement('tr');

            // Create cells
            const nameCell = document.createElement('td');
            nameCell.textContent = param.nombre;
            nameCell.dataset.label = "Nombre";

            const descCell = document.createElement('td');
            descCell.textContent = param.descripcion;
            descCell.dataset.label = "Descripción";

            const methodCell = document.createElement('td');
            methodCell.textContent = param.metodo || '-';
            methodCell.dataset.label = "Método";

            const unitsCell = document.createElement('td');
            unitsCell.textContent = param.unidades || '-';
            unitsCell.dataset.label = "Unidades";

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.dataset.label = "Acción";

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.name = param.nombre; // Safe assignment

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.dataset.name = param.nombre; // Safe assignment

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(nameCell);
            row.appendChild(descCell);
            row.appendChild(methodCell);
            row.appendChild(unitsCell);
            row.appendChild(actionsCell);

            coaTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, param = null) => {
        isEditing = editing;
        coaModal.classList.add('open');
        if (isEditing && param) {
            modalTitle.textContent = 'Editar Parámetro COA';
            coaNameInput.value = param.nombre;
            coaDescInput.value = param.descripcion;
            coaMethodInput.value = param.metodo || '';
            coaUnitsInput.value = param.unidades || '';
            coaIdInput.value = param.nombre;
        } else {
            modalTitle.textContent = 'Nuevo Parámetro COA';
            coaForm.reset();
            coaIdInput.value = '';
        }
    };

    const closeModal = () => {
        coaModal.classList.remove('open');
    };

    // --- Event Listeners ---

    // Search
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    // Add Button
    addCoaBtn.addEventListener('click', () => {
        openModal(false);
    });

    // Cancel Button
    cancelBtn.addEventListener('click', closeModal);

    // Save (Form Submit)
    coaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = coaNameInput.value;
        const descripcion = coaDescInput.value;
        const metodo = coaMethodInput.value;
        const unidades = coaUnitsInput.value;
        const originalName = coaIdInput.value;

        let coaParams = getCoaParams();

        if (isEditing) {
            const index = coaParams.findIndex(p => p.nombre === originalName);
            if (index !== -1) {
                coaParams[index] = { nombre, descripcion, metodo, unidades };
            }
        } else {
            coaParams.push({ nombre, descripcion, metodo, unidades });
        }

        saveCoaParams(coaParams);
        closeModal();
        renderTable(searchInput.value);
    });

    // Table Actions (Delegation)
    coaTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const name = btn.dataset.name;
        let coaParams = getCoaParams();

        if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de eliminar este parámetro?')) {
                const newParams = coaParams.filter(p => p.nombre !== name);
                saveCoaParams(newParams);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const param = coaParams.find(p => p.nombre === name);
            if (param) {
                openModal(true, param);
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
                window.location.href = '../index.html';
            }
        });
    }



    // AI CRUD Handler - COMPLETO PARA PARÁMETROS COA
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

        let coaParams = getCoaParams();
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let dataChanged = false;

        console.log(`Procesando acción en parámetros COA: ${action}`, data);

        switch (action) {
            case 'createCoa':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre del parámetro es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreParam = data.nombre.trim();

                // Verificar que no exista (case insensitive)
                const existeParam = coaParams.some(p =>
                    p.nombre.toLowerCase() === nombreParam.toLowerCase()
                );
                if (existeParam) {
                    message = `❌ Error: Ya existe un parámetro llamado "${nombreParam}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Crear nuevo parámetro con valores por defecto
                    const nuevoParam = {
                        nombre: nombreParam,
                        descripcion: data.descripcion || nombreParam,
                        metodo: data.metodo || "",
                        unidades: data.unidades || ""
                    };

                    coaParams.push(nuevoParam);
                    message = `✅ Parámetro "${nombreParam}" creado exitosamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'updateCoa':
                // Validar datos requeridos
                if (!data.originalName || data.originalName.trim() === '') {
                    message = "❌ Error: Se necesita el nombre original del parámetro";
                    success = false;
                    messages.push(message);
                    break;
                }

                const originalName = data.originalName.trim();

                // Buscar parámetro (case insensitive)
                const indexUpdate = coaParams.findIndex(p =>
                    p.nombre.toLowerCase() === originalName.toLowerCase()
                );

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró el parámetro "${originalName}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Verificar si se está cambiando el nombre y si ya existe
                    if (data.nombre && data.nombre.trim() !== '') {
                        const nuevoNombre = data.nombre.trim();
                        if (nuevoNombre.toLowerCase() !== originalName.toLowerCase()) {
                            const nombreYaExiste = coaParams.some((p, idx) =>
                                idx !== indexUpdate && p.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                            );

                            if (nombreYaExiste) {
                                message = `❌ Error: Ya existe otro parámetro llamado "${nuevoNombre}"`;
                                success = false;
                                messages.push(message);
                                break;
                            }
                        }
                    }

                    // Actualizar campos
                    const paramActual = coaParams[indexUpdate];
                    const nombreAnterior = paramActual.nombre;

                    coaParams[indexUpdate] = {
                        ...paramActual,
                        nombre: data.nombre ? data.nombre.trim() : paramActual.nombre,
                        descripcion: data.descripcion !== undefined ? data.descripcion : paramActual.descripcion,
                        metodo: data.metodo !== undefined ? data.metodo : paramActual.metodo,
                        unidades: data.unidades !== undefined ? data.unidades : paramActual.unidades
                    };

                    message = `✅ Parámetro "${nombreAnterior}" actualizado`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'deleteCoa':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre del parámetro";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar parámetro (case insensitive)
                const deleteIndex = coaParams.findIndex(p =>
                    p.nombre.toLowerCase() === nombreEliminar.toLowerCase()
                );

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró el parámetro "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminado = coaParams[deleteIndex].nombre;
                    coaParams.splice(deleteIndex, 1);
                    message = `✅ Parámetro "${eliminado}" eliminado correctamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'filterCoa':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todos los parámetros";
                    } else {
                        message = `🔍 Parámetros filtrados por: "${query}"`;
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
                console.log('Acción no reconocida en parámetros COA:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los datos
        if (dataChanged) {
            saveCoaParams(coaParams);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createCoa', 'updateCoa', 'deleteCoa', 'filterCoa'].includes(action)) {
            setTimeout(() => {
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
});
