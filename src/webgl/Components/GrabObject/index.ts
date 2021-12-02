import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, Quaternion, TextureLoader, Vector3 } from "three";
import { MainSceneContext } from "../../Scenes/MainScene";
import CursorController from "../People/CursorController";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import peopleImage from "../../../assets/images/placeholder.png"
import CompanionCube from "../CompanionCube";
import { fromPolarX, fromPolarY } from "../../../utils/math/fromPolar";
import PeopleController from "../People/PeopleController";
import tuple from "../../../utils/types/tuple";
import PhysicsController from "../People/PhysicsController";

const temporaryVectors = {
  gravity: new Vector3(),
  target: new Vector3(),
  oppositePosition: new Vector3(),
  lerpedTargetRotation: new Vector3()
}

export default class GrabObject extends PhysicsObject {
  public output: Mesh
  public peopleControllerTuples: [PeopleController, PhysicsController][]
  public cursor: CursorController
  private currentPlanet: Planet
  private state: "ROTATING" | "IDLE"

  constructor(context: MainSceneContext, originPlanet: Planet, mass = 1) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.output.scale.setScalar(0.3)
    this.state = "ROTATING"
    this.peopleControllerTuples = []

    this.rotateAroundPlanetOppositeFromMouse()
    // this.setEvents()
  }

  setState(newState: "ROTATING" | "IDLE") {
    this.state = newState
  }

  rotateAroundPlanetOppositeFromMouse(alpha = 0.75) {
    const angle = -Math.atan2(this.cursor.cursorPos.y - this.currentPlanet.position.y, this.cursor.cursorPos.x - this.currentPlanet.position.x)

    const offsetFromRadius = 0.8

    const x = fromPolarX(this.currentPlanet.radius + offsetFromRadius, angle - Math.PI / 2)
    const y = fromPolarY(this.currentPlanet.radius + offsetFromRadius, angle - Math.PI / 2)

    temporaryVectors.lerpedTargetRotation.set(x, y, 0)
    this.output.position.lerp(temporaryVectors.lerpedTargetRotation, alpha)
  }

  setPhysicalPeopleControllers = (peopleControllers: PeopleController[], planets: Planet[]) => {
    for (const peopleController of peopleControllers) {
      this.peopleControllerTuples.push(tuple(peopleController, new PhysicsController(peopleController, planets, this)))
    }
  }

  repulsePhysicalPeopleControllers() {
    for (const peopleController of this.peopleControllerTuples) {
      const physicsController = peopleController[1]
      physicsController.setReleasedCursorPosition(this.cursor.cursorPos)
      physicsController.setState("REPULSING")
    }
  }

  removePeopleControllers() {
    this.peopleControllerTuples = []
  }

  tick() {
    switch (this.state) {
      case "ROTATING":
        {
          this.rotateAroundPlanetOppositeFromMouse()
          break;
        }

      default:
        break;
    }
  }
}