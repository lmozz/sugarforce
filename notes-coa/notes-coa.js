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

    const openAiBtn = document.getElementById('openAiBtn');
    const aiChatWidget = document.getElementById('aiChatWidget');

    if (openAiBtn && aiChatWidget) {
        openAiBtn.addEventListener('click', () => {
            const currentDisplay = window.getComputedStyle(aiChatWidget).display;
            aiChatWidget.style.display = currentDisplay === 'flex' ? 'none' : 'flex';
        });
    }
});
