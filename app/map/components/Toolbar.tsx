"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  MousePointer, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Grid, 
  Ruler,
  Layers,
  Eye,
  EyeOff
} from "lucide-react"
import type { Tool } from "../types/canvas"

interface ToolbarProps {
  selectedTool: Tool
  onToolSelect: (tool: Tool) => void
  showGrid: boolean
  onToggleGrid: () => void
  showRulers: boolean
  onToggleRulers: () => void
}

export function Toolbar({
  selectedTool,
  onToolSelect,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers
}: ToolbarProps) {
  const tools = [
    { id: "select" as Tool, icon: MousePointer, label: "Select" },
    { id: "rectangle" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "line" as Tool, icon: Minus, label: "Line" },
    { id: "text" as Tool, icon: Type, label: "Text" },
  ]

  return (
    <div className="flex items-center gap-1">
      {/* Drawing Tools */}
      {tools.map((tool) => (
        <Button
          key={tool.id}
          size="sm"
          variant={selectedTool === tool.id ? "default" : "outline"}
          onClick={() => onToolSelect(tool.id)}
          className="flex items-center gap-1"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{tool.label}</span>
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6" />

      {/* View Controls */}
      <Button
        size="sm"
        variant={showGrid ? "default" : "outline"}
        onClick={onToggleGrid}
        className="flex items-center gap-1"
        title="Toggle Grid"
      >
        <Grid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>

      <Button
        size="sm"
        variant={showRulers ? "default" : "outline"}
        onClick={onToggleRulers}
        className="flex items-center gap-1"
        title="Toggle Rulers"
      >
        <Ruler className="h-4 w-4" />
        <span className="hidden sm:inline">Rulers</span>
      </Button>
    </div>
  )
} 