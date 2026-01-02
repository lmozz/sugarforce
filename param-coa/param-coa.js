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

    // AI Chat Widget Logic
    const openAiBtn = document.getElementById('openAiBtn');
    const closeAiBtn = document.getElementById('closeAiBtn');
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

    if (closeAiBtn && aiChatWidget) {
        closeAiBtn.addEventListener('click', () => {
            aiChatWidget.style.display = 'none';
        });
    }
});
