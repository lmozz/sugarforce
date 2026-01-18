document.addEventListener('DOMContentLoaded', () => {
    console.log("Módulo Pantallas Inicializado...");

    // --- Configuration ---
    const KEY_PANTALLAS = 'pantallas';
    const KEY_CLASES = 'claspantallas';

    // --- State ---
    let currentMultimediaItems = [];
    let currentLinkedClasses = [];
    let editingId = null;
    let currentFilterType = null;

    // --- UI Elements ---
    const classModal = document.getElementById('classModal');
    const screenModal = document.getElementById('screenModal');
    const mediaItemModal = document.getElementById('mediaItemModal');
    const classForm = document.getElementById('classForm');
    const screenForm = document.getElementById('screenForm');

    // --- Core Functions ---
    const getPantallas = () => JSON.parse(localStorage.getItem(KEY_PANTALLAS) || '[]');
    const savePantallas = (data) => localStorage.setItem(KEY_PANTALLAS, JSON.stringify(data));
    const getClases = () => JSON.parse(localStorage.getItem(KEY_CLASES) || '[]');
    const saveClases = (data) => localStorage.setItem(KEY_CLASES, JSON.stringify(data));

    // CRITICAL FIX: Use classList.add('open') for modals
    const openModal = (m) => {
        if (m) {
            console.log("Abriendo modal:", m.id);
            m.classList.add('open');
        } else {
            console.error("Error: Modal no encontrado");
        }
    };

    const closeModal = (m) => {
        if (m) {
            console.log("Cerrando modal:", m.id);
            m.classList.remove('open');
        }
        editingId = null;
    };

    // --- FAB Event Listeners ---
    const btnC = document.getElementById('addClassBtn');
    if (btnC) {
        btnC.onclick = (e) => {
            e.preventDefault();
            console.log("Clic en botón Clasificación (+C)");
            if (classForm) classForm.reset();
            document.getElementById('classId').value = '';
            currentMultimediaItems = [];
            renderMediaList('classMediaList');
            openModal(classModal);
        };
    }

    const btnP = document.getElementById('addScreenBtn');
    if (btnP) {
        btnP.onclick = (e) => {
            e.preventDefault();
            console.log("Clic en botón Pantalla (+P)");
            if (screenForm) screenForm.reset();
            document.getElementById('screenId').value = '';
            currentMultimediaItems = [];
            currentLinkedClasses = [];
            renderMediaList('screenMediaList');
            renderLinkedClasses();
            populateClassSelect();
            openModal(screenModal);
        };
    }

    const btnIA = document.getElementById('openAiBtn');
    if (btnIA) {
        btnIA.onclick = () => {
            const widget = document.getElementById('aiChatWidget');
            if (widget) widget.style.display = widget.style.display === 'flex' ? 'none' : 'flex';
        };
    }

    // --- Multimedia Details ---
    const openMediaDetail = (idx = null) => {
        const modal = document.getElementById('mediaItemModal');
        const grid = document.getElementById('imageGrid');
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const name = `${i}.png`;
            const div = document.createElement('div');
            div.className = `img-choice ${idx !== null && currentMultimediaItems[idx].imagen === name ? 'selected' : (i === 1 ? 'selected' : '')}`;
            div.innerHTML = `<img src="imgs/${name}">`;
            div.onclick = () => {
                grid.querySelectorAll('.img-choice').forEach(d => d.classList.remove('selected'));
                div.classList.add('selected');
                div.dataset.path = name;
            };
            div.dataset.path = name;
            grid.appendChild(div);
        }

        if (idx !== null) {
            const item = currentMultimediaItems[idx];
            document.getElementById('mediaDuration').value = item.duracion;
            document.getElementById('mediaSentence').value = item.oracion;
            document.getElementById('selectedMediaType').value = item.tipo;
            updateTypeBtns(item.tipo);
        } else {
            document.getElementById('mediaDuration').value = 10;
            document.getElementById('mediaSentence').value = '';
            document.getElementById('selectedMediaType').value = 'CD';
            updateTypeBtns('CD');
        }
        openModal(modal);
    };

    const updateTypeBtns = (val) => {
        document.querySelectorAll('.toggle-opt').forEach(b => b.classList.toggle('active', b.dataset.value === val));
    };

    document.querySelectorAll('.toggle-opt').forEach(b => {
        b.onclick = () => {
            updateTypeBtns(b.dataset.value);
            document.getElementById('selectedMediaType').value = b.dataset.value;
        };
    });

    const addClassMedia = document.getElementById('addClassMediaBtn');
    if (addClassMedia) addClassMedia.onclick = () => {
        window.editingMediaIndex = null;
        openMediaDetail();
    };

    const addScreenMedia = document.getElementById('addScreenMediaBtn');
    if (addScreenMedia) addScreenMedia.onclick = () => {
        window.editingMediaIndex = null;
        openMediaDetail();
    };

    const saveMediaBtn = document.getElementById('saveMediaItemBtn');
    if (saveMediaBtn) saveMediaBtn.onclick = () => {
        const selImg = document.querySelector('.img-choice.selected')?.dataset.path || "1.png";
        const dur = document.getElementById('mediaDuration').value;
        const tip = document.getElementById('selectedMediaType').value;
        const ora = document.getElementById('mediaSentence').value;

        const obj = { imagen: selImg, duracion: dur, tipo: tip, oracion: ora };

        if (window.editingMediaIndex !== null) {
            currentMultimediaItems[window.editingMediaIndex] = obj;
        } else {
            currentMultimediaItems.push(obj);
        }

        const currentModal = classModal.classList.contains('open') ? 'classMediaList' : 'screenMediaList';
        renderMediaList(currentModal);
        closeModal(mediaItemModal);
    };

    const renderMediaList = (containerId) => {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = currentMultimediaItems.map((item, i) => `
            <div class="item-row">
                <img src="imgs/${item.imagen}" style="width: 45px; height: 45px; border-radius: 8px;">
                <div style="flex: 1; font-size: 13px;">
                    <b>${item.tipo}</b> - ${item.duracion}s<br>
                    <small style="opacity: 0.7;">${item.oracion || 'Sin texto'}</small>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button type="button" class="edit-btn" onclick="editMediaItem(${i}, '${containerId}')">✏️</button>
                    <button type="button" class="delete-btn" onclick="deleteMediaItem(${i}, '${containerId}')">🗑️</button>
                </div>
            </div>
        `).join('');
    };

    window.editMediaItem = (i, container) => {
        window.editingMediaIndex = i;
        openMediaDetail(i);
    };

    window.deleteMediaItem = (i, container) => {
        currentMultimediaItems.splice(i, 1);
        renderMediaList(container);
    };

    // --- Tables and Data ---
    const renderTable = () => {
        const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
        let screens = getPantallas().map(p => ({ ...p, _kind: 'pantalla' }));
        let classes = getClases().map(c => ({ ...c, _kind: 'clasificacion' }));
        let data = [...screens, ...classes];

        if (currentFilterType) data = data.filter(d => d._kind === currentFilterType);
        if (search) data = data.filter(d => d.nombre.toLowerCase().includes(search));

        const tableBodyEl = document.getElementById('tableBody');
        const tableHeaderEl = document.getElementById('tableHeader');
        if (!tableBodyEl || !tableHeaderEl) return;

        tableHeaderEl.innerHTML = `<tr><th>Nombre</th><th>Tipo</th><th>Multimedia</th><th>Acciones</th></tr>`;
        tableBodyEl.innerHTML = data.map(d => `
            <tr class="row-${d._kind}">
                <td>${d.nombre}</td>
                <td><span class="badge ${d._kind}">${d._kind === 'pantalla' ? 'Pantalla' : 'Clase'}</span></td>
                <td>${(d.multimedia || []).length} items</td>
                <td>
                    <button class="edit-btn" onclick="openEditRecord('${d._kind}', '${d.id}')">Editar</button>
                    <button class="delete-btn" onclick="deleteRecord('${d._kind}', '${d.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay registros encontrados</td></tr>`;

        const noDataEl = document.getElementById('noDataState');
        if (noDataEl) noDataEl.style.display = data.length ? 'none' : 'flex';
    };

    window.openEditRecord = (kind, id) => {
        editingId = id;
        if (kind === 'clasificacion') {
            const item = getClases().find(c => c.id == id);
            if (!item) return;
            document.getElementById('classId').value = item.id;
            document.getElementById('className').value = item.nombre;
            document.getElementById('classDesc').value = item.descripcion;
            document.getElementById('classPeriod').value = item.periodo || '';
            currentMultimediaItems = [...(item.multimedia || [])];
            renderMediaList('classMediaList');
            openModal(classModal);
        } else {
            const item = getPantallas().find(p => p.id == id);
            if (!item) return;
            document.getElementById('screenId').value = item.id;
            document.getElementById('screenName').value = item.nombre;
            document.getElementById('screenDesc').value = item.descripcion;
            document.getElementById('screenLocation').value = item.ubicacion;
            const r = document.querySelector(`input[name="screenRandom"][value="${item.aleatorio}"]`);
            if (r) r.checked = true;
            currentMultimediaItems = [...(item.multimedia || [])];
            currentLinkedClasses = [...(item.clasificaciones || [])];
            renderMediaList('screenMediaList');
            renderLinkedClasses();
            populateClassSelect();
            openModal(screenModal);
        }
    };

    window.deleteRecord = (kind, id) => {
        if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
        if (kind === 'clasificacion') saveClases(getClases().filter(c => c.id != id));
        else savePantallas(getPantallas().filter(p => p.id != id));
        renderTable();
    };

    // --- Form Submits ---
    if (classForm) {
        classForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('classId').value || Date.now().toString();
            const obj = {
                id,
                nombre: document.getElementById('className').value,
                descripcion: document.getElementById('classDesc').value,
                periodo: document.getElementById('classPeriod').value,
                multimedia: currentMultimediaItems
            };
            const list = getClases();
            const idx = list.findIndex(l => l.id == id);
            if (idx !== -1) list[idx] = obj; else list.push(obj);
            saveClases(list);
            closeModal(classModal);
            renderTable();
        };
    }

    if (screenForm) {
        screenForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('screenId').value || Date.now().toString();
            const obj = {
                id,
                nombre: document.getElementById('screenName').value,
                descripcion: document.getElementById('screenDesc').value,
                ubicacion: document.getElementById('screenLocation').value,
                aleatorio: document.querySelector('input[name="screenRandom"]:checked').value === 'true',
                multimedia: currentMultimediaItems,
                clasificaciones: currentLinkedClasses
            };
            const list = getPantallas();
            const idx = list.findIndex(l => l.id == id);
            if (idx !== -1) list[idx] = obj; else list.push(obj);
            savePantallas(list);
            closeModal(screenModal);
            renderTable();
        };
    }

    // --- Helpers for Linking ---
    const populateClassSelect = () => {
        const select = document.getElementById('screenClassSelect');
        if (!select) return;
        select.innerHTML = getClases().map(c => `<option value="${c.id}">${c.nombre}</option>`).join('') || '<option disabled>Sin clasificaciones</option>';
    };

    const addLinkedClassBtn = document.getElementById('addScreenClassBtn');
    if (addLinkedClassBtn) {
        addLinkedClassBtn.onclick = () => {
            const select = document.getElementById('screenClassSelect');
            if (!select || !select.value || currentLinkedClasses.some(c => c.id == select.value)) return;
            currentLinkedClasses.push({ id: select.value, nombre: select.options[select.selectedIndex].text });
            renderLinkedClasses();
        };
    }

    const renderLinkedClasses = () => {
        const list = document.getElementById('screenClassList');
        if (!list) return;
        list.innerHTML = currentLinkedClasses.map((c, i) => `
            <div class="item-row">
                <span>${c.nombre}</span>
                <button type="button" class="delete-btn" onclick="unlinkClassFromScreen(${i})">🗑️</button>
            </div>
        `).join('');
    };
    window.unlinkClassFromScreen = (i) => { currentLinkedClasses.splice(i, 1); renderLinkedClasses(); };

    // --- Global Controls ---
    document.querySelectorAll('.close-modal, .close-sub-modal').forEach(b => {
        b.onclick = () => {
            closeModal(classModal);
            closeModal(screenModal);
            closeModal(mediaItemModal);
        };
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const wrapper = btn.closest('.modal-content');
            wrapper.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab);
            if (target) target.classList.add('active');
        };
    });

    const themeSwitch = document.getElementById('themeToggle');
    if (themeSwitch) {
        themeSwitch.onclick = () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        };
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            const wasActive = btn.classList.contains('active');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (!wasActive) {
                btn.classList.add('active');
                currentFilterType = btn.dataset.type;
            } else {
                currentFilterType = null;
            }
            renderTable();
        };
    });

    // Sidebar
    const openMenu = document.getElementById('openMenuBtn');
    const closeMenu = document.getElementById('closeMenuBtn');
    const sidebarEl = document.getElementById('sidebar');
    if (openMenu) openMenu.onclick = () => sidebarEl.classList.add('open');
    if (closeMenu) closeMenu.onclick = () => sidebarEl.classList.remove('open');

    // Init
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    const user = localStorage.getItem('currentUser');
    if (user) {
        document.getElementById('userInfo').textContent = `Usuario: ${user.startsWith('{') ? JSON.parse(user).name : user}`;
    }

    renderTable();
    flatpickr("#classPeriod", { mode: "range", locale: "es" });
});
