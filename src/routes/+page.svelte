<script lang="ts">
  import { fade } from 'svelte/transition'
  import type { Index, Size, Polygon, Vertex, Angle, Area } from '$lib/types'
  import {
    calculatePolygonVertices,
    calculateAngles,
    calculateArea,
    calculateFitInScaling,
    calculateRegularPolygonAngle,
    polygonIsValid,
  } from '$lib/geometry'

  // TODO: intro text for gsearch preview, vertex coordinates lay-down + short write-up on the algorithm
  // MAYBE: given sides, come up with any angles making up closed polygon

  const latinLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  /** e.g. 0 -> AB, 1 -> BC, 2 -> CA when size = 3 */
  function mkSideName(i: Index, size: Size): string {
    const startLetters = latinLetters[i]
    const endLetters = latinLetters[(i + 1) % size]
    return startLetters + endLetters
  }

  /** e.g. 0 -> ABC, 1 -> BCA, 2 -> CAB when size = 3 */
  function mkAngleName(i: Index, size: Size): string {
    const j = (i + 1) % size
    const k = (i + 2) % size
    const startLetter = latinLetters[i]
    const pivotLetter = latinLetters[j]
    const endLetter = latinLetters[k]
    return `∠${pivotLetter} = ∠${startLetter}${pivotLetter}${endLetter} =`
  }

  function setColorScheme(isLight: boolean) {
    const root = document.querySelector(':root')
    const scheme = isLight ? 'light' : 'dark'
    root.style.setProperty('color-scheme', scheme)
  }

  const FADE_DURATION = 200 // milliseconds

  let lightScheme: boolean = $state(true)
  $effect(() => {
    // load / guess preferred scheme
    const locallySavedLightScheme = localStorage.getItem('lightScheme')
    if (locallySavedLightScheme != null) {
      lightScheme = locallySavedLightScheme === 'true'
    } else {
      const darkIsPreferred = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true
      lightScheme = !darkIsPreferred
    }
  })
  $effect(() => {
    const newLight = lightScheme // lightScheme update hook
    setColorScheme(newLight)
    localStorage.setItem('lightScheme', newLight)
  })
  const defaultPolygon: Polygon = {
    sides: [6, 8, 10, 5],
    angles: [70],
  }
  const lightningBoltPolygon: Polygon = {
    sides: [1, 2, 1, 3.6, 2, 1, 3],
    angles: [60, 300, 45, 15],
  }
  let polygon: Polygon = $state(lightningBoltPolygon)
  $effect(() => {
    const locallySavedPolygon = localStorage.getItem('polygon')
    if (locallySavedPolygon) {
      const parsed = JSON.parse(locallySavedPolygon)
      if (polygonIsValid(parsed)) {
        polygon = parsed
      }
    }
  })
  $effect(() => {
    const newPolygon = polygon
    localStorage.setItem('polygon', JSON.stringify(newPolygon))
  })
  let vertices: Vertex[] = $derived(calculatePolygonVertices(polygon))
  let angles: Angle[] = $derived.by(() => {
    const allAngles = calculateAngles(vertices)
    if (vertices.length != polygon.sides.length) {
      // last vertex is missing
      allAngles.pop()
      allAngles.pop()
    }
    return allAngles
  })
  let area: Area | null = $derived(
    vertices.length != polygon.sides.length ? null : Math.abs(calculateArea(vertices)), // negative area can spook ppl i suppose
  )

  let canvas: HTMLCanvasElement
  const canvasPaddingPercent = 20
  $effect(() => {
    if (canvas != undefined) {
      const context = canvas.getContext('2d')!
      const w = canvas.width
      const h = canvas.height
      context.strokeStyle = lightScheme ? '#1f1b14' : '#ebe7e0'
      context.clearRect(0, 0, w, h)
      context.lineWidth = 5
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(w, 0)
      context.lineTo(w, h)
      context.lineTo(0, h)
      context.closePath()
      context.stroke()
      if (vertices != null && vertices.length > 0) {
        const canvasCenterX = w / 2
        const canvasCenterY = h / 2
        const paddedK = 1 - canvasPaddingPercent / 100
        const { centerX, centerY, scaleFactor } = calculateFitInScaling(
          vertices,
          paddedK * w,
          paddedK * h,
        )
        context.strokeStyle = lightScheme ? '#8800cc' : '#bb33ff' // based on hsl(280, 100, 60)
        context.beginPath()
        let v = vertices[0] // we are center-ing and scaling our polygon
        let x = canvasCenterX + (v.x - centerX) * scaleFactor
        let y = canvasCenterY + (v.y - centerY) * scaleFactor
        context.moveTo(x, y)
        for (let i = 1; i < vertices.length; i++) {
          v = vertices[i]
          x = canvasCenterX + (v.x - centerX) * scaleFactor
          y = canvasCenterY + (v.y - centerY) * scaleFactor
          context.lineTo(x, y)
        }
        if (vertices.length == polygon.sides.length) {
          context.closePath()
        }
        context.stroke()
        context.fillStyle = lightScheme ? '#1f1b14' : '#ebe7e0'
        /* context.font = '24px Noto Sans Math'; */
        context.font = '32px Arial'
        for (let i = 0; i < vertices.length; i++) {
          v = vertices[i]
          x = canvasCenterX + (v.x - centerX) * scaleFactor
          y = canvasCenterY + (v.y - centerY) * scaleFactor
          context.fillText(latinLetters[i], x + 5, y - 5)
        }
      }
    }
  })

  function addSide() {
    const defaultSideLength = 1
    const firstNonInputAngle = angles[polygon.angles.length] ?? 120
    polygon.angles.push(parseFloat(firstNonInputAngle.toFixed(2)))
    polygon.sides.push(defaultSideLength)
  }

  function deleteSide() {
    polygon.sides.pop()
    polygon.angles.pop()
  }

  function toRegularPolygon() {
    const n = polygon.sides.length
    const angle = parseFloat(calculateRegularPolygonAngle(n).toFixed(2))
    const sideLength = polygon.sides[0] ?? 1
    for (let i = 0; i < n; i++) {
      polygon.sides[i] = sideLength
      if (i < polygon.angles.length) {
        polygon.angles[i] = angle
      }
    }
  }

  function toggleColorScheme() {
    lightScheme = !lightScheme
  }
</script>

<header>
  <div class="top-right-icon-row">
    <a
      href="https://github.com/pier-bezuhoff/polygon-area"
      target="_blank"
      rel="noopener noreferrer"
      data-icon="github"
      aria-label="GitHub Repo"
      class="github-link {lightScheme ? 'github-link-light' : 'github-link-dark'}"
    ></a>
    <button type="button" class="light-dark-toggle unselectable" onclick={toggleColorScheme}>
      {@html lightScheme ? '&#9728;' : '&#127768;'}
    </button>
  </div>
</header>
<main>
  <div class="row">
    <div class="left-column">
      <h1>&#11041;&NonBreakingSpace;Polygon Area Calculator&NonBreakingSpace;&#11042;</h1>
      <div class="calcs">
        <div class="entries">
          <div class="angle-column-filler"></div>
          {#each polygon.sides as side, i}
            <div class="label-for-input-wrap side-label-wrap">
              <label class="side-label" for="side-input-{i}">
                |{mkSideName(i, polygon.sides.length)}| =
              </label>
            </div>
            <span class="side-value">
              <input
                class="side-input"
                id="side-input-{i}"
                type="number"
                bind:value={polygon.sides[i]}
              />
            </span>
            {#if polygon.angles.length > i}
              <div class="label-for-input-wrap angle-label-wrap">
                <label class="angle-label" for="angle-input-{i}">
                  {mkAngleName(i, polygon.sides.length)}
                </label>
              </div>
              <span class="angle-value">
                <input
                  class="angle-input"
                  id="angle-input-{i}"
                  type="number"
                  bind:value={polygon.angles[i]}
                />
                &deg;
              </span>
            {:else}
              <!-- do not remove this comment, otherwise #else and #if will be fused when prettified
                  which messes up fade transition trigger condition -->
              {#if i < angles.length}
                <div class="angle-label-wrap">
                  <span class="angle-label" transition:fade={{ duration: FADE_DURATION }}>
                    {mkAngleName(i, polygon.sides.length)}
                  </span>
                </div>
                <span class="angle-value" transition:fade={{ duration: FADE_DURATION }}>
                  {angles[i].toFixed(2)}&deg;
                </span>
              {/if}
            {/if}
          {/each}
          <div class="side-column-bottom-filler"></div>
        </div>
        <div class="buttons-row">
          <button type="button" class="control-button" onclick={addSide}> Add another side </button>
          <button type="button" class="control-button" onclick={deleteSide}>
            Delete last side
          </button>
          <button type="button" class="control-button" onclick={toRegularPolygon}>
            Regular polygon
          </button>
        </div>
        {#if area != null}
          <div class="result-wrap" transition:fade={{ duration: FADE_DURATION }}>
            <hr class="result-separator" />
            <h2 id="answer">
              Area <i>S</i> = <i class="actual-area">{area.toPrecision(6)}</i>
            </h2>
          </div>
        {/if}
      </div>
    </div>
    <div class="right-column">
      <div class="canvas-wrap">
        <canvas bind:this={canvas} width="600" height="600"></canvas>
      </div>
    </div>
  </div>
</main>

<style>
  :root {
    color-scheme: light dark;
    --accent-color-light: hsl(280, 100%, 50%);
    --accent-color-dark: hsl(280, 100%, 70%);
    --bg-color-light: white;
    --bg-color-dark: hsl(0, 0%, 12%); /* rgb(31,31,31) = #1f1f1f recommmended bg for dark mode */
    --text-color-light: hsl(40, 20%, 10%); /* #1c1a17 */
    --text-color-dark: hsl(40, 20%, 90%);
    --button-bg-color-light: hsl(0, 0%, 90%);
    --button-bg-color-dark: hsl(0, 0%, 30%);
    --button-hover-bg-color-light: hsl(40, 20%, 80%);
    --button-hover-bg-color-dark: hsl(0, 0%, 40%);
    --button-pressed-bg-color-light: hsl(40, 20%, 70%);
    --button-pressed-bg-color-dark: hsl(0, 0%, 50%);
    --title-text-color-light: hsl(40, 40%, 15%);
    --answer-text-color-light: hsl(40, 30%, 15%);
    --text-color: light-dark(var(--text-color-light), var(--text-color-dark));
    --bg-color: light-dark(var(--bg-color-light), var(--bg-color-dark));
    --accent-color: light-dark(var(--accent-color-light), var(--accent-color-dark));
    --button-bg-color: light-dark(var(--button-bg-color-light), var(--button-bg-color-dark));
    --button-hover-bg-color: light-dark(
      var(--button-hover-bg-color-light),
      var(--button-hover-bg-color-dark)
    );
    --button-pressed-bg-color: light-dark(
      var(--button-pressed-bg-color-light),
      var(--button-pressed-bg-color-dark)
    );
    --title-text-color: light-dark(var(--title-text-color-light), var(--text-color-dark));
    --answer-text-color: light-dark(var(--answer-text-color-light), var(--text-color-dark));
    --default-font-family: 'Noto Sans Math, sans-serif';
    --default-font-size: 18px;
    color: var(--text-color);
    background-color: var(--bg-color);
  }

  .top-right-icon-row {
    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;
    padding: 8px;
    margin-right: 16px;
    gap: 12px;
  }

  button {
    cursor: pointer;
  }

  .github-link {
    display: inline-block;
    width: 30px;
    height: 30px;
    background-size: contain; /* Ensures the SVG fits within the container while maintaining its aspect ratio */
    text-decoration: none;
  }

  .github-link:hover {
    filter: brightness(150%);
  }

  /* alternatively separate logo svg into diff file and style with `@media (prefers-color-scheme: dark)` */
  .github-link-light {
    background-image: url("data:image/svg+xml,%3csvg%20width='98'%20height='96'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M48.854%200C21.839%200%200%2022%200%2049.217c0%2021.756%2013.993%2040.172%2033.405%2046.69%202.427.49%203.316-1.059%203.316-2.362%200-1.141-.08-5.052-.08-9.127-13.59%202.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015%204.934.326%207.523%205.052%207.523%205.052%204.367%207.496%2011.404%205.378%2014.235%204.074.404-3.178%201.699-5.378%203.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283%200-5.378%201.94-9.778%205.014-13.2-.485-1.222-2.184-6.275.486-13.038%200%200%204.125-1.304%2013.426%205.052a46.97%2046.97%200%200%201%2012.214-1.63c4.125%200%208.33.571%2012.213%201.63%209.302-6.356%2013.427-5.052%2013.427-5.052%202.67%206.763.97%2011.816.485%2013.038%203.155%203.422%205.015%207.822%205.015%2013.2%200%2018.905-11.404%2023.06-22.324%2024.283%201.78%201.548%203.316%204.481%203.316%209.126%200%206.6-.08%2011.897-.08%2013.526%200%201.304.89%202.853%203.316%202.364%2019.412-6.52%2033.405-24.935%2033.405-46.691C97.707%2022%2075.788%200%2048.854%200z'%20fill='%231b1f23'/%3e%3c/svg%3e");
  }

  .github-link-dark {
    background-image: url("data:image/svg+xml,%3csvg%20width='98'%20height='96'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M48.854%200C21.839%200%200%2022%200%2049.217c0%2021.756%2013.993%2040.172%2033.405%2046.69%202.427.49%203.316-1.059%203.316-2.362%200-1.141-.08-5.052-.08-9.127-13.59%202.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015%204.934.326%207.523%205.052%207.523%205.052%204.367%207.496%2011.404%205.378%2014.235%204.074.404-3.178%201.699-5.378%203.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283%200-5.378%201.94-9.778%205.014-13.2-.485-1.222-2.184-6.275.486-13.038%200%200%204.125-1.304%2013.426%205.052a46.97%2046.97%200%200%201%2012.214-1.63c4.125%200%208.33.571%2012.213%201.63%209.302-6.356%2013.427-5.052%2013.427-5.052%202.67%206.763.97%2011.816.485%2013.038%203.155%203.422%205.015%207.822%205.015%2013.2%200%2018.905-11.404%2023.06-22.324%2024.283%201.78%201.548%203.316%204.481%203.316%209.126%200%206.6-.08%2011.897-.08%2013.526%200%201.304.89%202.853%203.316%202.364%2019.412-6.52%2033.405-24.935%2033.405-46.691C97.707%2022%2075.788%200%2048.854%200z'%20fill='%23f0f0f0'/%3e%3c/svg%3e");
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

  main {
    font-family: var(--default-font-family);
    font-size: var(--default-font-size);
  }

  .row {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .left-column {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: top;
  }

  h1 {
    color: var(--title-text-color);
  }

  .calcs {
    padding-left: 24px;
    padding-right: 24px;
  }

  .entries {
    display: grid;
    grid-template-columns: max-content max-content 1em max-content max-content;
    grid-auto-rows: 1fr;
    row-gap: 0.5em;
    column-gap: 0.5em;
  }

  .angle-column-filler {
    grid-column: 4;
    grid-column-end: span 2;
    grid-row: 1;
    grid-row-end: span 1;
    width: 1px;
    height: 1px;
  }

  .label-for-input-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: end;
    margin-bottom: 0.1em;
  }

  .side-label-wrap {
    grid-column: 1;
    grid-row-start: span 2;
  }

  .side-value {
    grid-column: 2;
    grid-row-start: span 2;
  }

  .angle-label-wrap {
    grid-column: 4;
    grid-row-start: span 2;
  }

  .angle-value {
    grid-column: 5;
    grid-row-start: span 2;
  }

  .side-column-bottom-filler {
    grid-column: 1;
    grid-column-end: span 1;
    width: 1px;
    height: 1px;
  }

  /* Hide arrows on number inputs */
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='number'] {
    font-family: var(--default-font-family);
    font-size: var(--default-font-size);
  }

  input[type='number'] {
    width: 3.6em;
  }

  .side-input {
    color: var(--accent-color);
  }

  .buttons-row {
    display: flex;
    flex-direction: row;
    justify-content: start;
    margin-top: 1em;
  }

  .control-button {
    margin-right: 16px;
    font-size: 16px;
    background-color: var(--button-bg-color);
    color: var(--text-color);
    border-color: var(--text-color);
    border: solid;
    border-radius: 4px;
    border-width: 1px;
  }

  .control-button:hover {
    background-color: var(--button-hover-bg-color);
  }

  .control-button:active {
    background-color: var(--button-pressed-bg-color);
  }

  .result-wrap {
    display: flex;
    flex-direction: column;
    margin-top: 1em;
  }

  .result-separator {
    float: left;
    width: 100%;
  }

  .actual-area {
    border: solid;
    border-radius: 12px;
    border-color: var(--accent-color);
    padding-left: 4px;
    padding-right: 12px;
  }

  #answer {
    color: var(--answer-text-color);
  }

  .right-column {
    width: 50%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .canvas-wrap {
    display: flex;
    flex-direction: row;
    justify-content: start;
    padding-left: 48px;
    margin-top: 36px;
  }

  canvas {
    width: 80%;
  }

  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* on mobile */
  @media only screen and (max-width: 820px) {
    h1 {
      font-size: 1.5em;
    }

    .row {
      display: flex;
      flex-direction: column;
      justify-content: top;
      align-items: center;
    }

    .left-column {
      width: 100%;
      height: auto;
      align-items: center;
    }

    .calcs {
      padding-left: 8px;
      padding-right: 0px;
    }

    .right-column {
      width: 100%;
      height: auto;
    }

    .canvas-wrap {
      width: 100%;
      justify-content: center;
      padding-left: 0px;
    }

    canvas {
      width: 80%;
    }
  }
</style>
