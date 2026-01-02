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
            // Store original name to find it later (simple approach)
            stepIdInput.value = step.nombre;
        } else {
            modalTitle.textContent = 'Nuevo Paso';
            stepForm.reset();
            stepIdInput.value = '';
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
        const originalName = stepIdInput.value;

        let steps = getSteps();

        if (isEditing) {
            // Update
            const index = steps.findIndex(s => s.nombre === originalName);
            if (index !== -1) {
                steps[index] = { nombre, descripcion };
            }
        } else {
            // Create
            steps.push({ nombre, descripcion });
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

    // AI Chat Widget Logic
    const openAiBtn = document.getElementById('openAiBtn');
    const closeAiBtn = document.getElementById('closeAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');

    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            // Check if currently visible (flex)
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
