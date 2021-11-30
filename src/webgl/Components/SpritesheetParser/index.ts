import { Vector2, Vector4 } from "three"

type Rect = {
  x: number,
  y: number,
  w: number,
  h: number
}

type Frame = {
  frame: Rect,
}

type Spritesheet = {
  frames: { [name: string]: Frame }
  meta: {
    image: string,
    size: {
      w: number,
      h: number
    }
  }
}

export default class SpritesheetParser {
  offsets: { name: string, offset: Vector4 }[]
  size: Vector2

  constructor(sheet: Spritesheet) {
    this.size = new Vector2(sheet.meta.size.w, sheet.meta.size.h)
    const frames = sheet.frames
    const entries = Object.entries(frames)
    this.offsets = entries.map((entry) => ({ name: entry[0], offset: this.getVectorFrom(entry[1]) }))
  }

  getVectorFrom(frame: Frame) {
    const { x, y, w, h } = frame.frame
    return new Vector4(x / this.size.x, y / this.size.y, w / this.size.x, h / this.size.y)
  }
}