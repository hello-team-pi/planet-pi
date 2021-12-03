import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneBufferGeometry,
  Quaternion,
  TextureLoader,
  Vector3,
} from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import CursorController from "../People/CursorController"
import PhysicsObject from "../PhysicsObject"
import Planet from "../Planet"
import cursorImage from "../../../assets/images/ui/cursor_target.png"
import { fromPolarX, fromPolarY } from "../../../utils/math/fromPolar"
import PeopleController from "../People/PeopleController"
import tuple from "../../../utils/types/tuple"
import PhysicsController from "../People/PhysicsController"
import getViewport, { Viewport } from "../../../utils/webgl/viewport"
import gsap, {Cubic} from "gsap/all"
import { PeopleControllerTuples } from "../GrabObject"

export type OnLanding = (
  previousPlanet: Planet,
  landedPlanet: Planet,
  physicsController: PhysicsController,
) => void
export type OnDeath = (physicsController: PhysicsController) => void

const temporaryVectors = {
  gravity: new Vector3(),
  target: new Vector3(),
  oppositePosition: new Vector3(),
  lerpedTargetRotation: new Vector3(),
}

export default class LaunchObject extends PhysicsObject {
  public output: Object3D
  public peopleControllerTuples: PeopleControllerTuples //TODO: hlep
  public cursor: CursorController
  private currentPlanet: Planet
  private onLanding: OnLanding
  private onDeath: OnDeath
  private viewport: Viewport
  private offsetRadius = 1.2
  private icon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  public scaleScalar = 0.6

  constructor(
    context: MainSceneContext,
    originPlanet: Planet,
    mass = 1,
  ) {
    super(mass)

    this.cursor = new CursorController(context)
    this.currentPlanet = originPlanet
    this.cursor.setCurrentPlanet(this.currentPlanet)
    this.icon = new Mesh(
      new PlaneBufferGeometry(0.65, 1),
      new MeshBasicMaterial({ map: new TextureLoader().load(cursorImage), transparent: true }),
    )
    this.output = new Object3D()
    this.viewport = getViewport(context.camera)

    this.icon.scale.setScalar(this.scaleScalar)

    this.output = new Object3D()
    this.output.add(this.icon)
    this.peopleControllerTuples = []

    this.output.visible = false

    this.rotateAroundPlanet()
  }

  private rotateAroundPlanet(alpha = 0.75) {
    const angle = -Math.atan2(
      this.cursor.cursorPos.y - this.currentPlanet.position.y,
      this.cursor.cursorPos.x - this.currentPlanet.position.x,
    )

    const x = fromPolarX(this.currentPlanet.radius + this.offsetRadius, angle + Math.PI / 2)
    const y = fromPolarY(this.currentPlanet.radius + this.offsetRadius, angle + Math.PI / 2)

    temporaryVectors.lerpedTargetRotation.set(
      this.currentPlanet.position.x - x,
      this.currentPlanet.position.y - y,
      0,
    )
    this.output.rotation.z = -angle + Math.PI / 2
    this.icon.position.y = -(this.offsetRadius + this.currentPlanet.radius) * 2
    this.output.position.lerp(temporaryVectors.lerpedTargetRotation, alpha)
  }

  // public setPhysicalPeopleControllers = (
  //   planets: Planet[],
  // ) => {
  //   const controllers = this.currentPlanet.peopleData.keys()
  //   for (const controller of controllers) {
      
  //     this.peopleControllerTuples.push(
  //       tuple(
  //         controller,
  //         new PhysicsController(
  //           controller,
  //           this.currentPlanet,
  //           planets,
  //           this,
  //           this.viewport,
  //           this.onLanding,
  //           this.onDeath,
  //         ),
  //       ),
  //     )
  //   }
  // }

  public setPeopleControllerTuples = (
    tuples: PeopleControllerTuples,
  ) => {  
    this.peopleControllerTuples = tuples
  }

  public push = () => {
    for (const peopleControllerTuple of this.peopleControllerTuples) {
      const physicsController : PhysicsController = peopleControllerTuple[1]
      physicsController.setState("REPULSING")
    }  
  }

  // public repulsePhysicalPeopleControllers() {
  //   for (const peopleController of this.peopleControllerTuples) {
  //     const physicsController = peopleController[1]
  //     if (!physicsController) return
  //     physicsController.setReleasedCursorPosition(this.cursor.cursorPos)
  //     physicsController.setState("REPULSING")
  //   }
  // }

  public clearPeopleControllerTuples() {
    this.peopleControllerTuples = []
  }

  public removePeopleControllerTuple(index: number) {
    // this.peopleControllerTuples[index] = tuple(null, null)
  }

  public disappear() {
    gsap.to(this.icon.scale, {x: 0, y: 0, z: 0, duration: 0.5, ease: Cubic.easeInOut, onComplete: ()=>{
      this.output.visible = false
    }})
  }

  public appear(){
    gsap.to(this.icon.scale, {x: this.scaleScalar, y: this.scaleScalar, z: this.scaleScalar, duration: 0.5, ease: Cubic.easeInOut, onStart: ()=>{
      this.output.visible = true
    }})
  }

  public tick() {
    if (this.output.visible) {
      this.rotateAroundPlanet()
      for (const tuple of this.peopleControllerTuples) {
        const physicsController : PhysicsController = tuple[1]
        console.log('ticking');
        
        physicsController.tick()
      }
    }
  }
}
