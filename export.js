import { CONFIG } from './config.js';
import { getSvgDimensions, prepareSvgForExport, showToast } from './utils.js';

/**
 * Convert SVG to image (PNG/JPG)
 */
export const convertSvgToImage = (svgElement, bbox, format, onSuccess, onError) => {
    const { width, height, x, y } = bbox;
    const clonedSvg = prepareSvgForExport(svgElement);

    console.log('Export size:', {
        width,
        height,
        aspectRatio: (width / height).toFixed(2)
    });

    // Set SVG attributes
    Object.assign(clonedSvg.style, { width: '', height: '', maxWidth: '' });
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    clonedSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

    // Serialize and encode
    const svgXML = new XMLSerializer().serializeToString(clonedSvg).replace(/\0/g, '');

    let svgDataUrl;
    try {
        svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgXML)));
    } catch (e) {
        console.error('SVG encoding error:', e);
        onError(CONFIG.MESSAGES.ENCODE_FAILED);
        return;
    }

    // Convert to image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadTimeout = setTimeout(() => {
        console.error('Image loading timeout');
        onError(CONFIG.MESSAGES.IMAGE_TIMEOUT);
    }, CONFIG.LOAD_TIMEOUT);

    img.onload = () => {
        clearTimeout(loadTimeout);

        try {
            console.log('Image loaded successfully!');
            console.log('Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
            console.log('Expected dimensions:', width, 'x', height);

            if (width <= 0 || height <= 0) {
                console.error('Invalid dimensions:', { width, height });
                onError(CONFIG.MESSAGES.INVALID_DIMENSIONS);
                return;
            }

            if (!img.complete || img.naturalWidth === 0) {
                console.error('Image not fully loaded:', { complete: img.complete, naturalWidth: img.naturalWidth });
                onError(CONFIG.MESSAGES.IMAGE_NOT_LOADED);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width + CONFIG.PADDING * 2;
            canvas.height = height + CONFIG.PADDING * 2;

            console.log('Canvas created with size:', canvas.width, 'x', canvas.height);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Failed to get canvas context');
                onError(CONFIG.MESSAGES.CANVAS_FAILED);
                return;
            }

            // Use dark background if dark mode is enabled
            const isDarkMode = document.body.classList.contains('dark-mode');
            ctx.fillStyle = isDarkMode ? '#1e1e2e' : 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            console.log(`${isDarkMode ? 'Dark' : 'White'} background filled`);

            console.log('Drawing image at:', CONFIG.PADDING, CONFIG.PADDING, 'with size:', width, height);
            ctx.drawImage(img, CONFIG.PADDING, CONFIG.PADDING, width, height);
            console.log('Image drawn successfully');

            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            let dataUrl;
            try {
                dataUrl = canvas.toDataURL(mimeType);
            } catch (e) {
                console.error('Canvas to data URL error:', e);
                onError(CONFIG.MESSAGES.EXPORT_FAILED);
                return;
            }

            if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
                console.error('Generated data URL is empty or invalid');
                console.log('Canvas size:', canvas.width, 'x', canvas.height);
                console.log('Image size:', img.width, 'x', img.height);
                console.log('Data URL length:', dataUrl ? dataUrl.length : 0);
                onError(CONFIG.MESSAGES.EXPORT_EMPTY);
                return;
            }

            onSuccess(dataUrl);
        } catch (e) {
            console.error('Image conversion error:', e);
            onError(CONFIG.MESSAGES.EXPORT_ERROR);
        }
    };

    img.onerror = (e) => {
        clearTimeout(loadTimeout);
        console.error('Image load error:', e);
        console.log('SVG Data URL length:', svgDataUrl ? svgDataUrl.length : 0);
        console.log('SVG XML preview:', svgXML.substring(0, 500));
        onError(CONFIG.MESSAGES.IMAGE_LOAD_ERROR);
    };

    img.src = svgDataUrl;
};

/**
 * Copy image to clipboard
 */
export const copyImageToClipboard = async (svgElement, bbox) => {
    return new Promise((resolve, reject) => {
        convertSvgToImage(
            svgElement,
            bbox,
            'png',
            async (dataUrl) => {
                try {
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();

                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);

                    resolve();
                } catch (error) {
                    console.error('Failed to copy image to clipboard:', error);
                    reject(error);
                }
            },
            (errorMessage) => {
                reject(new Error(errorMessage));
            }
        );
    });
};

/**
 * Download diagram in specified format
 */
export const downloadDiagram = (format) => {
    const mermaidDiagram = document.getElementById('mermaid-diagram');
    const svgElement = mermaidDiagram.querySelector('svg');
    
    if (!svgElement) {
        showToast(CONFIG.MESSAGES.NO_DIAGRAM);
        return;
    }

    console.log('SVG element info:', {
        clientWidth: svgElement.clientWidth,
        clientHeight: svgElement.clientHeight,
        viewBox: svgElement.getAttribute('viewBox')
    });

    const bbox = getSvgDimensions(svgElement);
    const { width, height, x, y } = bbox;
    console.log('Using BBox:', { x, y, width, height });

    // Check dimension limits
    if (width > CONFIG.MAX_DIMENSION || height > CONFIG.MAX_DIMENSION) {
        console.warn('Diagram dimensions exceed maximum allowed size:', { width, height });
        showToast(CONFIG.MESSAGES.DIAGRAM_TOO_LARGE);
        return;
    }

    // Convert and download
    convertSvgToImage(
        svgElement,
        bbox,
        format,
        (dataUrl) => {
            const link = document.createElement('a');
            link.download = `diagram.${format}`;
            link.href = dataUrl;
            link.click();
        },
        (errorMessage) => {
            showToast(errorMessage);
        }
    );
};

/**
 * Export diagram as SVG
 */
export const exportSvg = () => {
    const mermaidDiagram = document.getElementById('mermaid-diagram');
    const svgElement = mermaidDiagram.querySelector('svg');
    
    if (!svgElement) {
        showToast(CONFIG.MESSAGES.NO_DIAGRAM);
        return;
    }

    try {
        const clonedSvg = prepareSvgForExport(svgElement);
        const bbox = getSvgDimensions(svgElement);
        const { width, height, x, y } = bbox;
        
        clonedSvg.setAttribute('width', width);
        clonedSvg.setAttribute('height', height);
        clonedSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
        
        if (!clonedSvg.hasAttribute('xmlns')) {
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        if (!clonedSvg.hasAttribute('xmlns:xlink')) {
            clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        }
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('SVG downloaded successfully!');
    } catch (error) {
        console.error('SVG download error:', error);
        showToast('Failed to download SVG');
    }
};

/**
 * Export diagram as PDF
 */
export const exportPdf = () => {
    const mermaidDiagram = document.getElementById('mermaid-diagram');
    const svgElement = mermaidDiagram.querySelector('svg');
    
    if (!svgElement) {
        showToast(CONFIG.MESSAGES.NO_DIAGRAM);
        return;
    }

    try {
        const bbox = getSvgDimensions(svgElement);
        
        convertSvgToImage(
            svgElement,
            bbox,
            'png',
            (dataUrl) => {
                try {
                    const { jsPDF } = window.jspdf || {};
                    if (!jsPDF) {
                        showToast(CONFIG.MESSAGES.PDF_FAILED);
                        return;
                    }
                    
                    const orientation = bbox.width > bbox.height ? 'landscape' : 'portrait';
                    const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const margin = 20;
                    
                    const imgWidth = bbox.width + CONFIG.PADDING * 2;
                    const imgHeight = bbox.height + CONFIG.PADDING * 2;
                    const maxWidth = pageWidth - margin * 2;
                    const maxHeight = pageHeight - margin * 2;
                    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                    
                    const renderWidth = imgWidth * scale;
                    const renderHeight = imgHeight * scale;
                    const offsetX = (pageWidth - renderWidth) / 2;
                    const offsetY = (pageHeight - renderHeight) / 2;
                    
                    pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight);
                    pdf.save('diagram.pdf');
                    
                    showToast(CONFIG.MESSAGES.PDF_SUCCESS);
                } catch (err) {
                    console.error('PDF generation error:', err);
                    showToast(CONFIG.MESSAGES.PDF_FAILED);
                }
            },
            (errorMessage) => {
                console.error('Failed to convert SVG for PDF:', errorMessage);
                showToast(CONFIG.MESSAGES.PDF_FAILED);
            }
        );
    } catch (err) {
        console.error('PDF export error:', err);
        showToast(CONFIG.MESSAGES.PDF_FAILED);
    }
};
