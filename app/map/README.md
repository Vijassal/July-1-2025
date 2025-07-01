# Canvas-Based Blueprint Designer

A comprehensive collaborative canvas-based design tool similar to Figma or Miro, built for event planning and blueprint creation.

## Features

### Core Drawing Tools
- **Select Tool**: Click and drag to select shapes, multi-select with Ctrl/Cmd
- **Rectangle Tool**: Draw rectangles and squares
- **Circle Tool**: Draw circles and ellipses
- **Line Tool**: Draw straight lines
- **Text Tool**: Add text labels and annotations
- **Polygon Tool**: Draw custom polygons (coming soon)

### Shape Manipulation
- **Move**: Click and drag shapes to reposition them
- **Resize**: Use corner and edge handles to resize shapes
- **Rotate**: Rotate shapes using the rotation handle
- **Delete**: Select shapes and press Delete or use context menu
- **Duplicate**: Right-click and select "Duplicate" or use Ctrl/Cmd+D

### Real-time Measurements
- **Live Measurements**: See real-time measurements in inches and feet as you draw
- **Grid Snapping**: Shapes snap to a 1-inch grid for precise placement
- **Ruler Overlays**: Toggle rulers along canvas edges for reference
- **Measurement Display**: Shows dimensions in both feet and inches (e.g., 1' 6", 24")

### Collaboration Features
- **Multi-user Editing**: Real-time collaboration with other users
- **Live Cursors**: See other users' cursors as they work
- **Shape Syncing**: Changes sync automatically across all collaborators
- **Collaborator Indicators**: Visual indicators show who's currently editing

### Advanced Features
- **Undo/Redo**: Full history support with Ctrl/Cmd+Z and Ctrl/Cmd+Y
- **Copy/Paste**: Copy shapes between blueprints or duplicate within the same canvas
- **Layers Panel**: Manage object stacking and visibility
- **Properties Panel**: Edit shape properties like colors, stroke width, and text
- **Context Menus**: Right-click for quick actions
- **Keyboard Shortcuts**: Efficient workflow with keyboard shortcuts

### View Controls
- **Zoom**: Zoom in/out with mouse wheel or zoom controls
- **Grid Toggle**: Show/hide the measurement grid
- **Rulers Toggle**: Show/hide ruler overlays
- **Alignment Guides**: Visual guides when moving shapes near others

## Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + C`: Copy selected shapes
- `Ctrl/Cmd + V`: Paste shapes
- `Ctrl/Cmd + A`: Select all shapes
- `Delete/Backspace`: Delete selected shapes
- `Escape`: Cancel current operation or deselect

## Usage

1. **Create a Blueprint**: Click "New" to create a new blueprint with custom dimensions
2. **Select Tools**: Choose a drawing tool from the toolbar
3. **Draw Shapes**: Click and drag on the canvas to create shapes
4. **Edit Properties**: Select shapes and use the properties panel to modify appearance
5. **Collaborate**: Invite others to edit the same blueprint in real-time
6. **Save**: Changes are automatically saved to the database

## Technical Implementation

### Components
- `CanvasDesigner`: Main orchestrator component
- `Canvas`: Core drawing canvas with mouse event handling
- `ShapeRenderer`: Renders different shape types
- `Toolbar`: Drawing tools and view controls
- `LayersPanel`: Layer management interface
- `PropertiesPanel`: Shape property editing
- `ContextMenu`: Right-click context menus
- `Ruler`: Measurement rulers
- `Grid`: Grid overlay
- `ResizeHandles`: Shape resizing controls
- `AlignmentGuides`: Visual alignment guides
- `CollaboratorCursor`: Other users' cursors

### Hooks
- `useKeyboardShortcuts`: Handles keyboard shortcuts
- `useCollaboration`: Real-time collaboration via Supabase

### Database Tables
- `blueprints`: Main blueprint data
- `blueprint_collaboration`: Real-time shape syncing
- `blueprint_cursors`: Real-time cursor positions

### Real-time Features
- Supabase Realtime for live collaboration
- WebSocket connections for cursor tracking
- Automatic conflict resolution
- Optimistic updates for smooth UX

## Future Enhancements

- **Export to PDF/Image**: Export blueprints as images or PDFs
- **Background Images**: Upload and trace over existing blueprints
- **Advanced Shapes**: More complex shape types
- **Templates**: Pre-built blueprint templates
- **Version History**: Track changes over time
- **Comments**: Add comments and annotations
- **Mobile Support**: Touch-friendly interface for tablets 