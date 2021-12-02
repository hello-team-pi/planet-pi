import * as THREE from "three"
import cremap from "../../../utils/math/cremap"
import Easing from "easing-functions"
import Animator from "../Animator"
import SpritesheetParser from "../SpritesheetParser"

type Planet = { radius: number; position: THREE.Vector3 }

type PeopleState = "alive" | "dead" | "projected" | "onPlanet"

export default class PeopleController {
  private object: THREE.Object3D
  private mesh: THREE.InstancedMesh
  private animator: Animator
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
    this.animator = new Animator(5)
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

  public updatePeople(transform: (object: THREE.Object3D) => void) {
    transform(this.object)
    this.object.updateMatrix()
    this.mesh.setMatrixAt(this.index, this.object.matrix)
    this.updateAnim()
  }
}
