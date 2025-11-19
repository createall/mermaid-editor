# Mermaid Editor

A web-based tool for creating diagrams using [Mermaid.js](https://mermaid.js.org/).

## Features

- **Real-time Rendering**: The diagram updates automatically as you type.
- **Enhanced Editor**: Code editor with **line numbers** for better readability and navigation.
- **Detailed Error Reporting**: Clear and specific error messages are displayed directly in the preview area when syntax errors occur.
- **Auto-Save**: Your work is automatically saved to your browser's local storage (expires after 1 hour), so you won't lose progress if you accidentally close the tab.
- **Zoom & Pan**: Easily navigate large diagrams using mouse drag (pan) and scroll (zoom). Control icons are also provided.
- **Split View**: Adjustable split view between the code editor and the diagram preview. Your layout preference is saved automatically using local storage.
- **Shareable URLs**: Generate a unique URL containing your diagram code to share with others.
- **File Save/Load**: Save your Mermaid code as a text file (`.txt`) and load it back later to continue working.
- **Export Options**: Download your diagrams as high-quality PNG or JPG images (maintains original resolution).

## How to Use

1. Open `index.html` in your web browser (no server or build process required).
2. Enter Mermaid diagram syntax in the left editor pane.
3. The diagram will appear in the right pane.
4. Use the buttons below the editor to:
    - **Copy Share URL**: Copy a link to the current diagram to your clipboard.
    - **Download PNG/JPG**: Save the diagram as an image file.
5. Click "Need Help?" to view the official Mermaid documentation.

## Technologies Used

- HTML5, CSS3, JavaScript (Vanilla)
- [Mermaid.js](https://mermaid.js.org/) - Diagram generation
- [Split.js](https://split.js.org/) - Resizable split views
- [svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom) - Pan and zoom capabilities for SVG

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## What's New (2025-11)

- **대형 다이어그램 SVG로 자동 저장**: PNG/JPG로 저장 시 이미지 크기가 너무 크면 자동으로 SVG로 저장되며, 사용자에게 안내 메시지가 표시됩니다.
- **Gantt 차트 todayMarker 자동 off**: Gantt 차트에서 todayMarker(오늘 표시선)가 자동으로 비활성화되어, 내보내기 시 불필요한 선이 포함되지 않습니다.
- **창 크기 변경 시 다이어그램 리렌더링**: 브라우저 창 크기가 변경되면 다이어그램이 자동으로 다시 맞춰집니다.
- **SVG 내보내기 개선**: 내보내는 SVG의 실제 보이는 영역만 정확히 포함되도록 개선되었습니다.
