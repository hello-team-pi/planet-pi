import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import * as THREE from "three"
import PeopleController from "../People/PeopleController"
import Easing from "easing-functions"
import cremap from "../../../utils/math/cremap"
import { FolderApi } from "tweakpane"
import FluidMaterial from "../../Material/FluidMaterial"
import remap from "../../../utils/math/remap"
import dangerBackUi from "../../../assets/images/ui/hud_quit_planet.png"
import overpopulationBackUi from "../../../assets/images/ui/hud_overpopulation.png"
import dangerFrontUi from "../../../assets/images/ui/ico-eject.png"
import overpopulationFrontUi from "../../../assets/images/ui/ico-attention.png"
import Animator from "../Animator"
import gsap from "gsap"

import fragmentShader from "./anim.frag?raw"
import vertexShader from "./anim.vert?raw"

type PeopleData = { rotation: number }

type PlanetParams = {
  position: THREE.Vector3Tuple
  lifeSpan: number
  radius: number
  type: PlanetType
  onPeopleDie: (controller: PeopleController, data: PeopleData) => void
  onPlanetDie: () => void
  onSpawn: (planet: Planet, data: PeopleData) => void
}

type PlanetType = "green" | "purple" | "blue"

const TYPE_TEXTURE: Record<PlanetType, "greenGradient" | "purpleGradient" | "blueGradient"> = {
  green: "greenGradient",
  purple: "purpleGradient",
  blue: "blueGradient",
}

export default class Planet extends AbstractObject<MainSceneContext> {
  private fluidMaterial: FluidMaterial
  private planetMesh: THREE.Mesh
  private frontUI: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  private backUI: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  private animationQuad: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  private animator: Animator<"PLANET">

  private peoplesControllers: Set<PeopleController>

  public get peopleAmount(): number {
    return this.peoplesControllers.size
  }

  private peopleDiedCb: PlanetParams["onPeopleDie"]
  private planetDiedCb: PlanetParams["onPlanetDie"]
  private spawnCb: PlanetParams["onSpawn"]
  private lifespan: number
  private lifetime: number = 0
  private isDying = false
  private uiState: "none" | "overpopulation" | "danger" = "none"
  private timer = 0

  public peopleData: Map<PeopleController, { rotation: number }> = new Map()

  private static gui: FolderApi
  private static spawnParams = {
    minimumDist: 1,
    neighbourLimit: 10,
    spawnProba: 0.005,
    restartSpawn: 3,
  }
  private static textures: {
    front: {
      overpopulation: THREE.Texture
      danger: THREE.Texture
    }
    back: {
      overpopulation: THREE.Texture
      danger: THREE.Texture
    }
  }

  // private static materialParams: Partial<FluidParams> = {
  //   direction: new THREE.Euler(2.47, 4.16, 0),
  //   fresnelColor: "#ffffff",
  //   fresnelPower: 2.5,
  //   noiseScale: 3,
  //   noiseStrength: 0.01,
  //   loopCount: 2,
  //   gradient: new THREE.Texture(),
  // }

  private startRadius: number
  private _radius: number
  public set radius(radius: number) {
    this.planetMesh.scale.setScalar(radius)
    this._radius = radius
  }
  public get radius() {
    return this._radius
  }

  public get position(): THREE.Vector3 {
    return this.output.position
  }

  constructor(
    context: MainSceneContext,
    params: Omit<PlanetParams, "onPlanetDie" | "onPeopleDie" | "onSpawn"> & {
      onPeopleDie?: PlanetParams["onPeopleDie"]
      onPlanetDie?: PlanetParams["onPlanetDie"]
      onSpawn?: PlanetParams["onSpawn"]
    },
  ) {
    super(context)
    Planet.initTextures()
    this.peoplesControllers = new Set()
    this.initMesh(params)
    this.peopleDiedCb = params.onPeopleDie || (() => {})
    this.planetDiedCb = params.onPlanetDie || (() => {})
    this.spawnCb = params.onSpawn || (() => {})
    this.lifespan = params.lifeSpan
    this.animator = new Animator(5, "PLANET")
    Planet.initGui(context, this)
  }

  public get isDead(): boolean {
    return this.lifetime === 1
  }

  private static initTextures() {
    if (this.textures) return
    const loader = new THREE.TextureLoader()
    const transform = (t: THREE.Texture) => (t.minFilter = THREE.NearestFilter)
    this.textures = {
      back: {
        danger: loader.load(dangerBackUi, transform),
        overpopulation: loader.load(overpopulationBackUi, transform),
      },
      front: {
        danger: loader.load(dangerFrontUi, transform),
        overpopulation: loader.load(overpopulationFrontUi, transform),
      },
    }
  }

  private static initGui(context: MainSceneContext, planet: Planet) {
    if (this.gui) return
    this.gui = context.gui.addFolder({ title: "Planet" })
    const spawnFolder = this.gui.addFolder({ title: "Spawn", expanded: false })
    spawnFolder.addInput(this.spawnParams, "minimumDist", {
      min: 0.2,
      max: 2,
      label: "Minimum Distance",
    })
    spawnFolder.addInput(this.spawnParams, "neighbourLimit", { step: 1, label: "Neighbour Limit" })
    spawnFolder.addInput(this.spawnParams, "spawnProba", {
      min: 0.001,
      max: 0.05,
      step: 0.001,
      label: "Spawn Proba",
    })
    spawnFolder.addButton({ title: "Restart" }).on("click", () => {
      planet.killAll()
      planet.lifetime = 0
      for (let index = 0; index < this.spawnParams.restartSpawn; index++) {
        planet.spawnCb(planet, { rotation: Math.random() * Math.PI * 2 })
      }
    })
    spawnFolder.addInput(this.spawnParams, "restartSpawn", { step: 1, label: "Restart Spawn" })
  }

  private initMesh({
    position,
    radius,
    type,
  }: {
    position: PlanetParams["position"]
    radius: PlanetParams["radius"]
    type: PlanetParams["type"]
  }) {
    const randomRotation = new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    )
    const geometry = this.context.assets.planetGeometry!
    this.fluidMaterial = new FluidMaterial({
      gradient: this.context.assets[TYPE_TEXTURE[type]],
      direction: randomRotation,
    })
    this.planetMesh = new THREE.Mesh(geometry, this.fluidMaterial.material)
    this.planetMesh.rotation.set(randomRotation.x - Math.PI / 2, randomRotation.y, randomRotation.z)

    this.backUI = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({
        transparent: true,
        map: Planet.textures.back.overpopulation,
      }),
    )
    this.backUI.position.z = -0.1
    this.backUI.position.y = 0.7
    this.backUI.visible = false

    this.frontUI = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        transparent: true,
        map: Planet.textures.front.overpopulation,
        depthTest: false,
      }),
    )
    this.frontUI.visible = false
    this.frontUI.position.y = 0.2

    this.animationQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: {
          uTexture: { value: this.context.assets.planetSpritesheet },
          uUvOffset: { value: new THREE.Vector4(0, 0, 0, 0) },
        },
      }),
    )
    this.animationQuad.position.z = -0.1

    this.output = new THREE.Object3D()
    this.output.position.fromArray(position)
    this.output.add(this.planetMesh, this.frontUI, this.backUI, this.animationQuad)

    this.radius = radius
    this.startRadius = radius
  }

  private setUI(state: Planet["uiState"]) {
    const visible = state !== "none" && Math.floor(this.timer * 3) % 2 === 0
    this.frontUI.visible = visible
    this.backUI.visible = visible
    if (this.uiState === state) return
    this.timer = 0
    if (state === "none") return
    this.frontUI.material.map = Planet.textures.front[state]
    this.backUI.material.map = Planet.textures.back[state]
    this.uiState = state
  }

  private kill(peopleController: PeopleController) {
    const data = this.peopleData.get(peopleController)!
    this.removePeopleController(peopleController)
    this.peopleDiedCb(peopleController, data)
  }
  private killAll() {
    for (const controller of this.peoplesControllers) this.kill(controller)
  }

  public addPeopleController(controller: PeopleController, initRotation: number) {
    this.isDying = true
    this.peoplesControllers.add(controller)
    this.peopleData.set(controller, { rotation: initRotation })
  }

  public removePeopleController(controller: PeopleController) {
    this.peoplesControllers.delete(controller)
    this.peopleData.delete(controller)
  }

  public tick(time: number, deltaTime: number) {
    const minDistSq = Planet.spawnParams.minimumDist * Planet.spawnParams.minimumDist
    let state: Planet["uiState"] = this.uiState

    for (const controller of this.peoplesControllers) {
      const data = this.peopleData.get(controller)!

      let closeNeighbour = 0
      const position = [
        Math.cos(data.rotation) * this.radius,
        Math.sin(data.rotation) * this.radius,
      ]

      controller.updatePeople((object) => {
        let value = 0
        for (const foreignController of this.peoplesControllers) {
          const foreignData = this.peopleData.get(foreignController)!
          const loopRotation =
            data.rotation > foreignData.rotation
              ? foreignData.rotation + Math.PI * 2
              : foreignData.rotation - Math.PI * 2
          const loopDiff = data.rotation - loopRotation
          const straightDiff = data.rotation - foreignData.rotation
          const finalDiff = Math.abs(loopDiff) > Math.abs(straightDiff) ? straightDiff : loopDiff
          const factor = Easing.Exponential.Out(cremap(Math.abs(finalDiff), [0, 0.2], [1, 0]))
          value += Math.sign(finalDiff) * factor

          const foreignPos = [
            Math.cos(foreignData.rotation) * this.radius,
            Math.sin(foreignData.rotation) * this.radius,
          ]
          const distSq =
            Math.abs(position[0] - foreignPos[0]) + Math.abs(position[1] - foreignPos[1])
          if (distSq < minDistSq) closeNeighbour++
        }

        const clampValue = Math.sign(value) * (Math.abs(value) > 0.2 ? 2 : 0)
        const offset = clampValue * 0.005
        const hasMoved = clampValue > 0
        let newRotation = data.rotation + offset
        if (newRotation > Math.PI * 2) newRotation -= Math.PI * 2
        if (newRotation < 0) newRotation += Math.PI * 2
        data.rotation = newRotation

        const radius = this.radius + 0.3

        object.position.set(
          this.position.x + Math.cos(data.rotation) * radius,
          this.position.y + Math.sin(data.rotation) * radius,
          this.position.z,
        )

        const q = new THREE.Quaternion()
        object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), data.rotation - Math.PI / 2)
        object.quaternion.multiply(q)
        object.updateMatrix()

        if (closeNeighbour > Planet.spawnParams.neighbourLimit) {
          this.kill(controller)
          state = "overpopulation"
        } else if (
          Math.random() <
            remap(closeNeighbour, [0, Planet.spawnParams.neighbourLimit], [0.02, 0.0001]) &&
          !this.context.globalState.isIntro
        )
          this.spawnCb(this, this.peopleData.get(controller)!)

        return hasMoved ? "walk" : "alive"
      })
    }

    if (this.isDying && !this.context.globalState.isIntro) {
      const lastLifeTime = this.lifetime
      this.lifetime = Math.min(this.lifetime + deltaTime / this.lifespan, 1)
      if (!this.isDead)
        this.radius = remap(
          Easing.Quadratic.Out(this.lifetime),
          [0, 1],
          [this.startRadius, this.startRadius * 0.6],
        )
      if (this.lifespan - this.lifetime * this.lifespan < 3 && lastLifeTime < 1)
        this.fluidMaterial.setIsShaky(true)
      if (this.lifespan - this.lifetime * this.lifespan < 5 && !this.isDead) {
        state = "danger"
        if (
          this.context.sceneState.currentPlanet === this &&
          !this.context.sounds.planetWarning.playing()
        )
          this.context.sounds.planetWarning.play()
      }
      if (this.lifetime >= 1) state = "none"
      if (this.lifetime >= 1 && lastLifeTime < 1) {
        this.killAll()
        this.planetDiedCb()
        this.context.sounds.planetExplosion.play()
        this.animator.setAnimation("explosion", () => this.animator.setAnimation("none"))
        gsap.to(this, { radius: 0 })
        this.fluidMaterial.setIsShaky(false)
      }
      this.fluidMaterial.updateLifetime(this.lifetime)
    }
    this.timer += deltaTime
    this.setUI(this.context.sceneState.currentPlanet === this ? state : "none")

    this.fluidMaterial.tick(time, deltaTime)
    this.animationQuad.visible = this.animator.currentAnimation !== "none"
    this.animator.tick()
    this.animationQuad.material.uniforms.uUvOffset.value.copy(
      this.context.planetSpritesheetParser.getByName(this.animator.getFrame()),
    )
  }
}
