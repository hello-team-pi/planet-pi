import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import * as THREE from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import { FolderApi } from "tweakpane"
import AbstractObjectWithSize from "../../Abstract/AbstractObjectWithSize"
import backgroundImg from "../../../assets/images/paper_bg_1K.png"
import getViewport from "../../../utils/webgl/viewport"

export default class SciFiBackground extends AbstractObjectWithSize<MainSceneContext> {
  private params = {
    gridScale: 30,
    gridOffset: new THREE.Vector2(),
    imageTranslateOffset: 0.7,
    imageRotation: 1,
    imageScale: 1,
    useDebugOffset: false,
  }

  private uniforms: Record<string, THREE.IUniform>

  private gui: FolderApi

  constructor(context: MainSceneContext) {
    super(context)
    this.gui = this.context.gui.addFolder({ title: "Background" })
    this.setupMesh()
    this.setupGUI()
  }

  private setupMesh() {
    this.uniforms = {
      uGridScale: { value: this.params.gridScale },
      uGridOffset: { value: this.params.gridOffset.clone() },
      uCameraPosition: { value: this.context.camera.position },
      uImageTranslateOffset: { value: this.params.imageTranslateOffset },
      uImageRotation: { value: this.params.imageRotation },
      uImageScale: { value: this.params.imageScale },
      uScreenResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uBackgroundImage: {
        value: new THREE.TextureLoader().load(backgroundImg, (t) => {
          t.wrapS = THREE.RepeatWrapping
          t.wrapT = THREE.RepeatWrapping
        }),
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

  protected onResize(width: number, height: number) {
    this.uniforms.uScreenResolution.value.set(width, height)
  }

  // TODO: find out why this stops on game end
  public tick(time: number, deltaTime: number) {    
    if (this.params.useDebugOffset) return
    const cam = this.context.camera

    
    // console.log(cam, cam.position, this.windowSize.state);
    
    const { width, height } = getViewport(
      cam,
      [cam.position.x, cam.position.y, 0],
      this.windowSize.state,
    )

    // console.log(width, height);

    this.output.position.set(cam.position.x, cam.position.y, cam.position.z - 1)
    this.uniforms.uGridOffset.value.set(
      (cam.position.x / width) * this.windowSize.state.width + time * 20,
      (cam.position.y / height) * this.windowSize.state.height + time * 20,
    )
  }

  private setupGUI() {
    this.gui
      .addInput(this.params, "gridScale")
      .on("change", ({ value }) => (this.uniforms.uGridScale.value = value))
    const folder = this.gui.addFolder({ title: "Image" })
    folder
      .addInput(this.params, "imageRotation", { min: 0, max: Math.PI * 2, label: "Rotation" })
      .on("change", ({ value }) => (this.uniforms.uImageRotation.value = value))
    folder
      .addInput(this.params, "imageScale", { label: "Scale" })
      .on("change", ({ value }) => (this.uniforms.uImageScale.value = value))
    folder
      .addInput(this.params, "imageTranslateOffset", { min: 0, max: 2, label: "Translate offset" })
      .on("change", ({ value }) => (this.uniforms.uImageTranslateOffset.value = value))
    folder.addInput(this.params, "useDebugOffset")
    // folder
    //   .addInput(this.params, "gridOffset")
    //   .on("change", ({ value }) => this.uniforms.uGridOffset.value.copy(value).multiplyScalar(10))
  }
}
