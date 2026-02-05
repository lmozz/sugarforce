document.addEventListener('DOMContentLoaded', () => {

    // --- AI Widget Activation (Immediate) ---
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            aiChatWidget.classList.toggle('open');
        });
    }

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

    // --- UI Logic (Sidebar & Menu) ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logoutBtn');

    if (openMenuBtn && sidebar) openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeMenuBtn && sidebar) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
                localStorage.removeItem('currentUser');
                window.location.href = '../index.html';
            }
        });
    }

    // --- State & DOM Elements ---
    const calidadTableBody = document.getElementById('calidadTableBody');
    const searchInput = document.getElementById('searchInput');
    const addCalidadBtn = document.getElementById('addCalidadBtn');
    const calidadModal = document.getElementById('calidadModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const calidadForm = document.getElementById('calidadForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Form Inputs
    const calidadIdInput = document.getElementById('calidadId');
    const centroEmpacadoInput = document.getElementById('centroEmpacado');
    const fechaProduccionInput = document.getElementById('fechaProduccion');
    const maquinaInput = document.getElementById('maquina');
    const presentacionInput = document.getElementById('presentacion');
    const pesoNetoInput = document.getElementById('pesoNeto');
    const cantidadBolsasInput = document.getElementById('cantidadBolsas');

    let isEditing = false;

    // --- Flatpickr Initialization ---
    const fpConfig = {
        locale: 'es',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: true,
        monthSelectorType: 'static',
        animate: true
    };
    const fpProduccion = flatpickr(fechaProduccionInput, fpConfig);


    // --- Helper Functions ---
    const getCalidadData = () => {
        try {
            return JSON.parse(localStorage.getItem('calidad') || '[]');
        } catch (e) {
            console.error("Error reading calidad data", e);
            return [];
        }
    };

    const saveCalidadData = (data) => {
        localStorage.setItem('calidad', JSON.stringify(data));
        sendContextToAi();
    };

    const sendContextToAi = () => {
        const iframe = document.querySelector('#aiChatWidget iframe');
        if (iframe && iframe.contentWindow) {
            const data = getCalidadData();
            iframe.contentWindow.postMessage({
                type: 'context-update',
                context: 'calidad',
                data: data
            }, '*');
        }
    };



    const renderTable = (filterText = '') => {
        const data = getCalidadData();
        calidadTableBody.innerHTML = '';

        const filtered = data.filter(item => {
            const term = filterText.toLowerCase();
            return (item.centroEmpacado || '').toLowerCase().includes(term) ||
                (item.maquina || '').toLowerCase().includes(term) ||
                (item.presentacion || '').toLowerCase().includes(term) ||
                (item.id || '').toString().includes(term) ||
                (item.pesoNeto || '').toString().includes(term) ||
                (item.cantidadBolsas || '').toString().includes(term) ||
                (item.fechaProduccion || '').toLowerCase().includes(term) ||
                (item.usuario || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            calidadTableBody.innerHTML = `
                <tr>
                    <td colspan="11">
                        <div class="no-data-container">
                            <div class="no-data">Sin registros de calidad</div>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        filtered.forEach((item) => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td data-label="ID">${item.id}</td>
                <td data-label="Centro">${item.centroEmpacado}</td>
                <td data-label="Máquina">${item.maquina}</td>
                <td data-label="Presentación">${item.presentacion}</td>
                <td data-label="Peso Neto">${item.pesoNeto}</td>
                <td data-label="Cantidad">${item.cantidadBolsas}</td>
                <td data-label="Fecha">${item.fechaProduccion}</td>
                <td data-label="Usuario">${item.usuario}</td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${item.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${item.id}">Eliminar</button>
                </td>
            `;
            calidadTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, item = null) => {
        isEditing = editing;
        calidadModal.classList.add('open');
        if (isEditing && item) {
            modalTitle.textContent = 'Editar Registro';
            calidadIdInput.value = item.id;
            centroEmpacadoInput.value = item.centroEmpacado;
            fpProduccion.setDate(item.fechaProduccion);
            maquinaInput.value = item.maquina;
            presentacionInput.value = item.presentacion;
            pesoNetoInput.value = item.pesoNeto;
            cantidadBolsasInput.value = item.cantidadBolsas;
        } else {
            modalTitle.textContent = 'Nuevo Registro';
            calidadForm.reset();
            fpProduccion.clear();
            calidadIdInput.value = '';
        }
    };

    const closeModal = () => {
        calidadModal.classList.remove('open');
    };

    // --- Event Listeners ---
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    addCalidadBtn.addEventListener('click', () => {
        openModal(false);
    });

    cancelBtn.addEventListener('click', closeModal);

    calidadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate basic fields
        if (!centroEmpacadoInput.value || !maquinaInput.value || !presentacionInput.value) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }

        const data = getCalidadData();
        let newItem = {
            centroEmpacado: centroEmpacadoInput.value,
            fechaProduccion: fechaProduccionInput.value,
            maquina: maquinaInput.value,
            presentacion: presentacionInput.value,
            pesoNeto: pesoNetoInput.value,
            cantidadBolsas: cantidadBolsasInput.value,
            usuario: currentUser || 'Anonimo'
        };

        if (isEditing) {
            const id = parseInt(calidadIdInput.value);
            const index = data.findIndex(i => i.id === id);
            if (index !== -1) {
                data[index] = { ...data[index], ...newItem, id: id }; // Keep ID
            }
        } else {
            // Generar ID único incremental
            const maxId = data.reduce((max, item) => Math.max(max, parseInt(item.id || 0)), 0);
            newItem.id = maxId + 1;
            data.push(newItem);
        }

        saveCalidadData(data);
        closeModal();
        renderTable(searchInput.value);
    });

    calidadTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id);
            const data = getCalidadData();
            const item = data.find(i => i.id === id);
            openModal(true, item);
        } else if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm(`¿Eliminar el registro #${id}?`)) {
                const data = getCalidadData();
                const newData = data.filter(i => i.id !== id);
                saveCalidadData(newData);
                renderTable(searchInput.value);
            }
        }
    });

    // --- AI Message Handler ---
    window.addEventListener('message', (event) => {
        if (!event.data || !event.data.action) return;

        const { action, data } = event.data;
        const allData = getCalidadData();

        switch (action) {
            case 'filterCalidad':
                let query = data.query || '';
                // Failsafe: if AI sends "field=value", extract only "value"
                if (query.includes('=')) {
                    query = query.split('=')[1];
                }
                searchInput.value = query;
                renderTable(query);
                break;

            case 'createCalidad':
                if (data.centroEmpacado || data.maquina || data.presentacion) {
                    const maxId = allData.reduce((max, item) => Math.max(max, parseInt(item.id || 0)), 0);
                    const newItem = {
                        id: maxId + 1,
                        centroEmpacado: data.centroEmpacado || 'Izalco',
                        fechaProduccion: data.fechaProduccion || new Date().toISOString().split('T')[0],
                        maquina: data.maquina || 'Cargado',
                        presentacion: data.presentacion || '25 KG',
                        pesoNeto: data.pesoNeto || 0,
                        cantidadBolsas: data.cantidadBolsas || 0,
                        usuario: currentUser || 'IA Assistant'
                    };
                    allData.push(newItem);
                    saveCalidadData(allData);
                    renderTable(searchInput.value);

                    // Notify AI that it was created
                    const iframe = document.querySelector('#aiChatWidget iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'ai-feedback',
                            message: `Registro #${newItem.id} creado exitosamente.`
                        }, '*');
                    }
                }
                break;

            case 'updateCalidad':
                if (data.id) {
                    const idToFind = parseInt(data.id);
                    const index = allData.findIndex(i => parseInt(i.id) === idToFind);
                    if (index !== -1) {
                        // Merge data, ensuring numeric types for specific fields
                        const updatedItem = { ...allData[index], ...data };

                        // ID must remain numeric and correct
                        updatedItem.id = idToFind;

                        // Enforce numeric types for numbers
                        if (updatedItem.pesoNeto) updatedItem.pesoNeto = updatedItem.pesoNeto.toString(); // User seems to prefer strings in JSON? 
                        // Actually, looking at Step 5195, user changed them TO strings. 
                        // But for calculation it's better to keep them as is. 
                        // I'll keep them as they come but ensure they are not objects.

                        allData[index] = updatedItem;
                        saveCalidadData(allData);
                        renderTable(searchInput.value);

                        const iframe = document.querySelector('#aiChatWidget iframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'ai-feedback',
                                message: `Registro #${idToFind} actualizado exitosamente.`
                            }, '*');
                        }
                    } else {
                        alert(`No se encontró el registro #${data.id}`);
                    }
                }
                break;

            case 'deleteCalidad':
                if (data.id) {
                    const id = parseInt(data.id);
                    const index = allData.findIndex(i => i.id === id);
                    if (index !== -1) {
                        // AI delete - still good to have a toast or non-blocking confirm if possible, 
                        // but user asked for "de un solo". Let's do a prompt-less delete if coming from AI.
                        allData.splice(index, 1);
                        saveCalidadData(allData);
                        renderTable(searchInput.value);

                        const iframe = document.querySelector('#aiChatWidget iframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'ai-feedback',
                                message: `Registro #${id} eliminado exitosamente.`
                            }, '*');
                        }
                    } else {
                        alert(`No se encontró el registro #${id} para eliminar.`);
                    }
                }
                break;

            case 'setTheme':
                if (data.theme) {
                    const isDark = data.theme === 'dark';
                    if (isDark) document.body.classList.add('dark-mode');
                    else document.body.classList.remove('dark-mode');
                    localStorage.setItem('theme', data.theme);

                    const iframe = document.querySelector('#aiChatWidget iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'ai-feedback',
                            message: `Tema cambiado a ${data.theme === 'dark' ? 'Oscuro' : 'Claro'}.`
                        }, '*');
                    }
                }
                break;

            case 'logout':
                if (confirm('¿Estás seguro de que deseas cerrar sesión? (Solicitado por IA)')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = '../index.html';
                }
                break;
        }
    });


    // Initial Render
    renderTable();

    // Initial context share
    setTimeout(sendContextToAi, 1000); // Give iframe time to load
});
