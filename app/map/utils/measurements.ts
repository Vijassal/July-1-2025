// Convert feet to inches
export function convertToInches(feet: number): number {
  return feet * 12
}

// Convert inches to feet
export function convertToFeet(inches: number): number {
  return inches / 12
}

// Format measurements in feet and inches
export function formatMeasurement(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  
  if (feet === 0) {
    return `${remainingInches}"`
  } else if (remainingInches === 0) {
    return `${feet}'`
  } else {
    return `${feet}' ${remainingInches}"`
  }
}

// Snap value to grid
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// Calculate distance between two points
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// Check if two rectangles overlap
export function rectanglesOverlap(
  x1: number, y1: number, width1: number, height1: number,
  x2: number, y2: number, width2: number, height2: number
): boolean {
  return !(x1 + width1 < x2 || x2 + width2 < x1 || y1 + height1 < y2 || y2 + height2 < y1)
}

// Get alignment guides for shapes
export function getAlignmentGuides(
  selectedShapes: Array<{ x: number; y: number; width: number; height: number }>,
  allShapes: Array<{ x: number; y: number; width: number; height: number }>,
  tolerance: number = 5
) {
  const guides = {
    vertical: [] as number[],
    horizontal: [] as number[]
  }

  // Get edges of selected shapes
  const selectedEdges = selectedShapes.flatMap(shape => [
    shape.x, // left
    shape.x + shape.width, // right
    shape.x + shape.width / 2, // center
    shape.y, // top
    shape.y + shape.height, // bottom
    shape.y + shape.height / 2 // middle
  ])

  // Check alignment with other shapes
  allShapes.forEach(shape => {
    if (selectedShapes.includes(shape)) return

    const edges = [
      shape.x, // left
      shape.x + shape.width, // right
      shape.x + shape.width / 2, // center
      shape.y, // top
      shape.y + shape.height, // bottom
      shape.y + shape.height / 2 // middle
    ]

    edges.forEach(edge => {
      selectedEdges.forEach(selectedEdge => {
        if (Math.abs(edge - selectedEdge) <= tolerance) {
          if (edge === shape.x || edge === shape.x + shape.width || edge === shape.x + shape.width / 2) {
            guides.vertical.push(edge)
          } else {
            guides.horizontal.push(edge)
          }
        }
      })
    })
  })

  return guides
} 