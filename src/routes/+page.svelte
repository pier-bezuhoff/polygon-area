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
  let polygon: Polygon = $state(defaultPolygon)
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
      context.strokeStyle = lightScheme ? '#000000' : '#ffffff'
      context.clearRect(0, 0, w, h)
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
        context.fillStyle = lightScheme ? '#000000' : '#ffffff'
        /* context.font = '24px Noto Sans Math'; */
        context.font = '20px Arial'
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
    const firstNonInputAngle = angles[polygon.angles.length]
    polygon.angles.push(parseFloat(firstNonInputAngle.toFixed(2)))
    polygon.sides.push(1)
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

<!-- TODO: mobile layout -->
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
      <h1>&#11041; Polygon Area Calculator &#11042;</h1>
      <div class="calcs">
        <div class="entries">
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
                {:else}
                  <!-- do not remove this comment, otherwise #else and #if will be fused when prettified
                  which messes up fade transition trigger condition -->
                  {#if i < angles.length}
                    <div transition:fade={{ duration: FADE_DURATION }}>
                      {mkAngleName(i, polygon.sides.length)}
                      {angles[i].toFixed(2)}&deg;
                    </div>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
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
        <canvas bind:this={canvas} width="300" height="300"></canvas>
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
    --bg-color-dark: rgb(31, 31, 31); /* recommmended bg for dark mode */
    --button-bg-color-light: hsl(0, 0%, 90%);
    --button-bg-color-dark: hsl(0, 0%, 30%);
    --button-hover-bg-color-light: hsl(0, 0%, 80%);
    --button-hover-bg-color-dark: hsl(0, 0%, 40%);
    --button-pressed-bg-color-light: hsl(0, 0%, 70%);
    --button-pressed-bg-color-dark: hsl(0, 0%, 50%);
    --text-color: light-dark(black, white);
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
    --default-font-family: 'Noto Sans Math';
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

  .github-link-light {
    background-image: url("data:image/svg+xml,%3csvg%20width='98'%20height='96'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M48.854%200C21.839%200%200%2022%200%2049.217c0%2021.756%2013.993%2040.172%2033.405%2046.69%202.427.49%203.316-1.059%203.316-2.362%200-1.141-.08-5.052-.08-9.127-13.59%202.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015%204.934.326%207.523%205.052%207.523%205.052%204.367%207.496%2011.404%205.378%2014.235%204.074.404-3.178%201.699-5.378%203.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283%200-5.378%201.94-9.778%205.014-13.2-.485-1.222-2.184-6.275.486-13.038%200%200%204.125-1.304%2013.426%205.052a46.97%2046.97%200%200%201%2012.214-1.63c4.125%200%208.33.571%2012.213%201.63%209.302-6.356%2013.427-5.052%2013.427-5.052%202.67%206.763.97%2011.816.485%2013.038%203.155%203.422%205.015%207.822%205.015%2013.2%200%2018.905-11.404%2023.06-22.324%2024.283%201.78%201.548%203.316%204.481%203.316%209.126%200%206.6-.08%2011.897-.08%2013.526%200%201.304.89%202.853%203.316%202.364%2019.412-6.52%2033.405-24.935%2033.405-46.691C97.707%2022%2075.788%200%2048.854%200z'%20fill='%23666'/%3e%3c/svg%3e");
  }

  .github-link-dark {
    background-image: url("data:image/svg+xml,%3csvg%20width='98'%20height='96'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M48.854%200C21.839%200%200%2022%200%2049.217c0%2021.756%2013.993%2040.172%2033.405%2046.69%202.427.49%203.316-1.059%203.316-2.362%200-1.141-.08-5.052-.08-9.127-13.59%202.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015%204.934.326%207.523%205.052%207.523%205.052%204.367%207.496%2011.404%205.378%2014.235%204.074.404-3.178%201.699-5.378%203.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283%200-5.378%201.94-9.778%205.014-13.2-.485-1.222-2.184-6.275.486-13.038%200%200%204.125-1.304%2013.426%205.052a46.97%2046.97%200%200%201%2012.214-1.63c4.125%200%208.33.571%2012.213%201.63%209.302-6.356%2013.427-5.052%2013.427-5.052%202.67%206.763.97%2011.816.485%2013.038%203.155%203.422%205.015%207.822%205.015%2013.2%200%2018.905-11.404%2023.06-22.324%2024.283%201.78%201.548%203.316%204.481%203.316%209.126%200%206.6-.08%2011.897-.08%2013.526%200%201.304.89%202.853%203.316%202.364%2019.412-6.52%2033.405-24.935%2033.405-46.691C97.707%2022%2075.788%200%2048.854%200z'%20fill='%23d4d4d4'/%3e%3c/svg%3e");
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

  .calcs {
    padding-left: 24px;
    padding-right: 24px;
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
    width: 60px;
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
    background-color: var(--button-bg-color);
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

  .right-column {
    width: 50%;
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
</style>
