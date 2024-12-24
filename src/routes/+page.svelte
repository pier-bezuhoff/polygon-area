<script lang="ts">
	import { onMount } from 'svelte';
	import type { Index, Size, Polygon, Vertex, Area } from '$lib/types';
	import { calculatePolygonVertices, calculateArea, calculateFitInScaling } from '$lib/geometry';

	const latinLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	/** e.g. 0 -> AB, 1 -> BC, 2 -> CA when size = 3 */
	function mkSideName(i: Index, size: Size): string {
		const startLetters = latinLetters[i];
		const endLetters = latinLetters[(i + 1) % size];
		return startLetters + endLetters;
	}

	const defaultPolygon1: Polygon = {
		sides: [6, 8, 10],
		angles: []
	};
	const defaultPolygon: Polygon = {
		sides: [6, 8, 10, 5],
		angles: [40]
	};
	let polygon: Polygon = $state(defaultPolygon);
	let vertices: Vertex[] = $derived(calculatePolygonVertices(polygon));
	$inspect(vertices);
	let area: Area | null = $derived(
		vertices.length != polygon.sides.length ? null : calculateArea(vertices)
	);

	let canvas: HTMLCanvasElement;
	const canvasPaddingPercent = 20;
	$effect(() => {
		if (canvas != undefined) {
			const context = canvas.getContext('2d')!;
			const w = canvas.width;
			const h = canvas.height;
			context.clearRect(0, 0, w, h);
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(w - 1, 0);
			context.lineTo(w - 1, h - 1);
			context.lineTo(0, h - 1);
			context.closePath();
			context.stroke();
			if (vertices != null && vertices.length > 0) {
				const canvasCenterX = w / 2;
				const canvasCenterY = h / 2;
				const paddedK = 1 - canvasPaddingPercent / 100;
				const { centerX, centerY, scaleFactor } = calculateFitInScaling(
					vertices,
					paddedK * w,
					paddedK * h
				);
				$inspect(centerX, centerY, scaleFactor);
				context.strokeStyle = '#ff00ff';
				context.beginPath();
				let v = vertices[0]; // we are center-ing and scaling our polygon
				let x = canvasCenterX + (v.x - centerX) * scaleFactor;
				let y = canvasCenterY + (v.y - centerY) * scaleFactor;
				context.moveTo(x, y);
				for (let i = 1; i < vertices.length; i++) {
					v = vertices[i];
					x = canvasCenterX + (v.x - centerX) * scaleFactor;
					y = canvasCenterY + (v.y - centerY) * scaleFactor;
					context.lineTo(x, y);
				}
				if (vertices.length == polygon.sides.length) {
					context.closePath();
				}
				context.stroke();
				context.font = '24px serif';
				for (let i = 0; i < vertices.length; i++) {
					v = vertices[i];
					x = canvasCenterX + (v.x - centerX) * scaleFactor;
					y = canvasCenterY + (v.y - centerY) * scaleFactor;
					context.fillText(latinLetters[i], x + 5, y - 5);
				}
			}
		}
	});
</script>

<main>
	<h1>Polygon Area Calculator</h1>
	{#each polygon.sides as side, i}
		<div class="input-group">
			<label>
				|{mkSideName(i, polygon.sides.length)}| =
				<input type="number" bind:value={polygon.sides[i]} />
			</label>
			{#if polygon.angles.length > i}
				<label>
					Angle &angle;{latinLetters[i + 1]} = &angle;{latinLetters[i]}{latinLetters[
						i + 1
					]}{latinLetters[i + 2]} =
					<input type="number" bind:value={polygon.angles[i]} />
				</label>
			{/if}
		</div>
	{/each}
	{#if area != null}
		<div class="result">
			<h2>Area = {area.toPrecision(4)}</h2>
		</div>
	{/if}
	{#if vertices != null}
		<canvas bind:this={canvas} width="300" height="300"></canvas>
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
