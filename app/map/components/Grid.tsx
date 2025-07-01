"use client"

import React from "react"

interface GridProps {
  width: number
  height: number
  gridSize: number
  zoom: number
}

export function Grid({ width, height, gridSize, zoom }: GridProps) {
  const generateGridLines = () => {
    const lines = []
    const adjustedGridSize = gridSize * zoom
    
    // Vertical lines
    for (let x = 0; x <= width; x += adjustedGridSize) {
      lines.push({
        type: "vertical" as const,
        position: x,
        isMajor: x % (adjustedGridSize * 12) === 0 // Every foot
      })
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += adjustedGridSize) {
      lines.push({
        type: "horizontal" as const,
        position: y,
        isMajor: y % (adjustedGridSize * 12) === 0 // Every foot
      })
    }
    
    return lines
  }

  const gridLines = generateGridLines()

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width,
        height,
        zIndex: 1
      }}
    >
      {gridLines.map((line, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: line.type === "vertical" ? line.position : 0,
            top: line.type === "horizontal" ? line.position : 0,
            width: line.type === "vertical" ? 1 : "100%",
            height: line.type === "horizontal" ? 1 : "100%",
            backgroundColor: line.isMajor ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)"
          }}
        />
      ))}
    </div>
  )
} 