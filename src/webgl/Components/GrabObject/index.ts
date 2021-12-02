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

export type OnLanding = (previousPlanet: Planet, landedPlanet: Planet, physicsController: PhysicsController, grabObject: GrabObject) => void

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
  private hasDisappeared = false

  constructor(context: MainSceneContext, originPlanet: Planet, mass = 1, onLanding: OnLanding) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.onLanding = onLanding
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.output.scale.setScalar(0.3)
    // this.output = new Object3D()
    this.peopleControllerTuples = []

    this.rotateAroundPlanet()
  }

  private rotateAroundPlanet(alpha = 0.75) {
    const angle = -Math.atan2(this.cursor.cursorPos.y - this.currentPlanet.position.y, this.cursor.cursorPos.x - this.currentPlanet.position.x)

    const offsetRadius = 1.1

    const x = fromPolarX(this.currentPlanet.radius + offsetRadius, angle + Math.PI / 2)
    const y = fromPolarY(this.currentPlanet.radius + offsetRadius, angle + Math.PI / 2)

    temporaryVectors.lerpedTargetRotation.set(this.currentPlanet.position.x - x, this.currentPlanet.position.y - y, 0)
    this.output.position.lerp(temporaryVectors.lerpedTargetRotation, alpha)
  }

  public setPhysicalPeopleControllers = (peopleControllers: PeopleController[], planets: Planet[]) => {
    for (let index = 0; index < peopleControllers.length; index++) {
      const peopleController = peopleControllers[index];
      this.peopleControllerTuples.push(tuple(peopleController, new PhysicsController(index, peopleController, this.currentPlanet, planets, this, this.onLanding)))
    }
  }

  public repulsePhysicalPeopleControllers() {
    for (const peopleController of this.peopleControllerTuples) {
      const physicsController = peopleController[1]
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

  // TODO: help
  public disappear(){
    this.output.scale.setScalar(0)
    this.hasDisappeared = true
  }

  public tick() {
    if(!this.hasDisappeared) this.rotateAroundPlanet()
  }
}