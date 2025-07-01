"use client"

import React from "react"

interface SelectionBoxProps {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: 100
      }}
    />
  )
} 