import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneBufferGeometry,
  Quaternion,
  TextureLoader,
  Vector2,
  Vector3,
} from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import GrabCursorController from "./GrabCursorController"
import PhysicsObject from "../PhysicsObject"
import Planet from "../Planet"
import cursorImage from "../../../assets/images/ui/cursor_target.png"
import { fromPolarX, fromPolarY } from "../../../utils/math/fromPolar"
import PeopleController from "../People/PeopleController"
import tuple from "../../../utils/types/tuple"
import PhysicsController from "../People/PhysicsController"
import getViewport, { Viewport } from "../../../utils/webgl/viewport"

const temporaryVectors = {
  position: new Vector3(),
  worldPos: new Vector3()
}

export default class GrabObject extends PhysicsObject {
  public output: Object3D
  public cursor: GrabCursorController
  private peopleControllers : Set<PeopleController>
  private currentPlanet: Planet
  private active : boolean
  private offsetRadius = 1.2
  private icon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>

  constructor(
    context: MainSceneContext,
    originPlanet: Planet,
    peopleControllers: Set<PeopleController>,
    mass = 1,
  ) {
    super(mass)

    this.cursor = new GrabCursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.icon = new Mesh(
      new PlaneBufferGeometry(0.39, 0.6),
      new MeshBasicMaterial({ map: new TextureLoader().load(cursorImage), transparent: true }),
    )

    this.peopleControllers = peopleControllers

    this.output = new Object3D()
    this.output.add(this.icon)

    this.toggle(true)
  }

  private rotateAroundPlanet(alpha = 0.4){
    this.currentPlanet.output.getWorldPosition(temporaryVectors.worldPos)

    const directionToPlanet = new Vector2(this.cursor.cursorPos.y - temporaryVectors.worldPos.y,
      this.cursor.cursorPos.x - temporaryVectors.worldPos.x)

    // Arc tangent of the division of its' arguments
    // Corresponds to the angle in radians between +x and (x, y)
    const angle = Math.atan2(directionToPlanet.x, directionToPlanet.y)+ Math.PI / 2

    // Angled x and y coordinates around a circle of a certain radius
    const x = fromPolarX(this.currentPlanet.radius + this.offsetRadius, angle)
    const y = fromPolarY(this.currentPlanet.radius + this.offsetRadius, angle)

    temporaryVectors.position.set(
      temporaryVectors.worldPos.x - x,
      temporaryVectors.worldPos.y - y,
      0,
    )

    this.output.rotation.z = angle
    this.icon.position.y = -(this.offsetRadius + this.currentPlanet.radius)

    // ;(window as any).debug = this.output.position
  }

  public repulsePhysicalPeopleControllers(peopleController: PeopleController) {
    peopleController.physicsController.setReleasedCursorPosition(this.cursor.cursorPos)
    peopleController.physicsController.setState("REPULSING")
  }

  public toggle(toggle: boolean) {
    this.active = toggle
    this.output.visible = this.active
  }

  public tick(time:number, delta:number) {
    if (this.active) this.rotateAroundPlanet()

    // console.log(this.peopleControllers);
    
    // for (const peopleController of this.peopleControllers) {
    // //   console.log("test: ", peopleController);
    //   peopleController.physicsController.tick(time,delta)
    // }
    
    // console.log(this.peopleControllers);

    // (window as any).peoplecontrollers = this.peopleControllers
  }
}
