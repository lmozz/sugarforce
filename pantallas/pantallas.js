document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---
    const KEY_PANTALLAS = 'pantallas';
    const KEY_CLASES = 'claspantallas';
    const SCREEN_IMAGES = Array.from({ length: 9 }, (_, i) => `${i + 1}.png`);

    // --- State ---
    let currentFilterType = null; // 'pantalla' | 'clasificacion' | null
    let currentMultimediaItems = []; // Temp storage for multimedia entries in modals
    let currentLinkedClasses = []; // Temp storage for linked classes in screen modal
    let editingId = null;
    let editingMediaIndex = null;

    // --- Elements ---
    const sidebar = document.getElementById('sidebar');
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('tableBody');
    const tableHeader = document.getElementById('tableHeader');
    const noDataState = document.getElementById('noDataState');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    // Modals
    const classModal = document.getElementById('classModal');
    const screenModal = document.getElementById('screenModal');
    const mediaItemModal = document.getElementById('mediaItemModal');
    const aiChatWidget = document.getElementById('aiChatWidget');

    // Forms
    const classForm = document.getElementById('classForm');
    const screenForm = document.getElementById('screenForm');

    // --- LocalStorage Helpers ---
    const getPantallas = () => JSON.parse(localStorage.getItem(KEY_PANTALLAS) || '[]');
    const savePantallas = (data) => localStorage.setItem(KEY_PANTALLAS, JSON.stringify(data));
    const getClases = () => JSON.parse(localStorage.getItem(KEY_CLASES) || '[]');
    const saveClases = (data) => localStorage.setItem(KEY_CLASES, JSON.stringify(data));

    // --- Init ---
    const init = () => {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        renderList();
        renderUser();
    };

    const renderUser = () => {
        const userInfo = document.getElementById('userInfo');
        const storedUser = localStorage.getItem('currentUser');
        if (userInfo && storedUser) {
            userInfo.textContent = storedUser.startsWith('{') ? JSON.parse(storedUser).name : storedUser;
        }
    };

    // --- Rendering Logic ---
    const renderList = () => {
        const searchText = searchInput.value.toLowerCase();
        let pantallas = getPantallas();
        let clases = getClases();

        // Categorize for rendering
        pantallas = pantallas.map(p => ({ ...p, _kind: 'pantalla' }));
        clases = clases.map(c => ({ ...c, _kind: 'clasificacion' }));

        let combined = [...pantallas, ...clases];

        // Filter by Type
        if (currentFilterType) {
            combined = combined.filter(item => item._kind === currentFilterType);
        }

        // Filter by Search
        if (searchText) {
            combined = combined.filter(item =>
                (item.nombre || '').toLowerCase().includes(searchText) ||
                (item.descripcion || '').toLowerCase().includes(searchText)
            );
        }

        // Sort: newest first
        combined.sort((a, b) => (b.id || 0) - (a.id || 0));

        updateUI(combined);
    };

    const updateUI = (items) => {
        if (items.length === 0) {
            tableView.style.display = 'none';
            cardView.style.display = 'none';
            noDataState.style.display = 'flex';
            return;
        }

        noDataState.style.display = 'none';

        // Headers (Dynamic-ish)
        tableHeader.innerHTML = `
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Multimedia</th>
            ${currentFilterType === 'pantalla' ? '<th>Ubicación</th><th>Aleatorio</th>' : ''}
            ${currentFilterType === 'clasificacion' ? '<th>Periodo</th>' : ''}
            <th>Acciones</th>
        `;

        // Body
        tableBody.innerHTML = '';
        cardView.innerHTML = '';

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = item._kind === 'pantalla' ? 'row-pantalla' : 'row-clasificacion';

            const mediaCount = (item.multimedia || []).length;
            const typeLabel = item._kind === 'pantalla' ? 'Pantalla' : 'Clasificación';

            tr.innerHTML = `
                <td>${item.id.toString().slice(-4)}</td>
                <td style="font-weight: 500;">${item.nombre}</td>
                <td><span class="badge ${item._kind}">${typeLabel}</span></td>
                <td><span style="opacity: 0.7;">🖼️ ${mediaCount}</span></td>
                ${currentFilterType === 'pantalla' ? `<td>${item.ubicacion || '-'}</td><td>${item.aleatorio ? 'Sí' : 'No'}</td>` : ''}
                ${currentFilterType === 'clasificacion' ? `<td>${item.periodo || '-'}</td>` : ''}
                <td>
                    <div class="action-btns">
                        <button class="btn-action edit-btn" onclick="openEditModal('${item._kind}', '${item.id}')">✏️</button>
                        <button class="btn-action delete-btn" onclick="deleteItem('${item._kind}', '${item.id}')">🗑️</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);

            // Card for mobile
            const card = document.createElement('div');
            card.className = `card ${item._kind === 'pantalla' ? 'row-pantalla' : 'row-clasificacion'}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span class="badge ${item._kind}">${typeLabel}</span>
                    <span style="font-size: 11px; opacity: 0.5;">ID: ${item.id.toString().slice(-4)}</span>
                </div>
                <h4 style="margin-bottom: 5px;">${item.nombre}</h4>
                <p style="font-size: 13px; opacity: 0.7; margin-bottom: 15px;">${item.descripcion || 'Sin descripción'}</p>
                <div style="font-size: 12px; margin-bottom: 15px;">
                    <div>Multimedia: ${mediaCount} ítems</div>
                    ${item.periodo ? `<div>Periodo: ${item.periodo}</div>` : ''}
                </div>
                <div class="action-btns">
                    <button class="btn-action edit-btn" onclick="openEditModal('${item._kind}', '${item.id}')">Editar</button>
                    <button class="btn-action delete-btn" onclick="deleteItem('${item._kind}', '${item.id}')">Eliminar</button>
                </div>
            `;
            cardView.appendChild(card);
        });

        // Toggle table/card visibility based on screen size (handled in CSS but double check here)
        tableView.style.display = window.innerWidth > 768 ? 'block' : 'none';
        cardView.style.display = window.innerWidth <= 768 ? 'grid' : 'none';
    };

    // --- Modal Handlers ---
    const openModal = (modal) => modal.style.display = 'flex';
    const closeModal = (modal) => {
        modal.style.display = 'none';
        editingId = null;
    };

    // FAB Group Toggle
    const mainFab = document.getElementById('mainFab');
    const fabGroup = document.querySelector('.fab-group');
    mainFab.addEventListener('click', () => {
        fabGroup.classList.toggle('open');
        mainFab.textContent = fabGroup.classList.contains('open') ? '×' : '+';
    });

    document.getElementById('addClassBtn').addEventListener('click', () => {
        classForm.reset();
        currentMultimediaItems = [];
        renderMediaList('classMediaList');
        document.getElementById('classId').value = '';
        document.getElementById('classModalTitle').textContent = 'Nueva Clasificación';
        openModal(classModal);
        fabGroup.classList.remove('open');
        mainFab.textContent = '+';
    });

    document.getElementById('addScreenBtn').addEventListener('click', () => {
        screenForm.reset();
        currentMultimediaItems = [];
        currentLinkedClasses = [];
        renderMediaList('screenMediaList');
        renderLinkedClasses();
        populateClassSelect();
        document.getElementById('screenId').value = '';
        document.getElementById('screenModalTitle').textContent = 'Nueva Pantalla';
        openModal(screenModal);
        fabGroup.classList.remove('open');
        mainFab.textContent = '+';
    });

    // Close Modals
    document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });

    // Sidebar/Theme/Logout
    openMenuBtn.addEventListener('click', () => sidebar.classList.add('open'));
    closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });

    // Filter Logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentFilterType = null;
            } else {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilterType = type;
            }
            renderList();
        });
    });

    searchInput.addEventListener('input', renderList);

    // --- Tab Switching ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-content');
            const targetTab = btn.dataset.tab;

            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            modal.querySelector(`#${targetTab}`).classList.add('active');
        });
    });

    // --- Flatpickr ---
    flatpickr("#classPeriod", {
        mode: "range",
        locale: "es",
        dateFormat: "Y-m-d",
        placeholder: "Seleccionar Periodo"
    });

    // --- Multimedia Logic ---
    const mediaListContainer = {
        class: 'classMediaList',
        screen: 'screenMediaList'
    };

    const renderMediaList = (containerId) => {
        const list = document.getElementById(containerId);
        list.innerHTML = '';
        currentMultimediaItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <img src="imgs/${item.imagen}" class="item-thumb">
                <div class="item-text">
                    <div style="font-weight: 500;">Tipo: ${item.tipo} | ${item.duracion}s</div>
                    <div style="font-size: 11px; opacity: 0.7;">"${item.oracion.slice(0, 30)}..."</div>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn-action" onclick="editMediaItem(${index})">✏️</button>
                    <button type="button" class="btn-action" onclick="removeMediaItem(${index}, '${containerId}')">🗑️</button>
                </div>
            `;
            list.appendChild(div);
        });
    };

    window.removeMediaItem = (index, containerId) => {
        currentMultimediaItems.splice(index, 1);
        renderMediaList(containerId);
    };

    window.editMediaItem = (index) => {
        const item = currentMultimediaItems[index];
        editingMediaIndex = index;

        // Fill sub-modal
        document.getElementById('mediaDuration').value = item.duracion;
        document.getElementById('mediaSentence').value = item.oracion;
        document.getElementById('selectedMediaType').value = item.tipo;

        // Image selection
        renderImageGrid(item.imagen);

        // Type buttons
        document.querySelectorAll('.sel-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === item.tipo);
        });

        openModal(mediaItemModal);
    };

    document.getElementById('addClassMedia').addEventListener('click', () => openNewMediaItem());
    document.getElementById('addScreenMedia').addEventListener('click', () => openNewMediaItem());

    const openNewMediaItem = () => {
        editingMediaIndex = null;
        document.getElementById('mediaDuration').value = 10;
        document.getElementById('mediaSentence').value = '';
        document.getElementById('selectedMediaType').value = 'CD';
        renderImageGrid('1.png');
        document.querySelectorAll('.sel-btn').forEach(b => b.classList.toggle('active', b.dataset.value === 'CD'));
        openModal(mediaItemModal);
    };

    const renderImageGrid = (selected) => {
        const grid = document.getElementById('imageGrid');
        grid.innerHTML = '';
        SCREEN_IMAGES.forEach(img => {
            const div = document.createElement('div');
            div.className = `img-opt ${img === selected ? 'selected' : ''}`;
            div.dataset.img = img;
            div.innerHTML = `<img src="imgs/${img}">`;
            div.onclick = () => {
                grid.querySelectorAll('.img-opt').forEach(o => o.classList.remove('selected'));
                div.classList.add('selected');
            };
            grid.appendChild(div);
        });
    };

    document.querySelectorAll('.sel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sel-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('selectedMediaType').value = btn.dataset.value;
        });
    });

    document.querySelector('.close-sub-modal').addEventListener('click', () => closeModal(mediaItemModal));

    document.getElementById('saveMediaItem').addEventListener('click', () => {
        const imagen = document.querySelector('.img-opt.selected').dataset.img;
        const duracion = document.getElementById('mediaDuration').value;
        const tipo = document.getElementById('selectedMediaType').value;
        const oracion = document.getElementById('mediaSentence').value;

        const mediaData = { imagen, duracion, tipo, oracion };

        if (editingMediaIndex !== null) {
            currentMultimediaItems[editingMediaIndex] = mediaData;
        } else {
            currentMultimediaItems.push(mediaData);
        }

        // Determine which list to refresh
        const container = classModal.style.display === 'flex' ? 'classMediaList' : 'screenMediaList';
        renderMediaList(container);
        closeModal(mediaItemModal);
    });

    // --- Linked Classes Logic (for Screen) ---
    const populateClassSelect = () => {
        const select = document.getElementById('screenClassSelect');
        const clases = getClases();
        select.innerHTML = clases.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('') || '<option disabled>Sin clasificaciones</option>';
    };

    document.getElementById('addScreenClass').addEventListener('click', () => {
        const select = document.getElementById('screenClassSelect');
        const id = select.value;
        const name = select.options[select.selectedIndex].text;

        if (!id || currentLinkedClasses.some(c => c.id == id)) return;

        currentLinkedClasses.push({ id, nombre: name });
        renderLinkedClasses();
    });

    const renderLinkedClasses = () => {
        const list = document.getElementById('screenClassList');
        list.innerHTML = '';
        currentLinkedClasses.forEach((c, index) => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-text">
                    <div style="font-weight: 500;">${c.nombre}</div>
                </div>
                <button type="button" class="btn-action" onclick="removeLinkedClass(${index})">🗑️</button>
            `;
            list.appendChild(div);
        });
    };

    window.removeLinkedClass = (index) => {
        currentLinkedClasses.splice(index, 1);
        renderLinkedClasses();
    };

    // --- Form Submissions ---
    classForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('classId').value || Date.now();
        const nombre = document.getElementById('className').value;
        const descripcion = document.getElementById('classDesc').value;
        const periodo = document.getElementById('classPeriod').value;

        const data = { id, nombre, descripcion, periodo, multimedia: currentMultimediaItems };
        let clases = getClases();

        const idx = clases.findIndex(c => c.id == id);
        if (idx !== -1) clases[idx] = data;
        else clases.push(data);

        saveClases(clases);
        closeModal(classModal);
        renderList();
    });

    screenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('screenId').value || Date.now();
        const nombre = document.getElementById('screenName').value;
        const descripcion = document.getElementById('screenDesc').value;
        const ubicacion = document.getElementById('screenLocation').value;
        const aleatorio = document.querySelector('input[name="screenRandom"]:checked').value === 'true';

        const data = {
            id, nombre, descripcion, ubicacion, aleatorio,
            multimedia: currentMultimediaItems,
            clasificaciones: currentLinkedClasses
        };
        let pantallas = getPantallas();

        const idx = pantallas.findIndex(s => s.id == id);
        if (idx !== -1) pantallas[idx] = data;
        else pantallas.push(data);

        savePantallas(pantallas);
        closeModal(screenModal);
        renderList();
    });

    // --- Global Actions (Edit/Delete) ---
    window.openEditModal = (kind, id) => {
        if (kind === 'clasificacion') {
            const clases = getClases();
            const item = clases.find(c => c.id == id);
            if (!item) return;

            document.getElementById('classId').value = item.id;
            document.getElementById('className').value = item.nombre;
            document.getElementById('classDesc').value = item.descripcion;
            document.getElementById('classPeriod').value = item.periodo || "";
            currentMultimediaItems = item.multimedia || [];
            renderMediaList('classMediaList');
            document.getElementById('classModalTitle').textContent = 'Editar Clasificación';
            openModal(classModal);
        } else {
            const pantallas = getPantallas();
            const item = pantallas.find(s => s.id == id);
            if (!item) return;

            document.getElementById('screenId').value = item.id;
            document.getElementById('screenName').value = item.nombre;
            document.getElementById('screenDesc').value = item.descripcion;
            document.getElementById('screenLocation').value = item.ubicacion;
            const rad = document.querySelectorAll('input[name="screenRandom"]');
            rad.forEach(r => r.checked = r.value === item.aleatorio.toString());

            currentMultimediaItems = item.multimedia || [];
            currentLinkedClasses = item.clasificaciones || [];
            renderMediaList('screenMediaList');
            renderLinkedClasses();
            populateClassSelect();
            document.getElementById('screenModalTitle').textContent = 'Editar Pantalla';
            openModal(screenModal);
        }
    };

    window.deleteItem = (kind, id) => {
        if (!confirm('¿Seguro que desea eliminar este registro?')) return;

        if (kind === 'clasificacion') {
            let clases = getClases();
            clases = clases.filter(c => c.id != id);
            saveClases(clases);
        } else {
            let pantallas = getPantallas();
            pantallas = pantallas.filter(s => s.id != id);
            savePantallas(pantallas);
        }
        renderList();
    };

    // --- AI Integration ---
    const openAiBtn = document.getElementById('openAiBtn');
    openAiBtn.addEventListener('click', () => {
        aiChatWidget.style.display = aiChatWidget.style.display === 'flex' ? 'none' : 'flex';
    });

    window.addEventListener('message', (event) => {
        const { action, data } = event.data;
        if (!action) return;

        let message = "";
        switch (action) {
            case 'setTheme':
                if (data.theme === 'dark') document.body.classList.add('dark-mode');
                else document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', data.theme);
                message = `Tema cambiado a ${data.theme}.`;
                break;
            case 'logout':
                localStorage.removeItem('currentUser');
                window.location.href = '../index.html';
                return;
        }

        if (event.source) {
            event.source.postMessage({ type: 'ai-feedback', message }, event.origin);
        }
    });

    init();
});
