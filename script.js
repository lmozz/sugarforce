document.addEventListener('DOMContentLoaded', async () => {
    console.log("inicio de sesion");

    // Check if AI models are already downloaded
    const aiModelsStatus = localStorage.getItem('aiModelsDownloaded');
    console.log(aiModelsStatus);
    const aiDownloadModal = document.getElementById('aiDownloadModal');

    // Global AI objects
    window.aiModels = {
        writer: null,
        translator: null,
        detector: null,
        summarizer: null,
        rewriter: null,
        session: null
    };

    // Function to update progress
    function updateProgress(modelName, percentage) {
        const progressFill = document.getElementById(`progress-${modelName}`);
        const progressText = document.getElementById(`text-${modelName}`);
        if (progressFill && progressText) {
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    // Function to download AI models
    async function downloadAIModels() {
        const statusDiv = document.getElementById('downloadStatus');
        const models = ['writer', 'translator', 'detector', 'summarizer', 'rewriter', 'session'];
        let allSuccess = true;

        try {
            // Writer
            statusDiv.textContent = 'Descargando Writer...';
            window.aiModels.writer = await Writer.create({
                monitor(m) {
                    m.addEventListener("downloadprogress", e => {
                        updateProgress('writer', e.loaded * 100);
                    });
                }
            });
            updateProgress('writer', 100);

            // Translator
            statusDiv.textContent = 'Descargando Translator...';
            window.aiModels.translator = await Translator.create({
                sourceLanguage: 'es',
                targetLanguage: 'fr',
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        updateProgress('translator', e.loaded * 100);
                    });
                },
            });
            updateProgress('translator', 100);

            // Detector
            statusDiv.textContent = 'Descargando Detector...';
            window.aiModels.detector = await LanguageDetector.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        updateProgress('detector', e.loaded * 100);
                    });
                },
            });
            updateProgress('detector', 100);

            // Summarizer
            statusDiv.textContent = 'Descargando Summarizer...';
            window.aiModels.summarizer = await Summarizer.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        updateProgress('summarizer', e.loaded * 100);
                    });
                }
            });
            updateProgress('summarizer', 100);

            // Rewriter
            statusDiv.textContent = 'Descargando Rewriter...';
            window.aiModels.rewriter = await Rewriter.create({
                monitor(m) {
                    m.addEventListener("downloadprogress", e => {
                        updateProgress('rewriter', e.loaded * 100);
                    });
                }
            });
            updateProgress('rewriter', 100);

            // Session
            statusDiv.textContent = 'Descargando Session...';
            window.aiModels.session = await LanguageModel.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        updateProgress('session', e.loaded * 100);
                    });
                },
            });
            updateProgress('session', 100);

            statusDiv.textContent = '✓ Todos los modelos descargados correctamente';
            statusDiv.style.color = '#28a745';

            // Mark as successfully downloaded
            localStorage.setItem('aiModelsDownloaded', 'success');

        } catch (error) {
            console.error('Error downloading AI models:', error);
            statusDiv.textContent = '⚠ Error al descargar modelos. Intente refrescar la página.';
            statusDiv.style.color = '#d93025';
            allSuccess = false;

            // Mark as failed
            localStorage.setItem('aiModelsDownloaded', 'failed');
        }

        // Hide modal after 2 seconds
        setTimeout(() => {
            aiDownloadModal.classList.remove('open');
        }, 2000);

        return allSuccess;
    }

    // Check if we need to download
    if (aiModelsStatus === 'success') {
        // Already downloaded, hide modal immediately
        console.log('AI models already downloaded, skipping...');
        aiDownloadModal.classList.remove('open');

        // Set all progress bars to 100%
        const models = ['writer', 'translator', 'detector', 'summarizer', 'rewriter', 'session'];
        models.forEach(model => updateProgress(model, 100));
    } else {
        // Need to download
        console.log('Downloading AI models...');
        await downloadAIModels();
    }

    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.setAttribute('placeholder', ' ');
    });
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value;
        if (username) {
            // Check for special command: save.data
            if (username === 'save.data') {
                const password = prompt('Ingrese la contraseña para exportar los datos:');
                if (password === 'zucaron.sv') {
                    // Export all localStorage data
                    const exportData = {
                        cellar: JSON.parse(localStorage.getItem('cellar') || '[]'),
                        classification: JSON.parse(localStorage.getItem('classification') || '[]'),
                        coa: JSON.parse(localStorage.getItem('coa') || '[]'),
                        coas: JSON.parse(localStorage.getItem('coas') || '[]'),
                        customer: JSON.parse(localStorage.getItem('customer') || '[]'),
                        login: JSON.parse(localStorage.getItem('login') || '[]'),
                        notes: JSON.parse(localStorage.getItem('notes') || '[]'),
                        presentation: JSON.parse(localStorage.getItem('presentation') || '[]'),
                        procesos: JSON.parse(localStorage.getItem('procesos') || '[]'),
                        product: JSON.parse(localStorage.getItem('product') || '[]'),
                        steps: JSON.parse(localStorage.getItem('steps') || '[]')
                    };

                    // Create filename with current date and time
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');
                    const filename = `${year}${month}${day}_${hours}${minutes}${seconds}_sugarforce.json`;

                    // Create and download the file
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert('Datos exportados correctamente.');
                    usernameInput.value = '';
                    return;
                } else {
                    alert('Contraseña incorrecta.');
                    usernameInput.value = '';
                    return;
                }
            }

            // Check for special command: load.data
            if (username === 'load.data') {
                const password = prompt('Ingrese la contraseña para importar los datos:');
                if (password === 'zucaron.sv') {
                    // Create a hidden file input
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.json';
                    fileInput.style.display = 'none';

                    fileInput.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (!file) {
                            usernameInput.value = '';
                            return;
                        }

                        // Show file size in KB or MB
                        const fileSizeKB = (file.size / 1024).toFixed(2);
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        const sizeDisplay = file.size > 1024 * 1024
                            ? `${fileSizeMB} MB`
                            : `${fileSizeKB} KB`;

                        const confirmLoad = confirm(
                            `Archivo: ${file.name}\n` +
                            `Tamaño: ${sizeDisplay}\n\n` +
                            `¿Está seguro de cargar y sobrescribir la data actual?`
                        );

                        if (confirmLoad) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                try {
                                    const importData = JSON.parse(e.target.result);

                                    // Validate that it's the correct format
                                    const requiredKeys = ['cellar', 'classification', 'coa', 'coas', 'customer',
                                        'login', 'notes', 'presentation', 'procesos', 'product', 'steps'];

                                    const hasAllKeys = requiredKeys.every(key => key in importData);

                                    if (!hasAllKeys) {
                                        alert('Error: El archivo JSON no tiene el formato correcto.');
                                        usernameInput.value = '';
                                        return;
                                    }

                                    // Import all data to localStorage
                                    localStorage.setItem('cellar', JSON.stringify(importData.cellar || []));
                                    localStorage.setItem('classification', JSON.stringify(importData.classification || []));
                                    localStorage.setItem('coa', JSON.stringify(importData.coa || []));
                                    localStorage.setItem('coas', JSON.stringify(importData.coas || []));
                                    localStorage.setItem('customer', JSON.stringify(importData.customer || []));
                                    localStorage.setItem('login', JSON.stringify(importData.login || []));
                                    localStorage.setItem('notes', JSON.stringify(importData.notes || []));
                                    localStorage.setItem('presentation', JSON.stringify(importData.presentation || []));
                                    localStorage.setItem('procesos', JSON.stringify(importData.procesos || []));
                                    localStorage.setItem('product', JSON.stringify(importData.product || []));
                                    localStorage.setItem('steps', JSON.stringify(importData.steps || []));

                                    alert('Datos importados correctamente.');
                                    usernameInput.value = '';
                                } catch (error) {
                                    alert('Error al leer el archivo JSON: ' + error.message);
                                    usernameInput.value = '';
                                }
                            };
                            reader.readAsText(file);
                        } else {
                            usernameInput.value = '';
                        }
                    });

                    document.body.appendChild(fileInput);
                    fileInput.click();
                    document.body.removeChild(fileInput);
                    return;
                } else {
                    alert('Contraseña incorrecta.');
                    usernameInput.value = '';
                    return;
                }
            }

            let logins = [];
            try {
                const stored = localStorage.getItem('login');
                if (stored) {
                    logins = JSON.parse(stored);
                }
            } catch (err) {
                console.error("Error parsing login data", err);
                logins = [];
            }
            if (!Array.isArray(logins)) {
                logins = [];
            }

            // Check if user exists
            // Check if user exists
            const exists = logins.some(u => u.usuario === username);

            if (!exists) {
                const create = confirm("El usuario no existe. ¿Desea crearlo?");
                if (create) {
                    logins.push({ "usuario": username });
                    localStorage.setItem('login', JSON.stringify(logins));
                    alert("Usuario creado correctamente. Por favor, inicie sesión nuevamente.");
                    usernameInput.value = '';
                    return;
                } else {
                    return;
                }
            }

            // Save current session user logic moved to after TFA

            // --- TFA Logic ---
            const tfaModal = document.getElementById('tfaModal');
            const cancelTfaBtn = document.getElementById('cancelTfaBtn');
            let tfaInterval;

            // 1. Initialize TFA
            localStorage.setItem('tfa', 'false');

            // 2. Show Modal
            tfaModal.classList.add('open');

            // 3. Start Polling
            tfaInterval = setInterval(() => {
                const tfaStatus = localStorage.getItem('tfa');
                if (tfaStatus === 'true') {
                    // Approved!
                    clearInterval(tfaInterval);

                    // Finalize Login
                    localStorage.setItem('currentUser', username);
                    localStorage.removeItem('tfa'); // Clean up

                    window.location.href = 'pasos/pasos.html';
                }
            }, 1000);

            // 4. Cancel Handler
            cancelTfaBtn.onclick = () => {
                clearInterval(tfaInterval);
                tfaModal.classList.remove('open');
                localStorage.removeItem('tfa');
            };
        }
    });
    const themeToggleBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');

            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});