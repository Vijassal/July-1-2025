"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Shape } from "../types/canvas"

interface Collaborator {
  id: string
  name: string
  cursor: { x: number; y: number }
}

export function useCollaboration(blueprintId: string, userId: string) {
  const [remoteShapes, setRemoteShapes] = useState<Shape[]>([])
  const [remoteCursors, setRemoteCursors] = useState<Collaborator[]>([])
  const [collaborationEnabled, setCollaborationEnabled] = useState(false)

  // Send shape updates to other users
  const sendShapeUpdate = useCallback(async (shapes: Shape[]) => {
    if (!collaborationEnabled) return
    
    try {
      const { error } = await supabase
        .from("blueprint_collaboration")
        .upsert({
          blueprint_id: blueprintId,
          user_id: userId,
          shapes_data: JSON.stringify(shapes),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.warn("Collaboration not available - tables may not exist yet:", error.message)
        setCollaborationEnabled(false)
      }
    } catch (error) {
      console.warn("Collaboration not available:", error)
      setCollaborationEnabled(false)
    }
  }, [blueprintId, userId, collaborationEnabled])

  // Send cursor position to other users
  const sendCursorUpdate = useCallback(async (cursor: { x: number; y: number }) => {
    if (!collaborationEnabled) return
    
    try {
      const { error } = await supabase
        .from("blueprint_cursors")
        .upsert({
          blueprint_id: blueprintId,
          user_id: userId,
          cursor_x: cursor.x,
          cursor_y: cursor.y,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.warn("Cursor tracking not available:", error.message)
        setCollaborationEnabled(false)
      }
    } catch (error) {
      console.warn("Cursor tracking not available:", error)
      setCollaborationEnabled(false)
    }
  }, [blueprintId, userId, collaborationEnabled])

  // Test if collaboration tables exist
  useEffect(() => {
    const testCollaboration = async () => {
      try {
        const { error } = await supabase
          .from("blueprint_collaboration")
          .select("id")
          .limit(1)

        if (error) {
          console.log("Collaboration tables not available - running in local mode")
          setCollaborationEnabled(false)
        } else {
          setCollaborationEnabled(true)
        }
      } catch (error) {
        console.log("Collaboration not available - running in local mode")
        setCollaborationEnabled(false)
      }
    }

    testCollaboration()
  }, [])

  // Subscribe to real-time updates only if collaboration is enabled
  useEffect(() => {
    if (!collaborationEnabled) return

    // Subscribe to shape updates
    const shapesSubscription = supabase
      .channel(`blueprint-shapes-${blueprintId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blueprint_collaboration",
          filter: `blueprint_id=eq.${blueprintId}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).user_id !== userId) {
            try {
              const shapes = JSON.parse((payload.new as any).shapes_data)
              setRemoteShapes(shapes)
            } catch (error) {
              console.error("Error parsing remote shapes:", error)
            }
          }
        }
      )
      .subscribe()

    // Subscribe to cursor updates
    const cursorsSubscription = supabase
      .channel(`blueprint-cursors-${blueprintId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blueprint_cursors",
          filter: `blueprint_id=eq.${blueprintId}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).user_id !== userId) {
            setRemoteCursors(prev => {
              const existing = prev.find(c => c.id === (payload.new as any).user_id)
              if (existing) {
                return prev.map(c => 
                  c.id === (payload.new as any).user_id 
                    ? { ...c, cursor: { x: (payload.new as any).cursor_x, y: (payload.new as any).cursor_y } }
                    : c
                )
              } else {
                return [...prev, {
                  id: (payload.new as any).user_id,
                  name: `User ${(payload.new as any).user_id.slice(0, 8)}`,
                  cursor: { x: (payload.new as any).cursor_x, y: (payload.new as any).cursor_y }
                }]
              }
            })
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      shapesSubscription.unsubscribe()
      cursorsSubscription.unsubscribe()
    }
  }, [blueprintId, userId, collaborationEnabled])

  // Clean up old cursor data periodically
  useEffect(() => {
    if (!collaborationEnabled) return

    const cleanupInterval = setInterval(async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        await supabase
          .from("blueprint_cursors")
          .delete()
          .lt("updated_at", fiveMinutesAgo)
      } catch (error) {
        console.warn("Error cleaning up old cursors:", error)
      }
    }, 60000) // Clean up every minute

    return () => clearInterval(cleanupInterval)
  }, [collaborationEnabled])

  return {
    sendShapeUpdate,
    sendCursorUpdate,
    remoteShapes,
    remoteCursors,
    collaborationEnabled
  }
} 