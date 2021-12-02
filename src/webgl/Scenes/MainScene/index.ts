import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import * as THREE from "three"
import { WebGLAppContext } from "../.."
import AbstractObject from "../../Abstract/AbstractObject"
import AbstractObjectWithSize from "../../Abstract/AbstractObjectWithSize"
import Planet from "../../Components/Planet"
import SciFiBackground from "../../Components/SciFiBackground"
import World from "../../Components/World"
import observableState from "../../../utils/observableState"

import spritesheet from "../../../assets/spritesheets/spritesheet.png"
import blueGradient from "../../../assets/images/gradients/blue_gradient.png"
import greenGradient from "../../../assets/images/gradients/green_gradient.png"
import purpleGradient from "../../../assets/images/gradients/purple_gradient.png"
import planetModel from "../../../assets/models/planet_4.gltf"

export default class MainScene extends AbstractObjectWithSize {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera

  private orbit: OrbitControls
  private assets: {
    spritesheet: THREE.Texture
    blueGradient: THREE.Texture
    greenGradient: THREE.Texture
    purpleGradient: THREE.Texture
    planetGeometry: THREE.BufferGeometry | null
  }

  private state = observableState<{ currentPlanet: null | Planet }>({
    currentPlanet: null,
  })

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
      const mesh = gltf.scenes[0].children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >
      // mesh.material.normalMap
      this.assets.planetGeometry = mesh.geometry
    })
    this.context.globalState.__onChange("step", (step) => {
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
    sceneState: this.state,
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
    this.orbit = new OrbitControls(this.camera, this.context.renderer.domElement)
    this.orbit.enabled = false
    this.context.gui.addInput(this.orbit, "enabled", { label: "Orbit Controls" })

    this.state.__onChange(
      "currentPlanet",
      (p) => {
        if (p === null) return
        this.camera.position.x = p.position.x
        this.camera.position.y = p.position.y
        this.orbit.target.copy(p.position)
      },
      true,
    )
  }

  private setObjects() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    const background = new SciFiBackground(this.genContext())
    this.scene.add(background.output)
    this.tickingObjects.push(background)
  }

  public tick(...params: Parameters<AbstractObject["tick"]>) {
    for (const obj of this.tickingObjects) {
      obj.tick(...params)
    }
  }
}

export type MainSceneContext = ReturnType<MainScene["genContext"]>
