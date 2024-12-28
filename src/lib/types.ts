export type Index = number // non-negative integer
export type Size = number // non-negative integer
export type SideLength = number // non-negative, non-NaN
export type Angle = number
export type Area = number // non-negative, non-NaN

/** sides and angles can be nulls when corresponding inputs are blank. Nulls should be treated as 0 (`+null === 0`) */
export interface Polygon {
  sides: SideLength[] // side lengths
  angles: Angle[] // angles in degrees, n - 3 are required
}

export interface Vertex {
  x: number
  y: number
}

export function Point(x: number, y: number): Vertex {
  return { x: x, y: y }
}

export interface Edge {
  start: Vertex
  end: Vertex
}
