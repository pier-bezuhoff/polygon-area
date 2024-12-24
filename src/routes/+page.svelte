<script lang="ts">
	import type { Index, Size, Polygon, Vertex, Area } from '$lib/types';
	import { calculatePolygonArea, calculatePolygonVertices, calculateArea } from '$lib/geometry';

	const latinLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function mkSideName(i: Index, size: Size): string {
		const startLetter = latinLetter[i];
		const endLetter = latinLetter[(i + 1) % size];
		return startLetter + endLetter;
	}

	const defaultPolygon: Polygon = {
		sides: [6, 8, 10],
		angles: []
	};
	let polygon: Polygon = $state(defaultPolygon);
	let vertices: Vertex[] = $derived(calculatePolygonVertices(polygon));
	let area: Area | null = $derived(calculateArea(vertices)); //$derived(calculatePolygonArea(polygon));
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
			<h2>Area = {area.toPrecision(4)}</h2>
		</div>
	{/if}
</main>

<style>
	/* Hide arrows on number inputs */
	/* Chrome, Safari, Edge, Opera */
	:global(input::-webkit-outer-spin-button),
	:global(input::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	/* Firefox */
	:global(input[type='number']) {
		-moz-appearance: textfield;
	}
</style>
