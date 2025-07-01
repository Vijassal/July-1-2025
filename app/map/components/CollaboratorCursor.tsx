"use client"

import React from "react"

interface CollaboratorCursorProps {
  collaborator: {
    id: string
    name: string
    cursor: { x: number; y: number }
  }
  zoom: number
}

export function CollaboratorCursor({ collaborator, zoom }: CollaboratorCursorProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: collaborator.cursor.x,
        top: collaborator.cursor.y,
        transform: "translate(-50%, -50%)",
        zIndex: 102
      }}
    >
      {/* Cursor pointer */}
      <div
        className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
        style={{
          transform: "rotate(45deg)"
        }}
      />
      
      {/* Cursor label */}
      <div
        className="absolute top-4 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        style={{
          transform: "translateX(-50%)"
        }}
      >
        {collaborator.name}
      </div>
    </div>
  )
} 