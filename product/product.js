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
    const productTableBody = document.getElementById('productTableBody');
    const searchInput = document.getElementById('searchInput');
    const addProductBtn = document.getElementById('addProductBtn');
    const productModal = document.getElementById('productModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Form Inputs
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productDescInput = document.getElementById('productDesc');
    const productPresentationInput = document.getElementById('productPresentation');
    const presentationSearchModal = document.getElementById('presentationSearchModal');
    const presSearchInput = document.getElementById('presSearchInput');
    const presSearchResults = document.getElementById('presSearchResults');
    const closePresSearchBtn = document.getElementById('closePresSearchBtn');

    let isEditing = false;

    // --- Helper Functions ---
    const getProducts = () => {
        try {
            return JSON.parse(localStorage.getItem('product') || '[]');
        } catch (e) {
            console.error("Error reading products", e);
            return [];
        }
    };

    const saveProducts = (products) => {
        localStorage.setItem('product', JSON.stringify(products));
    };

    const getPresentations = () => {
        try {
            const data = localStorage.getItem('presentation');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading presentations", e);
            return [];
        }
    };

    const renderPresentationSearch = (filter = '') => {
        const presentations = getPresentations();
        presSearchResults.innerHTML = '';

        const filtered = presentations.filter(p =>
            p.nombre.toLowerCase().includes(filter.toLowerCase()) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filtered.length === 0) {
            presSearchResults.innerHTML = '<div style="padding: 10px; color: #666; text-align: center;">No se encontraron presentaciones</div>';
            return;
        }

        filtered.forEach(p => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.style.padding = '12px';
            div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            div.style.cursor = 'pointer';
            div.style.transition = 'background 0.2s';
            div.innerHTML = `
                <div style="font-weight: 500; color: var(--text-color);">${p.nombre}</div>
                <div style="font-size: 12px; color: #666;">${p.descripcion || ''}</div>
            `;

            div.addEventListener('mouseenter', () => div.style.background = 'rgba(0,122,255,0.05)');
            div.addEventListener('mouseleave', () => div.style.background = 'transparent');

            div.addEventListener('click', () => {
                productPresentationInput.value = p.nombre;
                presentationSearchModal.classList.remove('open');
            });

            presSearchResults.appendChild(div);
        });
    };

    const renderTable = (filterText = '') => {
        const products = getProducts();
        productTableBody.innerHTML = '';

        const filtered = products.filter(p => {
            const term = filterText.toLowerCase();
            return (p.nombre || '').toLowerCase().includes(term) ||
                (p.descripcion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            productTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
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

            const nameCell = document.createElement('td');
            nameCell.textContent = item.nombre;
            nameCell.dataset.label = "Nombre";

            const descCell = document.createElement('td');
            descCell.textContent = item.descripcion;
            descCell.dataset.label = "Descripción";

            const presCell = document.createElement('td');
            presCell.textContent = item.presentacion || 'N/A';
            presCell.dataset.label = "Presentación";

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.dataset.label = "Acción";

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.name = item.nombre;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.dataset.name = item.nombre;

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(nameCell);
            row.appendChild(descCell);
            row.appendChild(presCell);
            row.appendChild(actionsCell);

            productTableBody.appendChild(row);
        });
    };

    const openModal = (editing = false, item = null) => {
        const presentations = getPresentations();
        if (presentations.length === 0) {
            alert('No existen presentaciones registradas. Debe crear al menos una presentación antes de gestionar productos.');
            return;
        }

        // loadPresentations(); // Removed, now using search modal
        isEditing = editing;
        productModal.classList.add('open');
        if (isEditing && item) {
            modalTitle.textContent = 'Editar Producto';
            productNameInput.value = item.nombre;
            productDescInput.value = item.descripcion;
            productPresentationInput.value = item.presentacion || '';
            productIdInput.value = item.nombre;
        } else {
            modalTitle.textContent = 'Nuevo Producto';
            productForm.reset();
            productIdInput.value = '';
        }
    };

    const closeModal = () => {
        productModal.classList.remove('open');
    };

    // --- Event Listeners ---
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    addProductBtn.addEventListener('click', () => {
        openModal(false);
    });

    cancelBtn.addEventListener('click', closeModal);

    // Presentation Search Modal Event Listeners
    productPresentationInput.addEventListener('click', () => {
        presSearchInput.value = '';
        renderPresentationSearch();
        presentationSearchModal.classList.add('open');
        setTimeout(() => presSearchInput.focus(), 100);
    });

    presSearchInput.addEventListener('keyup', (e) => {
        renderPresentationSearch(e.target.value);
    });

    closePresSearchBtn.addEventListener('click', () => {
        presentationSearchModal.classList.remove('open');
    });

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = productNameInput.value;
        const descripcion = productDescInput.value;
        const presentacion = productPresentationInput.value;
        const originalName = productIdInput.value;

        let items = getProducts();

        if (isEditing) {
            const index = items.findIndex(i => i.nombre === originalName);
            if (index !== -1) items[index] = { nombre, descripcion, presentacion };
        } else {
            items.push({ nombre, descripcion, presentacion });
        }

        saveProducts(items);
        closeModal();
        renderTable(searchInput.value);
    });

    productTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const name = btn.dataset.name;
        let items = getProducts();

        if (btn.classList.contains('delete-btn')) {
            if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
                items = items.filter(i => i.nombre !== name);
                saveProducts(items);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const item = items.find(i => i.nombre === name);
            if (item) openModal(true, item);
        }
    });

    // Initial Render
    renderTable();

    // Sidebars & AI
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (openMenuBtn && sidebar) openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeMenuBtn && sidebar) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
        if (confirm('¿Cerrar sesión?')) window.location.href = '../index.html';
    });

    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            const isVisible = window.getComputedStyle(aiChatWidget).display === 'flex';
            aiChatWidget.style.display = isVisible ? 'none' : 'flex';
        });
    }
});
