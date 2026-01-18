document.addEventListener('DOMContentLoaded', () => {
    console.log("Módulo Pantallas: Iniciando Reparación Estructural V2...");

    // --- State ---
    const KEY_PANTALLAS = 'pantallas';
    const KEY_CLASES = 'claspantallas';
    let currentMultimediaItems = [];
    let currentLinkedClasses = [];
    let editingId = null;
    let currentFilterType = null;
    let editingMediaIndex = null;

    // --- UI Elements ---
    const classModal = document.getElementById('classModal');
    const screenModal = document.getElementById('screenModal');
    const mediaItemModal = document.getElementById('mediaItemModal');
    const classForm = document.getElementById('classForm');
    const screenForm = document.getElementById('screenForm');

    // --- Helpers ---
    const getPantallas = () => JSON.parse(localStorage.getItem(KEY_PANTALLAS) || '[]');
    const savePantallas = (data) => localStorage.setItem(KEY_PANTALLAS, JSON.stringify(data));
    const getClases = () => JSON.parse(localStorage.getItem(KEY_CLASES) || '[]');
    const saveClases = (data) => localStorage.setItem(KEY_CLASES, JSON.stringify(data));

    const openModal = (m) => { if (m) m.classList.add('open'); };
    const closeModal = (m) => { if (m) m.classList.remove('open'); editingId = null; };

    // --- Multimedia Detalle ---
    const renderMediaList = (containerId) => {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = currentMultimediaItems.map((item, i) => `
            <div class="item-row" style="display:flex; align-items:center; gap:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; margin-bottom:8px;">
                <img src="../imgs/${item.imagen}" style="width:45px; height:28px; object-fit:contain; background:rgba(0,0,0,0.2); border-radius:6px; padding:4px;">
                <div style="flex:1; font-size:13px; color: var(--text-primary);">
                    <b style="color: var(--accent-blue);">${item.tipo}</b> - ${item.duracion}s<br>
                    <small style="opacity:0.7;">${(item.oracion || '').slice(0, 30)}${(item.oracion || '').length > 30 ? '...' : ''}</small>
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="edit-btn" style="padding:4px 10px;" onclick="editMediaItem(${i})">✏️</button>
                    <button type="button" class="delete-btn" style="padding:4px 10px;" onclick="deleteMediaItem(${i}, '${containerId}')">🗑️</button>
                </div>
            </div>
        `).join('') || '<div style="text-align:center; padding:20px; opacity:0.5;">Sin recursos cargados</div>';
    };

    const openMediaModal = (idx = null) => {
        editingMediaIndex = idx;
        const grid = document.getElementById('imageGrid');
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const name = `${i}.png`;
            const div = document.createElement('div');
            div.className = `img-choice ${idx !== null && currentMultimediaItems[idx].imagen === name ? 'selected' : (idx === null && i === 1 ? 'selected' : '')}`;
            div.innerHTML = `<img src="../imgs/${name}">`;
            div.onclick = () => {
                grid.querySelectorAll('.img-choice').forEach(d => d.classList.remove('selected'));
                div.classList.add('selected');
            };
            div.dataset.path = name;
            grid.appendChild(div);
        }

        if (idx !== null) {
            const item = currentMultimediaItems[idx];
            document.getElementById('mediaDuration').value = item.duracion;
            document.getElementById('mediaSentence').value = item.oracion;
            document.getElementById('selectedMediaType').value = item.tipo;
            document.querySelectorAll('.toggle-opt').forEach(b => b.classList.toggle('active', b.dataset.value === item.tipo));
        } else {
            document.getElementById('mediaDuration').value = 10;
            document.getElementById('mediaSentence').value = '';
            document.getElementById('selectedMediaType').value = 'CD';
            document.querySelectorAll('.toggle-opt').forEach(b => b.classList.toggle('active', b.dataset.value === 'CD'));
        }
        openModal(mediaItemModal);
    };

    window.editMediaItem = (i) => openMediaModal(i);
    window.deleteMediaItem = (i, container) => {
        currentMultimediaItems.splice(i, 1);
        renderMediaList(container);
    };

    const saveMediaBtn = document.getElementById('saveMediaItemBtn');
    if (saveMediaBtn) saveMediaBtn.onclick = () => {
        const sel = document.querySelector('.img-choice.selected')?.dataset.path || "1.png";
        const obj = {
            imagen: sel,
            duracion: document.getElementById('mediaDuration').value,
            tipo: document.getElementById('selectedMediaType').value,
            oracion: document.getElementById('mediaSentence').value
        };
        if (editingMediaIndex !== null) currentMultimediaItems[editingMediaIndex] = obj;
        else currentMultimediaItems.push(obj);

        const activeModal = classModal.classList.contains('open') ? 'classMediaList' : 'screenMediaList';
        renderMediaList(activeModal);
        closeModal(mediaItemModal);
    };

    // --- Main Rendering ---
    const renderTable = () => {
        const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
        let screens = getPantallas().map(p => ({ ...p, _kind: 'pantalla' }));
        let classes = getClases().map(c => ({ ...c, _kind: 'clasificacion' }));
        let data = [...screens, ...classes];

        if (currentFilterType) data = data.filter(d => d._kind === currentFilterType);
        if (search) data = data.filter(d => (d.nombre || '').toLowerCase().includes(search));

        const body = document.getElementById('tableBody');
        const head = document.getElementById('tableHeader');
        if (!body || !head) return;

        head.innerHTML = `<tr><th>Nombre</th><th>Tipo</th><th>Multimedia</th><th>Acciones</th></tr>`;
        body.innerHTML = data.map(d => `
            <tr class="row-${d._kind}">
                <td style="font-weight:600; color: var(--accent-blue);">${d.nombre}</td>
                <td><span class="badge ${d._kind}">${d._kind.toUpperCase()}</span></td>
                <td><span style="background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:10px; font-size:12px;">${(d.multimedia || []).length} Recursos</span></td>
                <td>
                    <div class="action-btn-group">
                        <button class="edit-btn" onclick="openEdit('${d._kind}', '${d.id}')">Editar</button>
                        <button class="delete-btn" onclick="deleteRecord('${d._kind}', '${d.id}')">Borrar</button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center; padding:40px; opacity:0.5;">No hay registros</td></tr>';

        document.getElementById('noDataState').style.display = data.length ? 'none' : 'flex';
    };

    window.openEdit = (kind, id) => {
        editingId = id;
        if (kind === 'clasificacion') {
            const item = getClases().find(c => c.id == id);
            classForm.reset();
            document.getElementById('classId').value = item.id;
            document.getElementById('className').value = item.nombre;
            document.getElementById('classDesc').value = item.descripcion;
            document.getElementById('classPeriod').value = item.periodo || '';
            document.getElementById('classModalTitle').textContent = 'Editar Clasificación';
            currentMultimediaItems = [...(item.multimedia || [])];
            renderMediaList('classMediaList');
            // Reset tabs
            classModal.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            classModal.querySelector('.tab-btn[data-tab="class-general"]').classList.add('active');
            document.getElementById('class-general').classList.add('active');
            openModal(classModal);
        } else {
            const item = getPantallas().find(p => p.id == id);
            screenForm.reset();
            document.getElementById('screenId').value = item.id;
            document.getElementById('screenName').value = item.nombre;
            document.getElementById('screenDesc').value = item.descripcion;
            document.getElementById('screenLocation').value = item.ubicacion;
            document.getElementById('screenModalTitle').textContent = 'Editar Pantalla';

            // Handle Random Toggle
            const isRandom = item.aleatorio === true || item.aleatorio === 'true';
            document.getElementById('screenRandom').value = isRandom;
            document.querySelectorAll('.toggle-opt-random').forEach(b => {
                b.classList.toggle('active', b.dataset.value === String(isRandom));
            });

            currentMultimediaItems = [...(item.multimedia || [])];
            currentLinkedClasses = [...(item.clasificaciones || [])];
            renderMediaList('screenMediaList');
            renderLinkedClasses();
            populateClassSelect();
            // Reset tabs
            screenModal.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            screenModal.querySelector('.tab-btn[data-tab="screen-general"]').classList.add('active');
            document.getElementById('screen-general').classList.add('active');
            openModal(screenModal);
        }
    };

    window.deleteRecord = (kind, id) => {
        if (!confirm("¿Desea eliminar el registro permanentemente?")) return;
        if (kind === 'clasificacion') saveClases(getClases().filter(c => c.id != id));
        else savePantallas(getPantallas().filter(p => p.id != id));
        renderTable();
    };

    // --- FAB Actions ---
    document.getElementById('addClassBtn').onclick = () => {
        classForm.reset();
        document.getElementById('classId').value = '';
        document.getElementById('classModalTitle').textContent = 'Nueva Clasificación';
        currentMultimediaItems = [];
        renderMediaList('classMediaList');
        openModal(classModal);
    };

    document.getElementById('addScreenBtn').onclick = () => {
        screenForm.reset();
        document.getElementById('screenId').value = '';
        document.getElementById('screenModalTitle').textContent = 'Nueva Pantalla';
        currentMultimediaItems = [];
        currentLinkedClasses = [];
        // Reset Random Toggle
        document.getElementById('screenRandom').value = 'false';
        document.querySelectorAll('.toggle-opt-random').forEach(b => b.classList.toggle('active', b.dataset.value === 'false'));

        renderMediaList('screenMediaList');
        renderLinkedClasses();
        populateClassSelect();
        openModal(screenModal);
    };

    // --- Tab Switching ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const wrap = btn.closest('.modal-content');
            wrap.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            wrap.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });

    // --- Toggle Buttons Logic ---
    // For Media Type (CD/SD)
    document.querySelectorAll('.toggle-opt').forEach(b => {
        b.onclick = () => {
            const wrap = b.closest('.btn-toggle-group');
            wrap.querySelectorAll('.toggle-opt').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById('selectedMediaType').value = b.dataset.value;
        };
    });

    // For Random Playback (Sí/No)
    document.querySelectorAll('.toggle-opt-random').forEach(b => {
        b.onclick = () => {
            const wrap = b.closest('.btn-toggle-group');
            wrap.querySelectorAll('.toggle-opt-random').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById('screenRandom').value = b.dataset.value;
        };
    });

    document.getElementById('addClassMediaBtn').onclick = () => openMediaModal();
    document.getElementById('addScreenMediaBtn').onclick = () => openMediaModal();

    // --- Form Submits ---
    classForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('classId').value || Date.now().toString();
        const list = getClases();
        const obj = {
            id,
            nombre: document.getElementById('className').value,
            descripcion: document.getElementById('classDesc').value,
            periodo: document.getElementById('classPeriod').value,
            multimedia: currentMultimediaItems
        };
        const idx = list.findIndex(l => l.id == id);
        if (idx !== -1) list[idx] = obj; else list.push(obj);
        saveClases(list); closeModal(classModal); renderTable();
    };

    screenForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('screenId').value || Date.now().toString();
        const list = getPantallas();
        const obj = {
            id,
            nombre: document.getElementById('screenName').value,
            descripcion: document.getElementById('screenDesc').value,
            ubicacion: document.getElementById('screenLocation').value,
            aleatorio: document.getElementById('screenRandom').value === 'true',
            multimedia: currentMultimediaItems,
            clasificaciones: currentLinkedClasses
        };
        const idx = list.findIndex(l => l.id == id);
        if (idx !== -1) list[idx] = obj; else list.push(obj);
        savePantallas(list); closeModal(screenModal); renderTable();
    };

    // --- Linking Logic ---
    const populateClassSelect = () => {
        const s = document.getElementById('screenClassSelect');
        if (s) {
            s.innerHTML = getClases().map(c => `<option value="${c.id}">${c.nombre}</option>`).join('') || '<option disabled>Sin clasificaciones</option>';
        }
    };

    document.getElementById('addScreenClassBtn').onclick = () => {
        const s = document.getElementById('screenClassSelect');
        if (s && s.value && !currentLinkedClasses.some(c => c.id == s.value)) {
            currentLinkedClasses.push({ id: s.value, nombre: s.options[s.selectedIndex].text });
            renderLinkedClasses();
        }
    };

    const renderLinkedClasses = () => {
        const l = document.getElementById('screenClassList');
        if (l) {
            l.innerHTML = currentLinkedClasses.map((c, i) => `
                <div class="item-row" style="display:flex; align-items:center; gap:12px; padding:10px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:8px;">
                    <span style="flex:1; font-weight:500;">${c.nombre}</span>
                    <button type="button" class="delete-btn" style="padding:4px 10px;" onclick="unlinkC(${i})">🗑️</button>
                </div>
            `).join('');
        }
    };
    window.unlinkC = (i) => { currentLinkedClasses.splice(i, 1); renderLinkedClasses(); };

    // --- Theme & Sidebar ---
    document.getElementById('themeToggle').onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };

    document.getElementById('openMenuBtn').onclick = () => document.getElementById('sidebar').classList.add('open');
    document.getElementById('closeMenuBtn').onclick = () => document.getElementById('sidebar').classList.remove('open');
    document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('currentUser'); window.location.href = '../index.html'; };

    // --- Global Controls ---
    document.querySelectorAll('.close-modal, .close-sub-modal, .btn-cancel').forEach(b => {
        b.onclick = () => {
            closeModal(classModal); closeModal(screenModal); closeModal(mediaItemModal);
        };
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            const was = btn.classList.contains('active');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (!was) { btn.classList.add('active'); currentFilterType = btn.dataset.type; }
            else currentFilterType = null;
            renderTable();
        };
    });

    // --- Init ---
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    const u = localStorage.getItem('currentUser');
    if (u) {
        const name = u.startsWith('{') ? JSON.parse(u).name : u;
        document.getElementById('userInfo').textContent = `Usuario: ${name}`;
    }

    renderTable();
    if (document.getElementById('searchInput')) document.getElementById('searchInput').oninput = renderTable;
    if (typeof flatpickr !== 'undefined') flatpickr("#classPeriod", { mode: "range", locale: "es", dateFormat: "Y-m-d" });
});
