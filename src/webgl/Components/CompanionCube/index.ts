import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, TextureLoader, Vector3 } from "three";
import { MainSceneContext } from "../../Scenes/MainScene";
import CursorController from "../People/CursorController";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import peopleImage from "../../../assets/images/perso.png"

const temporaryVectors = {
  gravity: new Vector3(),
  mouseDownTarget: new Vector3()
}

export default class CompanionCube extends PhysicsObject {
  public output: Mesh
  private cursor: CursorController
  private currentPlanet: Planet
  private targetPlanet: Planet
  private onReleaseCallbacks: Map<string, Function>
  private state: "REPULSING" | "IDLE" | "LANDED"

  constructor(context: MainSceneContext, originPlanet: Planet, targetPlanet: Planet, mass = 1) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.targetPlanet = targetPlanet
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.output.scale.setScalar(1)
    this.onReleaseCallbacks = new Map()
    this.state = "IDLE"
    this.forces = new Map()

    this.reset()
    this.setEvents()
  }

  reset = () => {
    this.forces.clear()

    this.velocity.setX(this.currentPlanet.radius * Math.sin(Math.random() * Math.PI * 2))
    this.velocity.setY(this.currentPlanet.radius * Math.cos(Math.random() * Math.PI * 2))
    this.velocity.setZ(0)
  }

  onMouseDown = () => {
    this.cursor.click(this.currentPlanet)
    this.onReleaseCallbacks.set("repulse", () => {
      this.state = "REPULSING"
    })
  }

  onMouseUp = () => {
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

  attractPlanet(planet: Planet, targetMass = 0.1) {
    const [gravityVector, stop] = this.attractToPlanet(planet, this.output.position, targetMass)
    if (stop) this.state = "LANDED"
    else if (gravityVector.length()) this.forces.set("gravity", gravityVector)
  }

  repulseMouse() {
    temporaryVectors.mouseDownTarget.copy(this.output.position)
    temporaryVectors.mouseDownTarget.sub(this.cursor.cursorPos)
    this.forces.set("repulseMouse", temporaryVectors.mouseDownTarget)
  }

  attractMouse() {
    temporaryVectors.mouseDownTarget.copy(this.cursor.cursorPos)
    temporaryVectors.mouseDownTarget.sub(this.output.position)
    const distance = temporaryVectors.mouseDownTarget.length()
    temporaryVectors.mouseDownTarget.normalize()
    temporaryVectors.mouseDownTarget.multiplyScalar(distance)
    this.forces.set("attractMouse", temporaryVectors.mouseDownTarget)
  }

  tick() {
    // this.attractPlanet()
    // this.repulseMouse()

    // if (this.cursor.isDragging) {
    //   this.attractMouse()
    // } else if (this.state === "REPULSING") {
    //   this.repulseMouse()
    //   this.attractPlanet(this.targetPlanet, 1.2)
    // } else if (this.state === "LANDED") {

    // }

    this.tickPhysics()
    this.output.position.copy(this.velocity)

    // Reset when out of bounds
    // const limit = 8
    // if (this.output.position.y >= limit) {
    //   this.reset()
    // } else if (this.output.position.y <= -limit) {
    //   this.reset()
    // } else if (this.output.position.x >= limit) {
    //   this.reset()
    // } else if (this.output.position.x <= -limit) {
    //   this.reset()
    // } else if (this.output.position.z >= limit) {
    //   this.reset()
    // } else if (this.output.position.z <= -limit) {
    //   this.reset()
    // }
  }
}