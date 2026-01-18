document.addEventListener('DOMContentLoaded', () => {
    console.log("Módulo Pantallas: Iniciando Reparación Estructural V2...");

    // --- ACTIVACIÓN INMEDIATA ASISTENTE IA ---
    const aiBtn = document.getElementById('openAiBtn');
    const aiWidget = document.getElementById('aiChatWidget');
    if (aiBtn && aiWidget) {
        console.log("IA Elements initialized.");
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = aiWidget.classList.contains('open');
            if (isOpen) {
                aiWidget.classList.remove('open');
                aiWidget.style.display = 'none';
            } else {
                aiWidget.classList.add('open');
                aiWidget.style.display = 'flex';
            }
            console.log("IA Toggle - Open:", !isOpen);
        });
    } else {
        console.error("Critical: IA elements NOT found!", { aiBtn, aiWidget });
    }

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

        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(3, 1fr)';
        list.style.gap = '12px';
        list.style.marginTop = '15px';

        list.innerHTML = currentMultimediaItems.map((item, i) => `
            <div class="media-card" style="background:rgba(255,255,255,0.05); border-radius:14px; padding:12px; border:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center;">
                <img src="imgs/${item.imagen}" style="width:100%; aspect-ratio:16/9; object-fit:contain; background:rgba(0,0,0,0.2); border-radius:8px;">
                <div style="font-size:12px; color: var(--text-primary); line-height:1.4;">
                    <b style="color: var(--accent-blue);">${item.tipo}</b><br>${item.duracion} segundos
                </div>
                <div style="display:flex; gap:6px; width:100%;">
                    <button type="button" class="edit-btn" style="flex:1; padding:6px !important;" onclick="editMediaItem(${i})">✏️</button>
                    <button type="button" class="delete-btn" style="flex:1; padding:6px !important;" onclick="deleteMediaItem(${i}, '${containerId}')">🗑️</button>
                </div>
            </div>
        `).join('') || '<div style="grid-column:1/-1; text-align:center; padding:30px; opacity:0.5;">Sin recursos cargados</div>';
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
            div.innerHTML = `<img src="imgs/${name}">`;
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
                <td data-label="Nombre" style="font-weight:600; color: var(--accent-blue);">${d.nombre}</td>
                <td data-label="Tipo"><span class="badge ${d._kind}">${d._kind.toUpperCase()}</span></td>
                <td data-label="Multimedia"><span style="background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:10px; font-size:12px;">${(d.multimedia || []).length} Recursos</span></td>
                <td data-label="Acciones">
                    <div class="action-btn-group">
                        ${d._kind === 'pantalla' ? `<button class="primary-btn" style="background:#34c759; color:#fff; padding:6px 12px; border:none; border-radius:8px; cursor:pointer;" onclick="startPresentation('${d.id}')">Presentación</button>` : ''}
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

            // Handle Type Toggle
            const tipo = item.tipo || 'S';
            document.getElementById('classType').value = tipo;
            document.querySelectorAll('.toggle-opt-type').forEach(b => {
                b.classList.toggle('active', b.dataset.value === tipo);
            });
            updateClassTypeUI(tipo);

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

            // Handle Comments Toggle
            const hasComments = item.comentarios || 'N';
            document.getElementById('screenComments').value = hasComments;
            document.querySelectorAll('.toggle-opt-comments').forEach(b => {
                b.classList.toggle('active', b.dataset.value === hasComments);
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

        // Reset Type to 'S'
        document.getElementById('classType').value = 'S';
        document.querySelectorAll('.toggle-opt-type').forEach(b => b.classList.toggle('active', b.dataset.value === 'S'));
        updateClassTypeUI('S');

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

        // Reset Comments Toggle
        document.getElementById('screenComments').value = 'N';
        document.querySelectorAll('.toggle-opt-comments').forEach(b => b.classList.toggle('active', b.dataset.value === 'N'));

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

    // For Comments Enabled (S/N)
    document.querySelectorAll('.toggle-opt-comments').forEach(b => {
        b.onclick = () => {
            const wrap = b.closest('.btn-toggle-group');
            wrap.querySelectorAll('.toggle-opt-comments').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById('screenComments').value = b.dataset.value;
        };
    });

    // For Classification Type (S/D)
    const updateClassTypeUI = (tipo) => {
        const periodCont = document.getElementById('periodContainer');
        const periodInp = document.getElementById('classPeriod');
        if (tipo === 'D') {
            periodCont.style.display = 'block';
            periodInp.required = true;
        } else {
            periodCont.style.display = 'none';
            periodInp.required = false;
            periodInp.value = ''; // Clear if switching back to S
        }
    };

    document.querySelectorAll('.toggle-opt-type').forEach(b => {
        b.onclick = () => {
            const wrap = b.closest('.btn-toggle-group');
            wrap.querySelectorAll('.toggle-opt-type').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            const val = b.dataset.value;
            document.getElementById('classType').value = val;
            updateClassTypeUI(val);
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
            tipo: document.getElementById('classType').value,
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
            comentarios: document.getElementById('screenComments').value,
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

    document.getElementById('openMenuBtn').onclick = () => document.getElementById('sidebar').classList.add('active');
    document.getElementById('closeMenuBtn').onclick = () => document.getElementById('sidebar').classList.remove('active');
    document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('currentUser'); window.location.href = '../index.html'; };

    // --- Global Controls ---
    document.querySelectorAll('.close-modal').forEach(b => {
        b.onclick = () => { closeModal(classModal); closeModal(screenModal); };
    });

    document.querySelectorAll('.close-sub-modal').forEach(b => {
        b.onclick = () => { closeModal(mediaItemModal); };
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

    // --- MODO PRESENTACIÓN ---
    let presentationTimer = null;
    let messageTimer = null;
    let presentationMedia = [];
    let currentSlideIdx = 0;

    const positiveMessages = [
        { text: "¡Tu sonrisa ilumina el día!", user: "Ana García", date: "2026-01-17 10:30" },
        { text: "La perseverancia es la clave del éxito.", user: "Carlos Ruiz", date: "2026-01-17 11:15" },
        { text: "Cada pequeño paso cuenta para tu meta.", user: "Elena M.", date: "2026-01-17 12:05" },
        { text: "Hoy es un gran día para aprender algo nuevo.", user: "Roberto S.", date: "2026-01-17 13:45" },
        { text: "Eres capaz de lograr cosas increíbles si te lo propones.", user: "Lucía P.", date: "2026-01-17 14:20" },
        { text: "La amabilidad es un lenguaje que todos entienden.", user: "Marcos T.", date: "2026-01-17 15:55" },
        { text: "Tu esfuerzo de hoy dará sus frutos mañana.", user: "Sofia V.", date: "2026-01-17 16:10" },
        { text: "Cree en ti mismo y todo será posible.", user: "Juan D.", date: "2026-01-17 17:30" },
        { text: "El éxito no es el final, sino el camino que recorres.", user: "Carmen L.", date: "2026-01-17 18:00" }
    ];
    let currentMsgIdx = 0;
    let typeWriterInterval = null;

    const startMessageRotation = () => {
        rotateMessage();
        messageTimer = setInterval(rotateMessage, 20000);
    };

    const typeWriter = (element, text, i = 0) => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            typeWriterInterval = setTimeout(() => typeWriter(element, text, i + 1), 50);
        }
    };

    const rotateMessage = () => {
        const p = document.getElementById('positiveMessage');
        if (!p) return;

        clearTimeout(typeWriterInterval);
        const obj = positiveMessages[currentMsgIdx];

        // Estructura del mensaje: Texto + Info Usuario
        p.innerHTML = ''; // Limpiar para el efecto typewriter
        p.className = obj.text.length < 40 ? 'msg-large' : 'msg-small';

        // Iniciar efecto en el texto principal
        typeWriter(p, obj.text);

        // Añadir meta información (Usuario y Fecha) después de un leve delay
        setTimeout(() => {
            const meta = document.createElement('div');
            meta.style.marginTop = '15px';
            meta.style.fontSize = '12px';
            meta.style.opacity = '0.7';
            meta.style.fontStyle = 'italic';
            meta.innerHTML = `<span style="color:var(--accent-blue); font-weight:700;">@${obj.user}</span> • ${obj.date}`;
            p.appendChild(meta);
        }, (obj.text.length * 50) + 100);

        currentMsgIdx = (currentMsgIdx + 1) % positiveMessages.length;
    };

    window.startPresentation = (id) => {
        const screen = getPantallas().find(p => p.id == id);
        if (!screen) return;

        // Recolectar medios
        let media = [...(screen.multimedia || [])];
        const linked = screen.clasificaciones || [];
        const allClases = getClases();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        linked.forEach(link => {
            const cls = allClases.find(c => c.id == link.id);
            if (!cls) return;

            let include = false;
            if (cls.tipo === 'S') {
                include = true;
            } else if (cls.tipo === 'D' && cls.periodo) {
                const range = cls.periodo.split(' to ');
                if (range.length === 2) {
                    const start = new Date(range[0]);
                    const end = new Date(range[1]);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    if (today >= start && today <= end) include = true;
                } else {
                    const onlyDate = new Date(cls.periodo);
                    onlyDate.setHours(0, 0, 0, 0);
                    if (today.getTime() === onlyDate.getTime()) include = true;
                }
            }
            if (include) media = media.concat(cls.multimedia || []);
        });

        if (media.length === 0) {
            alert("¡Pantalla sin medios para mostrar!");
            return;
        }

        // Aleatorio
        if (screen.aleatorio === true || screen.aleatorio === 'true') {
            media.sort(() => Math.random() - 0.5);
        }

        presentationMedia = media;
        currentSlideIdx = 0;
        const overlay = document.getElementById('presentationOverlay');
        overlay.classList.add('active');

        // Lógica de Comentarios (S/N)
        if (screen.comentarios === 'S') {
            overlay.classList.add('with-comments');
            startMessageRotation();
        } else {
            overlay.classList.remove('with-comments');
        }

        renderSlide();
    };

    const renderSlide = () => {
        if (!presentationMedia.length) return;
        const item = presentationMedia[currentSlideIdx];
        const overlay = document.getElementById('presentationOverlay');
        const img = document.getElementById('slideImg');
        const bg = document.getElementById('slideBg');
        const txt = document.getElementById('slideText');

        // Reset
        img.classList.remove('slide-in-right', 'dynamic-zoom');
        img.style.opacity = '0';

        const path = `imgs/${item.imagen}`;
        img.src = path;
        bg.style.backgroundImage = `url('${path}')`;
        txt.textContent = item.oracion || '';

        // Reiniciar animación de marquesina
        txt.style.animation = 'none';
        void txt.offsetWidth; // Force reflow
        txt.style.animation = ''; // Restoration to CSS default

        if (item.tipo === 'CD') img.classList.add('dynamic-zoom');

        setTimeout(() => {
            img.style.opacity = '1';
            img.classList.add('slide-in-right');
        }, 50);

        const dur = (parseInt(item.duracion) || 10) * 1000;
        presentationTimer = setTimeout(() => {
            currentSlideIdx = (currentSlideIdx + 1) % presentationMedia.length;
            renderSlide();
        }, dur);
    };

    window.stopPresentation = () => {
        clearTimeout(presentationTimer);
        clearInterval(messageTimer);
        document.getElementById('presentationOverlay').classList.remove('active');
        document.getElementById('presentationOverlay').classList.remove('with-comments');
    };

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

    console.log("Módulo Pantallas: Script cargado completamente.");
});
