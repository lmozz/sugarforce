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

    // --- AI Widget Activation (Immediate) ---
    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');
    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            aiChatWidget.classList.toggle('open');
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



    // AI CRUD Handler - COMPLETO PARA PRODUCTOS (con validación de presentaciones)
    window.addEventListener('message', (event) => {
        // Validar que sea un mensaje válido
        if (!event.data || typeof event.data !== 'object') {
            console.warn('Mensaje AI inválido recibido');
            return;
        }

        const { action, data } = event.data;

        // Validaciones básicas
        if (!action || !data || typeof data !== 'object') {
            console.warn('Mensaje AI con formato inválido:', event.data);
            return;
        }

        let products = getProducts();
        let presentations = getPresentations(); // Obtener presentaciones para validar
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let dataChanged = false;

        console.log(`Procesando acción en productos: ${action}`, data);
        console.log('Presentaciones disponibles:', presentations.map(p => p.nombre));

        switch (action) {
            case 'createProduct':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: El nombre del producto es requerido";
                    success = false;
                    messages.push(message);
                    break;
                }

                if (!data.presentacion || data.presentacion.trim() === '') {
                    message = "❌ Error: La presentación del producto es requerida";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreProducto = data.nombre.trim();
                const presentacionProducto = data.presentacion.trim();

                // Verificar que el producto no exista (case insensitive)
                const existeProducto = products.some(p =>
                    p.nombre.toLowerCase() === nombreProducto.toLowerCase()
                );
                if (existeProducto) {
                    message = `❌ Error: Ya existe un producto llamado "${nombreProducto}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // VERIFICACIÓN CRÍTICA: La presentación debe existir
                const presentacionExiste = presentations.some(p =>
                    p.nombre.toLowerCase() === presentacionProducto.toLowerCase()
                );

                if (!presentacionExiste) {
                    // Buscar presentaciones similares (case insensitive)
                    const presentacionesSimilares = presentations.filter(p =>
                        p.nombre.toLowerCase().includes(presentacionProducto.toLowerCase()) ||
                        presentacionProducto.toLowerCase().includes(p.nombre.toLowerCase())
                    );

                    if (presentacionesSimilares.length > 0) {
                        const sugerencias = presentacionesSimilares.map(p => p.nombre).join(', ');
                        message = `❌ Error: La presentación "${presentacionProducto}" no existe. ` +
                            `¿Quisiste decir alguna de estas?: ${sugerencias}`;
                    } else {
                        const todasPresentaciones = presentations.map(p => p.nombre).join(', ');
                        message = `❌ Error: La presentación "${presentacionProducto}" no existe. ` +
                            `Presentaciones disponibles: ${todasPresentaciones || "ninguna (debes crear presentaciones primero)"}`;
                    }
                    success = false;
                    messages.push(message);
                    break;
                }

                // Obtener el nombre exacto de la presentación (preservar capitalización)
                const presentacionExacta = presentations.find(p =>
                    p.nombre.toLowerCase() === presentacionProducto.toLowerCase()
                ).nombre;

                // Crear nuevo producto
                const nuevoProducto = {
                    nombre: nombreProducto,
                    descripcion: data.descripcion ? data.descripcion.trim() : nombreProducto,
                    presentacion: presentacionExacta
                };

                products.push(nuevoProducto);
                message = `✅ Producto "${nombreProducto}" creado con presentación "${presentacionExacta}"`;
                actionPerformed = true;
                dataChanged = true;
                messages.push(message);
                break;

            case 'updateProduct':
                // Validar datos requeridos
                if (!data.originalName || data.originalName.trim() === '') {
                    message = "❌ Error: Se necesita el nombre original del producto";
                    success = false;
                    messages.push(message);
                    break;
                }

                const originalName = data.originalName.trim();

                // Buscar producto (case insensitive)
                const indexUpdate = products.findIndex(p =>
                    p.nombre.toLowerCase() === originalName.toLowerCase()
                );

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró el producto "${originalName}"`;
                    success = false;
                    messages.push(message);
                    break;
                }

                const productoActual = products[indexUpdate];
                const nombreAnterior = productoActual.nombre;

                // Verificar si se está cambiando el nombre y si ya existe
                if (data.nombre && data.nombre.trim() !== '' &&
                    data.nombre.trim().toLowerCase() !== nombreAnterior.toLowerCase()) {
                    const nuevoNombre = data.nombre.trim();
                    const nombreYaExiste = products.some((p, idx) =>
                        idx !== indexUpdate && p.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                    );

                    if (nombreYaExiste) {
                        message = `❌ Error: Ya existe otro producto llamado "${nuevoNombre}"`;
                        success = false;
                        messages.push(message);
                        break;
                    }
                }

                // VERIFICACIÓN: Si se cambia la presentación, debe existir
                if (data.presentacion && data.presentacion.trim() !== '') {
                    const nuevaPresentacion = data.presentacion.trim();
                    const presentacionValida = presentations.some(p =>
                        p.nombre.toLowerCase() === nuevaPresentacion.toLowerCase()
                    );

                    if (!presentacionValida) {
                        const todasPresentaciones = presentations.map(p => p.nombre).join(', ');
                        message = `❌ Error: La presentación "${nuevaPresentacion}" no existe. ` +
                            `Presentaciones disponibles: ${todasPresentaciones}`;
                        success = false;
                        messages.push(message);
                        break;
                    }

                    // Usar nombre exacto de la presentación
                    const presentacionExacta = presentations.find(p =>
                        p.nombre.toLowerCase() === nuevaPresentacion.toLowerCase()
                    ).nombre;
                    data.presentacion = presentacionExacta;
                }

                // Actualizar campos
                products[indexUpdate] = {
                    ...productoActual,
                    nombre: data.nombre ? data.nombre.trim() : productoActual.nombre,
                    descripcion: data.descripcion !== undefined ? data.descripcion.trim() : productoActual.descripcion,
                    presentacion: data.presentacion !== undefined ? data.presentacion : productoActual.presentacion
                };

                message = `✅ Producto "${nombreAnterior}" actualizado`;
                actionPerformed = true;
                dataChanged = true;
                messages.push(message);
                break;

            case 'deleteProduct':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '') {
                    message = "❌ Error: Se necesita el nombre del producto";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre.trim();

                // Buscar producto (case insensitive)
                const deleteIndex = products.findIndex(p =>
                    p.nombre.toLowerCase() === nombreEliminar.toLowerCase()
                );

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró el producto "${nombreEliminar}"`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminado = products[deleteIndex].nombre;
                    products.splice(deleteIndex, 1);
                    message = `✅ Producto "${eliminado}" eliminado correctamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'filterProduct':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todos los productos";
                    } else {
                        message = `🔍 Productos filtrados por: "${query}"`;
                    }
                    actionPerformed = true;
                    messages.push(message);
                } else {
                    message = "❌ Error: Elemento de búsqueda no encontrado";
                    success = false;
                    messages.push(message);
                }
                break;

            case 'setTheme':
                if (data.theme === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
                localStorage.setItem('theme', data.theme);
                message = `🎨 Tema cambiado a modo ${data.theme === 'dark' ? 'oscuro' : 'claro'}`;
                actionPerformed = true;
                messages.push(message);
                break;

            case 'logout':
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = '../index.html';
                }
                return;

            default:
                console.log('Acción no reconocida en productos:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los datos
        if (dataChanged) {
            saveProducts(products);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createProduct', 'updateProduct', 'deleteProduct', 'filterProduct'].includes(action)) {
            setTimeout(() => {
                renderTable(searchInput ? searchInput.value : '');
            }, 100);
        }

        // Enviar retroalimentación a la IA
        if (event.source) {
            // Enviar cada mensaje individualmente
            messages.forEach(msg => {
                event.source.postMessage({
                    type: 'ai-feedback',
                    message: msg,
                    success: success,
                    action: action
                }, event.origin);
            });
        }

        // Mostrar notificación visual si hay error
        if (!success && messages.some(m => m.includes('❌'))) {
            const errorMessages = messages.filter(m => m.includes('❌'));
            if (errorMessages.length > 0) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-notification';
                errorMsg.textContent = errorMessages[0].replace('❌ ', '');
                errorMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff6b6b;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                    max-width: 300px;
                    word-wrap: break-word;
                `;
                document.body.appendChild(errorMsg);
                setTimeout(() => errorMsg.remove(), 3000);
            }
        }

        // Mostrar notificación de éxito
        if (success && actionPerformed && messages.some(m => m.includes('✅'))) {
            const successMessages = messages.filter(m => m.includes('✅'));
            if (successMessages.length > 0) {
                const successMsg = document.createElement('div');
                successMsg.className = 'success-notification';
                successMsg.textContent = successMessages[0].replace('✅ ', '');
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4caf50;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                    max-width: 300px;
                    word-wrap: break-word;
                `;
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 2000);
            }
        }
    });
});
