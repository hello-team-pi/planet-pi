const ANIMATIONS = {
  PEOPLE: {
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
  },
  PLANET: {
    none: ["planet_explosion_00000.png"],
    explosion: [
      "planet_explosion_00000.png",
      "planet_explosion_00001.png",
      "planet_explosion_00002.png",
      "planet_explosion_00003.png",
      "planet_explosion_00004.png",
      "planet_explosion_00005.png",
      "planet_explosion_00006.png",
      "planet_explosion_00007.png",
      "planet_explosion_00008.png",
      "planet_explosion_00009.png",
    ],
  },
}

type AnimationObject = keyof typeof ANIMATIONS
type AnimationCycle<T extends AnimationObject> = keyof typeof ANIMATIONS[T]

// const ANIMATION_CYCLES: Record<Animation, number[]> = {
//   alive: [0],
//   dead: [1],
//   walk: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
//   spawn: [17, 18, 2, 19, 20],

//   // spawn: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
// }

export default class Animator<T extends AnimationObject> {
  private framesToSkip: number
  private frameCount = 0

  private previousFrame: string | null = null

  private animationObject: AnimationObject
  public currentAnimation: AnimationCycle<T>
  private animationCallback: Function | null = null

  public get effectiveFrameCount(): number {
    return Math.floor(this.frameCount / this.framesToSkip)
  }

  constructor(framesToSkip: number, animationObject: T) {
    this.framesToSkip = framesToSkip
    this.currentAnimation = Object.keys(ANIMATIONS[animationObject])[0] as AnimationCycle<T>
    this.animationObject = animationObject
  }

  public getFrame() {
    const currentCycle = (ANIMATIONS[this.animationObject] as any)[
      this.currentAnimation
    ] as typeof ANIMATIONS["PEOPLE"]["alive"]
    const newFrame = currentCycle[this.effectiveFrameCount % currentCycle.length]
    if (this.frameCount === currentCycle.length * this.framesToSkip - 1) {
      if (this.animationCallback) this.animationCallback()
      this.animationCallback = null
    }
    const isNew = newFrame !== this.previousFrame
    this.previousFrame = newFrame
    return newFrame
  }

  public setAnimation(
    animation: AnimationCycle<T>,
    callback: Animator<T>["animationCallback"] = null,
  ) {
    if (this.currentAnimation !== animation) this.frameCount = 0
    this.animationCallback = callback
    this.currentAnimation = animation
  }

  public tick() {
    this.frameCount++
  }
}
