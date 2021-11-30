import * as THREE from "three"
import { WebGLAppContext } from "../.."
import AbstractObject from "../../abstract/AbstractObject"
import AbstractObjectWithSize from "../../abstract/AbstractObjectWithSize"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import Background from "../../Background"

export type MainSceneContext = WebGLAppContext & {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}
export default class MainScene extends AbstractObjectWithSize {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera

  private tickingObjects: AbstractObject[] = []

  constructor(context: WebGLAppContext) {
    super(context)
    this.setCamera()
    this.setObjects()
    this.context.renderer.compile(this.scene, this.camera)
  }

  private genContext = (): MainSceneContext => ({
    ...this.context,
    camera: this.camera,
    scene: this.scene,
  })

  protected onResize(width: number, height: number) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      22.9,
      window.innerWidth / window.innerHeight,
      0.01,
      1000,
    )
    this.camera.position.z = 10
    this.onResize(window.innerWidth, window.innerHeight)
    new OrbitControls(this.camera, this.context.renderer.domElement)
  }

  private setObjects() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)
    const background = new Background(this.genContext())
    this.scene.add(background.output)
  }

  public tick(...params: Parameters<AbstractObject["tick"]>) {
    for (const obj of this.tickingObjects) {
      obj.tick(...params)
    }
  }
}
