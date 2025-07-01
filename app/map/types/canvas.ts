export type Tool = "select" | "rectangle" | "circle" | "line" | "polygon" | "text"

export type Shape = {
  id: string
  type: "rectangle" | "circle" | "line" | "polygon" | "text"
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fill: string
  stroke: string
  strokeWidth: number
  text?: string
  points?: { x: number; y: number }[]
  selected: boolean
  locked: boolean
  visible: boolean
  zIndex: number
} 