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

const BUGGY_SPRITESHEET_ASSOC = [
  0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 4, 9, 14, 19, 20,
]

export default class SpritesheetParser {
  private sprites: Record<string, Vector4>
  public size: Vector2

  constructor(sheet: Spritesheet) {
    this.size = new Vector2(sheet.meta.size.w, sheet.meta.size.h)
    const frames = sheet.frames
    const entries = Object.entries(frames)
    this.sprites = Object.fromEntries(
      entries.map((entry) => [entry[0], this.getVectorFrom(entry[1].frame)]),
    )
  }
  public getByName(name: string) {
    return this.sprites[name]
  }

  private getVectorFrom(rect: Rect) {
    const { x, y, w, h } = rect
    return new Vector4(x / this.size.x, y / this.size.y, w / this.size.x, h / this.size.y)
  }
}
