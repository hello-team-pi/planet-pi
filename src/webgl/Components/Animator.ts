type Animation = "alive" | "dead" | "walk" | "spawn"

const ANIMATION_CYCLES: Record<Animation, number[]> = {
  alive: [0],
  dead: [1],
  walk: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  spawn: [13, 14, 15, 16],
}

export default class Animator {
  private framesToSkip: number
  private frameCount = 0

  private previousFrame: number | null = null

  private currentAnimation: Animation = "alive"
  private animationCallback: Function | null = null

  public get effectiveFrameCount(): number {
    return Math.floor(this.frameCount / this.framesToSkip)
  }

  constructor(framesToSkip: number) {
    this.framesToSkip = framesToSkip
  }

  public getFrame() {
    const currentCycle = ANIMATION_CYCLES[this.currentAnimation]
    const newFrame = currentCycle[this.effectiveFrameCount % currentCycle.length]
    if (this.frameCount === currentCycle.length * this.framesToSkip - 1) {
      if (this.animationCallback) this.animationCallback()
      this.animationCallback = null
    }
    const isNew = newFrame !== this.previousFrame
    this.previousFrame = newFrame
    return newFrame
  }

  public setAnimation(animation: Animation, callback: Animator["animationCallback"] = null) {
    if (this.currentAnimation !== animation) this.frameCount = 0
    this.animationCallback = callback
    this.currentAnimation = animation
  }

  public tick() {
    this.frameCount++
  }
}
