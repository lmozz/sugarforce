document.addEventListener('DOMContentLoaded', () => {

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    const presentationTableBody = document.getElementById('presentationTableBody');
    const searchInput = document.getElementById('searchInput');
    const addPresentationBtn = document.getElementById('addPresentationBtn');
    const presentationModal = document.getElementById('presentationModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const presentationForm = document.getElementById('presentationForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) userInfo.textContent = `Usuario: ${currentUser}`;

    const presentationIdInput = document.getElementById('presentationId');
    const presentationNameInput = document.getElementById('presentationName');
    const presentationDescInput = document.getElementById('presentationDesc');

    let isEditing = false;

    const getData = () => {
        try {
            const data = localStorage.getItem('presentation');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading presentation", e);
            return [];
        }
    };

    const saveData = (data) => {
        localStorage.setItem('presentation', JSON.stringify(data));
    };

    const renderTable = (filterText = '') => {
        const items = getData();
        presentationTableBody.innerHTML = '';

        const filtered = items.filter(i => {
            const term = filterText.toLowerCase();
            return (i.nombre || '').toLowerCase().includes(term) ||
                (i.descripcion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            presentationTableBody.innerHTML = `
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

        filtered.forEach((item) => {
            const row = document.createElement('tr');

            const nCell = document.createElement('td');
            nCell.textContent = item.nombre;
            nCell.dataset.label = "Nombre";

            const dCell = document.createElement('td');
            dCell.textContent = item.descripcion;
            dCell.dataset.label = "Descripción";

            const aCell = document.createElement('td');
            aCell.className = 'actions-cell';
            aCell.dataset.label = "Acción";

            const eBtn = document.createElement('button');
            eBtn.className = 'action-btn edit-btn';
            eBtn.textContent = 'Editar';
            eBtn.dataset.name = item.nombre;

            const dBtn = document.createElement('button');
            dBtn.className = 'action-btn delete-btn';
            dBtn.textContent = 'Eliminar';
            dBtn.dataset.name = item.nombre;

            aCell.appendChild(eBtn);
            aCell.appendChild(dBtn);

            row.appendChild(nCell);
            row.appendChild(dCell);
            row.appendChild(aCell);
            presentationTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, item = null) => {
        isEditing = editing;
        presentationModal.classList.add('open');
        if (isEditing && item) {
            modalTitle.textContent = 'Editar Presentación';
            presentationNameInput.value = item.nombre;
            presentationDescInput.value = item.descripcion;
            presentationIdInput.value = item.nombre;
        } else {
            modalTitle.textContent = 'Nueva Presentación';
            presentationForm.reset();
            presentationIdInput.value = '';
        }
    };

    const closeModal = () => presentationModal.classList.remove('open');

    searchInput.addEventListener('keyup', (e) => renderTable(e.target.value));
    if (addPresentationBtn) addPresentationBtn.addEventListener('click', () => openModal(false));
    cancelBtn.addEventListener('click', closeModal);

    presentationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = presentationNameInput.value;
        const descripcion = presentationDescInput.value;
        const originalName = presentationIdInput.value;
        let items = getData();

        if (isEditing) {
            const idx = items.findIndex(i => i.nombre === originalName);
            if (idx !== -1) items[idx] = { nombre, descripcion };
        } else {
            items.push({ nombre, descripcion });
        }

        saveData(items);
        closeModal();
        renderTable(searchInput.value);
    });

    presentationTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const name = btn.dataset.name;
        let items = getData();

        if (btn.classList.contains('delete-btn')) {
            if (confirm(`¿Eliminar presentación "${name}"?`)) {
                items = items.filter(i => i.nombre !== name);
                saveData(items);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const item = items.find(i => i.nombre === name);
            if (item) openModal(true, item);
        }
    });

    renderTable();

    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (openMenuBtn && sidebar) openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeMenuBtn && sidebar) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { if (confirm('¿Cerrar sesión?')) window.location.href = '../index.html'; });

    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            const isVisible = window.getComputedStyle(aiChatWidget).display === 'flex';
            aiChatWidget.style.display = isVisible ? 'none' : 'flex';
        });
    }

    // AI CRUD Handler - COMPLETO Y MEJORADO
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

        let items = getData();
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let itemsChanged = false;

        console.log(`Procesando acción en presentaciones: ${action}`, data);

        switch (action) {
            case 'createPresentation':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre de la presentación es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreCrear = data.nombre.trim();
                const descripcionCrear = (data.descripcion || nombreCrear).trim();

                // Verificar que no exista (case insensitive)
                const existeCrear = items.some(i => i.nombre.toLowerCase() === nombreCrear.toLowerCase());
                if (existeCrear) {
                    message = `❌ Error: Ya existe una presentación llamada "${nombreCrear}"`;
                    success = false;
                    messages.push(message);
                } else {
                    items.push({ nombre: nombreCrear, descripcion: descripcionCrear });
                    message = `✅ Presentación "${nombreCrear}" creada exitosamente`;
                    actionPerformed = true;
                    itemsChanged = true;
                    messages.push(message);
                }
                break;

            case 'updatePresentation':
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

                // Buscar presentación (case insensitive)
                const indexUpdate = items.findIndex(i => i.nombre.toLowerCase() === originalName.toLowerCase());

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró la presentación "${originalName}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
                    const nombreYaExiste = items.some((i, idx) =>
                        idx !== indexUpdate && i.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                    );

                    if (nombreYaExiste) {
                        message = `❌ Error: Ya existe otra presentación llamada "${nuevoNombre}"`;
                        success = false;
                        messages.push(message);
                    } else {
                        const nombreAnterior = items[indexUpdate].nombre;
                        items[indexUpdate] = { nombre: nuevoNombre, descripcion: nuevaDesc };
                        message = `✅ Presentación "${nombreAnterior}" actualizada a "${nuevoNombre}"`;
                        actionPerformed = true;
                        itemsChanged = true;
                        messages.push(message);
                    }
                }
                break;

            case 'deletePresentation':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre de la presentación";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar presentación (case insensitive)
                const deleteIndex = items.findIndex(i => i.nombre.toLowerCase() === nombreEliminar.toLowerCase());

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró la presentación "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminado = items[deleteIndex].nombre;
                    items.splice(deleteIndex, 1);
                    message = `✅ Presentación "${eliminado}" eliminada correctamente`;
                    actionPerformed = true;
                    itemsChanged = true;
                    messages.push(message);
                }
                break;

            case 'filterPresentation':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todas las presentaciones";
                    } else {
                        message = `🔍 Presentaciones filtradas por: "${query}"`;
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
                console.log('Acción no reconocida en presentaciones:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron las presentaciones
        if (itemsChanged) {
            saveData(items);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createPresentation', 'updatePresentation', 'deletePresentation', 'filterPresentation'].includes(action)) {
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
