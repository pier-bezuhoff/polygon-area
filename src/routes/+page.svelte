<script lang="ts">
	import { onMount } from 'svelte';
	import type { Index, Size, Polygon, Vertex, Angle, Area } from '$lib/types';
	import {
		calculatePolygonVertices,
		calculateAngles,
		calculateArea,
		calculateFitInScaling
	} from '$lib/geometry';

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
	let angles: Agle[] = $derived.by(() => {
		const allAngles = calculateAngles(vertices);
		if (vertices.length != polygon.sides.length) {
			// last vertex is missing
			allAngles.pop();
			allAngles.pop();
		}
		return allAngles;
	});
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
			context.strokeStyle = '#000000';
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
				context.strokeStyle = '#670099';
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
				context.fillStyle = '#404040';
				context.font = '24px Noto Sans Math';
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

<svelte:head>
	<title>Polygon Area Calculator</title>
	<meta name="description" content="Calculate area of any polygon by its sides and some angles." />
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Math" rel="stylesheet" />
</svelte:head>
<main>
	<div class="row">
		<div class="left-column">
			<div class="entries">
				<h1>Polygon Area Calculator</h1>
				{#each polygon.sides as side, i}
					<div class="entry-row">
						<div class="side-entry">
							<label>
								|{mkSideName(i, polygon.sides.length)}| =
								<input type="number" class="side-input" bind:value={polygon.sides[i]} />
							</label>
						</div>
						<div class="angle-entry">
							{#if polygon.angles.length > i}
								<label>
									&angle;{latinLetters[i + 1]} = &angle;{latinLetters[i]}{latinLetters[
										i + 1
									]}{latinLetters[i + 2]} =
									<input type="number" class="angle-input" bind:value={polygon.angles[i]} />
									&deg;
								</label>
							{:else if i < angles.length}
								&angle;{latinLetters[i + 1]} = &angle;{latinLetters[i]}{latinLetters[
									i + 1
								]}{latinLetters[i + 2]} = {polygon.angles[i] ?? angles[i].toFixed(2)}&deg;
							{/if}
						</div>
					</div>
				{/each}
				{#if area != null}
					<hr class="result-separator" />
					<div class="result">
						<h2>Area = <em class="actual-area">{area.toPrecision(4)}</em></h2>
					</div>
				{/if}
			</div>
		</div>
		{#if vertices != null}
			<div class="right-column">
				<canvas bind:this={canvas} width="300" height="300"></canvas>
			</div>
		{/if}
	</div>
</main>

<style>
	:root {
		--primary-color: hsl(280, 100%, 30%); /* #670099 */
	}
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

	main,
	input[type='number'] {
		font-family: 'Noto Sans Math';
		font-size: 18px;
	}

	main {
		padding: 24px;
		height: 100%;
	}

	input[type='number'] {
		width: 50px;
	}

	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.left-column,
	.right-column {
		height: 100%;
		padding: 12px;
	}

	.left-column {
		width: 60%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.right-column {
		width: 40%;
	}

	.entry-row {
		display: flex;
		flex-direction: row;
	}

	.side-entry,
	.angle-entry {
		float: left;
		padding-top: 8px;
		padding-bottom: 8px;
	}

	/* staggered columns effect */
	.angle-entry {
		position: relative;
		top: 16px;
		margin-left: 16px;
	}

	.side-input {
		color: var(--primary-color);
	}

	.result-separator {
		float: left;
		width: 100%;
		margin-top: 36px;
		margin-bottom: 24px;
	}

	.result {
		float: left;
	}

	.actual-area {
		border: solid;
		border-radius: 12px;
		padding-left: 4px;
		padding-right: 12px;
	}
</style>
