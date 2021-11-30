import * as THREE from "three"
import normalizeMouse from "../../../utils/webgl/normalizeMouse"
import AbstractObjectWithSize from "../../Abstract/AbstractObjectWithSize"
import { MainSceneContext } from "../../Scenes/MainScene"
import Planet from "../Planet"

export default class CursorController extends AbstractObjectWithSize<MainSceneContext> {
  private cusorPos: THREE.Vector3 = new THREE.Vector3()
  private isDragging = false
  private currentPlanet: Planet | null = null

  constructor(context: MainSceneContext) {
    super(context)
    this.context.renderer.domElement.addEventListener("mouseover", this.handleDrag)
  }

  private handleDrag(e: MouseEvent) {
    if (!this.isDragging) return

    const wp = this.currentPlanet!.position
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1))
    plane.constant = 0
    plane.translate(wp)
    const raycaster = new THREE.Raycaster()
    const mouse = normalizeMouse({ x: e.clientX, y: e.clientY }, this.windowSize.state)

    raycaster.setFromCamera(mouse, this.context.camera)
    raycaster.ray.intersectPlane(plane, this.cusorPos)
  }

  public click(planet: Planet, mousePosition: [number, number]) {
    this.isDragging = true
    this.currentPlanet = planet
  }

  public release() {
    this.isDragging = false
  }

  public destroy() {
    super.destroy()
    this.context.renderer.domElement.removeEventListener("mouseover", this.handleDrag)
  }
}
