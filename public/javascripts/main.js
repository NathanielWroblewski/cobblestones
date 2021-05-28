import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import renderPolygon from './views/polygon.js'
import { seed, noise } from './utilities/noise.js'
import { stableSort, remap, grid, clamp } from './utilities/index.js'
import { NOISE_FACTOR, JITTER_RESOLUTION, TRANSLATION_RESOLUTION, FPS } from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')
const { sin, cos } = Math

seed(Math.random())

const perspective = FourByFour
  .identity()
  .rotX(angles.toRadians(-60))
  .rotZ(angles.toRadians(45))

const camera = new Camera({
  position: Vector.from([0,0,0]),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: 0.11
})

let time = 0

// 10x10,16x16 ok, bug in hex loop increment
const from = Vector.from([-16, -16])
const to = Vector.from([16, 16])
const by = Vector.from([1, 1])
const spread = ((Math.abs(from.x) + to.x) / by.x)

const gridPoints = grid({ from, to, by }, ([x, y]) => {
  const Δx = y % 2 === 0 ? -by.x/2 : 0

  return Vector.from([x + Δx, y, 0])
})

const points = stableSort(gridPoints, (a, b) => {
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x < b.x) return -1
  if (a.x > b.x) return 1
  return 0
})

const noisyPoints = points.map(point => {
  const distortion = noise(
    point.x * JITTER_RESOLUTION, point.y * JITTER_RESOLUTION, time
  )

  return point.add(Vector.from([distortion, distortion, 0]))
})

// add mid points perhaps?
// shatter polygons into two?
let hexes = []

for (let i = 0; i < noisyPoints.length; i += 3) {
  const column = i % spread
  const row = Math.floor(i/spread)

  if (column === spread - 1) continue
  if (column === spread - 2) {
    i++
    continue
  }

  const hexIndices = row % 2 === 0 ?
    [i, i+1, i+spread+2, i + (2*spread) + 1, i + (2*spread), i + spread, i] :
    [i, i+1, i+spread+1, i + (2*spread) + 1, i + (2*spread), i + spread - 1, i]

  const vertices = hexIndices.reduce((memo, index) => {
    const vertex = noisyPoints[index]

    return vertex ? memo.concat([vertex]) : memo
  }, [])

  if (vertices.length === hexIndices.length) {
    hexes.push(vertices)
  }
}

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  hexes.forEach((hex, index) => {
    const sample = hex[0]
    const Δz = (Math.sin(noise(sample.x * TRANSLATION_RESOLUTION, sample.y * TRANSLATION_RESOLUTION, time)) + 1) * NOISE_FACTOR
    let zsample = 1

    const bottom = hex.map(vertex => {
      return camera.project(vertex.transform(perspective))
    })

    const top = hex.map((vertex, index) => {
      const translated = Vector.from([
        vertex.x, vertex.y, clamp(vertex.z + 1 + Δz, [1, 50])
      ])

      if (index === 0) {
        zsample = translated.z
      }

      return camera.project(translated.transform(perspective))
    })

    const sides = hex.map((_, i) => {
      const next = (i + 1) % (bottom.length )

      return [bottom[i], bottom[next], top[next], top[i]]
    })

    const faces = sides.concat([top])

    faces.forEach((face, index) => {
      let stroke, fill
      // if (index === 3) color = '#FEB992'
      // if (index === 4) color = '#C2727E'
      // if (index === 5) color = '#7B5678'
      // if (index === 7) color = '#F4DBC7'

      if (Math.floor(time / 5) % 2 !== 0) {
        if (index === 3) fill = '#476F7D'
        if (index === 4) fill = '#5B4758'
        if (index === 5) fill = '#5B4758'
        if (index === 7) fill = '#F2937E'
        stroke = '#555555'
      } else {
        stroke = index === 7 ? '#F2937E' : '#A48380'
        fill = index < 7 ? '#5B4758' : null
      }

      if (index > 2) {
        renderPolygon(context, face, stroke, fill)
      }
    })
  })

  time += 0.02
}

let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
