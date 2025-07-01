"use client"

import React from "react"
import type { Shape } from "../types/canvas"
import { getAlignmentGuides } from "../utils/measurements"

interface AlignmentGuidesProps {
  selectedShapes: Shape[]
  allShapes: Shape[]
  zoom: number
}

export function AlignmentGuides({ selectedShapes, allShapes, zoom }: AlignmentGuidesProps) {
  if (selectedShapes.length === 0) return null

  const guides = getAlignmentGuides(selectedShapes, allShapes, 5)

  return (
    <>
      {/* Vertical guides */}
      {guides.vertical.map((position, index) => (
        <div
          key={`v-${index}`}
          className="absolute bg-blue-500 pointer-events-none"
          style={{
            left: position,
            top: 0,
            width: 1,
            height: "100%",
            zIndex: 99
          }}
        />
      ))}

      {/* Horizontal guides */}
      {guides.horizontal.map((position, index) => (
        <div
          key={`h-${index}`}
          className="absolute bg-blue-500 pointer-events-none"
          style={{
            left: 0,
            top: position,
            width: "100%",
            height: 1,
            zIndex: 99
          }}
        />
      ))}
    </>
  )
} 