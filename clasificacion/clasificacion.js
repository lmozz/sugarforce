document.addEventListener('DOMContentLoaded', () => {
    // --- State & Elements ---
    let isEditing = false;
    let currentTargetRow = null;

    const classificationTableBody = document.getElementById('classificationTableBody');
    const classificationModal = document.getElementById('classificationModal');
    const classificationForm = document.getElementById('classificationForm');
    const modalTitle = document.getElementById('modalTitle');
    const detailTableBody = document.getElementById('detailTableBody');

    // Search Modal Elements
    const searchModal = document.getElementById('searchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchModalResults = document.getElementById('searchModalResults');

    // --- LocalStorage Helpers ---
    const getData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // --- Sidebar Menu ---
    const sidebar = document.getElementById('sidebar');
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    if (openMenuBtn) openMenuBtn.addEventListener('click', () => sidebar.classList.add('open'));
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // --- User Info & Logout ---
    const userInfo = document.getElementById('userInfo');
    let user = { name: "Usuario" };
    try {
        const storedUser = "Usuario: " + localStorage.getItem('currentUser');
        if (storedUser) {
            // Check if it's already a JSON string or a raw string
            if (storedUser.startsWith('{')) {
                user = JSON.parse(storedUser);
            } else {
                user = { name: storedUser };
            }
        }
    } catch (e) {
        console.error("Error parsing user info", e);
    }
    if (userInfo) userInfo.textContent = user.name || user;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });

    // --- Table Rendering ---
    const renderTable = (filterText = '') => {
        const classifications = getData('classification');
        classificationTableBody.innerHTML = '';

        const filtered = classifications.filter(c =>
            (c.nombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
            (c.descripcion || '').toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            classificationTableBody.innerHTML = `<tr><td colspan="4"><div class="no-data-container"><img src="../imgs/empty.png" class="no-data-img"><div class="no-data">Sin información</div></div></td></tr>`;
            return;
        }

        filtered.forEach(item => {
            const row = document.createElement('tr');
            const stepsCount = (item.steps || []).length;

            row.innerHTML = `
                <td data-label="Nombre">${item.nombre}</td>
                <td data-label="Descripción">${item.descripcion}</td>
                <td data-label="Pasos">${stepsCount} paso(s)</td>
                <td class="actions-cell" data-label="Acción">
                    <button class="action-btn edit-btn" data-id="${item.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${item.id}">Eliminar</button>
                </td>
            `;
            classificationTableBody.appendChild(row);
        });

        // Add Listeners
        classificationTableBody.querySelectorAll('.edit-btn').forEach(btn =>
            btn.addEventListener('click', () => openModal(true, btn.dataset.id))
        );
        classificationTableBody.querySelectorAll('.delete-btn').forEach(btn =>
            btn.addEventListener('click', () => {
                if (confirm('¿Eliminar esta clasificación?')) {
                    const data = getData('classification').filter(c => c.id !== btn.dataset.id);
                    saveData('classification', data);
                    renderTable(document.getElementById('searchInput').value);
                }
            })
        );
    };

    // --- Detail Row Helper ---
    const createDetailRow = (stepName = '') => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <input type="text" class="step-input" readonly placeholder="Click para seleccionar..." value="${stepName}" 
                    style="width: 100%; border: none; background: transparent; cursor: pointer; color: var(--text-color);">
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <button type="button" class="remove-detail-btn" style="background: none; border: none; color: #d93025; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </td>
        `;

        const input = tr.querySelector('.step-input');
        input.addEventListener('click', () => {
            currentTargetRow = tr;
            openSearchModal();
        });

        tr.querySelector('.remove-detail-btn').addEventListener('click', () => tr.remove());
        return tr;
    };

    // --- Modal Logic ---
    const openModal = (editing = false, id = null) => {
        isEditing = editing;
        classificationForm.reset();
        detailTableBody.innerHTML = '';

        if (editing) {
            const item = getData('classification').find(c => c.id === id);
            if (item) {
                document.getElementById('classificationId').value = item.id;
                document.getElementById('className').value = item.nombre;
                document.getElementById('classDesc').value = item.descripcion;
                item.steps.forEach(step => detailTableBody.appendChild(createDetailRow(step)));
                modalTitle.textContent = 'Editar Clasificación';
            }
        } else {
            document.getElementById('classificationId').value = '';
            modalTitle.textContent = 'Nueva Clasificación';
        }
        classificationModal.classList.add('open');
    };

    // --- Search Modal (Steps) ---
    const openSearchModal = () => {
        searchModalInput.value = '';
        renderSearchResults('');
        searchModal.classList.add('open');
    };

    const renderSearchResults = (query) => {
        const steps = getData('steps');
        searchModalResults.innerHTML = '';

        // Get already selected steps to avoid duplicates (optional visual feedback, but we check on selection)
        const selectedSteps = Array.from(detailTableBody.querySelectorAll('.step-input')).map(i => i.value);

        const filtered = steps.filter(s =>
            (s.nombre || '').toLowerCase().includes(query.toLowerCase()) ||
            (s.descripcion || '').toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            searchModalResults.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No hay pasos creados o no coinciden.</div>';
            return;
        }

        filtered.forEach(step => {
            const isSelected = selectedSteps.includes(step.nombre);
            const div = document.createElement('div');
            div.className = 'search-item';
            div.style.padding = '12px';
            div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            div.style.cursor = isSelected ? 'default' : 'pointer';
            div.style.opacity = isSelected ? '0.5' : '1';

            div.innerHTML = `
                <div style="font-weight: 500; color: var(--text-color);">${step.nombre}</div>
                <div style="font-size: 12px; color: #666;">${step.descripcion || ''}</div>
                ${isSelected ? '<div style="font-size: 10px; color: #d93025;">Ya agregado</div>' : ''}
            `;

            if (!isSelected) {
                div.addEventListener('click', () => {
                    if (currentTargetRow) {
                        currentTargetRow.querySelector('.step-input').value = step.nombre;
                        searchModal.classList.remove('open');
                    }
                });
                div.addEventListener('mouseenter', () => div.style.background = 'rgba(0,122,255,0.05)');
                div.addEventListener('mouseleave', () => div.style.background = 'transparent');
            }
            searchModalResults.appendChild(div);
        });
    };

    // --- Event Listeners ---
    document.getElementById('addClassBtn').addEventListener('click', () => openModal(false));
    document.getElementById('cancelBtn').addEventListener('click', () => classificationModal.classList.remove('open'));
    document.getElementById('addStepDetailBtn').addEventListener('click', () => detailTableBody.appendChild(createDetailRow()));
    document.getElementById('closeSearchBtn').addEventListener('click', () => searchModal.classList.remove('open'));
    searchModalInput.addEventListener('keyup', (e) => renderSearchResults(e.target.value));

    // Form Submit
    classificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('classificationId').value || Date.now().toString();
        const nombre = document.getElementById('className').value;
        const descripcion = document.getElementById('classDesc').value;

        // Collect steps and validate duplicates
        const stepInputs = Array.from(detailTableBody.querySelectorAll('.step-input'));
        const steps = [];
        for (const input of stepInputs) {
            const val = input.value.trim();
            if (!val) continue;
            if (steps.includes(val)) {
                alert(`El paso "${val}" ya está incluido en esta clasificación.`);
                return;
            }
            steps.push(val);
        }

        const data = getData('classification');
        const classification = { id, nombre, descripcion, steps };

        if (isEditing) {
            const index = data.findIndex(c => c.id === id);
            data[index] = classification;
        } else {
            data.push(classification);
        }

        saveData('classification', data);
        classificationModal.classList.remove('open');
        renderTable(document.getElementById('searchInput').value);
    });

    document.getElementById('searchInput').addEventListener('keyup', (e) => renderTable(e.target.value));

    // --- AI Widget Controls ---
    const aiChatWidget = document.getElementById('aiChatWidget');
    const openAiBtn = document.getElementById('openAiBtn');
    if (openAiBtn) {
        openAiBtn.addEventListener('click', () => {
            aiChatWidget.style.display = aiChatWidget.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Initial Render
    renderTable();
});
