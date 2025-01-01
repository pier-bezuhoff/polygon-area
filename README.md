# Polygon Area Calculator
Simple calculator for area of arbitrary polygons, given their side lengths and minimal neccessary number of angles.  
The site: [pier-bezuhoff.github.io/polygon-area](https://pier-bezuhoff.github.io/polygon-area/)  

## Features
- Arbitrary N-polygons with arbitrary side lengths
- Minimum required parameteres (sides + angles)
- All non-specified angles are also calculated
- Visualized
- Regular polygons
- Light/dark mode
- Responsive design for mobile
- Last used parameters are persisted in `localStorage`

## NB
Triangle requires 0 additional angles, quadrilateral — 1, pentagon — 2, hexagon — 3, etc.  
Out of 2 possible configurations of vertices chosen one without self-crossing edges and preferably convex.  
When no valid polygon is possible given inputted parameters, it will appear open and no area is returned.

