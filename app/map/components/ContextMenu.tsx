"use client"

import React, { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Trash2, Lock, Unlock, Eye, EyeOff } from "lucide-react"

interface ContextMenuProps {
  x: number
  y: number
  shapeId?: string
  onClose: () => void
  onDelete: () => void
  onCopy: () => void
  onDuplicate: () => void
}

export function ContextMenu({ 
  x, 
  y, 
  shapeId, 
  onClose, 
  onDelete, 
  onCopy, 
  onDuplicate 
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
      style={{
        left: x,
        top: y,
        minWidth: "160px"
      }}
    >
      {shapeId ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2"
            onClick={onCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2"
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          
          <div className="border-t border-gray-200 my-1" />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </>
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">
          Right-click on a shape for options
        </div>
      )}
    </div>
  )
} 