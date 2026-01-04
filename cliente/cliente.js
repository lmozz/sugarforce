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

    // --- State & DOM Elements ---
    const clientTableBody = document.getElementById('clientTableBody');
    const searchInput = document.getElementById('searchInput');
    const addClientBtn = document.getElementById('addClientBtn');
    const clientModal = document.getElementById('clientModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const clientForm = document.getElementById('clientForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Form Inputs
    const clientIdInput = document.getElementById('clientId');
    const clientNameInput = document.getElementById('clientName');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientDeptInput = document.getElementById('clientDept');
    const clientMunInput = document.getElementById('clientMun');
    const clientClassInput = document.getElementById('clientClass');
    const emailListContainer = document.getElementById('emailListContainer');
    const addEmailBtn = document.getElementById('addEmailBtn');

    let isEditing = false;

    // --- Helper Functions ---
    const getClients = () => {
        try {
            const customers = localStorage.getItem('customer');
            return customers ? JSON.parse(customers) : [];
        } catch (e) {
            console.error("Error reading customers", e);
            return [];
        }
    };

    const saveClients = (customers) => {
        localStorage.setItem('customer', JSON.stringify(customers));
    };

    const renderTable = (filterText = '') => {
        const customers = getClients();
        clientTableBody.innerHTML = '';

        const filtered = customers.filter(c => {
            const term = filterText.toLowerCase();
            return (c.nombre || '').toLowerCase().includes(term) ||
                (c.clasificacion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            clientTableBody.innerHTML = `
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

        filtered.forEach((client) => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = client.nombre;
            nameCell.dataset.label = "Nombre";

            const addrCell = document.createElement('td');
            addrCell.textContent = client.direccion;
            addrCell.dataset.label = "Dirección";

            const locCell = document.createElement('td');
            locCell.textContent = `${client.municipio}, ${client.departamento}`;
            locCell.dataset.label = "Ubicación";

            const classCell = document.createElement('td');
            classCell.dataset.label = "Clasificación";
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = client.clasificacion;
            classCell.appendChild(badge);

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.dataset.label = "Acción";

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.name = client.nombre;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.dataset.name = client.nombre;

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(nameCell);
            row.appendChild(addrCell);
            row.appendChild(locCell);
            row.appendChild(classCell);
            row.appendChild(actionsCell);

            clientTableBody.appendChild(row);
        });
    };

    const createEmailRow = (emailValue = '') => {
        const row = document.createElement('div');
        row.className = 'input-group';
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.marginBottom = '10px';
        row.style.alignItems = 'center';

        row.innerHTML = `
            <input type="email" class="client-email-input" value="${emailValue}" placeholder="Correo electrónico" required style="flex: 1; margin-bottom: 0;">
            <button type="button" class="action-btn delete-btn" style="padding: 8px 12px; font-size: 14px; background: #ff4444; color: white; border: none;">&times;</button>
        `;

        row.querySelector('.delete-btn').addEventListener('click', () => row.remove());
        return row;
    };

    const openModal = (editing = false, client = null) => {
        isEditing = editing;
        emailListContainer.innerHTML = '';
        clientModal.classList.add('open');
        if (isEditing && client) {
            modalTitle.textContent = 'Editar Cliente';
            clientNameInput.value = client.nombre;
            clientAddressInput.value = client.direccion;
            clientDeptInput.value = client.departamento;
            clientMunInput.value = client.municipio;
            clientClassInput.value = client.clasificacion;
            clientIdInput.value = client.nombre;

            // Load Emails
            if (client.emails && Array.isArray(client.emails)) {
                client.emails.forEach(email => {
                    emailListContainer.appendChild(createEmailRow(email));
                });
            } else if (client.email) {
                // Backward compatibility for single email
                emailListContainer.appendChild(createEmailRow(client.email));
            }
        } else {
            modalTitle.textContent = 'Nuevo Cliente';
            clientForm.reset();
            clientIdInput.value = '';
            // Start with one empty email row
            emailListContainer.appendChild(createEmailRow());
        }
    };

    const closeModal = () => {
        clientModal.classList.remove('open');
    };

    // --- Event Listeners ---

    // Search
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    // Add Email Row
    addEmailBtn.addEventListener('click', () => {
        emailListContainer.appendChild(createEmailRow());
    });

    // Add Button
    addClientBtn.addEventListener('click', () => {
        openModal(false);
    });

    // Cancel Button
    cancelBtn.addEventListener('click', closeModal);

    // Save (Form Submit)
    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInputs = document.querySelectorAll('.client-email-input');
        const emails = [];
        const emailSet = new Set();
        let hasDuplicate = false;

        emailInputs.forEach(input => {
            const val = input.value.trim().toLowerCase();
            if (val) {
                if (emailSet.has(val)) {
                    hasDuplicate = true;
                }
                emailSet.add(val);
                emails.push(input.value.trim()); // Keep original case or trim
            }
        });

        if (hasDuplicate) {
            alert('Este cliente ya tiene ese correo agregado. No se permiten correos duplicados.');
            return;
        }

        const newClient = {
            nombre: clientNameInput.value,
            direccion: clientAddressInput.value,
            departamento: clientDeptInput.value,
            municipio: clientMunInput.value,
            clasificacion: clientClassInput.value,
            emails: emails
        };

        const originalName = clientIdInput.value;
        let customers = getClients();

        if (isEditing) {
            const index = customers.findIndex(c => c.nombre === originalName);
            if (index !== -1) {
                customers[index] = newClient;
            }
        } else {
            customers.push(newClient);
        }

        saveClients(customers);
        closeModal();
        renderTable(searchInput.value);
    });

    // Table Actions (Delegation)
    clientTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const name = btn.dataset.name;
        let customers = getClients();

        if (btn.classList.contains('delete-btn')) {
            if (confirm(`¿Estás seguro de eliminar al cliente "${name}"?`)) {
                const newCustomers = customers.filter(c => c.nombre !== name);
                saveClients(newCustomers);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const client = customers.find(c => c.nombre === name);
            if (client) {
                openModal(true, client);
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

    // --- AI Chat Widget Logic ---
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');

    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            const currentDisplay = window.getComputedStyle(aiChatWidget).display;
            if (currentDisplay === 'flex') {
                aiChatWidget.style.display = 'none';
            } else {
                aiChatWidget.style.display = 'flex';
            }
        });
    }

    // AI CRUD Handler - COMPLETO PARA CLIENTES
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

        let customers = getClients();
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let dataChanged = false;

        console.log(`Procesando acción en clientes: ${action}`, data);

        switch (action) {
            case 'createCustomer':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre del cliente es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreCliente = data.nombre.trim();

                // Verificar que no exista (case insensitive)
                const existeCliente = customers.some(c =>
                    c.nombre.toLowerCase() === nombreCliente.toLowerCase()
                );
                if (existeCliente) {
                    message = `❌ Error: Ya existe un cliente llamado "${nombreCliente}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Crear nuevo cliente con valores por defecto
                    const nuevoCliente = {
                        nombre: nombreCliente,
                        direccion: data.direccion || "",
                        departamento: data.departamento || "",
                        municipio: data.municipio || "",
                        clasificacion: data.clasificacion || "Minorista",
                        emails: []
                    };

                    // Agregar emails si se proporcionan
                    if (data.emails && Array.isArray(data.emails)) {
                        const emailsUnicos = [];
                        const emailsSet = new Set();

                        data.emails.forEach(email => {
                            const emailTrim = email.trim().toLowerCase();
                            if (emailTrim && !emailsSet.has(emailTrim)) {
                                emailsSet.add(emailTrim);
                                emailsUnicos.push(email.trim()); // Mantener capitalización original
                            }
                        });

                        nuevoCliente.emails = emailsUnicos;
                    } else if (data.email) {
                        // Backward compatibility for single email
                        nuevoCliente.emails = [data.email.trim()];
                    }

                    customers.push(nuevoCliente);
                    message = `✅ Cliente "${nombreCliente}" creado exitosamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'updateCustomer':
                // Validar datos requeridos
                if (!data.originalName || data.originalName.trim() === '') {
                    message = "❌ Error: Se necesita el nombre original del cliente";
                    success = false;
                    messages.push(message);
                    break;
                }

                const originalName = data.originalName.trim();

                // Buscar cliente (case insensitive)
                const indexUpdate = customers.findIndex(c =>
                    c.nombre.toLowerCase() === originalName.toLowerCase()
                );

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró el cliente "${originalName}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Verificar si se está cambiando el nombre y si ya existe
                    if (data.nombre && data.nombre.trim() !== '') {
                        const nuevoNombre = data.nombre.trim();
                        if (nuevoNombre.toLowerCase() !== originalName.toLowerCase()) {
                            const nombreYaExiste = customers.some((c, idx) =>
                                idx !== indexUpdate && c.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                            );

                            if (nombreYaExiste) {
                                message = `❌ Error: Ya existe otro cliente llamado "${nuevoNombre}"`;
                                success = false;
                                messages.push(message);
                                break;
                            }
                        }
                    }

                    // Actualizar campos
                    const clienteActual = customers[indexUpdate];
                    const nombreAnterior = clienteActual.nombre;

                    customers[indexUpdate] = {
                        ...clienteActual,
                        nombre: data.nombre ? data.nombre.trim() : clienteActual.nombre,
                        direccion: data.direccion !== undefined ? data.direccion : clienteActual.direccion,
                        departamento: data.departamento !== undefined ? data.departamento : clienteActual.departamento,
                        municipio: data.municipio !== undefined ? data.municipio : clienteActual.municipio,
                        clasificacion: data.clasificacion !== undefined ? data.clasificacion : clienteActual.clasificacion
                    };

                    message = `✅ Cliente "${nombreAnterior}" actualizado`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'deleteCustomer':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre del cliente";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar cliente (case insensitive)
                const deleteIndex = customers.findIndex(c =>
                    c.nombre.toLowerCase() === nombreEliminar.toLowerCase()
                );

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró el cliente "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminado = customers[deleteIndex].nombre;
                    customers.splice(deleteIndex, 1);
                    message = `✅ Cliente "${eliminado}" eliminado correctamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'addEmailToCustomer':
                // Validar datos requeridos
                if (!data.customerName || data.customerName.trim() === '' ||
                    !data.email || data.email.trim() === '') {
                    message = "❌ Error: Se necesita nombre del cliente y correo";
                    success = false;
                    messages.push(message);
                    break;
                }

                const customerName = data.customerName.trim();
                const emailToAdd = data.email.trim().toLowerCase();

                // Validar formato de email básico
                if (!emailToAdd.includes('@') || !emailToAdd.includes('.')) {
                    message = `❌ Error: El formato del correo "${emailToAdd}" no es válido`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Buscar cliente
                const addIdx = customers.findIndex(c =>
                    c.nombre.toLowerCase() === customerName.toLowerCase()
                );

                if (addIdx === -1) {
                    message = `❌ Error: No se encontró el cliente "${customerName}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Verificar que no esté ya agregado (case insensitive para emails)
                const emailYaExiste = customers[addIdx].emails.some(e =>
                    e.toLowerCase() === emailToAdd
                );

                if (emailYaExiste) {
                    message = `⚠️ El correo "${emailToAdd}" ya existe para el cliente "${customers[addIdx].nombre}"`;
                    success = false;
                    messages.push(message);
                } else {
                    customers[addIdx].emails.push(data.email.trim()); // Mantener capitalización original
                    message = `✅ Correo "${data.email.trim()}" agregado a "${customers[addIdx].nombre}"`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'removeEmailFromCustomer':
                // Validar datos requeridos
                if (!data.customerName || data.customerName.trim() === '' ||
                    !data.email || data.email.trim() === '') {
                    message = "❌ Error: Se necesita nombre del cliente y correo";
                    success = false;
                    messages.push(message);
                    break;
                }

                const removeCustomerName = data.customerName.trim();
                const emailToRemove = data.email.trim().toLowerCase();

                // Buscar cliente
                const removeIdx = customers.findIndex(c =>
                    c.nombre.toLowerCase() === removeCustomerName.toLowerCase()
                );

                if (removeIdx === -1) {
                    message = `❌ Error: No se encontró el cliente "${removeCustomerName}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Buscar email (case insensitive)
                const emailIndex = customers[removeIdx].emails.findIndex(e =>
                    e.toLowerCase() === emailToRemove
                );

                if (emailIndex === -1) {
                    message = `❌ Error: El correo "${data.email.trim()}" no existe para el cliente "${customers[removeIdx].nombre}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const emailEliminado = customers[removeIdx].emails[emailIndex];
                    customers[removeIdx].emails.splice(emailIndex, 1);
                    message = `✅ Correo "${emailEliminado}" eliminado de "${customers[removeIdx].nombre}"`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'filterCustomer':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todos los clientes";
                    } else {
                        message = `🔍 Clientes filtrados por: "${query}"`;
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
                console.log('Acción no reconocida en clientes:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los datos
        if (dataChanged) {
            saveClients(customers);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createCustomer', 'updateCustomer', 'deleteCustomer',
            'addEmailToCustomer', 'removeEmailFromCustomer', 'filterCustomer'].includes(action)) {
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
