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
    const notesTableBody = document.getElementById('notesTableBody');
    const searchInput = document.getElementById('searchInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const noteForm = document.getElementById('noteForm');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');

    // Display Current User
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && userInfo) {
        userInfo.textContent = `Usuario: ${currentUser}`;
    }

    // Form Inputs
    const noteIdInput = document.getElementById('noteId');
    const noteNameInput = document.getElementById('noteName');
    const noteOrderInput = document.getElementById('noteOrder');
    const noteDescInput = document.getElementById('noteDesc');

    let isEditing = false;
    let draggedRow = null;

    // --- Helper Functions ---
    const getNotes = () => {
        try {
            const notes = localStorage.getItem('notes');
            return notes ? JSON.parse(notes) : [];
        } catch (e) {
            console.error("Error reading notes", e);
            return [];
        }
    };

    const saveNotes = (notes) => {
        localStorage.setItem('notes', JSON.stringify(notes));
    };

    const renderTable = (filterText = '') => {
        let notes = getNotes();
        notesTableBody.innerHTML = '';

        // Initial sort by Order
        notes.sort((a, b) => parseFloat(a.orden) - parseFloat(b.orden));

        const filtered = notes.filter(n => {
            const term = filterText.toLowerCase();
            return (n.nombre || '').toLowerCase().includes(term) ||
                (n.descripcion || '').toLowerCase().includes(term);
        });

        if (filtered.length === 0) {
            notesTableBody.innerHTML = `
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

        filtered.forEach((note) => {
            const row = document.createElement('tr');
            row.draggable = true;
            row.dataset.id = note.id;

            // Drag handle + Order
            const orderCell = document.createElement('td');
            orderCell.dataset.label = "Orden";
            orderCell.innerHTML = `<span class="drag-handle">☰</span> ${note.orden}`;

            const nameCell = document.createElement('td');
            nameCell.textContent = note.nombre;
            nameCell.dataset.label = "Nombre";

            const descCell = document.createElement('td');
            descCell.className = 'description-cell';
            descCell.textContent = note.descripcion; // preserves \n with CSS pre-wrap
            descCell.dataset.label = "Descripción";

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.dataset.label = "Acción";

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.id = note.id;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.dataset.id = note.id;

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(orderCell);
            row.appendChild(nameCell);
            row.appendChild(descCell);
            row.appendChild(actionsCell);

            // Drag & Drop Events
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('dragleave', handleDragLeave);
            row.addEventListener('drop', handleDrop);
            row.addEventListener('dragend', handleDragEnd);

            notesTableBody.appendChild(row);
        });
    };

    // --- Drag & Drop Handlers ---
    function handleDragStart(e) {
        draggedRow = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drop-target');
    }

    function handleDragLeave() {
        this.classList.remove('drop-target');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drop-target');

        if (draggedRow !== this) {
            // Reorder visually first
            const allRows = Array.from(notesTableBody.querySelectorAll('tr'));
            const draggedPos = allRows.indexOf(draggedRow);
            const targetPos = allRows.indexOf(this);

            if (draggedPos < targetPos) {
                this.after(draggedRow);
            } else {
                this.before(draggedRow);
            }

            // Sync property "orden" based on new position
            updateOrdersAfterDrop();
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedRow = null;
    }

    const updateOrdersAfterDrop = () => {
        const rows = Array.from(notesTableBody.querySelectorAll('tr'));
        const notes = getNotes();
        const updatedNotes = [];

        rows.forEach((row, index) => {
            const id = row.dataset.id;
            const note = notes.find(n => n.id === id);
            if (note) {
                note.orden = (index + 1).toString(); // Simple re-ordering 1, 2, 3...
                updatedNotes.push(note);
            }
        });

        saveNotes(updatedNotes);
        renderTable(searchInput.value);
    };

    // --- CRUD Handlers ---
    const openModal = (editing = false, note = null) => {
        isEditing = editing;
        noteModal.classList.add('open');
        if (isEditing && note) {
            modalTitle.textContent = 'Editar Nota';
            noteNameInput.value = note.nombre || '';
            noteOrderInput.value = note.orden;
            noteDescInput.value = note.descripcion;
            noteIdInput.value = note.id;
        } else {
            modalTitle.textContent = 'Nueva Nota';
            noteForm.reset();
            noteIdInput.value = '';
            // Auto-increment order
            const notes = getNotes();
            noteOrderInput.value = notes.length + 1;
        }
    };

    const closeModal = () => {
        noteModal.classList.remove('open');
    };

    // --- Event Listeners ---
    searchInput.addEventListener('keyup', (e) => {
        renderTable(e.target.value);
    });

    addNoteBtn.addEventListener('click', () => {
        openModal(false);
    });

    cancelBtn.addEventListener('click', closeModal);

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newNote = {
            id: isEditing ? noteIdInput.value : Date.now().toString(),
            nombre: noteNameInput.value,
            orden: noteOrderInput.value,
            descripcion: noteDescInput.value
        };

        let notes = getNotes();

        if (isEditing) {
            const index = notes.findIndex(n => n.id === newNote.id);
            if (index !== -1) {
                notes[index] = newNote;
            }
        } else {
            notes.push(newNote);
        }

        saveNotes(notes);
        closeModal();
        renderTable(searchInput.value);
    });

    notesTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        let notes = getNotes();

        if (btn.classList.contains('delete-btn')) {
            if (confirm(`¿Estás seguro de eliminar esta nota?`)) {
                const newNotes = notes.filter(n => n.id !== id);
                saveNotes(newNotes);
                renderTable(searchInput.value);
            }
        } else if (btn.classList.contains('edit-btn')) {
            const note = notes.find(n => n.id === id);
            if (note) {
                openModal(true, note);
            }
        }
    });

    // Initial Render
    renderTable();

    // --- General UI Logistics ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (openMenuBtn && sidebar) {
        openMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    }
    if (closeMenuBtn && sidebar) {
        closeMenuBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro?')) window.location.href = '../index.html';
        });
    }



    // AI CRUD Handler - COMPLETO PARA NOTAS COA (con funcionalidad de orden)
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

        let notes = getNotes();
        let message = "";
        let success = true;
        let actionPerformed = false;
        let messages = [];
        let dataChanged = false;

        console.log(`Procesando acción en notas COA: ${action}`, data);

        switch (action) {
            case 'createNote':
                // Validar datos requeridos
                if (!data.nombre || data.nombre.trim() === '' ||
                    !data.descripcion || data.descripcion.trim() === '') {
                    message = "❌ Error: Se necesita nombre y descripción de la nota";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreNota = data.nombre.trim();
                const descripcionNota = data.descripcion.trim();

                // Verificar que no exista (case insensitive)
                const existeNota = notes.some(n =>
                    n.nombre.toLowerCase() === nombreNota.toLowerCase()
                );
                if (existeNota) {
                    message = `❌ Error: Ya existe una nota llamada "${nombreNota}"`;
                    success = false;
                    messages.push(message);
                } else {
                    // Determinar orden (si no se especifica, va al final)
                    let ordenNota = data.orden ? data.orden.toString() : (notes.length + 1).toString();

                    // Si el orden ya existe, reordenar todas las notas
                    const ordenNum = parseInt(ordenNota);
                    if (ordenNum <= notes.length) {
                        // Reasignar órdenes
                        notes.forEach(note => {
                            const noteOrden = parseInt(note.orden);
                            if (noteOrden >= ordenNum) {
                                note.orden = (noteOrden + 1).toString();
                            }
                        });
                    }

                    // Crear nueva nota
                    const nuevaNota = {
                        id: Date.now().toString(),
                        nombre: nombreNota,
                        descripcion: descripcionNota,
                        orden: ordenNota
                    };

                    notes.push(nuevaNota);

                    // Ordenar por orden numérico
                    notes.sort((a, b) => parseInt(a.orden) - parseInt(b.orden));

                    message = `✅ Nota "${nombreNota}" creada en posición ${ordenNota}`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'updateNote':
                // Validar datos requeridos
                if (!data.originalName || data.originalName.trim() === '') {
                    // Intentar con id si no hay originalName
                    if (!data.id) {
                        message = "❌ Error: Se necesita nombre original o ID de la nota";
                        success = false;
                        messages.push(message);
                        break;
                    }
                }

                // Buscar nota (por nombre o id, case insensitive para nombre)
                const searchTerm = data.originalName ? data.originalName.trim().toLowerCase() : null;
                const noteId = data.id;

                const indexUpdate = notes.findIndex(n =>
                    (searchTerm && n.nombre.toLowerCase() === searchTerm) ||
                    (noteId && n.id === noteId)
                );

                if (indexUpdate === -1) {
                    message = `❌ Error: No se encontró la nota`;
                    success = false;
                    messages.push(message);
                } else {
                    const notaActual = notes[indexUpdate];
                    const nombreAnterior = notaActual.nombre;

                    // Verificar si se está cambiando el nombre y si ya existe
                    if (data.nombre && data.nombre.trim() !== '' &&
                        data.nombre.trim().toLowerCase() !== nombreAnterior.toLowerCase()) {
                        const nuevoNombre = data.nombre.trim();
                        const nombreYaExiste = notes.some((n, idx) =>
                            idx !== indexUpdate && n.nombre.toLowerCase() === nuevoNombre.toLowerCase()
                        );

                        if (nombreYaExiste) {
                            message = `❌ Error: Ya existe otra nota llamada "${nuevoNombre}"`;
                            success = false;
                            messages.push(message);
                            break;
                        }
                    }

                    // Manejar cambio de orden si se especifica
                    if (data.orden && data.orden.toString() !== notaActual.orden) {
                        const nuevoOrden = data.orden.toString();
                        const ordenNum = parseInt(nuevoOrden);
                        const ordenActual = parseInt(notaActual.orden);

                        if (ordenNum !== ordenActual) {
                            // Reordenar todas las notas
                            if (ordenNum < ordenActual) {
                                // Mover hacia arriba
                                notes.forEach(note => {
                                    const noteOrden = parseInt(note.orden);
                                    if (noteOrden >= ordenNum && noteOrden < ordenActual) {
                                        note.orden = (noteOrden + 1).toString();
                                    }
                                });
                            } else {
                                // Mover hacia abajo
                                notes.forEach(note => {
                                    const noteOrden = parseInt(note.orden);
                                    if (noteOrden > ordenActual && noteOrden <= ordenNum) {
                                        note.orden = (noteOrden - 1).toString();
                                    }
                                });
                            }
                        }
                    }

                    // Actualizar campos
                    notes[indexUpdate] = {
                        ...notaActual,
                        nombre: data.nombre ? data.nombre.trim() : notaActual.nombre,
                        descripcion: data.descripcion !== undefined ? data.descripcion.trim() : notaActual.descripcion,
                        orden: data.orden ? data.orden.toString() : notaActual.orden
                    };

                    // Reordenar por orden numérico
                    notes.sort((a, b) => parseInt(a.orden) - parseInt(b.orden));

                    message = `✅ Nota "${nombreAnterior}" actualizada`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'deleteNote':
                // Validar datos requeridos
                if ((!data.nombre || data.nombre.trim() === '') && !data.id) {
                    message = "❌ Error: Se necesita nombre o ID de la nota";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreEliminar = data.nombre ? data.nombre.trim().toLowerCase() : null;
                const idEliminar = data.id;

                // Buscar nota
                const deleteIndex = notes.findIndex(n =>
                    (nombreEliminar && n.nombre.toLowerCase() === nombreEliminar) ||
                    (idEliminar && n.id === idEliminar)
                );

                if (deleteIndex === -1) {
                    message = `❌ Error: No se encontró la nota`;
                    success = false;
                    messages.push(message);
                } else {
                    const eliminada = notes[deleteIndex].nombre;
                    const ordenEliminada = parseInt(notes[deleteIndex].orden);

                    // Eliminar la nota
                    notes.splice(deleteIndex, 1);

                    // Reasignar órdenes de las notas restantes
                    notes.forEach(note => {
                        const noteOrden = parseInt(note.orden);
                        if (noteOrden > ordenEliminada) {
                            note.orden = (noteOrden - 1).toString();
                        }
                    });

                    message = `✅ Nota "${eliminada}" eliminada correctamente`;
                    actionPerformed = true;
                    dataChanged = true;
                    messages.push(message);
                }
                break;

            case 'reorderNote':
                // Validar datos requeridos
                if ((!data.nombre || data.nombre.trim() === '') && !data.id) {
                    message = "❌ Error: Se necesita nombre o ID de la nota";
                    success = false;
                    messages.push(message);
                    break;
                }

                if (!data.orden || data.orden.toString().trim() === '') {
                    message = "❌ Error: Se necesita la nueva posición (orden)";
                    success = false;
                    messages.push(message);
                    break;
                }

                const nombreReordenar = data.nombre ? data.nombre.trim().toLowerCase() : null;
                const idReordenar = data.id;
                const nuevoOrden = parseInt(data.orden.toString());

                // Buscar nota
                const reorderIndex = notes.findIndex(n =>
                    (nombreReordenar && n.nombre.toLowerCase() === nombreReordenar) ||
                    (idReordenar && n.id === idReordenar)
                );

                if (reorderIndex === -1) {
                    message = `❌ Error: No se encontró la nota`;
                    success = false;
                    messages.push(message);
                    break;
                }

                if (nuevoOrden < 1 || nuevoOrden > notes.length) {
                    message = `❌ Error: La posición ${nuevoOrden} no es válida (debe estar entre 1 y ${notes.length})`;
                    success = false;
                    messages.push(message);
                    break;
                }

                const notaReordenar = notes[reorderIndex];
                const ordenActual = parseInt(notaReordenar.orden);

                if (nuevoOrden === ordenActual) {
                    message = `⚠️ La nota ya está en la posición ${ordenActual}`;
                    success = false;
                    messages.push(message);
                    break;
                }

                // Reordenar todas las notas
                if (nuevoOrden < ordenActual) {
                    // Mover hacia arriba
                    notes.forEach(note => {
                        const noteOrden = parseInt(note.orden);
                        if (noteOrden >= nuevoOrden && noteOrden < ordenActual) {
                            note.orden = (noteOrden + 1).toString();
                        }
                    });
                } else {
                    // Mover hacia abajo
                    notes.forEach(note => {
                        const noteOrden = parseInt(note.orden);
                        if (noteOrden > ordenActual && noteOrden <= nuevoOrden) {
                            note.orden = (noteOrden - 1).toString();
                        }
                    });
                }

                // Actualizar orden de la nota
                notaReordenar.orden = nuevoOrden.toString();

                // Reordenar array por orden numérico
                notes.sort((a, b) => parseInt(a.orden) - parseInt(b.orden));

                message = `✅ Nota "${notaReordenar.nombre}" movida a posición ${nuevoOrden}`;
                actionPerformed = true;
                dataChanged = true;
                messages.push(message);
                break;

            case 'filterNote':
                // Validar datos
                const query = data.query ? data.query.trim() : '';

                if (searchInput) {
                    searchInput.value = query;
                    renderTable(query);

                    if (query === '') {
                        message = "🗑️ Filtro removido - Mostrando todas las notas";
                    } else {
                        message = `🔍 Notas filtradas por: "${query}"`;
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
                console.log('Acción no reconocida en notas COA:', action);
                message = `⚠️ Acción "${action}" no reconocida`;
                success = false;
                messages.push(message);
                break;
        }

        // Guardar cambios si se modificaron los datos
        if (dataChanged) {
            saveNotes(notes);
        }

        // Re-renderizar tabla si fue una acción relacionada con datos
        if (actionPerformed && ['createNote', 'updateNote', 'deleteNote', 'reorderNote', 'filterNote'].includes(action)) {
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
