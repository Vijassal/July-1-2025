"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MousePointer, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  RotateCw, 
  Grid, 
  Ruler, 
  Layers, 
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Users
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Canvas } from "./Canvas"
import { Toolbar } from "./Toolbar"
import { LayersPanel } from "./LayersPanel"
import { PropertiesPanel } from "./PropertiesPanel"
import { ContextMenu } from "./ContextMenu"
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts"
import { useCollaboration } from "../hooks/useCollaboration"
import type { Shape, Tool } from "../types/canvas"

interface CanvasDesignerProps {
  blueprint: {
    id: string
    name: string
    width_ft: number
    height_ft: number
    measurements_unit: string
  }
  userId: string
  eventId: string
}

export default function CanvasDesigner({ blueprint, userId, eventId }: CanvasDesignerProps) {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool>("select")
  const [selectedShapes, setSelectedShapes] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [showProperties, setShowProperties] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId?: string } | null>(null)
  const [history, setHistory] = useState<Shape[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; cursor: { x: number; y: number } }>>([])

  const canvasRef = useRef<HTMLDivElement>(null)

  // Collaboration hook
  const { 
    sendShapeUpdate, 
    sendCursorUpdate, 
    remoteShapes, 
    remoteCursors,
    collaborationEnabled
  } = useCollaboration(blueprint.id, userId)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselect,
  })

  // Save to history
  const saveToHistory = useCallback((newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newShapes])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // Undo/Redo handlers
  function handleUndo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setShapes(history[historyIndex - 1])
      toast.success("Undone")
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setShapes(history[historyIndex + 1])
      toast.success("Redone")
    }
  }

  function handleDelete() {
    if (selectedShapes.length > 0) {
      const newShapes = shapes.filter(shape => !selectedShapes.includes(shape.id))
      setShapes(newShapes)
      setSelectedShapes([])
      saveToHistory(newShapes)
      sendShapeUpdate(newShapes)
      toast.success("Deleted selected shapes")
    }
  }

  function handleCopy() {
    if (selectedShapes.length > 0) {
      const copiedShapes = shapes.filter(shape => selectedShapes.includes(shape.id))
      localStorage.setItem('canvasClipboard', JSON.stringify(copiedShapes))
      toast.success("Copied to clipboard")
    }
  }

  function handlePaste() {
    const clipboard = localStorage.getItem('canvasClipboard')
    if (clipboard) {
      const copiedShapes: Shape[] = JSON.parse(clipboard)
      const newShapes = copiedShapes.map(shape => ({
        ...shape,
        id: `${shape.id}-${Date.now()}`,
        x: shape.x + 20,
        y: shape.y + 20,
        selected: false
      }))
      setShapes(prev => [...prev, ...newShapes])
      setSelectedShapes(newShapes.map(s => s.id))
      saveToHistory([...shapes, ...newShapes])
      sendShapeUpdate([...shapes, ...newShapes])
      toast.success("Pasted shapes")
    }
  }

  function handleSelectAll() {
    const allShapeIds = shapes.map(shape => shape.id)
    setSelectedShapes(allShapeIds)
    toast.success("Selected all shapes")
  }

  function handleDeselect() {
    setSelectedShapes([])
  }

  // Shape management
  const addShape = useCallback((shape: Omit<Shape, "id" | "selected" | "locked" | "visible" | "zIndex">) => {
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      selected: false,
      locked: false,
      visible: true,
      zIndex: shapes.length
    }
    const newShapes = [...shapes, newShape]
    setShapes(newShapes)
    saveToHistory(newShapes)
    sendShapeUpdate(newShapes)
  }, [shapes, saveToHistory, sendShapeUpdate])

  const updateShape = useCallback((shapeId: string, updates: Partial<Shape>) => {
    const newShapes = shapes.map(shape => 
      shape.id === shapeId ? { ...shape, ...updates } : shape
    )
    setShapes(newShapes)
    saveToHistory(newShapes)
    sendShapeUpdate(newShapes)
  }, [shapes, saveToHistory, sendShapeUpdate])

  const selectShape = useCallback((shapeId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedShapes(prev => 
        prev.includes(shapeId) 
          ? prev.filter(id => id !== shapeId)
          : [...prev, shapeId]
      )
    } else {
      setSelectedShapes([shapeId])
    }
  }, [])

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1))
  const handleZoomReset = () => setZoom(1)

  // Export functionality
  const handleExport = async () => {
    try {
      // This would integrate with a canvas-to-image library
      toast.success("Export functionality coming soon")
    } catch (error) {
      toast.error("Failed to export")
    }
  }

  // Save blueprint
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("blueprints")
        .update({
          canvas_data: JSON.stringify(shapes),
          updated_at: new Date().toISOString()
        })
        .eq("id", blueprint.id)

      if (error) throw error
      toast.success("Blueprint saved successfully")
    } catch (error) {
      console.error("Error saving blueprint:", error)
      toast.error("Failed to save blueprint")
    }
  }

  // Load saved canvas data
  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        const { data, error } = await supabase
          .from("blueprints")
          .select("canvas_data")
          .eq("id", blueprint.id)
          .single()

        if (!error && data?.canvas_data) {
          const savedShapes = JSON.parse(data.canvas_data)
          setShapes(savedShapes)
          setHistory([savedShapes])
          setHistoryIndex(0)
        }
      } catch (error) {
        console.error("Error loading canvas data:", error)
      }
    }

    loadCanvasData()
  }, [blueprint.id])

  // Sync with remote changes
  useEffect(() => {
    if (remoteShapes && remoteShapes.length > 0) {
      setShapes(remoteShapes)
    }
  }, [remoteShapes])

  useEffect(() => {
    setCollaborators(remoteCursors)
  }, [remoteCursors])

  return (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b bg-background p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Toolbar
              selectedTool={selectedTool}
              onToolSelect={setSelectedTool}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              showRulers={showRulers}
              onToggleRulers={() => setShowRulers(!showRulers)}
            />
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </Badge>
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomReset}>
                Reset
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={handleCopy} disabled={selectedShapes.length === 0}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handlePaste}>
                Paste
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={selectedShapes.length === 0}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {collaborationEnabled 
                  ? `${collaborators.length} collaborators` 
                  : "Local mode (no collaboration)"
                }
              </span>
            </div>
            
            {!collaborationEnabled && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Offline
              </div>
            )}
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button size="sm" variant="outline" onClick={() => setShowLayers(!showLayers)}>
              <Layers className="h-4 w-4" />
              Layers
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers Panel */}
        {showLayers && (
          <div className="w-64 border-r bg-muted/30">
            <LayersPanel
              shapes={shapes}
              selectedShapes={selectedShapes}
              onShapeSelect={selectShape}
              onShapeUpdate={updateShape}
            />
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas
            ref={canvasRef}
            shapes={shapes}
            selectedShapes={selectedShapes}
            selectedTool={selectedTool}
            zoom={zoom}
            showGrid={showGrid}
            showRulers={showRulers}
            blueprint={blueprint}
            collaborators={collaborators}
            onShapeAdd={addShape}
            onShapeUpdate={updateShape}
            onShapeSelect={selectShape}
            onContextMenu={setContextMenu}
            onCursorMove={sendCursorUpdate}
          />
        </div>

        {/* Properties Panel */}
        {showProperties && selectedShapes.length > 0 && (
          <div className="w-80 border-l bg-muted/30">
            <PropertiesPanel
              shapes={shapes.filter(shape => selectedShapes.includes(shape.id))}
              onShapeUpdate={updateShape}
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          shapeId={contextMenu.shapeId}
          onClose={() => setContextMenu(null)}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onDuplicate={() => {
            if (contextMenu.shapeId) {
              const shape = shapes.find(s => s.id === contextMenu.shapeId)
              if (shape) {
                const { id, selected, locked, visible, zIndex, ...shapeData } = shape
                addShape({
                  ...shapeData,
                  x: shape.x + 20,
                  y: shape.y + 20
                })
              }
            }
            setContextMenu(null)
          }}
        />
      )}
    </div>
  )
} 