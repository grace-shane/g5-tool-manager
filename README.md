# G5 Tool Manager

A professional tool library viewer for Autodesk Fusion tool libraries.

**Created for Grace Engineering**

## Features

- **Multi-Library Support**: Load multiple tool libraries simultaneously
- **Smart Filtering**: Dynamic filters based on tool type (mills, drills, holders)
- **Advanced Search**: Search by product ID, description, or any tool parameter
- **Sortable Columns**: Click any column header to sort ascending/descending
- **Detailed View**: Click any tool to see complete specifications
- **Export Functionality**: Merge and export all loaded libraries into one JSON file
- **Vendor Management**: Filter by vendor, view all loaded libraries with tool counts

## How to Use

### Opening the App

1. Extract all files from the zip
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari)

### Loading Tool Libraries

1. Click "Choose File" button
2. Select one or more Fusion tool library JSON files
3. Hold Ctrl (Windows/Linux) or Cmd (Mac) to select multiple files
4. All tools will be loaded and displayed in the table

### Managing Libraries

- View loaded libraries with tool counts below the file picker
- Click the **✕** on any library tag to remove it
- Click **Clear All** to remove all libraries and start fresh

### Filtering Tools

The filter options dynamically change based on the types of tools loaded:

**For Mills:**
- Diameter range
- Number of flutes
- Corner radius

**For Drills:**
- Diameter range
- Number of flutes
- Point angle

**For Holders:**
- Gauge length range

**Common Filters:**
- Search by product ID or description
- Filter by tool type
- Filter by vendor

### Exporting

1. Load one or more libraries
2. Click **Export Merged Library** button
3. A single JSON file will be downloaded containing all tools
4. The file can be imported back into Fusion 360

## File Structure

```
g5-tool-manager/
├── index.html      # Main HTML structure
├── styles.css      # Prime Archery themed styles
├── script.js       # Application logic
└── README.md       # This file
```

## Supported File Types

- Fusion Tool Library JSON files (.json)
- Compatible with tool libraries exported from Fusion 360

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Notes

- All processing is done locally in your browser
- No data is sent to any server
- Large libraries (10,000+ tools) load and filter smoothly
- Export files are properly formatted for Fusion 360 import

## About

Developed for Grace Engineering's machining operations.

**Accuracy is Everything™**
