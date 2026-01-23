document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---
    const STORAGE_KEY = 'procesos';
    const CLIENT_IMAGES = [
        'banban.png', 'buenprovecho.png', 'eduvigis.png', 'lilian.png',
        'lorena.png', 'mister.png', 'nsv.png', 'teclana.png'
    ];
    const BRAND_IMAGES = [
        'cañal.png', 'esevia.png', 'glass.png', 'muzza.png',
        'pura.png', 'roseliere.png', 'upperade.png'
    ];

    // --- State & Elements ---
    let isEditing = false;
    const processesContainer = document.getElementById('processesContainer');
    const noDataState = document.getElementById('noDataState');
    const searchInput = document.getElementById('searchInput');

    // Modal Elements
    const processModal = document.getElementById('processModal');
    const processForm = document.getElementById('processForm');
    const modalTitle = document.getElementById('modalTitle');
    const processNameInput = document.getElementById('processName');
    const processTypeSelect = document.getElementById('processType');
    const imageSelector = document.getElementById('imageSelector');
    const selectedImageInput = document.getElementById('selectedImageInput');
    const imageError = document.getElementById('imageError');

    // --- LocalStorage Helpers ---
    const getData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const saveData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // --- Sidebar Menu ---
    const sidebar = document.getElementById('sidebar');
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    openMenuBtn?.addEventListener('click', () => sidebar.classList.add('open'));
    closeMenuBtn?.addEventListener('click', () => sidebar.classList.remove('open'));

    // --- User Info & Logout ---
    const userInfo = document.getElementById('userInfo');
    const storedUser = localStorage.getItem('currentUser');
    if (userInfo && storedUser) {
        userInfo.textContent = storedUser.startsWith('{') ? JSON.parse(storedUser).name : `Usuario: ${storedUser}`;
    }
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });

    // --- Filtering Logic ---
    let currentTypeFilter = null; // 'cliente' | 'marca' | null

    // --- Rendering ---
    const renderProcesses = (filterText = '') => {
        const processes = getData();
        const filtered = processes.filter(p => {
            const matchesText = (p.name || '').toLowerCase().includes(filterText.toLowerCase());
            const matchesType = currentTypeFilter ? p.type === currentTypeFilter : true;
            return matchesText && matchesType;
        });

        processesContainer.innerHTML = '';

        if (filtered.length === 0) {
            processesContainer.style.display = 'none';
            noDataState.style.display = 'flex';
            return;
        }

        processesContainer.style.display = 'grid';
        noDataState.style.display = 'none';

        filtered.forEach(proc => {
            const card = document.createElement('div');
            card.className = 'process-card';

            // Determine image path based on type
            const folder = proc.type === 'cliente' ? 'clientes' : 'marcas';
            const imgPath = `${folder}/${proc.image}`;

            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${imgPath}" alt="${proc.name}" class="card-image" onerror="this.src='../imgs/icon.png'">
                </div>
                <div class="card-content">
                    <span class="card-badge badge-${proc.type}">${proc.type}</span>
                    <h3 class="card-title" title="${proc.name}">${proc.name}</h3>
                    
                    <!-- Status Display -->
                     <div style="font-size: 11px; color: #666; margin-bottom: 5px; height: 16px;">
                        ${proc.currentStep ? `<span style="color: #1a73e8;">● ${proc.currentStep}</span>` : ''}
                    </div>

                    <div class="card-actions">
                        <button class="action-btn manage-btn" data-id="${proc.id}" title="Gestionar">⚙️</button>
                        <button class="action-btn timeline-btn" data-id="${proc.id}" title="Ver Seguimiento">📊</button>
                        <button class="action-btn sales-btn" data-id="${proc.id}" title="Análisis de Ventas">💰</button>
                        <button class="action-btn edit-btn" data-id="${proc.id}" title="Editar">✏️</button>
                        <button class="action-btn delete-btn" data-id="${proc.id}" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;

            // Manage Action
            card.querySelector('.manage-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openManageModal(proc);
            });

            // Timeline Action
            card.querySelector('.timeline-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openTimelineModal(proc);
            });

            // Sales Action
            card.querySelector('.sales-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openSalesModal(proc);
            });

            // Edit Action
            card.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(true, proc);
            });

            // Delete Action
            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar proceso "${proc.name}"?`)) {
                    const newData = getData().filter(p => p.id !== proc.id);
                    saveData(newData);
                    renderProcesses(searchInput.value);
                }
            });

            processesContainer.appendChild(card);
        });
    };

    // Filter Buttons Event Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filter;

            if (btn.classList.contains('active')) {
                // Deactivate filter
                btn.classList.remove('active');
                currentTypeFilter = null;
            } else {
                // Activate filter (and deactivate others)
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTypeFilter = filterType;
            }
            renderProcesses(searchInput.value);
        });
    });

    // --- Sales Analysis Logic (Chart.js) ---
    const salesModal = document.getElementById('salesModal');
    const salesDateFilter = document.getElementById('salesDateFilter');
    const salesCompareDateFilter = document.getElementById('salesCompareDateFilter');
    const enableComparisonCheckbox = document.getElementById('enableComparison');
    const compareDateGroup = document.getElementById('compareDateGroup');
    const salesCtx = document.getElementById('salesChart').getContext('2d');

    let salesChartInstance = null;
    let currentSalesProcess = null;

    // Initialize Flatpickr for Sales
    const salesPicker = flatpickr(salesDateFilter, {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()], // Last 7 days default
        onChange: () => updateSalesChart()
    });

    const comparePicker = flatpickr(salesCompareDateFilter, {
        mode: "range",
        dateFormat: "Y-m-d",
        onChange: () => updateSalesChart()
    });

    enableComparisonCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            compareDateGroup.style.display = 'block';
            salesDateFilter.placeholder = "Periodo 1";
        } else {
            compareDateGroup.style.display = 'none';
            salesDateFilter.placeholder = "Seleccionar Fecha(s)";
            comparePicker.clear();
        }
        updateSalesChart();
    });

    const generateRandomSalesData = (days) => {
        // Generate random sales data with some variance
        return Array.from({ length: days }, () => Math.floor(Math.random() * 8000) + 2000); // 2000 - 10000
    };

    const formatDateLabel = (date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const getDatesInRange = (startDate, endDate) => {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const openSalesModal = (process) => {
        currentSalesProcess = process;
        document.getElementById('salesTitle').textContent = `Análisis de Ventas: ${process.name}`;
        salesModal.classList.add('open');

        // Reset defaults
        enableComparisonCheckbox.checked = false;
        compareDateGroup.style.display = 'none';
        salesPicker.setDate([new Date(new Date().setDate(new Date().getDate() - 7)), new Date()]);

        updateSalesChart();
    };

    const updateSalesChart = () => {
        if (salesChartInstance) salesChartInstance.destroy();

        const isComparison = enableComparisonCheckbox.checked;
        const period1Dates = salesPicker.selectedDates;

        if (period1Dates.length < 2 && !period1Dates[0]) return; // Need at least one date

        const startDate1 = period1Dates[0];
        const endDate1 = period1Dates[1] || period1Dates[0];
        const daysRange1 = getDatesInRange(startDate1, endDate1);
        const labels1 = daysRange1.map(d => formatDateLabel(d));
        const data1 = generateRandomSalesData(daysRange1.length);

        if (isComparison) {
            // ** BAR CHART (Comparison) **
            const period2Dates = comparePicker.selectedDates;
            let data2 = [];
            let labels = labels1; // Default to Period 1 labels if simple comparison

            if (period2Dates.length > 0) {
                const startDate2 = period2Dates[0];
                const endDate2 = period2Dates[1] || period2Dates[0];
                const daysRange2 = getDatesInRange(startDate2, endDate2);
                data2 = generateRandomSalesData(daysRange2.length);

                // If ranges differ in length, we might just compare index by index or truncate
                // For a demo, let's just show dataset 2 alongside.
            } else {
                // If compare enabled but no date picked, maybe show placeholder or empty
                data2 = Array(data1.length).fill(0);
            }

            salesChartInstance = new Chart(salesCtx, {
                type: 'bar',
                data: {
                    labels: labels1, // Simplified: Using Period 1 axis
                    datasets: [
                        {
                            label: 'Periodo 1',
                            data: data1,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Periodo 2',
                            data: data2,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Comparativa de Ventas' }
                    }
                }
            });

        } else {
            // ** PIE CHART (Single Period / Distribution) **
            // Pie chart usually shows distribution of categories. 
            // Since we only have "Sales dates", showing a Pie of "Daily Sales" is a bit odd (Sum of slices = Total sales).
            // But user requested: "sin comparacion de ventas que sea un grafico de pastel"
            // Let's implement exactly that.

            salesChartInstance = new Chart(salesCtx, {
                type: 'pie',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Ventas Diarias',
                        data: data1,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)',
                            // Repeat colors if needed
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: true, text: 'Distribución de Ventas por Día' }
                    }
                }
            });
        }
    };

    document.getElementById('closeSalesBtn').addEventListener('click', () => {
        salesModal.classList.remove('open');
    });
    const timelineModal = document.getElementById('timelineModal');
    const timelineContainer = document.getElementById('timelineContainer');
    const timelineClassFilter = document.getElementById('timelineClassFilter');
    const timelineDateFilter = document.getElementById('timelineDateFilter');
    let currentTimelineProcessId = null;

    // Initialize Flatpickr for Date Filter (Range Mode)
    flatpickr(timelineDateFilter, {
        mode: "range",
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
            renderTimeline(currentTimelineProcessId, dateStr, timelineClassFilter.value);
        }
    });

    // Store classification colors to be consistent within a session
    const classificationColors = {};
    const getClassificationColor = (classificationName) => {
        if (!classificationColors[classificationName]) {
            // Generate a random dark/vibrant color for better contrast with white text
            const hue = Math.floor(Math.random() * 360);
            classificationColors[classificationName] = `hsl(${hue}, 70%, 40%)`;
        }
        return classificationColors[classificationName];
    };

    const openTimelineModal = (process) => {
        currentTimelineProcessId = process.id;
        document.getElementById('timelineTitle').textContent = `Seguimiento Visual: ${process.name}`;

        // Populate Classification Filter based on process history
        const uniqueClassifications = [...new Set((process.track || []).map(t => t.classification))];
        timelineClassFilter.innerHTML = '<option value="">Todas las clasificaciones</option>';
        uniqueClassifications.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            timelineClassFilter.appendChild(option);
        });

        timelineClassFilter.value = '';
        timelineDateFilter._flatpickr.clear(); // Clear flatpickr instance

        timelineModal.classList.add('open');
        renderTimeline(process.id);
    };

    const renderTimeline = (processId, dateRangeStr = '', classFilter = '') => {
        const processes = getData();
        const process = processes.find(p => p.id === processId);

        if (!process) return;

        const allClassifications = JSON.parse(localStorage.getItem('classification') || '[]');
        const allSteps = JSON.parse(localStorage.getItem('steps') || '[]');

        let relevantClassifications = allClassifications.filter(c =>
            (c.tipo || 'Producto').toLowerCase() === (process.type || 'producto').toLowerCase()
        );

        relevantClassifications.sort((a, b) => (parseInt(a.orden) || 999) - (parseInt(b.orden) || 999));

        timelineContainer.innerHTML = '';
        timelineContainer.style.display = 'flex';
        timelineContainer.style.justifyContent = 'center';
        timelineContainer.style.padding = '20px';

        if (relevantClassifications.length === 0) {
            timelineContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">No hay configuraciones de clasificación para este tipo de proceso.</div>';
            return;
        }

        let currentClassIndex = -1;
        if (process.currentClassification) {
            currentClassIndex = relevantClassifications.findIndex(c => c.nombre === process.currentClassification);
        }

        const widgetWrapper = document.createElement('div');
        widgetWrapper.style.display = 'flex';
        widgetWrapper.style.gap = '30px';
        widgetWrapper.style.alignItems = 'stretch';
        widgetWrapper.style.height = '500px';

        const tubeWithBulb = document.createElement('div');
        tubeWithBulb.style.display = 'flex';
        tubeWithBulb.style.flexDirection = 'column';
        tubeWithBulb.style.alignItems = 'center';

        const tube = document.createElement('div');
        tube.style.flex = '1';
        tube.style.width = '100px';
        tube.style.border = '4px solid #fff';
        if (document.body.classList.contains('dark-mode')) tube.style.borderColor = '#555';

        tube.style.borderRadius = '50px';
        tube.style.background = 'rgba(0,0,0,0.05)';
        if (document.body.classList.contains('dark-mode')) tube.style.background = 'rgba(255,255,255,0.05)';

        tube.style.overflow = 'hidden';
        tube.style.display = 'flex';
        tube.style.flexDirection = 'column-reverse';
        tube.style.position = 'relative';
        tube.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';

        const labelsCol = document.createElement('div');
        labelsCol.style.display = 'flex';
        labelsCol.style.flexDirection = 'column-reverse';
        labelsCol.style.justifyContent = 'space-between';
        labelsCol.style.padding = '10px 0';

        relevantClassifications.forEach((classification, index) => {
            let fillPercentage = 0;
            let currentStepName = '';
            let isActive = false;

            if (index < currentClassIndex) {
                fillPercentage = 100;
                currentStepName = 'Completado';
            } else if (index === currentClassIndex) {
                isActive = true;
                currentStepName = process.currentStep;
                const stepDef = allSteps.find(s => s.nombre === process.currentStep);
                fillPercentage = stepDef && stepDef.porcentual ? parseFloat(stepDef.porcentual) : 50;
            } else {
                fillPercentage = 0;
                currentStepName = 'Pendiente';
            }

            const color = classification.color || '#1a73e8';

            const segment = document.createElement('div');
            segment.style.flex = '1';
            segment.style.width = '100%';
            segment.style.position = 'relative';
            segment.style.borderBottom = '1px solid rgba(128,0,128, 0.5)';

            const fill = document.createElement('div');
            fill.style.position = 'absolute';
            fill.style.bottom = '0';
            fill.style.left = '0';
            fill.style.width = '100%';
            fill.style.height = `${fillPercentage}%`;
            fill.style.backgroundColor = color;
            fill.style.transition = 'height 1s ease-in-out';
            fill.style.boxShadow = `0 0 10px ${color}`;

            segment.appendChild(fill);
            tube.appendChild(segment);

            const labelItem = document.createElement('div');
            labelItem.style.flex = '1';
            labelItem.style.display = 'flex';
            labelItem.style.flexDirection = 'column';
            labelItem.style.justifyContent = 'center';
            labelItem.style.marginLeft = '10px';

            labelItem.innerHTML = `
                <div style="font-weight: bold; font-size: 14px; color: ${isActive ? color : 'var(--text-color)'}; opacity: ${fillPercentage === 0 ? 0.5 : 1};">
                    ${classification.orden}. ${classification.nombre}
                </div>
                ${isActive ? `<div style="font-size: 12px; color: ${color}; font-weight: 500;">● ${currentStepName} (${fillPercentage}%)</div>` : ''}
                ${fillPercentage === 100 ? `<div style="font-size: 11px; color: #4caf50;">✓ Completado</div>` : ''}
            `;
            labelsCol.appendChild(labelItem);
        });

        if (tube.lastElementChild) {
            tube.lastElementChild.style.borderBottom = 'none';
        }

        tubeWithBulb.appendChild(tube);
        widgetWrapper.appendChild(tubeWithBulb);
        widgetWrapper.appendChild(labelsCol);

        timelineContainer.appendChild(widgetWrapper);
    };

    timelineClassFilter.addEventListener('change', (e) => {
        renderTimeline(currentTimelineProcessId, timelineDateFilter.value, e.target.value);
    });

    document.getElementById('closeTimelineBtn').addEventListener('click', () => {
        timelineModal.classList.remove('open');
    });

    // Add Timeline Button to Card Actions
    const originalRenderProcesses = renderProcesses;

    // --- Quill Editor Init ---
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeHolder: 'Escriba su notificación aquí...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['image', 'link'],
                ['clean']
            ]
        }
    });

    // --- Modal Logic & State ---
    const modalTabs = document.getElementById('modalTabs');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Temporary State for Edit Mode
    let tempAlerts = [];
    let tempUsers = [];
    let tempEmails = [];

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    const renderImageOptions = (type, selectedImage = null) => {
        imageSelector.innerHTML = '';
        const images = type === 'cliente' ? CLIENT_IMAGES : BRAND_IMAGES;
        const folder = type === 'cliente' ? 'clientes' : 'marcas';

        images.forEach(img => {
            const div = document.createElement('div');
            div.className = `image-option ${selectedImage === img ? 'selected' : ''}`;
            div.innerHTML = `<img src="${folder}/${img}" alt="${img}">`;

            div.addEventListener('click', () => {
                document.querySelectorAll('.image-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedImageInput.value = img;
                imageError.style.display = 'none';
            });

            imageSelector.appendChild(div);
        });
    };

    const openModal = (editing = false, process = null) => {
        isEditing = editing;
        processForm.reset();
        selectedImageInput.value = '';
        imageSelector.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #777; padding: 20px; font-size: 13px;">Seleccione un tipo primero</div>';
        imageError.style.display = 'none';

        // Reset Tabs to First
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tabBtns[0].classList.add('active');
        document.getElementById('tab-general').classList.add('active');

        // Reset Edit States
        editingEmailIndex = -1;
        document.getElementById('addEmailBtn').textContent = 'Agregar';

        editingAlertIndex = -1;
        const addAlertBtn = document.getElementById('addAlertBtn');
        if (addAlertBtn) {
            addAlertBtn.innerHTML = '+';
            addAlertBtn.title = 'Agregar Alerta';
        }

        // Reset Day Selection Buttons
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));

        if (editing && process) {
            // Edit Mode Configuration
            document.getElementById('processId').value = process.id;
            processNameInput.value = process.name;
            processTypeSelect.value = process.type;
            modalTitle.textContent = 'Editar Proceso: ' + process.name;
            renderImageOptions(process.type, process.image);
            selectedImageInput.value = process.image;

            // Show Tabs
            modalTabs.style.display = 'flex';

            // Load Advanced Data
            tempAlerts = process.alerts || [];
            tempUsers = process.encargados || [];
            tempEmails = process.interesados || []; // Array of {name, email}

            renderAlertsList();
            renderUsersList();
            renderEmailsList();

            // Load Available Users for Select
            loadUserOptions();

        } else {
            // Create Mode Configuration
            document.getElementById('processId').value = '';
            processTypeSelect.value = '';
            modalTitle.textContent = 'Nuevo Proceso';
            modalTabs.style.display = 'none'; // Hide advanced tabs on create

            // Reset Temp Data
            tempAlerts = [];
            tempUsers = [];
            tempEmails = [];
        }
        processModal.classList.add('open');
    };

    // --- Advanced Features Logic (Tabs) ---

    // 1. Alerts
    const alertsList = document.getElementById('alertsList');
    const addAlertBtn = document.getElementById('addAlertBtn');
    let editingAlertIndex = -1;

    // Day Selector Logic
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        });
    });

    addAlertBtn.addEventListener('click', () => {
        // Gather selected days
        const selectedDays = Array.from(document.querySelectorAll('.day-btn.selected'))
            .map(btn => btn.dataset.day)
            .join(', ');

        const time = document.getElementById('alertTime').value;

        if (!selectedDays) return alert('Seleccione al menos un día');
        if (!time) return alert('Seleccione una hora');

        if (editingAlertIndex > -1) {
            // Update
            tempAlerts[editingAlertIndex] = { days: selectedDays, time };
            editingAlertIndex = -1;
            addAlertBtn.innerHTML = '+';
            addAlertBtn.title = 'Agregar Alerta';
        } else {
            // Add
            tempAlerts.push({ days: selectedDays, time });
        }

        renderAlertsList();

        // Reset Inputs
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('alertTime').value = '';
    });

    const renderAlertsList = () => {
        alertsList.innerHTML = tempAlerts.map((a, i) => `
            <li class="list-item">
                <span>📅 ${a.days} ⏰ ${a.time}</span>
                <div style="display: flex; gap: 0;">
                    <button type="button" class="btn-small-edit" onclick="editAlert(${i})" title="Editar">✏️</button>
                    <button type="button" class="btn-small-remove" onclick="removeAlert(${i})" title="Eliminar">×</button>
                </div>
            </li>
        `).join('');
    };

    window.editAlert = (index) => {
        const item = tempAlerts[index];
        // Populate Time
        document.getElementById('alertTime').value = item.time;

        // Populate Days
        const days = item.days.split(', ');
        document.querySelectorAll('.day-btn').forEach(btn => {
            if (days.includes(btn.dataset.day)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        editingAlertIndex = index;
        addAlertBtn.innerHTML = '✓'; // Using checkmark for update
        addAlertBtn.title = 'Actualizar Alerta';
    };

    window.removeAlert = (index) => {
        if (index === editingAlertIndex) {
            editingAlertIndex = -1;
            addAlertBtn.innerHTML = '+';
            addAlertBtn.title = 'Agregar Alerta';
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('alertTime').value = '';
        } else if (index < editingAlertIndex) {
            editingAlertIndex--;
        }
        tempAlerts.splice(index, 1);
        renderAlertsList();
    };

    // 2. Encargados (Users)
    const userSelect = document.getElementById('userSelect');
    const usersList = document.getElementById('usersList');

    const loadUserOptions = () => {
        userSelect.innerHTML = '<option value="">Seleccione Usuario</option>';
        try {
            const logins = JSON.parse(localStorage.getItem('login') || '[]');
            logins.forEach(l => {
                const user = l.usuario; // Structure: [{"usuario":"lmoz"}, ...]
                const option = document.createElement('option');
                option.value = user;
                option.textContent = user;
                userSelect.appendChild(option);
            });
        } catch (e) { console.error("Error loading users", e); }
    };

    document.getElementById('addUserBtn').addEventListener('click', () => {
        const user = userSelect.value;
        if (!user) return;
        if (tempUsers.includes(user)) return alert('Usuario ya agregado');

        tempUsers.push(user);
        renderUsersList();
        userSelect.value = '';
    });

    const renderUsersList = () => {
        usersList.innerHTML = tempUsers.map((u, i) => `
            <li class="list-item">
                <span>👤 ${u}</span>
                <button type="button" class="btn-small-remove" onclick="removeUser(${i})">×</button>
            </li>
        `).join('');
    };

    window.removeUser = (index) => {
        tempUsers.splice(index, 1);
        renderUsersList();
    };

    // 3. Interesados (Emails)
    // 3. Interesados (Emails)
    const emailsList = document.getElementById('emailsList');
    const addEmailBtn = document.getElementById('addEmailBtn');
    let editingEmailIndex = -1;

    addEmailBtn.addEventListener('click', () => {
        const name = document.getElementById('interestedName').value.trim();
        const email = document.getElementById('interestedEmail').value.trim();

        if (!name || !email) return alert('Ingrese nombre y correo');

        // Check duplicates (exclude current edited item)
        if (tempEmails.some((e, i) => i !== editingEmailIndex && e.email === email)) {
            return alert('Correo ya existe');
        }

        if (editingEmailIndex > -1) {
            // Update mode
            tempEmails[editingEmailIndex] = { name, email };
            editingEmailIndex = -1;
            addEmailBtn.textContent = 'Agregar';
        } else {
            // Add mode
            tempEmails.push({ name, email });
        }

        renderEmailsList();
        document.getElementById('interestedName').value = '';
        document.getElementById('interestedEmail').value = '';
    });

    const renderEmailsList = () => {
        emailsList.innerHTML = tempEmails.map((e, i) => `
            <li class="list-item">
                <span>📧 ${e.name} (${e.email})</span>
                <div style="display: flex; gap: 0;">
                    <button type="button" class="btn-small-edit" onclick="editEmail(${i})" title="Editar">✏️</button>
                    <button type="button" class="btn-small-remove" onclick="removeEmail(${i})" title="Eliminar">×</button>
                </div>
            </li>
        `).join('');
    };

    window.editEmail = (index) => {
        const item = tempEmails[index];
        document.getElementById('interestedName').value = item.name;
        document.getElementById('interestedEmail').value = item.email;
        editingEmailIndex = index;
        addEmailBtn.textContent = 'Actualizar';
    };

    window.removeEmail = (index) => {
        if (index === editingEmailIndex) {
            editingEmailIndex = -1;
            addEmailBtn.textContent = 'Agregar';
            document.getElementById('interestedName').value = '';
            document.getElementById('interestedEmail').value = '';
        } else if (index < editingEmailIndex) {
            editingEmailIndex--; // Adjust index if removing preceding item
        }
        tempEmails.splice(index, 1);
        renderEmailsList();
    };

    // 4. Notificaciones
    document.getElementById('sendNotificationBtn').addEventListener('click', () => {
        if (quill.getText().trim().length === 0) return alert('Escriba un mensaje');
        alert('Notificación enviada a los interesados.');
        quill.setText('');
    });

    // --- Save Process Logic ---

    // Restore Main Listeners
    document.getElementById('addProcessBtn').addEventListener('click', () => openModal(false));
    document.getElementById('cancelBtn').addEventListener('click', () => processModal.classList.remove('open'));

    processTypeSelect.addEventListener('change', (e) => {
        renderImageOptions(e.target.value);
        selectedImageInput.value = ''; // Reset selection on type change
    });

    processForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = processNameInput.value.trim();
        const type = processTypeSelect.value;
        const image = selectedImageInput.value;
        const id = document.getElementById('processId').value || Date.now().toString();

        if (!image) {
            imageError.style.display = 'block';
            return;
        }

        const processes = getData();
        let newProcess = { id, name, type, image };

        if (isEditing) {
            const index = processes.findIndex(p => p.id === id);
            if (index !== -1) {
                // Preserve existing data (like track history) and merge new/edited fields
                // Also save the advanced tabs data
                newProcess = {
                    ...processes[index],
                    name,
                    type,
                    image,
                    alerts: tempAlerts,
                    encargados: tempUsers,
                    interesados: tempEmails
                };
                processes[index] = newProcess;
            }
        } else {
            // New Process (Simple)
            // Advanced fields are empty/undefined initially as tabs were hidden
            processes.push(newProcess);
        }

        saveData(processes);
        processModal.classList.remove('open');
        renderProcesses(searchInput.value);
    });

    // --- Management Modal Logic ---
    const manageModal = document.getElementById('manageModal');
    const manageForm = document.getElementById('manageForm');
    const manageTitle = document.getElementById('manageTitle');
    const classificationSelect = document.getElementById('classificationSelect');
    const stepSelect = document.getElementById('stepSelect');
    const trackHistoryContainer = document.getElementById('trackHistory');
    let currentManagingProcessId = null;

    const openManageModal = (process) => {
        currentManagingProcessId = process.id;
        manageTitle.textContent = `Gestionar: ${process.name}`;
        manageModal.classList.add('open');

        // Load Classifications
        const classifications = JSON.parse(localStorage.getItem('classification') || '[]');
        classificationSelect.innerHTML = '<option value="" disabled selected>Seleccione Clasificación</option>';

        classifications.forEach(c => {
            const option = document.createElement('option');
            option.value = c.nombre; // Storing name as per request
            option.dataset.steps = JSON.stringify(c.steps || []);
            option.textContent = c.nombre;
            if (process.currentClassification === c.nombre) option.selected = true;
            classificationSelect.appendChild(option);
        });

        // Load Steps based on current selection or reset
        updateStepOptions(process.currentStep);

        // Render History
        renderTrackHistory(process.track || []);
    };

    const updateStepOptions = (selectedStep = null) => {
        stepSelect.innerHTML = '<option value="" disabled selected>Seleccione Paso</option>';
        const selectedOption = classificationSelect.options[classificationSelect.selectedIndex];

        if (selectedOption && selectedOption.dataset.steps) {
            const steps = JSON.parse(selectedOption.dataset.steps);
            steps.forEach(step => {
                const option = document.createElement('option');
                option.value = step;
                option.textContent = step;
                if (step === selectedStep) option.selected = true;
                stepSelect.appendChild(option);
            });
        }
    };

    classificationSelect.addEventListener('change', () => updateStepOptions());

    document.getElementById('closeManageBtn').addEventListener('click', () => {
        manageModal.classList.remove('open');
    });

    manageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const processes = getData();
        const processIdx = processes.findIndex(p => p.id === currentManagingProcessId);
        if (processIdx === -1) return;

        const process = processes[processIdx];
        const newClassification = classificationSelect.value;
        const newStep = stepSelect.value;

        // Get Current User
        let currentUser = "Desconocido";
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                currentUser = userStr.startsWith('{') ? JSON.parse(userStr).name : userStr;
            }
        } catch (e) { }

        const now = new Date();
        const timestamp = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0') + " " +
            String(now.getHours()).padStart(2, '0') + ":" +
            String(now.getMinutes()).padStart(2, '0') + ":" +
            String(now.getSeconds()).padStart(2, '0');

        const trackEntry = {
            classification: newClassification,
            step: newStep,
            previousStep: process.currentStep || 'Inicio',
            user: currentUser,
            timestamp: timestamp
        };

        // Update Process
        process.currentClassification = newClassification;
        process.currentStep = newStep;
        if (!process.track) process.track = [];
        process.track.unshift(trackEntry); // Add to beginning

        saveData(processes);
        renderProcesses(searchInput.value);
        openManageModal(process); // Re-render modal to show new history
    });

    const renderTrackHistory = (track) => {
        trackHistoryContainer.innerHTML = '';
        if (track.length === 0) {
            trackHistoryContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 10px;">Sin historial de movimientos</div>';
            return;
        }

        track.forEach(t => {
            const item = document.createElement('div');
            item.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            item.style.padding = '8px 0';
            item.style.fontSize = '12px';
            item.style.color = '#555';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <strong style="color: #1a73e8;">${t.step}</strong>
                    <span style="font-size: 11px; opacity: 0.7;">${t.timestamp}</span>
                </div>
                <div>Clasif: ${t.classification}</div>
                <div style="margin-top: 2px; font-style: italic;">Por: ${t.user}</div>
            `;
            trackHistoryContainer.appendChild(item);
        });
    };

    searchInput.addEventListener('keyup', (e) => renderProcesses(e.target.value));

    // --- AI Widget ---
    const aiChatWidget = document.getElementById('aiChatWidget');
    document.getElementById('openAiBtn')?.addEventListener('click', () => {
        aiChatWidget.style.display = aiChatWidget.style.display === 'flex' ? 'none' : 'flex';
    });

    // AI Message Handler
    window.addEventListener('message', (event) => {
        const { action, data } = event.data;
        if (!action || !data) return;

        let processes = getData();
        let message = "";

        switch (action) {
            case 'createProcess':
                // Check if image exists in registry
                let imgFile = data.image; // Assume AI sends exact filename or closest match logic could go here

                // If AI doesn't send specific file, try to match by name or default
                if (!imgFile) {
                    const list = data.type === 'cliente' ? CLIENT_IMAGES : BRAND_IMAGES;
                    // Simple heuristic: try to find substring match or pick random
                    imgFile = list.find(f => f.toLowerCase().includes(data.name.toLowerCase())) || list[0];
                }

                processes.push({
                    id: Date.now().toString(),
                    name: data.name,
                    type: data.type.toLowerCase(), // 'cliente' or 'marca'
                    image: imgFile
                });
                message = `Proceso "${data.name}" creado.`;
                break;

            case 'filterProcess':
                searchInput.value = data.query;
                renderProcesses(data.query);
                message = `Filtrando por "${data.query}".`;
                break;

            case 'setTheme': // Global action
                if (data.theme === 'dark') document.body.classList.add('dark-mode');
                else document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', data.theme);
                message = `Tema cambiado a ${data.theme}.`;
                break;

            case 'logout': // Global action
                localStorage.removeItem('currentUser');
                window.location.href = '../index.html';
                return;
        }

        saveData(processes);
        renderProcesses(searchInput.value);

        if (event.source) {
            event.source.postMessage({ type: 'ai-feedback', message }, event.origin);
        }
    });

    // Initial Render
    renderProcesses();
});
