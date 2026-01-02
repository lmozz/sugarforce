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

    const cellarTableBody = document.getElementById('cellarTableBody');
    const searchInput = document.getElementById('searchInput');
    const addCellarBtn = document.getElementById('addCellarBtn');
    const cellarModal = document.getElementById('cellarModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const cellarForm = document.getElementById('cellarForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) userInfo.textContent = `Usuario: ${currentUser}`;

    const cellarIdInput = document.getElementById('cellarId');
    const cellarNameInput = document.getElementById('cellarName');
    const cellarDescInput = document.getElementById('cellarDesc');

    let isEditing = false;

    const getCellars = () => {
        try {
            const data = localStorage.getItem('cellar');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading cellar", e);
            return [];
        }
    };

    const saveCellars = (data) => {
        localStorage.setItem('cellar', JSON.stringify(data));
    };

    const renderTable = (filterText = '') => {
        const items = getCellars();
        cellarTableBody.innerHTML = '';

        const filtered = items.filter(i => {
            const term = filterText.toLowerCase();
            return (i.nombre || '').toLowerCase().includes(term) ||
                (i.descripcion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            cellarTableBody.innerHTML = `
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
            cellarTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, item = null) => {
        isEditing = editing;
        cellarModal.classList.add('open');
        if (isEditing && item) {
            modalTitle.textContent = 'Editar Bodega';
            cellarNameInput.value = item.nombre;
            cellarDescInput.value = item.descripcion;
            cellarIdInput.value = item.nombre;
        } else {
            modalTitle.textContent = 'Nueva Bodega';
            cellarForm.reset();
            cellarIdInput.value = '';
        }
    };

    const closeModal = () => cellarModal.classList.remove('open');

    searchInput.addEventListener('keyup', (e) => renderTable(e.target.value));
    if (addCellarBtn) addCellarBtn.addEventListener('click', () => openModal(false));
    cancelBtn.addEventListener('click', closeModal);

    cellarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = cellarNameInput.value;
        const descripcion = cellarDescInput.value;
        const originalName = cellarIdInput.value;
        let items = getCellars();

        if (isEditing) {
            const idx = items.findIndex(i => i.nombre === originalName);
            if (idx !== -1) items[idx] = { nombre, descripcion };
        } else {
            items.push({ nombre, descripcion });
        }

        saveCellars(items);
        closeModal();
        renderTable(searchInput.value);
    });

    cellarTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const name = btn.dataset.name;
        let items = getCellars();

        if (btn.classList.contains('delete-btn')) {
            if (confirm(`¿Eliminar bodega "${name}"?`)) {
                items = items.filter(i => i.nombre !== name);
                saveCellars(items);
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
