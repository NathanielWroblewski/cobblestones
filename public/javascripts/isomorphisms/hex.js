import Vector from '../models/vector.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const ROOT_3 = Math.sqrt(3)
const HALF_ROOT_3 = Math.sqrt(3) / 2
const THIRD_ROOT_3 = Math.sqrt(3) / 2

const hex = {
  toCube ([x, y]) {
    return Vector.from([
      THIRD_ROOT_3 * x - 1/3 * y,
      2 / 3 * y
    ])
  },

  toCartesian ([q, r]) {
    return Vector.from([
      ROOT_3 * q + HALF_ROOT_3 * r,
      3 / 2 * r
    ])
  }
}

export default hex
