import { describe, it, expect } from 'vitest';
import type { Edge } from '../lib/types';
import { Point } from '../lib/types';
import { pointLiesOnEdge, edgesIntersect } from '../lib/geometry';

describe("segment intersectino", () => {
    it("+", () => {
        expect(edgesIntersect({start: Point(-1, 0), end: Point(1, 0)}, {start: Point(0, -1), end: Point(0, 1)})).toBeTruthy();
    });
});
