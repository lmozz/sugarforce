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
});
