// Configuration constants
export const CONFIG = {
    SPLIT_SIZES_KEY: 'split-sizes',
    MERMAID_CODE_KEY: 'mermaid-code',
    BACKGROUND_PATTERN_KEY: 'background-pattern',
    DARK_MODE_KEY: 'dark-mode',
    AUTOSAVE_TTL: 60 * 60 * 1000, // 1 hour
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    PADDING: 20,
    LOAD_TIMEOUT: 10000,
    MAX_DIMENSION: 16384,
    DEFAULT_SPLIT_SIZES: [50, 50],
    MESSAGES: {
        URL_COPIED: 'Share URL copied to clipboard!',
        URL_COPY_FAILED: 'Failed to copy URL.',
        FILE_SAVED: 'File saved successfully!',
        FILE_SAVE_FAILED: 'Failed to save file.',
        FILE_LOADED: 'File loaded successfully!',
        FILE_LOAD_FAILED: 'Failed to read file.',
        NO_DIAGRAM: 'No diagram to download.',
        DIAGRAM_TOO_LARGE: 'Diagram size is too large to export.',
        IMAGE_TIMEOUT: 'Image loading timeout. Please try a simpler diagram.',
        INVALID_DIMENSIONS: 'Invalid diagram dimensions. Please try regenerating the diagram.',
        IMAGE_NOT_LOADED: 'Image not fully loaded. Please try again.',
        CANVAS_FAILED: 'Failed to create canvas context.',
        EXPORT_FAILED: 'Failed to export image. Browser security policy blocked the export.',
        EXPORT_EMPTY: 'Failed to generate image. Please try a smaller or simpler diagram.',
        EXPORT_ERROR: 'Failed to export image. Some diagram features may not be compatible.',
        IMAGE_LOAD_ERROR: 'Failed to load image. The SVG may contain unsupported features.',
        URL_DECODE_FAILED: 'Failed to load code from URL.',
        ENCODE_FAILED: 'Failed to encode diagram. Please try a different diagram type.',
        PDF_SUCCESS: 'PDF downloaded successfully!',
        PDF_FAILED: 'Failed to generate PDF.',
        CLIPBOARD_SUCCESS: 'Image copied to clipboard!',
        CLIPBOARD_FAILED: 'Failed to copy image to clipboard.',
        CLIPBOARD_NOT_SUPPORTED: 'Clipboard API is not supported in your browser.'
    }
};

// Sample diagram codes for different types
export const SAMPLES = {
    flowchart: `---
title: Sample Flowchart
---
graph TD
    A[Start] --> B{Is it?}
    B -- Yes --> C[OK]
    C --> D[Rethink]
    D --> B
    B -- No --> E[End]`,
    sequence: `---
title: Sample Sequence Diagram
---
sequenceDiagram
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
    class: `---
title: Sample Class Diagram
---
classDiagram
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
    state: `---
title: Sample State Diagram
---
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
    er: `---
title: Sample ER Diagram
---
erDiagram
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
    todayMarker off
    A task           :a1, 2025-11-10, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2025-11-20  , 12d
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
    requirement: `---
title: Sample Requirement Diagram
---
requirementDiagram
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
    git: `---
title: Sample Git Graph
---
gitGraph
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
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0`,
    treemap: `---
title: Sample Treemap
---
treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25`
};
