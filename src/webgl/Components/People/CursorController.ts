import * as THREE from "three"
import normalizeMouse from "../../../utils/webgl/normalizeMouse"
import AbstractObjectWithSize from "../../Abstract/AbstractObjectWithSize"
import { MainSceneContext } from "../../Scenes/MainScene"
import Planet from "../Planet"

export default class CursorController extends AbstractObjectWithSize<MainSceneContext> {
  public cursorPos: THREE.Vector3 = new THREE.Vector3()
  public isClicking = false
  private currentPlanet: Planet | null = null

  constructor(context: MainSceneContext) {
    super(context)

    this.context.renderer.domElement.addEventListener("mousemove", this.handleMouseMove)
  }

  setCurrentPlanet(planet: Planet) {
    this.currentPlanet = planet
  }

  private handleMouseMove = (e: MouseEvent) => {
    // if (!this.isDragging) return

    if (!this.currentPlanet) return

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1))
    plane.constant = 0
    plane.translate(this.currentPlanet!.position)
    const raycaster = new THREE.Raycaster()
    const mouse = normalizeMouse({ x: e.clientX, y: e.clientY }, this.windowSize.state)

    raycaster.setFromCamera(mouse, this.context.camera)
    raycaster.ray.intersectPlane(plane, this.cursorPos)
  }


  // Not used for now
  private handleDrag = (e: MouseEvent) => {
    if (!this.isClicking) return

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1))
    plane.constant = 0
    plane.translate(this.currentPlanet!.position)
    const raycaster = new THREE.Raycaster()
    const mouse = normalizeMouse({ x: e.clientX, y: e.clientY }, this.windowSize.state)

    raycaster.setFromCamera(mouse, this.context.camera)
    raycaster.ray.intersectPlane(plane, this.cursorPos)
  }

  public click(planet: Planet) {
    this.isClicking = true
    this.currentPlanet = planet
  }

  public release() {
    this.isClicking = false
  }

  public destroy() {
    super.destroy()
    this.context.renderer.domElement.removeEventListener("mouseover", this.handleMouseMove)
  }
}
