import { CONFIG, SAMPLES } from './config.js';
import { debounce, saveFile, showToast, getSvgDimensions } from './utils.js';
import { renderDiagram, applyBackground, applyDarkMode, getPanZoomInstance, updateZoomLevel } from './diagram.js';
import { downloadDiagram, exportSvg, exportPdf, copyImageToClipboard } from './export.js';

/**
 * Setup URL code loading
 */
export const setupUrlCodeLoading = (editor) => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        try {
            const decodedCode = decodeURIComponent(atob(code));
            editor.setValue(decodedCode);
            return true;
        } catch (e) {
            console.error('URL parameter decoding error:', e);
            showToast(CONFIG.MESSAGES.URL_DECODE_FAILED);
        }
    }
    return false;
};

/**
 * Setup copy URL button
 */
export const setupCopyUrlButton = (editor) => {
    const copyUrlBtn = document.getElementById('copy-url-btn');
    
    copyUrlBtn.addEventListener('click', () => {
        const mermaidCode = editor.getValue();
        const encodedCode = btoa(encodeURIComponent(mermaidCode));
        const url = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;

        navigator.clipboard.writeText(url).then(() => {
            showToast(CONFIG.MESSAGES.URL_COPIED);
        }, (err) => {
            console.error('Clipboard copy failed:', err);
            showToast(CONFIG.MESSAGES.URL_COPY_FAILED);
        });
    });
};

/**
 * Setup file save/load buttons
 */
export const setupFileButtons = (editor, renderCallback) => {
    const saveTxtBtn = document.getElementById('save-txt-btn');
    const loadTxtBtn = document.getElementById('load-txt-btn');
    const loadTxtInput = document.getElementById('load-txt-input');

    saveTxtBtn.addEventListener('click', async () => {
        const text = editor.getValue();

        try {
            const saved = await saveFile(text, 'mermaid-diagram.txt', 'text/plain');
            if (saved) {
                showToast(CONFIG.MESSAGES.FILE_SAVED);
            }
        } catch (err) {
            console.error('File save error:', err);
            showToast(CONFIG.MESSAGES.FILE_SAVE_FAILED);
        }
    });

    loadTxtBtn.addEventListener('click', () => {
        loadTxtInput.click();
    });

    loadTxtInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            editor.setValue(content);
            renderCallback();

            const data = {
                code: content,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.MERMAID_CODE_KEY, JSON.stringify(data));

            showToast(CONFIG.MESSAGES.FILE_LOADED);
        };
        reader.onerror = () => {
            showToast(CONFIG.MESSAGES.FILE_LOAD_FAILED);
        };
        reader.readAsText(file);

        loadTxtInput.value = '';
    });
};

/**
 * Setup export menu
 */
export const setupExportMenu = () => {
    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-menu');

    exportBtn.addEventListener('click', () => {
        const parent = exportBtn.closest('.export-dropdown');
        const isOpen = parent.classList.contains('open');
        parent.classList.toggle('open');
        exportBtn.setAttribute('aria-expanded', String(!isOpen));
        exportMenu.setAttribute('aria-hidden', String(isOpen));
    });

    document.addEventListener('click', (e) => {
        if (!exportMenu.contains(e.target) && !exportBtn.contains(e.target)) {
            const parent = exportBtn.closest('.export-dropdown');
            if (parent.classList.contains('open')) {
                parent.classList.remove('open');
                exportBtn.setAttribute('aria-expanded', 'false');
                exportMenu.setAttribute('aria-hidden', 'true');
            }
        }
    });

    exportMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('.export-item');
        if (!btn) return;
        
        const format = btn.getAttribute('data-format');
        const parent = exportBtn.closest('.export-dropdown');
        parent.classList.remove('open');
        exportBtn.setAttribute('aria-expanded', 'false');
        exportMenu.setAttribute('aria-hidden', 'true');

        if (format === 'png' || format === 'jpg') {
            downloadDiagram(format);
        } else if (format === 'svg') {
            exportSvg();
        } else if (format === 'pdf') {
            exportPdf();
        }
    });
};

/**
 * Setup copy image button
 */
export const setupCopyImageButton = () => {
    const copyImageBtn = document.getElementById('copy-image-btn');

    copyImageBtn.addEventListener('click', async () => {
        const mermaidDiagram = document.getElementById('mermaid-diagram');
        const svgElement = mermaidDiagram.querySelector('svg');
        
        if (!svgElement) {
            showToast(CONFIG.MESSAGES.NO_DIAGRAM);
            return;
        }

        if (!navigator.clipboard || !navigator.clipboard.write) {
            showToast(CONFIG.MESSAGES.CLIPBOARD_NOT_SUPPORTED);
            return;
        }

        const bbox = getSvgDimensions(svgElement);
        const { width, height } = bbox;

        if (width > CONFIG.MAX_DIMENSION || height > CONFIG.MAX_DIMENSION) {
            console.warn('Diagram dimensions exceed maximum allowed size:', { width, height });
            showToast(CONFIG.MESSAGES.DIAGRAM_TOO_LARGE);
            return;
        }

        try {
            await copyImageToClipboard(svgElement, bbox);
            showToast(CONFIG.MESSAGES.CLIPBOARD_SUCCESS);
        } catch (error) {
            console.error('Clipboard copy error:', error);
            showToast(CONFIG.MESSAGES.CLIPBOARD_FAILED);
        }
    });
};

/**
 * Setup background toggle button
 */
export const setupBackgroundToggle = (currentBackground) => {
    const toggleBackgroundBtn = document.getElementById('toggle-background-btn');
    const backgroundCycle = ['dot', 'grid', 'none'];

    toggleBackgroundBtn.addEventListener('click', () => {
        const idx = backgroundCycle.indexOf(currentBackground.value);
        const nextIdx = (idx + 1) % backgroundCycle.length;
        currentBackground.value = backgroundCycle[nextIdx];
        localStorage.setItem(CONFIG.BACKGROUND_PATTERN_KEY, currentBackground.value);
        applyBackground(currentBackground.value);
    });

    applyBackground(currentBackground.value);
};

/**
 * Setup dark mode toggle
 */
export const setupDarkModeToggle = (isDarkMode, currentBackground, renderCallback) => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    darkModeToggle.addEventListener('click', () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem(CONFIG.DARK_MODE_KEY, isDarkMode.value);
        applyDarkMode(isDarkMode.value, currentBackground.value, renderCallback);
    });
};

/**
 * Setup zoom controls
 */
export const setupZoomControls = () => {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');

    zoomInBtn?.addEventListener('click', () => {
        const panZoomInstance = getPanZoomInstance();
        if (panZoomInstance) {
            panZoomInstance.zoomIn();
            updateZoomLevel(panZoomInstance.getZoom());
        }
    });

    zoomOutBtn?.addEventListener('click', () => {
        const panZoomInstance = getPanZoomInstance();
        if (panZoomInstance) {
            panZoomInstance.zoomOut();
            updateZoomLevel(panZoomInstance.getZoom());
        }
    });

    zoomResetBtn?.addEventListener('click', () => {
        const panZoomInstance = getPanZoomInstance();
        if (panZoomInstance) {
            panZoomInstance.resetZoom();
            panZoomInstance.resize();
            panZoomInstance.fit();
            panZoomInstance.center();
            updateZoomLevel(panZoomInstance.getZoom());
        }
    });
};

/**
 * Setup keyboard shortcuts
 */
export const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('CodeMirror')) return;

        const panZoomInstance = getPanZoomInstance();
        if (!panZoomInstance) return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                panZoomInstance.zoomIn();
                updateZoomLevel(panZoomInstance.getZoom());
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                panZoomInstance.zoomOut();
                updateZoomLevel(panZoomInstance.getZoom());
            } else if (e.key === '0') {
                e.preventDefault();
                panZoomInstance.resetZoom();
                panZoomInstance.resize();
                panZoomInstance.fit();
                panZoomInstance.center();
                updateZoomLevel(panZoomInstance.getZoom());
            } else if (e.key === 'i' || e.key === 'k' || e.key === 'j' || e.key === 'l') {
                e.preventDefault();
                const pan = panZoomInstance.getPan();
                const panStep = 50;

                switch (e.key) {
                    case 'i':
                        panZoomInstance.pan({ x: pan.x, y: pan.y + panStep });
                        break;
                    case 'k':
                        panZoomInstance.pan({ x: pan.x, y: pan.y - panStep });
                        break;
                    case 'j':
                        panZoomInstance.pan({ x: pan.x - panStep, y: pan.y });
                        break;
                    case 'l':
                        panZoomInstance.pan({ x: pan.x + panStep, y: pan.y });
                        break;
                }
            }
        }
    });
};

/**
 * Setup view toggle (mobile code/preview switch)
 */
export const setupViewToggle = (renderCallback) => {
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const splitContainer = document.querySelector('.split-container');
    const codeIcon = viewToggleBtn.querySelector('.code-icon');
    const previewIcon = viewToggleBtn.querySelector('.preview-icon');
    const btnText = viewToggleBtn.querySelector('.btn-text');

    let isCodeView = true;
    splitContainer.classList.add('show-code');

    const updateViewState = (forceCodeView) => {
        const newCodeView = forceCodeView !== undefined ? forceCodeView : isCodeView;
        
        if (newCodeView !== isCodeView) {
            isCodeView = newCodeView;
        }

        if (isCodeView) {
            splitContainer.classList.remove('show-diagram');
            splitContainer.classList.add('show-code');
            codeIcon.style.display = 'block';
            previewIcon.style.display = 'none';
            btnText.textContent = 'Preview';
            viewToggleBtn.title = 'Switch to Preview';
        } else {
            splitContainer.classList.remove('show-code');
            splitContainer.classList.add('show-diagram');
            codeIcon.style.display = 'none';
            previewIcon.style.display = 'block';
            btnText.textContent = 'Code';
            viewToggleBtn.title = 'Switch to Code';

            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                renderCallback().then(() => {
                    const panZoomInstance = getPanZoomInstance();
                    if (panZoomInstance) {
                        panZoomInstance.resize();
                        panZoomInstance.fit();
                        panZoomInstance.center();
                    }
                });
            }, 100);
        }
    };

    // Handle window resize to sync state when crossing mobile breakpoint
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                // Reset to code view when going back to desktop
                updateViewState(true);
                splitContainer.classList.remove('show-code', 'show-diagram');
            } else if (!splitContainer.classList.contains('show-code') && !splitContainer.classList.contains('show-diagram')) {
                // Initialize mobile view if no class is set
                updateViewState(true);
            }
        }, 150);
    };

    window.addEventListener('resize', handleResize);

    viewToggleBtn.addEventListener('click', () => {
        isCodeView = !isCodeView;
        updateViewState();
    });

    // Initial state check
    handleResize();
};

/**
 * Setup sample selector
 */
export const setupSampleSelector = (editor, renderCallback) => {
    const sampleSelector = document.getElementById('sample-selector');

    sampleSelector.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        if (selectedType && SAMPLES[selectedType]) {
            editor.setValue(SAMPLES[selectedType]);
            renderCallback();
        }
    });
};

/**
 * Setup theme selector
 */
export const setupThemeSelector = (editor, currentTheme) => {
    const themeSelector = document.getElementById('theme-selector');

    themeSelector.value = currentTheme;
    themeSelector.addEventListener('change', function () {
        const newTheme = this.value;
        editor.setOption('theme', newTheme);
        localStorage.setItem('editorTheme', newTheme);
    });
};

/**
 * Setup sponsor modal
 */
export const setupSponsorModal = () => {
    const sponsorBtn = document.getElementById('sponsor-btn');
    const sponsorModal = document.getElementById('sponsor-modal');
    const closeModal = document.getElementById('close-modal');

    sponsorBtn.addEventListener('click', () => {
        sponsorModal.classList.add('show');
    });

    closeModal.addEventListener('click', () => {
        sponsorModal.classList.remove('show');
    });

    sponsorModal.addEventListener('click', (e) => {
        if (e.target === sponsorModal) {
            sponsorModal.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sponsorModal.classList.contains('show')) {
            sponsorModal.classList.remove('show');
        }
    });
};

/**
 * Setup window resize handler
 */
export const setupWindowResize = (renderCallback) => {
    let resizeTimeout;
    let wasMobile = window.matchMedia('(max-width: 768px)').matches;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const splitContainer = document.querySelector('.split-container');
            const isDiagramVisible = splitContainer.classList.contains('show-diagram');

            if (wasMobile !== isMobile) {
                wasMobile = isMobile;

                if (!isMobile) {
                    splitContainer.classList.remove('show-code', 'show-diagram');
                    renderCallback().then(() => {
                        const panZoomInstance = getPanZoomInstance();
                        if (panZoomInstance) {
                            panZoomInstance.resize();
                            panZoomInstance.fit();
                            panZoomInstance.center();
                        }
                    });
                } else {
                    if (!isDiagramVisible && !splitContainer.classList.contains('show-code')) {
                        splitContainer.classList.add('show-code');
                    }
                }
            } else if (isMobile && isDiagramVisible) {
                renderCallback().then(() => {
                    const panZoomInstance = getPanZoomInstance();
                    if (panZoomInstance) {
                        panZoomInstance.resize();
                        panZoomInstance.fit();
                        panZoomInstance.center();
                    }
                });
            } else if (!isMobile) {
                const panZoomInstance = getPanZoomInstance();
                if (panZoomInstance) {
                    panZoomInstance.resize();
                    panZoomInstance.fit();
                    panZoomInstance.center();
                }
            }
        }, 300);
    });
};
