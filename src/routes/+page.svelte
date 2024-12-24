<script lang="ts">
	interface Polygon {
		sides: number[]; // side lengths
		angles: number[]; // angles in degrees, n - 3 are required
	}

	function calculatePolygonArea(polygon: Polygon): number | null {
		const n = polygon.sides.length;
		const justEnoughAngles = polygon.angles.length == n - 3;
		const anglesAreValid = polygon.angles.every((angle) => !isNaN(angle));
		const sidesAreValid = polygon.sides.every((side) => side >= 0);
		if (justEnoughAngles && anglesAreValid && sidesAreValid) {
			if (n == 3) {
				const [a, b, c] = polygon.sides;
				const p = (a + b + c) / 2;
				const area = Math.sqrt(p * (p - a) * (p - b) * (p - c));
				if (isNaN(area)) {
					return null;
				} else {
					return area; // .toFixed(2)
				}
			}
			return 0; // stub
		} else {
			return null;
		}
	}

	const latinLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function mkSideName(i: number, size: number): string {
		const startLetter = latinLetter[i];
		const endLetter = latinLetter[(i + 1) % size];
		return startLetter + endLetter;
	}

	const defaultPolygon: Polygon = {
		sides: [6, 8, 10],
		angles: []
	};
	let polygon: Polygon = $state(defaultPolygon);
	let nSides = $derived(polygon.sides.length);
	let area = $derived(calculatePolygonArea(polygon));
</script>

<main>
	<h1>Polygon Area Calculator</h1>
	{#each polygon.sides as side, i}
		<div class="input-group">
			<label>
				Side {mkSideName(i, polygon.sides.length)} =
				<input type="number" bind:value={polygon.sides[i]} />
			</label>
		</div>
	{/each}
	{#if area !== null}
		<div class="result">
			<h2>Area = {area.toFixed(3)}</h2>
		</div>
	{/if}
</main>
