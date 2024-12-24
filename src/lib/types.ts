export type Index = number; // non-negative integer
export type Size = number; // non-negative integer
export type SideLength = number; // non-negative, non-NaN
export type Angle = number;
export type Area = number; // non-negative, non-NaN

export type Polygon = {
    sides: SideLength[]; // side lengths
    angles: Angle[]; // angles in degrees, n - 3 are required
};

// export class Point {
   // x: number;
   // y: number;
   // constructor(x: number, y: number) {
       // this.x = x;
       // this.y = y;
   // }
// }

export type Vertex = {
    x: number;
    y: number;
};

