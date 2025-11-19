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
