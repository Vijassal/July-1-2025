"use client"

import React, { forwardRef, useRef, useEffect, useState, useCallback } from "react"
import type { Shape, Tool } from "../types/canvas"
import { Ruler } from "./Ruler"
import { Grid } from "./Grid"
import { ShapeRenderer } from "./ShapeRenderer"
import { SelectionBox } from "./SelectionBox"
import { ResizeHandles } from "./ResizeHandles"
import { AlignmentGuides } from "./AlignmentGuides"
import { CollaboratorCursor } from "./CollaboratorCursor"
import { convertToInches, convertToFeet, snapToGrid } from "../utils/measurements"

interface CanvasProps {
  shapes: Shape[]
  selectedShapes: string[]
  selectedTool: Tool
  zoom: number
  showGrid: boolean
  showRulers: boolean
  blueprint: {
    id: string
    name: string
    width_ft: number
    height_ft: number
    measurements_unit: string
  }
  collaborators: Array<{ id: string; name: string; cursor: { x: number; y: number } }>
  onShapeAdd: (shape: Omit<Shape, "id" | "selected" | "locked" | "visible" | "zIndex">) => void
  onShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void
  onShapeSelect: (shapeId: string, multiSelect?: boolean) => void
  onContextMenu: (context: { x: number; y: number; shapeId?: string } | null) => void
  onCursorMove: (cursor: { x: number; y: number }) => void
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  shapes,
  selectedShapes,
  selectedTool,
  zoom,
  showGrid,
  showRulers,
  blueprint,
  collaborators,
  onShapeAdd,
  onShapeUpdate,
  onShapeSelect,
  onContextMenu,
  onCursorMove
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [measurements, setMeasurements] = useState<{ width: string; height: string } | null>(null)

  // Canvas dimensions in pixels (1 foot = 50 pixels)
  const pixelsPerFoot = 50
  const canvasWidth = blueprint.width_ft * pixelsPerFoot
  const canvasHeight = blueprint.height_ft * pixelsPerFoot

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: (screenX - rect.left) / zoom,
      y: (screenY - rect.top) / zoom
    }
  }, [zoom])

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom,
      y: canvasY * zoom
    }
  }, [zoom])

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    
    // Check if clicking on a shape
    const clickedShape = shapes.find(shape => {
      const screenPos = canvasToScreen(shape.x, shape.y)
      const screenWidth = shape.width * zoom
      const screenHeight = shape.height * zoom
      
      return (
        canvasPos.x >= shape.x &&
        canvasPos.x <= shape.x + shape.width &&
        canvasPos.y >= shape.y &&
        canvasPos.y <= shape.y + shape.height
      )
    })

    if (clickedShape) {
      // Select shape
      const multiSelect = e.ctrlKey || e.metaKey
      onShapeSelect(clickedShape.id, multiSelect)
      
      // Start dragging
      setIsDragging(true)
      setDragStart({ x: canvasPos.x - clickedShape.x, y: canvasPos.y - clickedShape.y })
    } else {
      // Start drawing or selection
      if (selectedTool !== "select") {
        setIsDrawing(true)
        setDrawStart(canvasPos)
        setDrawEnd(canvasPos)
      } else {
        // Start selection box
        setIsDrawing(true)
        setDrawStart(canvasPos)
        setDrawEnd(canvasPos)
      }
    }
  }, [shapes, selectedTool, zoom, screenToCanvas, canvasToScreen, onShapeSelect])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    setMousePosition(canvasPos)
    
    // Update cursor position for collaboration
    onCursorMove(canvasPos)

    if (isDrawing && drawStart) {
      setDrawEnd(canvasPos)
      
      // Update measurements for drawing
      if (selectedTool !== "select") {
        const width = Math.abs(canvasPos.x - drawStart.x)
        const height = Math.abs(canvasPos.y - drawStart.y)
        
        const widthInches = convertToInches(width / pixelsPerFoot)
        const heightInches = convertToInches(height / pixelsPerFoot)
        
        setMeasurements({
          width: `${widthInches}"`,
          height: `${heightInches}"`
        })
      }
    }

    if (isDragging && dragStart && selectedShapes.length > 0) {
      // Move selected shapes
      const deltaX = canvasPos.x - dragStart.x
      const deltaY = canvasPos.y - dragStart.y
      
      selectedShapes.forEach(shapeId => {
        const shape = shapes.find(s => s.id === shapeId)
        if (shape) {
          const snappedX = snapToGrid(deltaX, 12) // Snap to 1 inch grid
          const snappedY = snapToGrid(deltaY, 12)
          
          onShapeUpdate(shapeId, {
            x: snappedX,
            y: snappedY
          })
        }
      })
    }
  }, [isDrawing, isDragging, drawStart, dragStart, selectedShapes, shapes, selectedTool, zoom, screenToCanvas, onCursorMove, onShapeUpdate])

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isDrawing && drawStart && drawEnd) {
      if (selectedTool !== "select") {
        // Create new shape
        const x = Math.min(drawStart.x, drawEnd.x)
        const y = Math.min(drawStart.y, drawEnd.y)
        const width = Math.abs(drawEnd.x - drawStart.x)
        const height = Math.abs(drawEnd.y - drawStart.y)
        
        if (width > 5 && height > 5) { // Minimum size
          onShapeAdd({
            type: selectedTool as any,
            x,
            y,
            width,
            height,
            rotation: 0,
            fill: "#ffffff",
            stroke: "#000000",
            strokeWidth: 2,
            text: selectedTool === "text" ? "Text" : undefined
          })
        }
      } else {
        // Selection box
        const x = Math.min(drawStart.x, drawEnd.x)
        const y = Math.min(drawStart.y, drawEnd.y)
        const width = Math.abs(drawEnd.x - drawStart.x)
        const height = Math.abs(drawEnd.y - drawStart.y)
        
        // Select shapes within selection box
        const selectedInBox = shapes.filter(shape => 
          shape.x >= x && 
          shape.x + shape.width <= x + width &&
          shape.y >= y && 
          shape.y + shape.height <= y + height
        )
        
        selectedInBox.forEach(shape => {
          onShapeSelect(shape.id, true)
        })
      }
    }
    
    setIsDrawing(false)
    setIsDragging(false)
    setDrawStart(null)
    setDrawEnd(null)
    setMeasurements(null)
  }, [isDrawing, drawStart, drawEnd, selectedTool, shapes, onShapeAdd, onShapeSelect])

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    
    // Check if right-clicking on a shape
    const clickedShape = shapes.find(shape => 
      canvasPos.x >= shape.x &&
      canvasPos.x <= shape.x + shape.width &&
      canvasPos.y >= shape.y &&
      canvasPos.y <= shape.y + shape.height
    )
    
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      shapeId: clickedShape?.id
    })
  }, [shapes, screenToCanvas, onContextMenu])

  // Handle resize handle interaction
  const handleResizeStart = useCallback((handle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
  }, [])

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !resizeHandle || selectedShapes.length !== 1) return
    
    e.preventDefault()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    const shapeId = selectedShapes[0]
    const shape = shapes.find(s => s.id === shapeId)
    
    if (!shape) return
    
    let newWidth = shape.width
    let newHeight = shape.height
    let newX = shape.x
    let newY = shape.y
    
    // Calculate new dimensions based on resize handle
    switch (resizeHandle) {
      case "nw":
        newWidth = shape.x + shape.width - canvasPos.x
        newHeight = shape.y + shape.height - canvasPos.y
        newX = canvasPos.x
        newY = canvasPos.y
        break
      case "ne":
        newWidth = canvasPos.x - shape.x
        newHeight = shape.y + shape.height - canvasPos.y
        newY = canvasPos.y
        break
      case "sw":
        newWidth = shape.x + shape.width - canvasPos.x
        newHeight = canvasPos.y - shape.y
        newX = canvasPos.x
        break
      case "se":
        newWidth = canvasPos.x - shape.x
        newHeight = canvasPos.y - shape.y
        break
      case "n":
        newHeight = shape.y + shape.height - canvasPos.y
        newY = canvasPos.y
        break
      case "s":
        newHeight = canvasPos.y - shape.y
        break
      case "w":
        newWidth = shape.x + shape.width - canvasPos.x
        newX = canvasPos.x
        break
      case "e":
        newWidth = canvasPos.x - shape.x
        break
    }
    
    // Apply minimum size constraints
    newWidth = Math.max(newWidth, 10)
    newHeight = Math.max(newHeight, 10)
    
    // Snap to grid
    newWidth = snapToGrid(newWidth, 12)
    newHeight = snapToGrid(newHeight, 12)
    newX = snapToGrid(newX, 12)
    newY = snapToGrid(newY, 12)
    
    onShapeUpdate(shapeId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    })
  }, [isResizing, resizeHandle, selectedShapes, shapes, screenToCanvas, onShapeUpdate])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawing(false)
        setIsDragging(false)
        setDrawStart(null)
        setDrawEnd(null)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-white"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: "top left"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          <Ruler 
            orientation="horizontal" 
            length={canvasWidth} 
            pixelsPerUnit={pixelsPerFoot}
            unit="ft"
          />
          <Ruler 
            orientation="vertical" 
            length={canvasHeight} 
            pixelsPerUnit={pixelsPerFoot}
            unit="ft"
          />
        </>
      )}

      {/* Grid */}
      {showGrid && (
        <Grid 
          width={canvasWidth} 
          height={canvasHeight} 
          gridSize={pixelsPerFoot / 12} // 1 inch grid
          zoom={zoom}
        />
      )}

      {/* Canvas background */}
      <div 
        className="absolute inset-0 border-2 border-gray-300"
        style={{
          width: canvasWidth,
          height: canvasHeight
        }}
      />

      {/* Shapes */}
      {shapes.map(shape => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          isSelected={selectedShapes.includes(shape.id)}
          zoom={zoom}
          onSelect={() => onShapeSelect(shape.id)}
        />
      ))}

      {/* Selection box */}
      {isDrawing && selectedTool === "select" && drawStart && drawEnd && (
        <SelectionBox
          start={drawStart}
          end={drawEnd}
        />
      )}

      {/* Drawing preview */}
      {isDrawing && selectedTool !== "select" && drawStart && drawEnd && (
        <ShapeRenderer
          shape={{
            id: "preview",
            type: selectedTool as any,
            x: Math.min(drawStart.x, drawEnd.x),
            y: Math.min(drawStart.y, drawEnd.y),
            width: Math.abs(drawEnd.x - drawStart.x),
            height: Math.abs(drawEnd.y - drawStart.y),
            rotation: 0,
            fill: "rgba(0, 123, 255, 0.3)",
            stroke: "#007bff",
            strokeWidth: 2,
            selected: false,
            locked: false,
            visible: true,
            zIndex: 0
          }}
          isSelected={false}
          zoom={zoom}
          onSelect={() => {}} // Preview shapes don't need selection
        />
      )}

      {/* Resize handles */}
      {selectedShapes.length === 1 && (
        <ResizeHandles
          shape={shapes.find(s => s.id === selectedShapes[0])!}
          onResizeStart={handleResizeStart}
          onResizeMove={handleResizeMove}
          onResizeEnd={handleResizeEnd}
          zoom={zoom}
        />
      )}

      {/* Alignment guides */}
      <AlignmentGuides
        selectedShapes={shapes.filter(s => selectedShapes.includes(s.id))}
        allShapes={shapes}
        zoom={zoom}
      />

      {/* Collaborator cursors */}
      {collaborators.map(collaborator => (
        <CollaboratorCursor
          key={collaborator.id}
          collaborator={collaborator}
          zoom={zoom}
        />
      ))}

      {/* Measurements display */}
      {measurements && (
        <div 
          className="absolute bg-black text-white px-2 py-1 rounded text-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 30
          }}
        >
          {measurements.width} × {measurements.height}
        </div>
      )}
    </div>
  )
})

Canvas.displayName = "Canvas" 