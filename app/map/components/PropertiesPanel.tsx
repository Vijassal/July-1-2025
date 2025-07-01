"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { Shape } from "../types/canvas"

interface PropertiesPanelProps {
  shapes: Shape[]
  onShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void
}

export function PropertiesPanel({ shapes, onShapeUpdate }: PropertiesPanelProps) {
  if (shapes.length === 0) return null

  const shape = shapes[0] // For now, only show properties for single selection

  const updateProperty = (property: keyof Shape, value: any) => {
    shapes.forEach(shape => {
      onShapeUpdate(shape.id, { [property]: value })
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Properties</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {shapes.length} selected
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(shape.x)}
                onChange={(e) => updateProperty("x", Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(shape.y)}
                onChange={(e) => updateProperty("y", Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={Math.round(shape.width)}
                onChange={(e) => updateProperty("width", Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={Math.round(shape.height)}
                onChange={(e) => updateProperty("height", Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Rotation</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shape.rotation]}
              onValueChange={([value]) => updateProperty("rotation", value)}
              max={360}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(shape.rotation)}
              onChange={(e) => updateProperty("rotation", Number(e.target.value))}
              className="w-16 h-8 text-xs"
            />
          </div>
        </div>

        {/* Fill Color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Fill Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 border border-gray-300 rounded"
              style={{ backgroundColor: shape.fill }}
            />
            <Input
              value={shape.fill}
              onChange={(e) => updateProperty("fill", e.target.value)}
              className="flex-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Stroke Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 border border-gray-300 rounded"
              style={{ backgroundColor: shape.stroke }}
            />
            <Input
              value={shape.stroke}
              onChange={(e) => updateProperty("stroke", e.target.value)}
              className="flex-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Stroke Width</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shape.strokeWidth]}
              onValueChange={([value]) => updateProperty("strokeWidth", value)}
              max={20}
              min={0}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={shape.strokeWidth}
              onChange={(e) => updateProperty("strokeWidth", Number(e.target.value))}
              className="w-16 h-8 text-xs"
            />
          </div>
        </div>

        {/* Text Content (for text shapes) */}
        {shape.type === "text" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Text Content</Label>
            <Input
              value={shape.text || ""}
              onChange={(e) => updateProperty("text", e.target.value)}
              className="h-8 text-xs"
              placeholder="Enter text..."
            />
          </div>
        )}
      </div>
    </div>
  )
} 