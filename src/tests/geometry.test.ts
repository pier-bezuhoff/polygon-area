// run tests with
// $ npx vitest run
import { describe, it, expect } from 'vitest'
import { Point } from '../lib/types'
import { pointLiesOnEdge, edgesIntersect } from '../lib/geometry'

describe('segment intersection', () => {
  it('point-segment', () => {
    expect(pointLiesOnEdge(Point(2, -1), { start: Point(0, 0), end: Point(4, -2) })).toBeTruthy()
    expect(pointLiesOnEdge(Point(2, 0), { start: Point(0, 0), end: Point(4, -2) })).toBeFalsy()
    expect(pointLiesOnEdge(Point(-2, 1), { start: Point(0, 0), end: Point(4, -2) })).toBeFalsy()
    expect(pointLiesOnEdge(Point(6, -3), { start: Point(0, 0), end: Point(4, -2) })).toBeFalsy()
  })
  it('segment-segment', () => {
    expect(
      edgesIntersect(
        { start: Point(-1, 0), end: Point(1, 0) },
        { start: Point(0, -1), end: Point(0, 1) },
      ),
    ).toBeTruthy()
    expect(
      edgesIntersect(
        { start: Point(0, 0), end: Point(6, 0) },
        { start: Point(-0.128, 5.142), end: Point(1.772, -4.6755) },
      ),
    ).toBeTruthy()
  })
})
