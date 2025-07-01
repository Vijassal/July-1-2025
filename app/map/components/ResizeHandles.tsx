"use client"

import React from "react"
import type { Shape } from "../types/canvas"

interface ResizeHandlesProps {
  shape: Shape
  onResizeStart: (handle: string, e: React.MouseEvent) => void
  onResizeMove: (e: React.MouseEvent) => void
  onResizeEnd: () => void
  zoom: number
}

export function ResizeHandles({ 
  shape, 
  onResizeStart, 
  onResizeMove, 
  onResizeEnd, 
  zoom 
}: ResizeHandlesProps) {
  const handleSize = 8
  const handleStyle = {
    position: "absolute" as const,
    width: handleSize,
    height: handleSize,
    backgroundColor: "#007bff",
    border: "1px solid white",
    borderRadius: "50%",
    cursor: "pointer",
    zIndex: 101
  }

  const handles = [
    { id: "nw", x: -handleSize / 2, y: -handleSize / 2, cursor: "nw-resize" },
    { id: "n", x: shape.width / 2 - handleSize / 2, y: -handleSize / 2, cursor: "n-resize" },
    { id: "ne", x: shape.width - handleSize / 2, y: -handleSize / 2, cursor: "ne-resize" },
    { id: "w", x: -handleSize / 2, y: shape.height / 2 - handleSize / 2, cursor: "w-resize" },
    { id: "e", x: shape.width - handleSize / 2, y: shape.height / 2 - handleSize / 2, cursor: "e-resize" },
    { id: "sw", x: -handleSize / 2, y: shape.height - handleSize / 2, cursor: "sw-resize" },
    { id: "s", x: shape.width / 2 - handleSize / 2, y: shape.height - handleSize / 2, cursor: "s-resize" },
    { id: "se", x: shape.width - handleSize / 2, y: shape.height - handleSize / 2, cursor: "se-resize" }
  ]

  return (
    <div
      className="absolute"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        transform: `rotate(${shape.rotation}deg)`,
        zIndex: 100
      }}
      onMouseMove={onResizeMove}
      onMouseUp={onResizeEnd}
    >
      {handles.map(handle => (
        <div
          key={handle.id}
          style={{
            ...handleStyle,
            left: handle.x,
            top: handle.y,
            cursor: handle.cursor
          }}
          onMouseDown={(e) => onResizeStart(handle.id, e)}
        />
      ))}
    </div>
  )
} 