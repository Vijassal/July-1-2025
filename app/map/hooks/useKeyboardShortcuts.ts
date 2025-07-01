"use client"

import { useEffect } from "react"

interface KeyboardShortcutsProps {
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onCopy: () => void
  onPaste: () => void
  onSelectAll: () => void
  onDeselect: () => void
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onSelectAll,
  onDeselect
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              onRedo()
            } else {
              onUndo()
            }
            break
          case "y":
            e.preventDefault()
            onRedo()
            break
          case "c":
            e.preventDefault()
            onCopy()
            break
          case "v":
            e.preventDefault()
            onPaste()
            break
          case "a":
            e.preventDefault()
            onSelectAll()
            break
        }
      } else {
        switch (e.key) {
          case "Delete":
          case "Backspace":
            e.preventDefault()
            onDelete()
            break
          case "Escape":
            e.preventDefault()
            onDeselect()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onUndo, onRedo, onDelete, onCopy, onPaste, onSelectAll, onDeselect])
} 