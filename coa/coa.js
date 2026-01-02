document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Logic ---
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

    // --- State & DOM Elements ---
    const coaTableBody = document.getElementById('coaTableBody');
    const searchInput = document.getElementById('searchInput');
    const addCoaBtn = document.getElementById('addCoaBtn');
    const coaModal = document.getElementById('coaModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const coaForm = document.getElementById('coaForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Request Modal Elements
    const requestCoaModal = document.getElementById('requestCoaModal');
    const requestCoaForm = document.getElementById('requestCoaForm');
    const reqClientSelect = document.getElementById('reqClientSelect');
    const reqDateInput = document.getElementById('reqDate');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');

    // History Modal Elements
    const historyModal = document.getElementById('historyModal');
    const historyContent = document.getElementById('historyContent');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');

    // Filtering State
    let selectedStatuses = new Set();
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Master Fields
    const coaIdInput = document.getElementById('coaId');
    const clientSelect = document.getElementById('coaClientSelect');
    const clientAddress = document.getElementById('coaClientAddress');
    const productSelect = document.getElementById('coaProductSelect');
    const presentationInput = document.getElementById('coaPresentation');
    const descriptionInput = document.getElementById('coaDescription');
    const cellarSelect = document.getElementById('coaCellarSelect');
    const quantityInput = document.getElementById('coaQuantity');
    const tarimasInput = document.getElementById('coaTarimas');
    const marchamoInput = document.getElementById('coaMarchamo');

    // Generic Search Modal Elements
    const coaSearchModal = document.getElementById('coaSearchModal');
    const coaSearchModalTitle = document.getElementById('coaSearchModalTitle');
    const coaSearchModalInput = document.getElementById('coaSearchModalInput');
    const coaSearchModalResults = document.getElementById('coaSearchModalResults');
    const closeCoaSearchBtn = document.getElementById('closeCoaSearchBtn');

    let currentSearchContext = null;
    let currentTargetRow = null;

    // Date Fields
    const dates = {
        analysis: document.getElementById('dateAnalysis'),
        emission: document.getElementById('dateEmission'),
        production: document.getElementById('dateProduction'),
        expiry: document.getElementById('dateExpiry'),
        lot: document.getElementById('lotNumber')
    };

    // Detail Elements
    const detailTableBody = document.getElementById('detailTableBody');
    const addDetailRowBtn = document.getElementById('addDetailRowBtn');

    let isEditing = false;

    // --- Flatpickr Initialization ---
    const fpConfig = {
        locale: 'es',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: true,
        monthSelectorType: 'static',
        animate: true
    };

    const fpAnalysis = flatpickr(dates.analysis, fpConfig);
    const fpEmission = flatpickr(dates.emission, fpConfig);
    const fpProduction = flatpickr(dates.production, fpConfig);
    const fpExpiry = flatpickr(dates.expiry, fpConfig);

    const fpRequestDate = flatpickr(reqDateInput, fpConfig);

    // --- User Info ---
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) userInfo.textContent = `Usuario: ${currentUser}`;

    // --- Helper Functions (LocalStorage) ---
    const getData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const trackStatus = (coa, newStatus) => {
        if (!coa.track) coa.track = [];
        coa.track.push({
            status: newStatus,
            user: currentUser || 'Anonimo',
            time: new Date().toLocaleString()
        });
        coa.status = newStatus;
    };

    // --- Generic Search Modal Logic ---
    const openSearchModal = (context, targetRow = null) => {
        currentSearchContext = context;
        currentTargetRow = targetRow;

        coaSearchModalInput.value = '';
        coaSearchModal.classList.add('open');

        let title = 'Buscar...';
        switch (context) {
            case 'customer': title = 'Seleccionar Cliente'; break;
            case 'product': title = 'Seleccionar Producto'; break;
            case 'cellar': title = 'Seleccionar Bodega'; break;
            case 'coa': title = 'Seleccionar Parámetro'; break;
        }
        coaSearchModalTitle.textContent = title;

        renderSearchResults('');
        setTimeout(() => coaSearchModalInput.focus(), 100);
    };

    const renderSearchResults = (filter = '') => {
        const data = getData(currentSearchContext);
        coaSearchModalResults.innerHTML = '';

        const term = filter.toLowerCase();
        const filtered = data.filter(item => {
            if (currentSearchContext === 'coa') {
                return (item.nombre || '').toLowerCase().includes(term) || (item.metodo || '').toLowerCase().includes(term);
            }
            return (item.nombre || '').toLowerCase().includes(term) || (item.descripcion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            coaSearchModalResults.innerHTML = '<div style="padding: 10px; text-align: center; color: #666;">No se encontraron resultados</div>';
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.style.padding = '12px';
            div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            div.style.cursor = 'pointer';

            let html = `<div style="font-weight: 500; color: var(--text-color);">${item.nombre}</div>`;
            if (currentSearchContext === 'coa') {
                html += `<div style="font-size: 12px; color: #666;">Método: ${item.metodo || 'S/M'}</div>`;
            } else if (item.descripcion) {
                html += `<div style="font-size: 12px; color: #666;">${item.descripcion}</div>`;
            } else if (item.municipio) {
                html += `<div style="font-size: 12px; color: #666;">${item.municipio}, ${item.departamento}</div>`;
            }

            div.innerHTML = html;

            div.addEventListener('click', () => {
                selectItem(item);
                coaSearchModal.classList.remove('open');
            });

            coaSearchModalResults.appendChild(div);
        });
    };

    const selectItem = (item) => {
        switch (currentSearchContext) {
            case 'customer':
                if (requestCoaModal.classList.contains('open')) {
                    reqClientSelect.value = item.nombre;
                } else {
                    clientSelect.value = item.nombre;
                    clientAddress.value = `${item.departamento}, ${item.municipio}, ${item.direccion}`;
                }
                break;
            case 'product':
                productSelect.value = item.nombre;
                presentationInput.value = item.presentacion || 'N/A';
                descriptionInput.value = item.descripcion || 'N/A';
                break;
            case 'cellar':
                cellarSelect.value = item.nombre;
                break;
            case 'coa':
                if (currentTargetRow) {
                    const input = currentTargetRow.querySelector('.param-input');
                    input.value = item.nombre;
                    // You could also store the method or full info if needed
                }
                break;
        }
    };

    // --- Master Fields Event Listeners ---
    clientSelect.addEventListener('click', () => openSearchModal('customer'));
    productSelect.addEventListener('click', () => openSearchModal('product'));
    cellarSelect.addEventListener('click', () => openSearchModal('cellar'));

    coaSearchModalInput.addEventListener('keyup', (e) => renderSearchResults(e.target.value));
    closeCoaSearchBtn.addEventListener('click', () => coaSearchModal.classList.remove('open'));

    // --- Detail Row Logic ---
    const createDetailRow = (selectedParam = '', resultValue = '') => {
        const row = document.createElement('tr');

        // Parameter Input (Readonly + Click to Search)
        const paramTd = document.createElement('td');
        const paramInput = document.createElement('input');
        paramInput.type = 'text';
        paramInput.className = 'form-control param-input';
        paramInput.required = true;
        paramInput.readOnly = true;
        paramInput.placeholder = 'Seleccionar Parámetro...';
        paramInput.style.cursor = 'pointer';
        paramInput.value = selectedParam;

        paramInput.addEventListener('click', () => openSearchModal('coa', row));

        paramTd.appendChild(paramInput);

        // Result Input
        const resultTd = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control result-input';
        input.placeholder = 'Valor...';
        input.required = true;
        input.value = resultValue;
        resultTd.appendChild(input);

        // Delete Action
        const actionTd = document.createElement('td');
        actionTd.innerHTML = '<span class="remove-row-btn">&times;</span>';
        actionTd.addEventListener('click', () => row.remove());

        row.appendChild(paramTd);
        row.appendChild(resultTd);
        row.appendChild(actionTd);
        return row;
    };

    addDetailRowBtn.addEventListener('click', () => {
        detailTableBody.appendChild(createDetailRow());
    });

    // --- Table Rendering ---
    const renderTable = (filterText = '') => {
        const coas = getData('coas');
        coaTableBody.innerHTML = '';

        const filtered = coas.filter(c => {
            const term = filterText.toLowerCase();

            // 1. Filter by Status (Intersection)
            // If no statuses are selected, allow all. Otherwise, must match one in selectedStatuses.
            const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(c.status);

            if (!matchesStatus) return false;

            // 2. Filter by Search Text (on top of status)
            return (c.cliente || '').toLowerCase().includes(term) ||
                (c.producto || '').toLowerCase().includes(term) ||
                (c.lote || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            coaTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="no-data-container">
                            <img src="../imgs/empty.png" class="no-data-img" alt="Sin datos">
                            <div class="no-data">Sin información disponible</div>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        filtered.forEach(coa => {
            const row = document.createElement('tr');
            const isNuevo = coa.status === 'nuevo';
            const isIniciado = coa.status === 'iniciado';

            // Add status-based color class
            row.classList.add(`row-${coa.status}`);

            row.innerHTML = `
                <td data-label="Fecha">${isNuevo ? (coa.fechaRequerimiento || '') : (coa.fechaRevision || '')}</td>
                <td data-label="Cliente">${coa.cliente || ''}</td>
                <td data-label="Producto">${isNuevo ? '<em>Pendiente</em>' : (coa.producto || '')}</td>
                <td data-label="Lote">${isNuevo ? '<em>Pendiente</em>' : (coa.lote || '')}</td>
                <td class="actions-cell ${isIniciado ? 'actions-grid' : ''}" data-label="Acción">
                    ${isNuevo
                    ? `<button class="action-btn start-btn" data-id="${coa.id}">Iniciar</button>`
                    : (coa.status === 'finalizado'
                        ? `
                                <button class="action-btn print-btn" data-id="${coa.id}" style="color: #d93025 !important; font-weight: 600;">Imprimir</button>
                                <button class="action-btn correction-btn" data-id="${coa.id}">Corrección</button>
                              `
                        : `
                                <button class="action-btn edit-btn" data-id="${coa.id}">Editar</button>
                                <button class="action-btn finish-btn" data-id="${coa.id}">Finalizar</button>
                              `
                    )
                }
                    ${coa.status !== 'finalizado' ? `<button class="action-btn delete-btn" data-id="${coa.id}">Eliminar</button>` : ''}
                    <button class="action-btn history-btn" data-id="${coa.id}">Track</button>
                </td>
            `;
            coaTableBody.appendChild(row);
        });
    };

    // --- Modal Actions ---
    const openModal = (editing = false, coa = null) => {
        const clients = getData('customer');
        const products = getData('product');
        const cellars = getData('cellar');
        const coaParams = getData('coa');

        if (clients.length === 0 || products.length === 0 || cellars.length === 0 || coaParams.length === 0) {
            alert('Faltan datos maestros (Clientes, Productos, Bodegas o Parámetros). Por favor, verifique que todas las bases estén cargadas.');
            return;
        }

        // populateSelects(); // Removed, now using searchable modals
        isEditing = editing;
        detailTableBody.innerHTML = '';
        coaModal.classList.add('open');

        if (isEditing && coa) {
            modalTitle.textContent = 'Editar Certificado COA';
            coaIdInput.value = coa.id;
            clientSelect.value = coa.cliente;
            // Trigger auto-fill for client
            const client = clients.find(c => c.nombre === coa.cliente);
            if (client) clientAddress.value = `${client.departamento}, ${client.municipio}, ${client.direccion}`;

            productSelect.value = coa.producto || '';
            presentationInput.value = coa.presentacion || '';
            descriptionInput.value = coa.descripcion || '';
            cellarSelect.value = coa.bodega || '';
            quantityInput.value = coa.cantidad || '';
            tarimasInput.value = coa.tarimas || '';
            marchamoInput.value = coa.marchamo || '';

            // Sync Flatpickr instances
            if (coa.fechaAnalisis) fpAnalysis.setDate(coa.fechaAnalisis); else fpAnalysis.clear();
            if (coa.fechaRevision) fpEmission.setDate(coa.fechaRevision); else fpEmission.clear();
            if (coa.fechaProduccion) fpProduction.setDate(coa.fechaProduccion); else fpProduction.clear();
            if (coa.fechaVencimiento) fpExpiry.setDate(coa.fechaVencimiento); else fpExpiry.clear();
            dates.lot.value = coa.lote || '';

            // Render Detail Rows
            (coa.detalles || []).forEach(d => {
                detailTableBody.appendChild(createDetailRow(d.parametro, d.resultado));
            });
        } else {
            modalTitle.textContent = 'Nuevo Certificado COA';
            coaForm.reset();
            coaIdInput.value = '';

            // Clear Flatpickr instances
            fpAnalysis.clear();
            fpEmission.clear();
            fpProduction.clear();
            fpExpiry.clear();

            // Add initial empty rows if needed (optional)
            detailTableBody.appendChild(createDetailRow());
        }
    };

    const closeModal = () => coaModal.classList.remove('open');

    // --- Event Listeners ---
    addCoaBtn.addEventListener('click', () => {
        requestCoaForm.reset();
        fpRequestDate.clear();
        requestCoaModal.classList.add('open');
    });

    cancelRequestBtn.addEventListener('click', () => requestCoaModal.classList.remove('open'));
    cancelBtn.addEventListener('click', closeModal);

    reqClientSelect.addEventListener('click', () => openSearchModal('customer'));

    requestCoaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const coaData = {
            id: Date.now().toString(),
            cliente: reqClientSelect.value,
            fechaRequerimiento: reqDateInput.value,
            usuarioSolicitante: currentUser || 'Anonimo',
            detalles: [],
            track: [] // Initial track
        };
        trackStatus(coaData, 'nuevo');

        const coas = getData('coas');
        coas.push(coaData);
        saveData('coas', coas);
        requestCoaModal.classList.remove('open');
        renderTable(searchInput.value);
    });

    coaForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect Details
        const details = [];
        const paramSet = new Set();
        const rows = detailTableBody.querySelectorAll('tr');
        let hasDuplicate = false;

        rows.forEach(row => {
            const select = row.querySelector('.param-input');
            const resultInput = row.querySelector('.result-input');
            const val = select.value;
            if (val && resultInput && resultInput.value) {
                if (paramSet.has(val)) {
                    hasDuplicate = true;
                }
                paramSet.add(val);
                details.push({
                    parametro: val,
                    resultado: resultInput.value
                });
            }
        });

        if (hasDuplicate) {
            alert('No se permiten parámetros duplicados en el mismo certificado.');
            return;
        }

        if (details.length === 0) {
            alert('Debe agregar al menos un parámetro de análisis con su resultado.');
            return;
        }

        const coaData = {
            id: isEditing ? coaIdInput.value : Date.now().toString(),
            cliente: clientSelect.value,
            direccion: clientAddress.value,
            producto: productSelect.value,
            presentacion: presentationInput.value,
            descripcion: descriptionInput.value,
            bodega: cellarSelect.value,
            cantidad: quantityInput.value,
            tarimas: tarimasInput.value,
            marchamo: marchamoInput.value,
            fechaAnalisis: dates.analysis.value,
            fechaRevision: dates.emission.value,
            fechaProduccion: dates.production.value,
            fechaVencimiento: dates.expiry.value,
            lote: dates.lot.value,
            detalles: details,
            status: 'iniciado' // Ensure status is set to iniciado when saving full form
        };

        let coas = getData('coas');
        if (isEditing) {
            const idx = coas.findIndex(c => c.id === coaData.id);
            if (idx !== -1) {
                // Preserve request audit fields
                const existing = coas[idx];
                coas[idx] = {
                    ...existing,
                    ...coaData
                };
            }
        } else {
            coas.push(coaData);
        }

        saveData('coas', coas);
        closeModal();
        renderTable(searchInput.value);
    });

    coaTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const coas = getData('coas');

        if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar este certificado?')) {
                saveData('coas', coas.filter(c => c.id !== id));
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) openModal(true, coa);
        } else if (btn.classList.contains('start-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) {
                const confirmed = confirm(`¿Estas seguro que desea iniciar la verificación del certificado para el cliente ${coa.cliente}?`);
                if (confirmed) {
                    // Phase 2: Initiation
                    trackStatus(coa, 'iniciado');
                    coa.usuarioInicio = currentUser || 'Anonimo';
                    coa.fechaInicio = new Date().toLocaleString();

                    // Save status change
                    saveData('coas', coas);

                    // Refresh table (it will now show "Editar")
                    renderTable(searchInput.value);
                }
            }
        } else if (btn.classList.contains('finish-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) {
                if (confirm('¿Desea FINALIZAR este certificado? Una vez finalizado no podrá ser editado sin solicitar una corrección.')) {
                    trackStatus(coa, 'finalizado');
                    coa.usuarioFinaliza = currentUser || 'Anonimo';
                    coa.fechaFinaliza = new Date().toLocaleString();
                    saveData('coas', coas);
                    renderTable(searchInput.value);
                }
            }
        } else if (btn.classList.contains('correction-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) {
                if (confirm('¿Desea solicitar una CORRECCIÓN para este certificado? Esto permitirá volver a editarlo.')) {
                    trackStatus(coa, 'iniciado');
                    // Optional: You could track correction history here if needed
                    saveData('coas', coas);
                    renderTable(searchInput.value);
                }
            }
        } else if (btn.classList.contains('print-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) {
                printCOA(coa);
            }
        } else if (btn.classList.contains('history-btn')) {
            const coa = coas.find(c => c.id === id);
            if (coa) {
                openHistoryModal(coa);
            }
        }
    });

    const openHistoryModal = (coa) => {
        historyContent.innerHTML = '';
        const track = coa.track || [];

        if (track.length === 0) {
            historyContent.innerHTML = '<div style="text-align: center; color: #666; margin-top: 20px;">No hay movimientos registrados.</div>';
        } else {
            track.forEach((log, index) => {
                const item = document.createElement('div');
                item.style.marginBottom = '20px';
                item.style.padding = '15px';
                item.style.borderRadius = '12px';
                item.style.background = 'rgba(128, 128, 128, 0.1)';
                item.style.borderLeft = `5px solid ${getStatusColor(log.status)}`;

                item.innerHTML = `
                    <div style="font-weight: 600; text-transform: uppercase; font-size: 13px; color: ${getStatusColor(log.status)}">${log.status}</div>
                    <div style="margin: 5px 0; color: var(--text-color);">${log.user}</div>
                    <div style="font-size: 12px; color: #666;">${log.time}</div>
                `;
                historyContent.appendChild(item);
            });
        }
        historyModal.classList.add('open');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'nuevo': return '#1a73e8';
            case 'iniciado': return '#28a745';
            case 'finalizado': return '#ffc107';
            default: return '#666';
        }
    };

    const printCOA = (coa) => {
        const params = JSON.parse(localStorage.getItem('coa') || '[]');
        const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');

        // Audit Track: Track this print action
        trackStatus(coa, 'impresion');
        const coas = getData('coas');
        const idx = coas.findIndex(c => c.id === coa.id);
        if (idx !== -1) {
            coas[idx] = coa; // Already has the new track entry
            saveData('coas', coas);
        }

        // Filter and sort notes
        const sortedNotes = allNotes.sort((a, b) => parseFloat(a.orden) - parseFloat(b.orden));

        const printWindow = window.open('', '_blank');

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Impresión COA - ${coa.cliente}</title>
                <style>
                    @page { margin: 1cm; size: letter; }
                    body { font-family: 'Roboto', sans-serif; color: #333; line-height: 1.4; margin: 0; padding: 20px; font-size: 11px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                    .logo { width: 110px; height: 50px; object-fit: contain; }
                    .company-info { text-align: right; font-weight: bold; font-size: 12px; }
                    .doc-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; text-transform: uppercase; }
                    
                    .coa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
                    .info-group { display: flex; margin-bottom: 4px; }
                    .info-label { font-weight: bold; width: 130px; }
                    .info-value { flex: 1; }
                    
                    hr { border: 0; border-top: 1.5px solid #000; margin: 15px 0; }
                    
                    .section-title { text-align: center; font-weight: bold; margin-bottom: 10px; font-size: 13px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th, td { border: 1.5px solid #000; padding: 6px; text-align: center; }
                    th { font-weight: bold; background-color: #d8d8d8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    .notes-section { margin-top: 15px; }
                    .note-item { margin-bottom: 5px; }
                    
                    .footer-notes { margin-top: 30px; font-size: 10px; }
                    .signatures { display: flex; justify-content: space-around; margin-top: 60px; text-align: center; border-bottom: none; }
                    .sig-line { width: 250px; border-top: 1px solid #000; padding-top: 5px; }
                    .legal-notice { margin-top: 30px; border-top: 1.5px solid #000; padding-top: 5px; text-align: left; font-size: 9px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="../imgs/coa-print.png" class="logo">
                    <div class="company-info">
                        DIZUCAR S.A. DE C.V.<br>
                        Av. 29 de Agosto Sur No. 834, Blvd.<br>
                        Venezuela, San Salvador, El Salvador
                    </div>
                </div>

                <div class="doc-title">Certificado de Calidad</div>

                <div class="coa-grid">
                    <div class="left-col">
                        <div class="info-group"><div class="info-label">Cliente:</div><div class="info-value">${coa.cliente || ''}</div></div>
                        <div class="info-group"><div class="info-label">Dirección del cliente:</div><div class="info-value">${coa.direccion || ''}</div></div>
                        <br>
                        <div class="info-group"><div class="info-label">Fecha de análisis:</div><div class="info-value">${coa.fechaAnalisis ? new Date(coa.fechaAnalisis).toLocaleDateString('es-ES') : ''}</div></div>
                        <div class="info-group"><div class="info-label">Fecha de emisión:</div><div class="info-value">${coa.fechaRevision ? new Date(coa.fechaRevision).toLocaleDateString('es-ES') : ''}</div></div>
                        <div class="info-group"><div class="info-label">Fecha de producción:</div><div class="info-value">${coa.fechaProduccion ? new Date(coa.fechaProduccion).toLocaleDateString('es-ES') : ''}</div></div>
                        <div class="info-group"><div class="info-label">Fecha de vencimiento:</div><div class="info-value">${coa.fechaVencimiento ? new Date(coa.fechaVencimiento).toLocaleDateString('es-ES') : ''}</div></div>
                    </div>
                    <div class="right-col">
                        <div class="info-group"><div class="info-label">Lote:</div><div class="info-value">${coa.lote || ''}</div></div>
                        <div class="info-group"><div class="info-label">Producto:</div><div class="info-value">${coa.producto || ''}</div></div>
                        <div class="info-group"><div class="info-label">Descripción:</div><div class="info-value">${coa.descripcion || ''}</div></div>
                        <br>
                        <div class="info-group"><div class="info-label">Bodega:</div><div class="info-value">${coa.bodega || ''}</div></div>
                        <div class="info-group"><div class="info-label">Presentación:</div><div class="info-value">${coa.presentacion || ''}</div></div>
                        <div class="info-group"><div class="info-label">Cantidad (kg):</div><div class="info-value">${coa.cantidad || ''}</div></div>
                        <div class="info-group"><div class="info-label">N° de Tarimas:</div><div class="info-value">${coa.tarimas || ''}</div></div>
                        <div class="info-group"><div class="info-label">Número de marchamo:</div><div class="info-value"><strong>${coa.marchamo || ''}</strong></div></div>
                    </div>
                </div>

                <hr>

                <div class="section-title">Resultado del análisis</div>

                <table>
                    <thead>
                        <tr>
                            <th>Parámetros</th>
                            <th>Metodo</th>
                            <th>Resultado</th>
                            <th>Unidades</th>
                            <th>Especificación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coa.detalles.map(d => {
            const p = params.find(param => param.nombre === d.parametro) || {};
            return `
                                <tr>
                                    <td>${d.parametro}</td>
                                    <td>${p.metodo || '-'}</td>
                                    <td>${d.resultado}</td>
                                    <td>${p.unidades || '-'}</td>
                                    <td>${p.descripcion || '-'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>

                <div class="notes-section">
                    ${sortedNotes.map(n => `<div class="note-item">${n.descripcion}</div>`).join('')}
                </div>

                <div class="footer-notes">
                    <p>* Los resultados son obtenidos de una muestra compuesta en etapa de producción enviada a un laboratorio subcontratado.</p>
                    <p>Certifico que el servicio especificado ha sido realizado obteniéndose los resultados descritos. Los resultados del análisis cumplen con las especificaciones del RTS 67.06.01:13 Fortificación de alimentos. Especificaciones; NSO 67.20.01:03 Azucares.</p>
                    <p>Como aseguramiento de inocuidad en el flujo de pulverizacion, los de los cristales de azúcar pasan por una rejilla imantada para detectar metales.</p>
                </div>

                <div class="signatures">
                    <div>
                        <div class="sig-line">Fátima Ramírez</div>
                        <div>Revisado por: Analista de Investigación y Desarrollo</div>
                    </div>
                    <div>
                        <div class="sig-line">María José Sánchez</div>
                        <div>Aprobado por: Jefe de Investigación y Desarrollo</div>
                    </div>
                </div>

                <div class="legal-notice">
                    Este documento no puede ser reproducido de forma parcial o total sin previa autorización.
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // Optional: window.close(); 
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('open'));

    // --- Status Filter Events ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;

            if (selectedStatuses.has(status)) {
                selectedStatuses.delete(status);
                btn.classList.remove('active');
            } else {
                selectedStatuses.add(status);
                btn.classList.add('active');
            }

            renderTable(searchInput.value);
        });
    });

    searchInput.addEventListener('keyup', (e) => renderTable(e.target.value));

    // --- Sidebar & UI ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (openMenuBtn && sidebar) openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeMenuBtn && sidebar) closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) window.location.href = '../index.html';
        });
    }

    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            const isVisible = window.getComputedStyle(aiChatWidget).display === 'flex';
            aiChatWidget.style.display = isVisible ? 'none' : 'flex';
        });
    }

    // Initial Load
    renderTable();
});
