import { Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry, Quaternion, TextureLoader, Vector3 } from "three";
import { MainSceneContext } from "../../Scenes/MainScene";
import CursorController from "../People/CursorController";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import peopleImage from "../../../assets/images/placeholder.png"
import { fromPolarX, fromPolarY } from "../../../utils/math/fromPolar";
import PeopleController from "../People/PeopleController";
import tuple from "../../../utils/types/tuple";
import PhysicsController from "../People/PhysicsController";
import getViewport, { Viewport } from "../../../utils/webgl/viewport";

export type OnLanding = (previousPlanet: Planet, landedPlanet: Planet, physicsController: PhysicsController, grabObject: GrabObject) => void
export type OnDeath = (physicsController: PhysicsController) => void

const temporaryVectors = {
  gravity: new Vector3(),
  target: new Vector3(),
  oppositePosition: new Vector3(),
  lerpedTargetRotation: new Vector3()
}

export default class GrabObject extends PhysicsObject {
  public output: Object3D
  public peopleControllerTuples: [PeopleController, PhysicsController][] & any[] //TODO: hlep
  public cursor: CursorController
  private currentPlanet: Planet
  private onLanding: OnLanding
  private onDeath: OnDeath
  private hasDisappeared = false
  private viewport : Viewport
  private offsetRadius = 1.2

  constructor(context: MainSceneContext, originPlanet: Planet, mass = 1, onLanding: OnLanding, onDeath: OnDeath ) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.onLanding = onLanding
    this.onDeath = onDeath
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.viewport = getViewport(context.camera)

    this.output.scale.setScalar(0.3)
    // this.output = new Object3D()
    this.peopleControllerTuples = []

    this.rotateAroundPlanet()
  }

  private rotateAroundPlanet(alpha = 0.75) {
    const angle = -Math.atan2(this.cursor.cursorPos.y - this.currentPlanet.position.y, this.cursor.cursorPos.x - this.currentPlanet.position.x)

    const x = fromPolarX(this.currentPlanet.radius + this.offsetRadius, angle + Math.PI / 2)
    const y = fromPolarY(this.currentPlanet.radius + this.offsetRadius, angle + Math.PI / 2)

    temporaryVectors.lerpedTargetRotation.set(this.currentPlanet.position.x - x, this.currentPlanet.position.y - y, 0)
    this.output.position.lerp(temporaryVectors.lerpedTargetRotation, alpha)
  }

  public setPhysicalPeopleControllers = (peopleControllers: PeopleController[], planets: Planet[]) => {
    for (let index = 0; index < peopleControllers.length; index++) {
      const peopleController = peopleControllers[index];
      this.peopleControllerTuples.push(tuple(peopleController, new PhysicsController(index, peopleController, this.currentPlanet, planets, this, this.viewport, this.onLanding, this.onDeath)))
    }
  }

  public repulsePhysicalPeopleControllers() {
    for (const peopleController of this.peopleControllerTuples) {
      const physicsController = peopleController[1]
      if(!physicsController) return
      physicsController.setReleasedCursorPosition(this.cursor.cursorPos)
      physicsController.setState("REPULSING")
    }
  }

  public clearPeopleControllerTuples() {
    this.peopleControllerTuples = []
  }

  public removePeopleControllerTuple(index: number) {
    this.peopleControllerTuples[index] = tuple(null, null)
  }

  // /TODO: hlep
  public disappear(){
    this.output.scale.setScalar(0)
    this.hasDisappeared = true
  }

  public tick() {
    if(!this.hasDisappeared) this.rotateAroundPlanet()
  }
}