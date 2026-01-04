document.addEventListener('DOMContentLoaded', () => {
    // --- State & DOM Elements ---
    let isEditing = false;
    let currentUser = "Usuario";
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = storedUser.startsWith('{') ? JSON.parse(storedUser).name : storedUser;
        }
    } catch (e) { console.error("User parse error", e); }

    const tableBody = document.getElementById('procesosTableBody');
    const processModal = document.getElementById('processModal');
    const processForm = document.getElementById('processForm');
    const modalTitle = document.getElementById('modalTitle');
    const uuidDisplay = document.getElementById('uuidDisplay');
    const searchInput = document.getElementById('searchInput');

    // Tab Contents
    const respTableBody = document.getElementById('respTableBody');
    const contTableBody = document.getElementById('contTableBody');
    const notesTableBody = document.getElementById('notesTableBody');
    const alertsTableBody = document.getElementById('alertsTableBody');

    // Search Modal
    const searchModal = document.getElementById('searchModal');
    const searchModalResults = document.getElementById('searchModalResults');
    const searchModalInput = document.getElementById('searchModalInput');
    let currentSearchContext = null; // 'type', 'user'

    // --- Helpers ---
    const getData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // --- Sidebar & User Info ---
    const sidebar = document.getElementById('sidebar');
    document.getElementById('openMenuBtn')?.addEventListener('click', () => sidebar.classList.add('active'));
    document.getElementById('closeMenuBtn')?.addEventListener('click', () => sidebar.classList.remove('active'));
    document.getElementById('userInfo').textContent = "Usuario: " + currentUser;

    // --- Table Rendering ---
    const renderTable = (filter = '') => {
        const data = getData('procesos');
        tableBody.innerHTML = '';

        const filtered = data.filter(p =>
            p.entity.toLowerCase().includes(filter.toLowerCase()) ||
            p.type.toLowerCase().includes(filter.toLowerCase()) ||
            p.uuid.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5"><div class="no-data-container"><img src="../imgs/empty.png" class="no-data-img"><div class="no-data">Sin información</div></div></td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Entidad">${p.entity}</td>
                <td data-label="Tipo">${p.type}</td>
                <td data-label="Estatus"><span class="status-badge" style="padding: 4px 8px; background: rgba(0,0,0,0.05); border-radius: 12px;">${p.status || 'Vacío'}</span></td>
                <td data-label="Creado por">${p.createdBy}</td>
                <td class="actions-cell" data-label="Acción">
                    <button class="action-btn edit-btn" data-id="${p.id}">Ver/Editar</button>
                    ${p.createdBy === currentUser ? `<button class="action-btn delete-btn" data-id="${p.id}" style="color: #d93025;">Eliminar</button>` : ''}
                    <button class="action-btn notify-btn" data-id="${p.id}" style="color: #1a73e8;">Notificar</button>
                    <button class="action-btn track-btn" data-id="${p.id}" style="color: #4caf50;">Track</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Listeners for action buttons
        tableBody.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', () => openProcessModal(true, b.dataset.id)));
        tableBody.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', () => deleteProcess(b.dataset.id)));
        tableBody.querySelectorAll('.notify-btn').forEach(b => b.addEventListener('click', () => openNotifyModal(b.dataset.id)));
        tableBody.querySelectorAll('.track-btn').forEach(b => b.addEventListener('click', () => openTrackModal(b.dataset.id)));
    };

    // --- Modal Logic (Tabs) ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    const createDetailRow = (type, value, canEdit) => {
        const tr = document.createElement('tr');
        if (type === 'notes') {
            tr.innerHTML = `
                <td style="font-size: 11px; color: #666;">${value.date}<br>${value.user}</td>
                <td><textarea class="note-edit" ${value.user !== currentUser ? 'readonly' : ''} style="width: 100%; border: none; background: transparent; font-family: inherit; color: var(--text-color);">${value.text}</textarea></td>
                <td class="detail-row-actions">
                    ${value.user === currentUser ? '<button type="button" class="remove-detail" style="background: rgba(217, 48, 37, 0.1); border: 1px solid rgba(217, 48, 37, 0.3); color: #d93025; padding: 4px 10px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); transition: all 0.3s; font-size: 14px;">Eliminar</button>' : ''}
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td><input type="text" class="detail-val" readonly value="${value}" style="width: 100%; border: none; background: transparent; color: var(--text-color);"></td>
                <td class="detail-row-actions">${canEdit ? '<button type="button" class="remove-detail" style="background: rgba(217, 48, 37, 0.1); border: 1px solid rgba(217, 48, 37, 0.3); color: #d93025; padding: 4px 10px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); transition: all 0.3s; font-size: 14px;">Eliminar</button>' : ''}</td>
            `;
        }
        tr.querySelector('.remove-detail')?.addEventListener('click', () => tr.remove());
        return tr;
    };

    const openProcessModal = (editing, id) => {
        isEditing = editing;
        processForm.reset();
        respTableBody.innerHTML = '';
        contTableBody.innerHTML = '';
        notesTableBody.innerHTML = '';
        alertsTableBody.innerHTML = '';

        if (editing) {
            const p = getData('procesos').find(x => x.id === id);
            const isOwner = p.createdBy === currentUser;

            document.getElementById('processId').value = p.id;
            document.getElementById('procEntity').value = p.entity;
            document.getElementById('procType').value = p.type;
            document.getElementById('procDesc').value = p.description;
            uuidDisplay.textContent = p.uuid;

            // Permissions
            document.getElementById('procEntity').readOnly = !isOwner;
            document.getElementById('procType').style.pointerEvents = isOwner ? 'auto' : 'none';
            document.getElementById('procDesc').readOnly = !isOwner;
            document.getElementById('saveBtn').style.display = isOwner ? 'block' : 'none';
            document.getElementById('addRespBtn').style.display = isOwner ? 'block' : 'none';
            document.getElementById('addContBtn').style.display = isOwner ? 'block' : 'none';
            document.getElementById('addAlertBtn').style.display = isOwner ? 'block' : 'none';

            p.responsibles.forEach(r => respTableBody.appendChild(createDetailRow('resp', r, isOwner)));
            p.contacts.forEach(c => contTableBody.appendChild(createDetailRow('cont', c, isOwner)));
            p.notes.forEach(n => notesTableBody.appendChild(createDetailRow('notes', n, isOwner)));
            p.alerts.forEach(a => {
                const tr = createDetailRow('alert', `${a.days.join(', ')} @ ${a.times.join(', ')}`, isOwner);
                tr.dataset.alertData = JSON.stringify(a);
                alertsTableBody.appendChild(tr);
            });

            modalTitle.textContent = isOwner ? "Editar Proceso" : "Ver Proceso (Solo Lectura)";
        } else {
            document.getElementById('processId').value = '';
            uuidDisplay.textContent = "UUID se generará al guardar";
            modalTitle.textContent = "Nuevo Proceso";
            // Set fields to editable since it's new
            document.getElementById('procEntity').readOnly = false;
            document.getElementById('procType').style.pointerEvents = 'auto';
            document.getElementById('procDesc').readOnly = false;
            document.getElementById('saveBtn').style.display = 'block';
            document.getElementById('addRespBtn').style.display = 'block';
            document.getElementById('addContBtn').style.display = 'block';
            document.getElementById('addAlertBtn').style.display = 'block';
        }
        processModal.classList.add('open');
    };

    // --- Search Modal (Unified) ---
    const openSearch = (context, title) => {
        currentSearchContext = context;
        document.getElementById('searchModalTitle').textContent = title;
        searchModalInput.value = '';
        renderSearchResults('');
        searchModal.classList.add('open');
    };

    const renderSearchResults = (q) => {
        searchModalResults.innerHTML = '';
        let items = [];
        if (currentSearchContext === 'type') {
            items = getData('classification').map(c => ({ id: c.id, name: c.nombre, desc: c.descripcion }));
        } else if (currentSearchContext === 'user') {
            items = getData('login').map(u => ({ name: u.usuario || u.name, desc: 'Usuario de sistema' }));
            if (items.length === 0) items = [{ name: 'admin', desc: 'Predefinido' }]; // Fallback
        }

        const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));
        filtered.forEach(i => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.style.padding = '10px';
            div.style.cursor = 'pointer';
            div.innerHTML = `<strong>${i.name}</strong><br><small>${i.desc}</small>`;
            div.addEventListener('click', () => selectSearchItem(i));
            searchModalResults.appendChild(div);
        });
    };

    const selectSearchItem = (item) => {
        if (currentSearchContext === 'type') {
            document.getElementById('procType').value = item.name;
        } else if (currentSearchContext === 'user') {
            const existing = Array.from(respTableBody.querySelectorAll('.detail-val')).map(x => x.value);
            if (existing.includes(item.name)) return alert("Usuario ya es responsable");
            respTableBody.appendChild(createDetailRow('resp', item.name, true));
        }
        searchModal.classList.remove('open');
    };

    // --- Alarms UI ---
    let currentAlertTr = null;
    const openAlertConfig = (tr = null) => {
        currentAlertTr = tr;
        document.querySelectorAll('#dayCheckboxes input').forEach(i => i.checked = false);
        document.getElementById('alertHour').value = '';
        document.getElementById('alertMinute').value = '';
        document.getElementById('alertPeriod').value = 'AM';

        if (tr && tr.dataset.alertData) {
            const data = JSON.parse(tr.dataset.alertData);
            data.days.forEach(d => {
                const cb = Array.from(document.querySelectorAll('#dayCheckboxes input')).find(i => i.value === d);
                if (cb) cb.checked = true;
            });
            if (data.times && data.times.length > 0) {
                const timeStr = data.times[0]; // Assuming one time per alert row for simplicity in manual entry
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    document.getElementById('alertHour').value = match[1];
                    document.getElementById('alertMinute').value = match[2];
                    document.getElementById('alertPeriod').value = match[3].toUpperCase();
                }
            }
        }
        document.getElementById('alertConfigModal').classList.add('open');
    };

    document.getElementById('saveAlertConfigBtn').addEventListener('click', () => {
        const days = Array.from(document.querySelectorAll('#dayCheckboxes input:checked')).map(i => i.value);
        const hour = document.getElementById('alertHour').value;
        const minute = document.getElementById('alertMinute').value;
        const period = document.getElementById('alertPeriod').value;

        if (days.length === 0) return alert("Seleccione al menos un día");
        if (!hour || !minute) return alert("Ingrese la hora y los minutos");

        const formattedMinute = minute.toString().padStart(2, '0');
        const timeStr = `${hour}:${formattedMinute} ${period}`;
        const alertData = { days, times: [timeStr] };
        const label = `${days.join(', ')} @ ${timeStr}`;

        if (currentAlertTr) {
            currentAlertTr.querySelector('.detail-val').value = label;
            currentAlertTr.dataset.alertData = JSON.stringify(alertData);
        } else {
            const tr = createDetailRow('alert', label, true);
            tr.dataset.alertData = JSON.stringify(alertData);
            alertsTableBody.appendChild(tr);
        }
        document.getElementById('alertConfigModal').classList.remove('open');
    });

    // --- Notify & Track ---
    const openNotifyModal = (id) => {
        const p = getData('procesos').find(x => x.id === id);
        const classification = getData('classification').find(c => c.nombre === p.type);
        const select = document.getElementById('notifyStatus');
        select.innerHTML = '';

        if (classification && classification.steps) {
            classification.steps.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                select.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.textContent = "Sin pasos definidos";
            select.appendChild(opt);
        }

        document.getElementById('notifyProcId').value = id;
        document.getElementById('notifyDesc').value = '';
        document.getElementById('notifyModal').classList.add('open');
    };

    document.getElementById('notifyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('notifyProcId').value;
        const status = document.getElementById('notifyStatus').value;
        const desc = document.getElementById('notifyDesc').value;

        const data = getData('procesos');
        const idx = data.findIndex(x => x.id === id);

        const entry = {
            user: currentUser,
            date: new Date().toLocaleString(),
            status: status,
            desc: desc
        };

        data[idx].status = status;
        data[idx].tracking = data[idx].tracking || [];
        data[idx].tracking.push(entry);

        saveData('procesos', data);
        document.getElementById('notifyModal').classList.remove('open');
        renderTable(searchInput.value);
    });

    const openTrackModal = (id) => {
        const p = getData('procesos').find(x => x.id === id);
        const content = document.getElementById('trackHistoryContent');
        content.innerHTML = '';

        if (!p.tracking || p.tracking.length === 0) {
            content.innerHTML = '<div style="text-align: center; color: #666;">Sin historial</div>';
        } else {
            p.tracking.slice().reverse().forEach(t => {
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.borderLeft = '3px solid #1a73e8';
                div.style.marginBottom = '15px';
                div.style.background = 'rgba(0,0,0,0.02)';
                div.innerHTML = `
                    <div style="font-weight: 500; font-size: 13px;">${t.status}</div>
                    <div style="font-size: 11px; color: #666;">${t.date} por ${t.user}</div>
                    <div style="margin-top: 5px; font-size: 12px;">${t.desc}</div>
                `;
                content.appendChild(div);
            });
        }
        document.getElementById('trackModal').classList.add('open');
    };

    // --- Form Submission ---
    processForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('processId').value || Date.now().toString();
        const entity = document.getElementById('procEntity').value;
        const type = document.getElementById('procType').value;
        const description = document.getElementById('procDesc').value;

        const resps = Array.from(respTableBody.querySelectorAll('.detail-val')).map(x => x.value);
        const conts = Array.from(contTableBody.querySelectorAll('.detail-val')).map(x => {
            if (!x.value.includes('@')) return null;
            return x.value;
        }).filter(Boolean);

        const notes = Array.from(notesTableBody.querySelectorAll('tr')).map(tr => ({
            user: tr.cells[0].textContent.split('\n')[1] || currentUser,
            date: tr.cells[0].textContent.split('\n')[0] || new Date().toLocaleString(),
            text: tr.querySelector('textarea').value
        }));

        const alerts = Array.from(alertsTableBody.querySelectorAll('tr')).map(tr => JSON.parse(tr.dataset.alertData));

        const database = getData('procesos');
        let record = database.find(x => x.id === id);

        if (record) {
            if (record.createdBy !== currentUser) return alert("No tienes permisos para editar");
            Object.assign(record, { entity, type, description, responsibles: resps, contacts: conts, notes, alerts });
        } else {
            record = {
                id,
                entity,
                type,
                description,
                uuid: crypto.randomUUID(),
                createdBy: currentUser,
                createdAt: new Date().toLocaleString(),
                status: 'Vacío',
                responsibles: resps,
                contacts: conts,
                notes,
                alerts,
                tracking: []
            };
            database.push(record);
        }

        saveData('procesos', database);
        processModal.classList.remove('open');
        renderTable(searchInput.value);
    });

    // --- Buttons & Event Attachments ---
    document.getElementById('addProcesoBtn').addEventListener('click', () => openProcessModal(false));
    document.getElementById('cancelBtn').addEventListener('click', () => processModal.classList.remove('open'));
    document.getElementById('procType').addEventListener('click', () => openSearch('type', 'Tipo de Clasificación'));
    document.getElementById('addRespBtn').addEventListener('click', () => openSearch('user', 'Buscar Responsable'));
    document.getElementById('closeSearchBtn').addEventListener('click', () => searchModal.classList.remove('open'));
    document.getElementById('closeTrackBtn').addEventListener('click', () => document.getElementById('trackModal').classList.remove('open'));
    document.getElementById('cancelNotifyBtn').addEventListener('click', () => document.getElementById('notifyModal').classList.remove('open'));
    document.getElementById('addAlertBtn').addEventListener('click', () => openAlertConfig());
    document.getElementById('cancelAlertConfigBtn').addEventListener('click', () => document.getElementById('alertConfigModal').classList.remove('open'));

    document.getElementById('addContBtn').addEventListener('click', () => {
        const mail = prompt("Ingrese correo:");
        if (mail) {
            const existing = Array.from(contTableBody.querySelectorAll('.detail-val')).map(x => x.value);
            if (existing.includes(mail)) return alert("Correo ya duplicado");
            contTableBody.appendChild(createDetailRow('cont', mail, true));
        }
    });

    document.getElementById('addNoteBtn').addEventListener('click', () => {
        const note = { user: currentUser, date: new Date().toLocaleString(), text: '' };
        notesTableBody.prepend(createDetailRow('notes', note, true));
    });

    document.getElementById('copyUuidBtn').addEventListener('click', () => {
        const txt = uuidDisplay.textContent;
        if (txt.includes('-')) {
            navigator.clipboard.writeText(txt).then(() => alert("Copiado al portapapeles"));
        }
    });

    searchInput.addEventListener('keyup', (e) => renderTable(e.target.value));

    // AI Toggle
    document.getElementById('openAiBtn').addEventListener('click', () => {
        const ai = document.getElementById('aiChatWidget');
        ai.style.display = ai.style.display === 'flex' ? 'none' : 'flex';
    });

    const deleteProcess = (id) => {
        if (!confirm("¿Desea eliminar?")) return;
        const data = getData('procesos').filter(x => x.id !== id);
        saveData('procesos', data);
        renderTable(searchInput.value);
    };

    renderTable();
});
