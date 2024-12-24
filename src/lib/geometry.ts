const { PI, abs, sqrt, sin, cos, hypot, atan2 } = Math;
import type { Polygon, Vertex, Angle, Area } from './types';

const EPSILON = 1e-6;

function calculateCircleIntersection(
	x1: number,
	y1: number,
	r1: number,
	x2: number,
	y2: number,
	r2: number
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
		return [{ x: x1 + (dcx / d) * r1, y: y1 + (dcy / d) * r1 }];
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
		const p = { x: pcx + vy, y: pcy - vx };
		const q = { x: pcx - vy, y: pcy + vx };
		return [p, q];
	}
}

/** Angle between two vectors in [0; 360) degrees */
function calculateAngle(dx1: number, dy1: number, dx2: number, dy2: number): Angle {
	const phi = atan2(dy2, dx2) - atan2(dy1, dx1); // in [-PI; PI]
	return ((phi * 180) / PI + 360) % 360;
}

export function polygonIsValid(polygon: Polygon): boolean {
	const n = polygon.sides.length;
	const justEnoughAngles = polygon.angles.length == n - 3;
	const anglesAreValid = polygon.angles.every((angle) => !isNaN(angle));
	const sidesAreValid = polygon.sides.every((side) => side >= 0);
	return justEnoughAngles && anglesAreValid && sidesAreValid;
}

export function calculatePolygonVertices(polygon: Polygon): Vertex[] | null {
	if (!polygonIsValid(polygon)) {
		return null;
	}
	const n = polygon.sides.length;
	const vertices: Vertex[] = [];
	if (n == 0) {
		return vertices;
	}
	vertices.push({ x: 0, y: 0 });
	if (n == 1) {
		return vertices;
	}
	vertices.push({ x: polygon.sides[0], y: 0 });
	for (var i = 0; i < polygon.angles.length; i++) {
		const lastVertex = vertices[i];
		const vertex = vertices[i + 1];
		// v = vector from the current vertex to the last
		const vx = lastVertex.x - vertex.x;
		const vy = lastVertex.y - vertex.y;
		const k = polygon.sides[i + 1] / hypot(vx, vy);
		const angle = (polygon.angles[i] * PI) / 180;
		const dx = k * (vx * sin(angle) - vy * cos(angle));
		const dy = k * (vx * cos(angle) + vy * sin(angle));
		const nextVertex = { x: vertex.x + dx, y: vertex.y + dy };
		vertices.push(nextVertex);
	} // we need to calc & add one last vertex
	const x1 = vertices[0].x; // first vertex
	const y1 = vertices[0].y;
	const x2 = vertices[n - 2].x; // penultimate vertex
	const y2 = vertices[n - 2].y;
	const l1 = polygon.sides[n - 1]; // side from 1st to last
	const l2 = polygon.sides[n - 2]; // side from penultimate to last
	if (x1 == x2 && y1 == y2) {
		if (l1 == l2) {
			vertices.push(vertices[0]);
			return vertices;
		} else {
			return null;
		}
	}
	const intersections = calculateCircleIntersection(x1, y1, l1, x2, y2, l2);
	if (intersections.length == 0) {
		return null;
	} else if (intersections.length == 1) {
		vertices.push(intersections[0]);
		return vertices;
	} else {
		const [v1, v2] = intersections; // we need to choose one of these somehow
		// const angle1 = calculateAngle(x1 - v1.x, y1 - v1.y, x2 - v1.x, y2 - v1.y);
		const angle2 = calculateAngle(x1 - v2.x, y1 - v2.y, x2 - v2.x, y2 - v2.y);
		if (angle2 > 180) {
			// we prefer convex shape
			vertices.push(v1);
		} else {
			vertices.push(v2);
		}
		return vertices;
	}
}

/** Shoelace formula: https://en.wikipedia.org/wiki/Shoelace_formula */
export function calculateArea(vertices: Vertex[]): Area {
	console.log(vertices);
	const n = vertices.length;
	let sum = 0.0;
	for (var i = 0; i < n; i++) {
		sum += vertices[i].y * (vertices[(i - 1 + n) % n].x - vertices[(i + 1) % n].x);
	}
	return sum / 2;
}

export function calculatePolygonArea(polygon: Polygon): Area | null {
	if (!polygonIsValid(polygon)) {
		return null;
	}
	const n = polygon.sides.length;
	if (n == 3) {
		const [a, b, c] = polygon.sides;
		const p = (a + b + c) / 2;
		const area = Math.sqrt(p * (p - a) * (p - b) * (p - c));
		if (isNaN(area)) {
			return null;
		} else {
			return area;
		}
	}
	return 0; // stub
}
