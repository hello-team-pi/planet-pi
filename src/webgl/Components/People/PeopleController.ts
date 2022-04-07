import * as THREE from "three"
import { WebGLAppContext } from "../.."
import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import Animator from "../Animator"
import GrabObject from "../GrabObject"
import Planet from "../Planet"
import SpritesheetParser from "../SpritesheetParser"
import PhysicsController from "./PhysicsController"

export type OnLanding = (
  previousPlanet: Planet,
  landedPlanet: Planet,
  physicsController: PhysicsController,
  grabObject: GrabObject,
) => void
export type OnDeath = (physicsController: PhysicsController) => void

export default class PeopleController extends AbstractObject<MainSceneContext> {
  public object: THREE.Object3D
  public physicsController: PhysicsController
  public onLanding:OnLanding
  public onDeath: OnDeath
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

  constructor(context: MainSceneContext, index: number, mesh: THREE.InstancedMesh, spritesheet: SpritesheetParser) {
    super(context)
    this.index = index
    this.mesh = mesh
    this.object = new THREE.Object3D()
    this.animator = new Animator(5, "PEOPLE")
    this.spritesheet = spritesheet
    this.animator.setAnimation("spawn", () => this.animator.setAnimation("alive"))
    this.physicsController = new PhysicsController(
      this.index,
      this,
      this.context.sceneState.currentPlanet,
    )
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

    this.mesh.geometry.attributes["aIsDead"].setX(this.index, anim === "dead" ? 1 : 0)

    this.object.updateMatrix()
    this.mesh.setMatrixAt(this.index, this.object.matrix)
    this.updateAnim()
    this.physicsController.tick()
  }
}
