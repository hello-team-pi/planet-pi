import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import * as THREE from "three"
import { WebGLAppContext } from "../.."
import AbstractObject from "../../Abstract/AbstractObject"
import AbstractObjectWithSize from "../../Abstract/AbstractObjectWithSize"
import Background from "../../Components/Background"
import World from "../../Components/World"

import spritesheet from "../../../assets/spritesheets/spritesheet.png"
import blueGradient from "../../../assets/images/gradients/blue_gradient.png"
import greenGradient from "../../../assets/images/gradients/green_gradient.png"
import purpleGradient from "../../../assets/images/gradients/purple_gradient.png"
import planetModel from "../../../assets/models/planet_4.gltf"

export default class MainScene extends AbstractObjectWithSize {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  private assets: {
    spritesheet: THREE.Texture
    blueGradient: THREE.Texture
    greenGradient: THREE.Texture
    purpleGradient: THREE.Texture
    planetGeometry: THREE.BufferGeometry | null
  }

  private tickingObjects: AbstractObject[] = []

  constructor(context: WebGLAppContext) {
    super(context)
    this.setCamera()
    this.setObjects()
    const gltfLoader = new GLTFLoader()
    const textureLoader = new THREE.TextureLoader()
    this.assets = {
      blueGradient: textureLoader.load(blueGradient),
      greenGradient: textureLoader.load(greenGradient),
      purpleGradient: textureLoader.load(purpleGradient),
      spritesheet: textureLoader.load(spritesheet),
      planetGeometry: null,
    }
    gltfLoader.load(planetModel, (gltf: GLTF) => {
      console.log(gltf.scenes[0].children[0])
      const mesh = gltf.scenes[0].children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >
      // mesh.material.normalMap
      this.assets.planetGeometry = mesh.geometry
      const world = new World(this.genContext())
      this.tickingObjects.push(world)
      this.scene.add(world.output)
    })
    this.context.renderer.compile(this.scene, this.camera)
  }

  private genContext = () => ({
    ...this.context,
    camera: this.camera,
    scene: this.scene,
    assets: this.assets,
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
    this.camera.position.z = 50
    this.onResize(window.innerWidth, window.innerHeight)
    // new OrbitControls(this.camera, this.context.renderer.domElement)
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

export type MainSceneContext = ReturnType<MainScene["genContext"]>
