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

  constructor(context: MainSceneContext, originPlanet: Planet, mass = 1) {
    super(context, mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.output = new Mesh(new PlaneBufferGeometry(), new MeshBasicMaterial({ map: new TextureLoader().load(peopleImage) }))
    this.output.scale.setScalar(1)

    this.reset()
    this.setEvents()
  }

  reset = () => {
    this.velocity.setX(this.currentPlanet.radius * Math.sin(Math.random() * Math.PI * 2))
    this.velocity.setY(this.currentPlanet.radius * Math.cos(Math.random() * Math.PI * 2))
  }

  onMouseDown = () => {
    this.cursor.click(this.currentPlanet)
  }

  onMouseUp = () => {
    this.cursor.release()
  }

  setEvents() {
    window.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)

    this.toUnbind(() => {
      window.removeEventListener("mousedown", this.onMouseDown)
      window.removeEventListener("mouseup", this.onMouseUp)
    })
  }

  attractPlanet() {
    const gravity = this.attract(this.currentPlanet, this.output.position, 0.3)
    if (gravity.length()) this.forces.push(gravity)
  }

  repulseMouse() {
    temporaryVectors.mouseDownTarget.copy(this.output.position)
    temporaryVectors.mouseDownTarget.sub(this.cursor.cursorPos)
    this.forces.push(temporaryVectors.mouseDownTarget)
  }

  tick() {
    this.attractPlanet()
    this.repulseMouse()
    this.tickPhysics()
    this.output.position.copy(this.velocity)

    // Reset when out of bounds
    const limit = 6
    if (this.output.position.y >= limit) {
      this.reset()
    } else if (this.output.position.y <= -limit) {
      this.reset()
    } else if (this.output.position.x >= limit) {
      this.reset()
    } else if (this.output.position.x <= -limit) {
      this.reset()
    } else if (this.output.position.z >= limit) {
      this.reset()
    } else if (this.output.position.z <= -limit) {
      this.reset()
    }
  }
}