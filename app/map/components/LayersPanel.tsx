"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react"
import type { Shape } from "../types/canvas"

interface LayersPanelProps {
  shapes: Shape[]
  selectedShapes: string[]
  onShapeSelect: (shapeId: string, multiSelect?: boolean) => void
  onShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void
}

export function LayersPanel({ 
  shapes, 
  selectedShapes, 
  onShapeSelect, 
  onShapeUpdate 
}: LayersPanelProps) {
  const toggleVisibility = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (shape) {
      onShapeUpdate(shapeId, { visible: !shape.visible })
    }
  }

  const toggleLock = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (shape) {
      onShapeUpdate(shapeId, { locked: !shape.locked })
    }
  }

  const deleteShape = (shapeId: string) => {
    // This would need to be handled by the parent component
    // For now, we'll just hide it
    onShapeUpdate(shapeId, { visible: false })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Layers</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {shapes.length} objects
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {shapes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No shapes yet
          </div>
        ) : (
          <div className="space-y-1">
            {shapes.map((shape) => (
              <div
                key={shape.id}
                className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${
                  selectedShapes.includes(shape.id)
                    ? "bg-blue-100 border border-blue-300"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => onShapeSelect(shape.id)}
              >
                {/* Visibility toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisibility(shape.id)
                  }}
                >
                  {shape.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>

                {/* Lock toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock(shape.id)
                  }}
                >
                  {shape.locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </Button>

                {/* Shape info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(shape.width)} × {Math.round(shape.height)}
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteShape(shape.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 