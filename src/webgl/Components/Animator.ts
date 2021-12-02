export type Animation = "alive" | "dead" | "walk" | "spawn"

const ANIMATION_CYCLES: Record<Animation, string[]> = {
  alive: ["alive.png"],
  dead: ["dead.png"],
  spawn: [
    "spawn_0001.png",
    "spawn_0002.png",
    "spawn_0003.png",
    "spawn_0004.png",
    "spawn_0005.png",
    "spawn_0006.png",
    "spawn_0007.png",
  ],
  walk: [
    "perso_walk0001.png",
    "perso_walk0002.png",
    "perso_walk0003.png",
    "perso_walk0004.png",
    "perso_walk0005.png",
    "perso_walk0006.png",
    "perso_walk0007.png",
    "perso_walk0008.png",
    "perso_walk0009.png",
    "perso_walk00010.png",
    "perso_walk00011.png",
    "perso_walk00012.png",
  ],
}

// const ANIMATION_CYCLES: Record<Animation, number[]> = {
//   alive: [0],
//   dead: [1],
//   walk: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
//   spawn: [17, 18, 2, 19, 20],

//   // spawn: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
// }

export default class Animator {
  private framesToSkip: number
  private frameCount = 0

  private previousFrame: string | null = null

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
