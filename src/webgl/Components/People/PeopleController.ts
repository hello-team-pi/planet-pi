import * as THREE from "three"
import Animator from "../Animator"
import SpritesheetParser from "../SpritesheetParser"

export default class PeopleController {
  public object: THREE.Object3D
  private mesh: THREE.InstancedMesh
  private animator: Animator<"PEOPLE">
  private spritesheet: SpritesheetParser
  private index: number

  // public planetPosition: {
  //   rotation: number
  //   tilt: number
  // }
  // private nextPlanetPosition: {
  //   rotation: number
  //   tilt: number
  // }
  // private data: {
  //   planetState: {
  //     rotation: number
  //     tilt: number
  //   }
  //   deadState: {
  //     velocity: THREE.Vector2Tuple
  //     position: THREE.Vector2Tuple
  //   }
  //   projectedState: {
  //     lifespan: number
  //   }
  // }

  constructor(index: number, mesh: THREE.InstancedMesh, spritesheet: SpritesheetParser) {
    this.index = index
    this.mesh = mesh
    this.object = new THREE.Object3D()
    this.animator = new Animator(5, "PEOPLE")
    this.spritesheet = spritesheet
    this.animator.setAnimation("spawn", () => this.animator.setAnimation("alive"))
    // this.planetPosition = { ...startPlanetPos }
    // this.nextPlanetPosition = { ...this.planetPosition }
  }

  public updateAnim() {
    this.animator.tick()
    const frame = this.animator.getFrame()
    const offset = this.spritesheet.getByName(frame)
    this.mesh.geometry.attributes["aUvOffset"].setXYZW(
      this.index,
      offset.x,
      offset.y,
      offset.z,
      offset.w,
    )
    this.mesh.geometry.attributes["aUvOffset"].needsUpdate = true
  }

  public updatePeople(
    transform: (
      object: THREE.Object3D,
    ) => void | Parameters<PeopleController["animator"]["setAnimation"]>[0],
  ) {
    const anim = transform(this.object)
    if (anim) this.animator.setAnimation(anim)

    this.object.updateMatrix()
    this.mesh.setMatrixAt(this.index, this.object.matrix)
    this.updateAnim()
  }
}
