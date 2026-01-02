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
});
