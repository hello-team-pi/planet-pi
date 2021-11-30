import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import * as THREE from "three"
import AbstractObject from "../abstract/AbstractObject"
import { MainSceneContext } from "../Scenes/MainScene"

export default class Background extends AbstractObject<MainSceneContext> {
  private params = {
    insideColor: "#373232",
    outsideColor: "#141414",
    gradientStart: 0,
    gradientEnd: 0.8,
  }

  private uniforms: Record<string, THREE.IUniform>

  public mesh: THREE.Mesh

  constructor(context: MainSceneContext) {
    super(context)
    this.setupMesh(this.context.camera)
  }

  private setupMesh(camera: THREE.Camera) {
    this.uniforms = {
      uInsideColor: { value: new THREE.Color(this.params.insideColor) },
      uOutsideColor: { value: new THREE.Color(this.params.outsideColor) },
      uGradientStart: { value: this.params.gradientStart },
      uGradientEnd: { value: this.params.gradientEnd },
      uCameraPosition: { value: camera.position },
      uScreenResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    }

    this.output = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100, 100),
      new THREE.RawShaderMaterial({
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        depthTest: false,
        uniforms: this.uniforms,
      }),
    )
    this.output.renderOrder = -1
  }
}
