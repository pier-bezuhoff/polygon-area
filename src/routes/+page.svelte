<script lang="ts">
  import { onMount } from 'svelte';
  import type { Index, Size, Polygon, Vertex, Angle, Area } from '$lib/types';
  import {
    calculatePolygonVertices,
    calculateAngles,
    calculateArea,
    calculateFitInScaling,
    calculateRegularPolygonAngle,
  } from '$lib/geometry';

  const latinLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  /** e.g. 0 -> AB, 1 -> BC, 2 -> CA when size = 3 */
  function mkSideName(i: Index, size: Size): string {
    const startLetters = latinLetters[i];
    const endLetters = latinLetters[(i + 1) % size];
    return startLetters + endLetters;
  }

  function mkAngleName(i: Index, size: Size): string {
    const j = (i + 1) % size;
    const k = (i + 2) % size;
    const startLetter = latinLetters[i];
    const pivotLetter = latinLetters[j];
    const endLetter = latinLetters[k];
    return `∠${pivotLetter} = ∠${startLetter}${pivotLetter}${endLetter} =`;
  }

  function setColorScheme(isLight: boolean) {
    const root = document.querySelector(':root');
    const scheme = isLight ? 'light' : 'dark';
    root.style.setProperty('color-scheme', scheme);
  }

  let lightScheme: boolean = $state(true);
  $effect(() => {
    // load / guess preffered scheme
    const locallySavedLightScheme = localStorage.getItem('lightScheme');
    if (locallySavedLightScheme != null) {
      lightScheme = locallySavedLightScheme === 'true';
    } else {
      const darkIsPreferred = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true;
      lightScheme = !darkIsPreferred;
    }
  });
  $effect(() => {
    const newLight = lightScheme; // lightScheme update hook
    setColorScheme(newLight);
    localStorage.setItem('lightScheme', newLight);
  });
  const defaultPolygon: Polygon = {
    sides: [6, 8, 10, 5],
    angles: [70],
  };
  let polygon: Polygon = $state(defaultPolygon);
  let vertices: Vertex[] = $derived(calculatePolygonVertices(polygon));
  let angles: Angle[] = $derived.by(() => {
    const allAngles = calculateAngles(vertices);
    if (vertices.length != polygon.sides.length) {
      // last vertex is missing
      allAngles.pop();
      allAngles.pop();
    }
    return allAngles;
  });
  let area: Area | null = $derived(
    vertices.length != polygon.sides.length ? null : Math.abs(calculateArea(vertices)), // negative area can spook ppl i suppose
  );

  let canvas: HTMLCanvasElement;
  const canvasPaddingPercent = 20;
  $effect(() => {
    if (canvas != undefined) {
      const context = canvas.getContext('2d')!;
      const w = canvas.width;
      const h = canvas.height;
      context.strokeStyle = lightScheme ? '#000000' : '#ffffff';
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
          paddedK * h,
        );
        context.strokeStyle = lightScheme ? '#8800cc' : '#bb33ff'; // based on hsl(280, 100, 60)
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
        context.fillStyle = lightScheme ? '#000000' : '#ffffff';
        /* context.font = '24px Noto Sans Math'; */
        context.font = '20px Arial';
        for (let i = 0; i < vertices.length; i++) {
          v = vertices[i];
          x = canvasCenterX + (v.x - centerX) * scaleFactor;
          y = canvasCenterY + (v.y - centerY) * scaleFactor;
          context.fillText(latinLetters[i], x + 5, y - 5);
        }
      }
    }
  });

  function addSide() {
    const firstNonInputAngle = angles[polygon.angles.length];
    polygon.angles.push(parseFloat(firstNonInputAngle.toFixed(2)));
    polygon.sides.push(1);
  }

  function deleteSide() {
    polygon.sides.pop();
    polygon.angles.pop();
  }

  function toRegularPolygon() {
    const n = polygon.sides.length;
    const angle = parseFloat(calculateRegularPolygonAngle(n).toFixed(2));
    const sideLength = polygon.sides[0] ?? 1;
    for (let i = 0; i < n; i++) {
      polygon.sides[i] = sideLength;
      if (i < polygon.angles.length) {
        polygon.angles[i] = angle;
      }
    }
  }

  function toggleColorScheme() {
    lightScheme = !lightScheme;
  }
</script>

<!-- -->

<svelte:head>
  <title>Polygon Area Online Calculator</title>
  <meta
    name="description"
    content="Calculate area of any polygon by its sides and some angles with picture | Free Online Calculator & Vizualizer for Arbitrary Polygons"
  />
  <link href="https://fonts.googleapis.com/css?family=Noto Sans Math" rel="stylesheet" />
  <meta name="google-site-verification" content="yKOpXb8Zc0SJds3eFMCCXDqQp52QWU2oVZR0exhXWxU" />
</svelte:head>
<main>
  <button type="button" class="light-dark-toggle" onclick={toggleColorScheme}
    >{@html lightScheme ? '&#9728;' : '&#127768;'}</button
  >
  <div class="row">
    <div class="left-column">
      <div class="calcs">
        <div class="entries">
          <h1>&#11041; Polygon Area Calculator &#11042;</h1>
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
                    {mkAngleName(i, polygon.sides.length)}
                    <input type="number" class="angle-input" bind:value={polygon.angles[i]} />
                    &deg;
                  </label>
                {:else if i < angles.length}
                  {mkAngleName(i, polygon.sides.length)}
                  {polygon.angles[i] ?? angles[i].toFixed(2)}&deg;
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="buttons-row">
          <button type="button" class="control-button" onclick={addSide}>Add another side</button>
          <button type="button" class="control-button" onclick={deleteSide}>Delete last side</button
          >
          <button type="button" class="control-button" onclick={toRegularPolygon}
            >Regular polygon</button
          >
        </div>
        {#if area != null}
          <hr class="result-separator" />
          <div class="result-wrap">
            <h2>Area <i>S</i> = <i class="actual-area">{area.toPrecision(6)}</i></h2>
          </div>
        {/if}
      </div>
    </div>
    {#if vertices != null}
      <div class="right-column">
        <div class="canvas-wrap">
          <canvas bind:this={canvas} width="300" height="300"></canvas>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  :root {
    color-scheme: light dark;
    --accent-color-light: hsl(280, 100%, 50%);
    --accent-color-dark: hsl(280, 100%, 60%);
    --text-color: light-dark(black, white);
    --bg-color: light-dark(white, rgb(31, 31, 31));
    --accent-color: light-dark(var(--accent-color-light), var(--accent-color-dark));
    color: var(--text-color);
    background-color: var(--bg-color);
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
    margin: 24px;
  }

  input[type='number'] {
    width: 60px;
  }

  .row {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .left-column,
  .right-column {
    padding: 12px;
  }

  .left-column {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: top;
  }

  .right-column {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .calcs {
    padding-left: 24px;
    padding-right: 24px;
  }

  .entries {
    /* margin-left: 8px; */
  }

  .entry-row {
    display: flex;
    flex-direction: row;
  }

  .side-entry,
  .angle-entry {
    float: left;
    padding: 8px;
  }

  .side-entry {
    padding-left: 0px;
  }

  /* staggered columns effect */
  .angle-entry {
    position: relative;
    top: 18px;
    margin-left: 16px;
  }

  .side-input {
    color: var(--accent-color);
  }

  .buttons-row {
    display: flex;
    flex-direction: row;
    justify-content: start;
    margin-top: 24px;
  }

  .control-button {
    margin-right: 16px;
    font-size: 16px;
  }

  .result-separator {
    float: left;
    width: 100%;
    margin-top: 30px;
    margin-bottom: 30px;
  }

  .result-wrap {
  }

  .actual-area {
    border: solid;
    border-radius: 12px;
    border-color: var(--accent-color);
    padding-left: 4px;
    padding-right: 12px;
  }

  .canvas-wrap {
    display: flex;
    flex-direction: row;
    justify-content: start;
    padding: 48px;
  }

  canvas {
    width: 90%;
  }

  .light-dark-toggle {
    position: relative;
    top: 0px;
    float: right;
    font-size: 30px;
    background-color: transparent;
    border: none;
  }

  .light-dark-toggle:hover {
    filter: brightness(150%);
  }
</style>
