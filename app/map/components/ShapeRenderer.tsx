"use client"

import React from "react"
import type { Shape } from "../types/canvas"

interface ShapeRendererProps {
  shape: Shape
  isSelected: boolean
  zoom: number
  onSelect: () => void
}

export function ShapeRenderer({ shape, isSelected, zoom, onSelect }: ShapeRendererProps) {
  if (!shape.visible) return null

  const baseStyle = {
    position: "absolute" as const,
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    transform: `rotate(${shape.rotation}deg)`,
    cursor: "pointer",
    zIndex: shape.zIndex
  }

  const selectionStyle = isSelected ? {
    outline: "2px solid #007bff",
    outlineOffset: "2px"
  } : {}

  const renderShape = () => {
    switch (shape.type) {
      case "rectangle":
        return (
          <div
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: shape.fill,
              border: `${shape.strokeWidth}px solid ${shape.stroke}`,
              borderRadius: "2px"
            }}
            onClick={onSelect}
          />
        )

      case "circle":
        return (
          <div
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: shape.fill,
              border: `${shape.strokeWidth}px solid ${shape.stroke}`,
              borderRadius: "50%"
            }}
            onClick={onSelect}
          />
        )

      case "line":
        const length = Math.sqrt(shape.width * shape.width + shape.height * shape.height)
        const angle = Math.atan2(shape.height, shape.width) * (180 / Math.PI)
        
        return (
          <div
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: length,
              height: shape.strokeWidth,
              backgroundColor: shape.stroke,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "0 50%"
            }}
            onClick={onSelect}
          />
        )

      case "text":
        return (
          <div
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${Math.max(12, shape.height / 2)}px`,
              fontWeight: "bold",
              color: shape.stroke,
              textAlign: "center" as const,
              wordBreak: "break-word" as const,
              padding: "4px"
            }}
            onClick={onSelect}
          >
            {shape.text || "Text"}
          </div>
        )

      case "polygon":
        // For now, render as rectangle. Polygon support can be added later
        return (
          <div
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: shape.fill,
              border: `${shape.strokeWidth}px solid ${shape.stroke}`,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
            }}
            onClick={onSelect}
          />
        )

      default:
        return null
    }
  }

  return renderShape()
} 