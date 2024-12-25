const { PI, abs, min, max, sqrt, sin, cos, hypot, atan2 } = Math;
import type { Polygon, Vertex, Edge, Angle, Area, Size } from './types';
import { Point } from './types';

const EPSILON = 1e-6;

export function calculateCircleIntersection(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): Vertex[] {
  const r12 = r1 * r1;
  const r22 = r2 * r2;
  const dcx = x2 - x1;
  const dcy = y2 - y1;
  const d2 = dcx * dcx + dcy * dcy;
  const d = sqrt(d2); // distance between centers
  if (abs(r1 - r2) > d + EPSILON || d > r1 + r2 + EPSILON || (x1 == x2 && y1 == y2 && r1 == r2)) {
    return [];
  } else if (
    abs(abs(r1 - r2) - d) < EPSILON || // inner touch
    abs(d - r1 - r2) < EPSILON // outer touch
  ) {
    return [Point(x1 + (dcx / d) * r1, y1 + (dcy / d) * r1)];
  } else {
    const dr2 = r12 - r22;
    // reference (0->1, 1->2):
    // https://stackoverflow.com/questions/3349125/circle-circle-intersection-points#answer-3349134
    const a = (d2 + dr2) / (2 * d);
    const h = sqrt(r12 - a * a);
    const pcx = x1 + (a * dcx) / d;
    const pcy = y1 + (a * dcy) / d;
    const vx = (h * dcx) / d;
    const vy = (h * dcy) / d;
    const p = Point(pcx + vy, pcy - vx);
    const q = Point(pcx - vy, pcy + vx);
    return [p, q];
  }
}

/** Angle between two vectors in [0; 360) degrees, CCW in right-hand xOy */
function calculateAngle(dx1: number, dy1: number, dx2: number, dy2: number): Angle {
  const phi = atan2(dy2, dx2) - atan2(dy1, dx1); // in [-PI; PI]
  return ((phi * 180) / PI + 360) % 360;
}

function calculateAngle3(start: Vertex, pivot: Vertex, end: Vertex): Angle {
  return calculateAngle(start.x - pivot.x, start.y - pivot.y, end.x - pivot.x, end.y - pivot.y);
}

export function pointLiesOnEdge(point: Vertex, edge: Edge): boolean {
  const { start, end } = edge;
  const onLine =
    abs((point.y - start.y) * (end.x - start.x) - (point.x - start.x) * (end.y - start.y)) <
    EPSILON;
  if (!onLine) {
    return false;
  }
  const spx = point.x - start.x;
  const spy = point.y - start.y;
  const sex = end.x - start.x;
  const sey = end.y - start.y;
  const m = (spx * sex + spy * sey) / (sex * sex + sey * sey); // should be in [0; 1]
  return 0 <= m && m <= 1;
}

export function edgesIntersect(edge1: Edge, edge2: Edge): boolean {
  const start1 = edge1.start;
  const end1 = edge1.end;
  const start2 = edge2.start;
  const end2 = edge2.end;
  if (start1.x == end1.x) {
    const x = start1.x; // 1: x = start1.x
    if (start2.x == end2.x) {
      // parallel vertical edges
      return false;
    }
    const k2 = (end2.y - start2.y) / (end2.x - start2.x);
    const y = k2 * (x - start2.x) + start2.y;
    const p = Point(x, y);
    const itLiesOnEdge1 = pointLiesOnEdge(p, edge1);
    const itLiesOnEdge2 = pointLiesOnEdge(p, edge2);
    return itLiesOnEdge1 && itLiesOnEdge2;
  } else if (start2.x == end2.x) {
    const x = start2.x; // 2: x = start2.x
    const k1 = (end1.y - start1.y) / (end1.x - start1.x);
    const y = k1 * (x - start1.x) + start1.y;
    const p = Point(x, y);
    const itLiesOnEdge1 = pointLiesOnEdge(p, edge1);
    const itLiesOnEdge2 = pointLiesOnEdge(p, edge2);
    return itLiesOnEdge1 && itLiesOnEdge2;
  } else {
    const k1 = (end1.y - start1.y) / (end1.x - start1.x);
    const k2 = (end2.y - start2.y) / (end2.x - start2.x);
    if (k1 == k2) {
      // parallel edges
      return false;
    } else {
      const x = (start2.y - start1.y - k2 * start2.x + k1 * start1.x) / (k1 - k2);
      const y = k1 * (x - start1.x) + start1.y;
      const p = Point(x, y);
      const itLiesOnEdge1 = pointLiesOnEdge(p, edge1);
      const itLiesOnEdge2 = pointLiesOnEdge(p, edge2);
      return itLiesOnEdge1 && itLiesOnEdge2;
    }
  }
}

export function polygonIsValid(polygon: Polygon): boolean {
  const n = polygon.sides.length;
  const justEnoughAngles = polygon.angles.length == n - 3;
  const anglesAreValid = polygon.angles.every((angle) => !isNaN(angle));
  const sidesAreValid = polygon.sides.every((side) => side >= 0);
  return justEnoughAngles && anglesAreValid && sidesAreValid;
}

/** If there are less vertices than polygon sides, something gone wrong */
export function calculatePolygonVertices(polygon: Polygon): Vertex[] {
  if (!polygonIsValid(polygon)) {
    return [];
  }
  const n = polygon.sides.length;
  const vertices: Vertex[] = [];
  if (n == 0) {
    return vertices;
  }
  vertices.push(Point(0, 0));
  if (n == 1) {
    return vertices;
  }
  vertices.push(Point(polygon.sides[0], 0));
  for (let i = 0; i < polygon.angles.length; i++) {
    const lastVertex = vertices[i];
    const vertex = vertices[i + 1];
    // v = vector from the current vertex to the last
    const vx = lastVertex.x - vertex.x;
    const vy = lastVertex.y - vertex.y;
    const k = polygon.sides[i + 1] / hypot(vx, vy);
    const angle = (-polygon.angles[i] * PI) / 180; // flip angles cuz our xOy is left-handed
    const dx = k * (vx * cos(angle) - vy * sin(angle));
    const dy = k * (vx * sin(angle) + vy * cos(angle));
    const nextVertex = Point(vertex.x + dx, vertex.y + dy);
    vertices.push(nextVertex);
  } // we need to calc & add one last vertex
  const v0 = vertices[0];
  const x1 = v0.x; // first vertex
  const y1 = v0.y;
  const vp = vertices[n - 2]; // penultimate vertex
  const x2 = vp.x;
  const y2 = vp.y;
  const l1 = polygon.sides[n - 1]; // side from 1st to last
  const l2 = polygon.sides[n - 2]; // side from penultimate to last
  if (x1 == x2 && y1 == y2) {
    if (l1 == l2) {
      vertices.push(v0);
      return vertices;
    } else {
      return vertices;
    }
  }
  const intersections = calculateCircleIntersection(x1, y1, l1, x2, y2, l2);
  if (intersections.length == 0) {
    return vertices;
  } else if (intersections.length == 1) {
    vertices.push(intersections[0]);
    return vertices;
  } else {
    const [v1, v2] = intersections; // we need to choose one of these somehow
    // first we want to avoid self-crossing, secondly we prefer convex shape
    let selfCross = false;
    let edge1 = { start: v2, end: v0 };
    let edge: Edge;
    for (let i = 1; !selfCross && i < n - 2; i++) {
      edge = { start: vertices[i], end: vertices[i + 1] };
      selfCross = edgesIntersect(edge1, edge);
    }
    let edge2 = { start: vp, end: v2 };
    for (let i = 0; !selfCross && i < n - 3; i++) {
      edge = { start: vertices[i], end: vertices[i + 1] };
      selfCross = edgesIntersect(edge2, edge);
    }
    if (selfCross) {
      vertices.push(v1);
    } else {
      const nextAngle2 = calculateAngle3(vertices[1], v0, v2);
      const currentAngle2 = calculateAngle3(v0, v2, vp);
      const previousAngle2 = calculateAngle3(v2, vp, vertices[n - 3]);
      if (nextAngle2 > 180 || currentAngle2 > 180 || previousAngle2 > 180) {
        // we prefer convex shape, but v1 can lead to self-crossing
        selfCross = false;
        edge1 = { start: v1, end: v0 };
        for (let i = 1; !selfCross && i < n - 2; i++) {
          edge = { start: vertices[i], end: vertices[i + 1] };
          selfCross = edgesIntersect(edge1, edge);
        }
        edge2 = { start: vp, end: v1 };
        for (let i = 0; !selfCross && i < n - 3; i++) {
          edge = { start: vertices[i], end: vertices[i + 1] };
          selfCross = edgesIntersect(edge2, edge);
        }
        if (selfCross) {
          vertices.push(v2);
        } else {
          vertices.push(v1);
        }
      } else {
        vertices.push(v2);
      }
    }
    return vertices;
  }
}

export function calculateAngles(vertices: Vertex[]): Angle[] {
  const n = vertices.length;
  const angles: Angle[] = [];
  for (let i = 0; i < n; i++) {
    const start = vertices[i];
    const pivot = vertices[(i + 1) % n];
    const end = vertices[(i + 2) % n];
    angles.push(360 - calculateAngle3(start, pivot, end)); // adjustment for left-hand xOy system
  }
  return angles;
}

/** Shoelace formula: https://en.wikipedia.org/wiki/Shoelace_formula */
export function calculateArea(vertices: Vertex[]): Area {
  const n = vertices.length;
  let sum = 0.0;
  for (let i = 0; i < n; i++) {
    sum += vertices[i].y * (vertices[(i - 1 + n) % n].x - vertices[(i + 1) % n].x);
  }
  return sum / 2;
}

export function calculateRegularPolygonAngle(n: Size): Angle {
  return ((((n - 2) * PI) / n) * 180) / PI;
}

export type Scaling = {
  centerX: number;
  centerY: number;
  scaleFactor: number;
};

/** scale up by this coefficient wrt. center  */
export function calculateFitInScaling(
  vertices: Vertex[],
  maxWidth: number,
  maxHeight: number,
): Scaling {
  if (vertices.length == 0) {
    return { centerX: 0, centerY: 0, scaleFactor: 1 };
  }
  let top = vertices[0].y;
  let left = vertices[0].x;
  let bottom = vertices[0].y;
  let right = vertices[0].x;
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i];
    top = min(v.y, top);
    left = min(v.x, left);
    bottom = max(v.y, bottom);
    right = max(v.x, right);
  }
  const w = right - left;
  const h = bottom - top;
  const horizontalK = maxWidth / w;
  const verticalK = maxHeight / h;
  const k = min(horizontalK, verticalK);
  return { centerX: (left + right) / 2, centerY: (top + bottom) / 2, scaleFactor: k };
}
