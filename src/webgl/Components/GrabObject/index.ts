import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, Quaternion, TextureLoader, Vector3 } from "three";
import { MainSceneContext } from "../../Scenes/MainScene";
import CursorController from "../People/CursorController";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import peopleImage from "../../../assets/images/perso.png"
import CompanionCube from "../CompanionCube";
import { fromPolarX, fromPolarY } from "../../../utils/math/fromPolar";
import People from "../People";
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
  private cursor: CursorController
  private currentPlanet: Planet
  private onReleaseCallbacks: Map<string, Function>
  private state: "ATTRACTING" | "IDLE" | "PROJECTING"
  private companions: CompanionCube[] // TODO: replace this

  constructor(context: MainSceneContext, originPlanet: Planet, targetPlanet: Planet, companions: CompanionCube[], mass = 1) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.output.scale.setScalar(1)
    this.onReleaseCallbacks = new Map()
    this.state = "IDLE"
    this.companions = companions
    this.peopleControllerTuples = []

    this.rotateAroundPlanetOppositeFromMouse()
    this.setEvents()
  }

  follow(origin: Vector3, target: Vector3) {
    temporaryVectors.target.copy(target)
    temporaryVectors.target.sub(origin)
    const distance = temporaryVectors.target.length()
    temporaryVectors.target.normalize()
    temporaryVectors.target.multiplyScalar(distance)
    return temporaryVectors.target
  }

  rotateAroundPlanetOppositeFromMouse(alpha = 0.75) {
    const angle = -Math.atan2(this.cursor.cursorPos.y - this.currentPlanet.position.y, this.cursor.cursorPos.x - this.currentPlanet.position.x)

    const offsetFromRadius = 0.8

    const x = fromPolarX(this.currentPlanet.radius + offsetFromRadius, angle - Math.PI / 2)
    const y = fromPolarY(this.currentPlanet.radius + offsetFromRadius, angle - Math.PI / 2)

    temporaryVectors.lerpedTargetRotation.set(x, y, 0)
    this.output.position.lerp(temporaryVectors.lerpedTargetRotation, alpha)
  }

  attractToGrab() {
    for (const companion of this.companions) {
      const cancel = companion.output.position.distanceTo(this.output.position) <= 1
      if (cancel) continue

      // const force = companion.attract(this.output.position, companion.output.position, 0.01)
      const followForce = this.follow(companion.output.position, this.output.position)

      const collisionOnPlanet = companion.output.position.distanceTo(this.currentPlanet.position) < this.currentPlanet.radius + 0.3
      if (collisionOnPlanet) continue

      companion.addForce(followForce)
    }
  }

  setPeopleControllers(peopleControllers: PeopleController[]) {
    for (const peopleController of peopleControllers) {
      this.peopleControllerTuples.push(tuple(peopleController, new PhysicsController(peopleController)))
    }
  }

  removePeopleControllers() {
    this.peopleControllerTuples = []
  }

  onMouseDown = () => {
    this.state = "ATTRACTING"
    this.cursor.click(this.currentPlanet)
    this.onReleaseCallbacks.set("project", () => {
      // Project

    })
  }

  onMouseUp = () => {
    this.state = "IDLE"
    this.cursor.release()

    for (const entry of this.onReleaseCallbacks.entries()) {
      const [name, callback] = entry
      callback()

      this.onReleaseCallbacks.delete(name)
    }
  }

  setEvents() {
    window.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)

    this.toUnbind(() => {
      window.removeEventListener("mousedown", this.onMouseDown)
      window.removeEventListener("mouseup", this.onMouseUp)
    })
  }

  tick() {
    switch (this.state) {
      case "IDLE":
        {
          this.rotateAroundPlanetOppositeFromMouse()
          break;
        }


      case "ATTRACTING":
        {
          this.attractToGrab()
          break;
        }

      case "PROJECTING":
        {
          // Do things
          // const physicsObject = this.peopleControllerTuples[1]);


          break
        }

      default:
        break;
    }

  }
}