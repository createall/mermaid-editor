document.addEventListener('DOMContentLoaded', async () => {
    // Get saved split sizes (default to [50, 50] if not found)
    const savedSizes = localStorage.getItem('split-sizes');
    const initialSizes = savedSizes ? JSON.parse(savedSizes) : [50, 50];

    // Initialize Split.js
    Split(['#editor-pane', '#diagram-pane'], {
        sizes: initialSizes,
        minSize: 200,
        gutterSize: 10,
        cursor: 'col-resize',
        onDragEnd: (sizes) => {
            // Save sizes on drag end
            localStorage.setItem('split-sizes', JSON.stringify(sizes));
            // Resize panZoom when panel size changes
            if (panZoomInstance) {
                panZoomInstance.resize();
                panZoomInstance.fit();
                panZoomInstance.center();
            }
        }
    });

    mermaid.initialize({ startOnLoad: false });

    const copyUrlBtn = document.getElementById('copy-url-btn');
    const saveTxtBtn = document.getElementById('save-txt-btn');
    const loadTxtBtn = document.getElementById('load-txt-btn');
    const loadTxtInput = document.getElementById('load-txt-input');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadJpgBtn = document.getElementById('download-jpg-btn');
    const mermaidInput = document.getElementById('mermaid-input');
    const lineNumbers = document.getElementById('line-numbers');
    const mermaidDiagram = document.getElementById('mermaid-diagram');
    const toast = document.getElementById('toast-notification');
    let panZoomInstance = null;

    // Function to update line numbers
    const updateLineNumbers = () => {
        const numberOfLines = mermaidInput.value.split('\n').length;
        lineNumbers.innerHTML = Array(numberOfLines).fill(0).map((_, i) => i + 1).join('<br>');
    };

    // Sync scroll
    mermaidInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = mermaidInput.scrollTop;
    });

    // Update line numbers on input
    mermaidInput.addEventListener('input', updateLineNumbers);

    // Debounce function: executes the function if there are no further calls for the specified time.
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    const renderDiagram = async () => {
        try {
            mermaidDiagram.innerHTML = ''; // Clear existing diagram
            const mermaidCode = mermaidInput.value;
            const { svg } = await mermaid.render('graphDiv', mermaidCode);
            mermaidDiagram.innerHTML = svg;

            // Initialize SVG Pan Zoom
            const svgElement = mermaidDiagram.querySelector('svg');
            if (svgElement) {
                // Destroy existing instance if present (prevent memory leaks)
                if (panZoomInstance) {
                    try { panZoomInstance.destroy(); } catch(e) {}
                }

                // Adjust Mermaid SVG style (prevent conflict with PanZoom)
                // Remove max-width set by Mermaid and set to 100% to fill the container
                svgElement.style.maxWidth = 'none';
                svgElement.style.height = '100%';
                svgElement.style.width = '100%';

                panZoomInstance = svgPanZoom(svgElement, {
                    zoomEnabled: true,
                    controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.5,
                    maxZoom: 10
                });
            }
        } catch (e) {
            console.error(e);
            mermaidDiagram.innerHTML = '';
            
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#721c24';
            errorDiv.style.backgroundColor = '#f8d7da';
            errorDiv.style.border = '1px solid #f5c6cb';
            errorDiv.style.padding = '15px';
            errorDiv.style.borderRadius = '4px';
            errorDiv.style.textAlign = 'left';
            errorDiv.style.overflow = 'auto';

            const title = document.createElement('div');
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '10px';
            title.textContent = 'Diagram Syntax Error:';
            errorDiv.appendChild(title);

            const pre = document.createElement('pre');
            pre.style.margin = '0';
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.fontFamily = 'monospace';
            pre.style.fontSize = '14px';
            pre.textContent = e.message || String(e);
            errorDiv.appendChild(pre);

            mermaidDiagram.appendChild(errorDiv);
        }
    };

    const setMermaidCodeFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            try {
                // Base64 decode then URI decode
                const decodedCode = decodeURIComponent(atob(code));
                mermaidInput.value = decodedCode;
                return true;
            } catch (e) {
                console.error('URL 파라미터 디코딩 오류:', e);
                showToast('Failed to load code from URL.');
            }
        }
        return false;
    };

    copyUrlBtn.addEventListener('click', () => {
        const mermaidCode = mermaidInput.value;
        // URI encode then Base64 encode
        const encodedCode = btoa(encodeURIComponent(mermaidCode));
        const url = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;
        
        navigator.clipboard.writeText(url).then(() => {
            showToast('Share URL copied to clipboard!');
        }, (err) => {
            console.error('클립보드 복사 실패:', err);
            showToast('Failed to copy URL.');
        });
    });

    // Save text file
    saveTxtBtn.addEventListener('click', async () => {
        const text = mermaidInput.value;
        
        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'mermaid-diagram.txt',
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt', '.mmd'] },
                    }],
                });
                
                const writable = await handle.createWritable();
                await writable.write(text);
                await writable.close();
                showToast('File saved successfully!');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('File save error:', err);
                    showToast('Failed to save file.');
                }
            }
        } else {
            // Fallback: Traditional download method
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mermaid-diagram.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // Click load text file button
    loadTxtBtn.addEventListener('click', () => {
        loadTxtInput.click();
    });

    // Handle file selection
    loadTxtInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            mermaidInput.value = content;
            
            // Update line numbers and render
            updateLineNumbers();
            renderDiagram();
            
            // Update auto-save
            const data = {
                code: content,
                timestamp: Date.now()
            };
            localStorage.setItem('mermaid-code', JSON.stringify(data));
            
            showToast('File loaded successfully!');
        };
        reader.onerror = () => {
            showToast('Failed to read file.');
        };
        reader.readAsText(file);
        
        // Reset to allow selecting the same file again
        loadTxtInput.value = '';
    });

    const downloadDiagram = (format) => {
        const svgElement = mermaidDiagram.querySelector('svg');
        if (!svgElement) {
            showToast('No diagram to download.');
            return;
        }

        // 1. Calculate size and position (performed on original DOM)
        let width, height, x, y;
        const originalViewport = svgElement.querySelector('.svg-pan-zoom_viewport');
        
        if (originalViewport) {
            // Use BBox of internal viewport if svg-pan-zoom is applied
            const bbox = originalViewport.getBBox();
            width = bbox.width;
            height = bbox.height;
            x = bbox.x;
            y = bbox.y;
        } else {
            // If svg-pan-zoom is not applied
            if (svgElement.viewBox && svgElement.viewBox.baseVal && svgElement.viewBox.baseVal.width > 0) {
                width = svgElement.viewBox.baseVal.width;
                height = svgElement.viewBox.baseVal.height;
                x = svgElement.viewBox.baseVal.x;
                y = svgElement.viewBox.baseVal.y;
            } else {
                const bbox = svgElement.getBBox();
                width = bbox.width;
                height = bbox.height;
                x = bbox.x;
                y = bbox.y;
            }
        }

        // 2. Clone SVG
        const clonedSvg = svgElement.cloneNode(true);

        // 3. Remove svg-pan-zoom transformations
        const clonedViewport = clonedSvg.querySelector('.svg-pan-zoom_viewport');
        if (clonedViewport) {
            clonedViewport.removeAttribute('transform');
            clonedViewport.removeAttribute('style');
        }

        // 4. Reset root SVG attributes
        clonedSvg.style.width = '';
        clonedSvg.style.height = '';
        clonedSvg.style.maxWidth = '';
        
        clonedSvg.setAttribute('width', width);
        clonedSvg.setAttribute('height', height);
        clonedSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

        const svgXML = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgXML], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const padding = 20;

            canvas.width = width + padding * 2;
            canvas.height = height + padding * 2;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 이미지를 원본 크기로 그림
            ctx.drawImage(img, padding, padding, width, height);

            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType);

            const link = document.createElement('a');
            link.download = `diagram.${format}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        };
        img.onerror = (e) => {
            console.error('이미지 로드 오류:', e);
            showToast('Error converting image.');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    downloadPngBtn.addEventListener('click', () => downloadDiagram('png'));
    downloadJpgBtn.addEventListener('click', () => downloadDiagram('jpg'));

    // Render function with 300ms debounce
    const debouncedRender = debounce(renderDiagram, 300);

    // Auto-save and call debounced render function on text input
    mermaidInput.addEventListener('input', () => {
        const data = {
            code: mermaidInput.value,
            timestamp: Date.now()
        };
        localStorage.setItem('mermaid-code', JSON.stringify(data));
        debouncedRender();
    });

    // Handle URL parameters and initial render
    const loadedFromUrl = setMermaidCodeFromUrl();
    
    if (!loadedFromUrl) {
        const savedData = localStorage.getItem('mermaid-code');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                const oneHour = 60 * 60 * 1000; // 1 hour (milliseconds)

                if (parsedData && parsedData.timestamp && parsedData.code) {
                    if (Date.now() - parsedData.timestamp < oneHour) {
                        mermaidInput.value = parsedData.code;
                    } else {
                        console.log('Auto-saved code expired.');
                        localStorage.removeItem('mermaid-code');
                    }
                }
            } catch (e) {
                // Ignore if legacy format (plain text) or invalid JSON
                console.log('Invalid or legacy auto-save data found.');
            }
        }
    }

    updateLineNumbers(); // Set initial line numbers
    await renderDiagram();
});



