import { Vector2, Vector4 } from "three"

type Rect = {
  x: number
  y: number
  w: number
  h: number
}

type Spritesheet = {
  frames: { [name: string]: { frame: Rect } }
  meta: {
    image: string
    size: {
      w: number
      h: number
    }
  }
}

export default class SpritesheetParser {
  private sprites: { name: string; offset: Vector4 }[]
  public size: Vector2

  constructor(sheet: Spritesheet) {
    this.size = new Vector2(sheet.meta.size.w, sheet.meta.size.h)
    const frames = sheet.frames
    const entries = Object.entries(frames)
    this.sprites = entries.map((entry) => ({
      name: entry[0],
      offset: this.getVectorFrom(entry[1].frame),
    }))
  }
  public getByIndex(index: number) {
    return this.sprites[index]
  }

  private getVectorFrom(rect: Rect) {
    const { x, y, w, h } = rect
    return new Vector4(x / this.size.x, y / this.size.y, w / this.size.x, h / this.size.y)
  }
}
