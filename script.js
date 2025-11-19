
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

    mermaid.initialize({ 
        startOnLoad: false,
        securityLevel: 'strict',
        flowchart: { 
            htmlLabels: false,
            useMaxWidth: false
        }
    });

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
    const sampleSelector = document.getElementById('sample-selector');
    let panZoomInstance = null;

    // Sample codes for different diagram types
    const samples = {
        flowchart: `graph TD
    A[Start] --> B{Is it?}
    B -- Yes --> C[OK]
    C --> D[Rethink]
    D --> B
    B -- No --> E[End]`,
        sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
        class: `classDiagram
    Class01 <|-- AveryLongClass : Cool
    Class03 *-- Class04
    Class05 o-- Class06
    Class07 .. Class08
    Class09 --> C2 : Where am i?
    Class09 --* C3
    Class09 --|> Class07
    Class07 : equals()
    Class07 : Object[] elementData
    Class01 : size()
    Class01 : int chimp
    Class01 : int gorilla
    Class08 <--> C2: Cool label`,
        state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
        er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
        journey: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
        gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
        pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
        quadrant: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
        requirement: `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`,
        git: `gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit
   commit`,
        c4: `C4Context
  title System Context diagram for Internet Banking System
  Enterprise_Boundary(b0, "BankBoundary0") {
    Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
    System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

    System_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

    System_Ext(SystemC, "E-mail System", "The internal Microsoft Exchange e-mail system.")
    System_Ext(SystemD, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

    Rel(customerA, SystemAA, "Uses")
    Rel(SystemAA, SystemE, "Uses")
    Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
    Rel(SystemAA, SystemD, "Uses")
  }`,
        mindmap: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`,
        timeline: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter`,
        zenuml: `zenuml
    title Demo
    Alice->John: Hello John, how are you?
    John->Alice: Great!
    Alice->John: See you later!`,
        sankey: `sankey-beta

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144`,
        xy: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`,
        block: `block-beta
columns 1
  db("DB")
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px`,
        packet: `packet-beta
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"
128-143: "Checksum"
144-159: "Urgent Pointer"
160-191: "(Options and Padding)"
192-255: "Data"`,
        kanban: `---
config:
  kanban:
    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases.]
  Ready for test
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
  Done
    id5[define getData]`,
        architecture: `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`,
        radar: `---
config:
  radar:
    curve: linear
---
radar
  title "Skills"
  "Communication" 80
  "Problem Solving" 90
  "Teamwork" 85
  "Creativity" 75
  "Technical" 95`,
        treemap: `treemap
    title "Sales by Region"
    "North America"
        "USA": 45000
        "Canada": 15000
    "Europe"
        "UK": 25000
        "Germany": 30000
        "France": 20000
    "Asia"
        "Japan": 35000
        "China": 40000`
    };

    // Handle sample selection
    sampleSelector.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        if (selectedType && samples[selectedType]) {
            mermaidInput.value = samples[selectedType];
            updateLineNumbers();
            renderDiagram();
            
            // Keep the selector showing the selected value instead of resetting
            // e.target.value = "";  // Removed this line
        }
    });

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
                // Log original SVG size before applying pan-zoom
                const viewport = svgElement.querySelector('.svg-pan-zoom_viewport') || svgElement;
                const bbox = viewport.getBBox();
                console.log('=== Rendered Diagram Info ===');
                console.log('Original SVG size:', {
                    width: bbox.width,
                    height: bbox.height,
                    x: bbox.x,
                    y: bbox.y,
                    aspectRatio: (bbox.width / bbox.height).toFixed(2)
                });
                console.log('SVG viewBox:', svgElement.getAttribute('viewBox'));
                console.log('============================');
                
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
        
        console.log('SVG element info:', {
            clientWidth: svgElement.clientWidth,
            clientHeight: svgElement.clientHeight,
            viewBox: svgElement.getAttribute('viewBox'),
            hasViewport: !!originalViewport
        });
        
        // Get the actual content size
        if (originalViewport) {
            // Use the viewport's complete bounding box to include all content (titles, labels, etc.)
            const bbox = originalViewport.getBBox();
            width = bbox.width;
            height = bbox.height;
            x = bbox.x;
            y = bbox.y;
            console.log('Using complete viewport BBox (includes all content):', { x, y, width, height });
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

        // 3. Inject all styles into the cloned SVG to ensure proper rendering
        const styleElement = document.createElement('style');
        let cssStyles = '';
        
        // Collect styles from all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            
            // Skip external stylesheets to avoid CORS issues
            if (sheet.href) continue;

            try {
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                    for (let j = 0; j < rules.length; j++) {
                        const cssText = rules[j].cssText;
                        
                        // Filter out rules with external URLs (not data URIs or internal references)
                        if (/url\s*\((?!['"]?(?:data:|#))/i.test(cssText)) {
                            continue;
                        }
                        
                        cssStyles += cssText + '\n';
                    }
                }
            } catch (e) {
                console.warn('Cannot access stylesheet:', e);
            }
        }
        
        styleElement.textContent = cssStyles;
        clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

        // 4. Remove svg-pan-zoom transformations
        const clonedViewport = clonedSvg.querySelector('.svg-pan-zoom_viewport');
        if (clonedViewport) {
            clonedViewport.removeAttribute('transform');
            clonedViewport.removeAttribute('style');
        }

        // 5. Use original content size for export (no scaling)
        let exportWidth = width;
        let exportHeight = height;
        
        console.log('Using original content size for export:', { 
            exportWidth, 
            exportHeight,
            aspectRatio: (width / height).toFixed(2)
        });
        
        // 6. Reset root SVG attributes with original dimensions
        clonedSvg.style.width = '';
        clonedSvg.style.height = '';
        clonedSvg.style.maxWidth = '';
        
        clonedSvg.setAttribute('width', exportWidth);
        clonedSvg.setAttribute('height', exportHeight);
        clonedSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

        const svgXML = new XMLSerializer().serializeToString(clonedSvg);
        
        // Clean up the SVG XML to ensure compatibility
        // Remove any null characters or invalid XML
        const cleanedSvgXML = svgXML.replace(/\0/g, '');
        
        // Use a different approach: convert SVG to data URL directly
        let svgDataUrl;
        try {
            svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(cleanedSvgXML)));
        } catch (e) {
            console.error('SVG encoding error:', e);
            showToast('Failed to encode diagram. Please try a different diagram type.');
            return;
        }

        const img = new Image();
        // IMPORTANT: Set crossOrigin before setting src to avoid tainted canvas
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            try {
                const padding = 20;

                console.log('Image loaded successfully!');
                console.log('Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                console.log('Expected dimensions:', exportWidth, 'x', exportHeight);

                // Verify dimensions are valid
                if (exportWidth <= 0 || exportHeight <= 0) {
                    console.error('Invalid dimensions:', { exportWidth, exportHeight });
                    showToast('Invalid diagram dimensions. Please try regenerating the diagram.');
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = exportWidth + padding * 2;
                canvas.height = exportHeight + padding * 2;

                console.log('Canvas created with size:', canvas.width, 'x', canvas.height);

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Failed to get canvas context');
                    showToast('Failed to create canvas context.');
                    return;
                }
                
                // Fill with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                console.log('White background filled');
                
                // Verify image has loaded properly
                if (!img.complete || img.naturalWidth === 0) {
                    console.error('Image not fully loaded:', { complete: img.complete, naturalWidth: img.naturalWidth });
                    showToast('Image not fully loaded. Please try again.');
                    return;
                }
                
                // Draw the image
                console.log('Drawing image at:', padding, padding, 'with size:', exportWidth, exportHeight);
                ctx.drawImage(img, padding, padding, exportWidth, exportHeight);
                console.log('Image drawn successfully');

                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                let dataUrl;
                try {
                    dataUrl = canvas.toDataURL(mimeType);
                } catch (e) {
                    console.error('Canvas to data URL error:', e);
                    showToast('Failed to export image. Browser security policy blocked the export.');
                    return;
                }
                
                // Verify that dataUrl is valid before downloading
                if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
                    console.error('Generated data URL is empty or invalid');
                    console.log('Canvas size:', canvas.width, 'x', canvas.height);
                    console.log('Image size:', img.width, 'x', img.height);
                    console.log('Data URL length:', dataUrl ? dataUrl.length : 0);
                    showToast('Failed to generate image. Please try a smaller or simpler diagram.');
                    return;
                }

                const link = document.createElement('a');
                link.download = `diagram.${format}`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error('이미지 변환 오류:', e);
                showToast('Failed to export image. Some diagram features may not be compatible.');
            }

        };
        img.onerror = (e) => {
            console.error('이미지 로드 오류:', e);
            console.log('SVG Data URL length:', svgDataUrl ? svgDataUrl.length : 0);
            console.log('SVG XML preview:', cleanedSvgXML.substring(0, 500));
            showToast('Failed to load image. The SVG may contain unsupported features.');
        };
        
        // Add a timeout to detect if image loading hangs
        const loadTimeout = setTimeout(() => {
            console.error('Image loading timeout');
            showToast('Image loading timeout. Please try a simpler diagram.');
        }, 10000); // 10 second timeout
        
        img.onload = ((originalOnload) => {
            return function() {
                clearTimeout(loadTimeout);
                originalOnload.call(this);
            };
        })(img.onload);
        
        img.src = svgDataUrl;
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



