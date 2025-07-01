"use client"

import React from "react"

interface RulerProps {
  orientation: "horizontal" | "vertical"
  length: number
  pixelsPerUnit: number
  unit: string
}

export function Ruler({ orientation, length, pixelsPerUnit, unit }: RulerProps) {
  const isHorizontal = orientation === "horizontal"
  const rulerSize = 20

  const generateMarks = () => {
    const marks = []
    const units = Math.ceil(length / pixelsPerUnit)
    
    for (let i = 0; i <= units; i++) {
      const position = i * pixelsPerUnit
      const isMajorMark = i % 12 === 0 // Every foot
      const isMediumMark = i % 6 === 0 // Every 6 inches
      
      if (position <= length) {
        marks.push({
          position,
          isMajor: isMajorMark,
          isMedium: isMediumMark,
          label: isMajorMark ? `${i / 12}${unit}` : ""
        })
      }
    }
    
    return marks
  }

  const marks = generateMarks()

  return (
    <div
      className="bg-gray-100 border-r border-b border-gray-300 text-xs text-gray-600"
      style={{
        position: "absolute",
        left: isHorizontal ? 0 : -rulerSize,
        top: isHorizontal ? -rulerSize : 0,
        width: isHorizontal ? length : rulerSize,
        height: isHorizontal ? rulerSize : length,
        zIndex: 10
      }}
    >
      {marks.map((mark, index) => (
        <div
          key={index}
          className="absolute bg-gray-300"
          style={{
            left: isHorizontal ? mark.position : 0,
            top: isHorizontal ? 0 : mark.position,
            width: isHorizontal ? 1 : rulerSize,
            height: isHorizontal ? rulerSize : 1,
            borderTop: isHorizontal ? "none" : mark.isMajor ? "2px solid #666" : mark.isMedium ? "1px solid #999" : "1px solid #ccc",
            borderLeft: isHorizontal ? mark.isMajor ? "2px solid #666" : mark.isMedium ? "1px solid #999" : "1px solid #ccc" : "none"
          }}
        >
          {mark.label && (
            <div
              className="absolute text-xs font-medium"
              style={{
                left: isHorizontal ? mark.position + 2 : 2,
                top: isHorizontal ? 2 : mark.position + 2,
                transform: isHorizontal ? "none" : "rotate(-90deg)",
                transformOrigin: "0 0"
              }}
            >
              {mark.label}
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 