import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import * as THREE from "three"
import PeopleController from "../People/PeopleController"
import Easing from "easing-functions"
import cremap from "../../../utils/math/cremap"
import { FolderApi } from "tweakpane"
import FluidMaterial from "../../Material/FluidMaterial"
import remap from "../../../utils/math/remap"

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
  private peoplesControllers: Set<PeopleController>
  private peopleDiedCb: PlanetParams["onPeopleDie"]
  private planetDiedCb: PlanetParams["onPlanetDie"]
  private spawnCb: PlanetParams["onSpawn"]
  private lifespan: number
  private lifetime: number = 0
  private isDying = false
  public peopleData: Map<PeopleController, { rotation: number }> = new Map()

  private static gui: FolderApi
  private static spawnParams = {
    minimumDist: 1,
    neighbourLimit: 10,
    spawnProba: 0.005,
    restartSpawn: 3,
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
    this.output.scale.setScalar(radius)
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
    this.peoplesControllers = new Set()
    this.initMesh(params)
    this.peopleDiedCb = params.onPeopleDie || (() => { })
    this.planetDiedCb = params.onPlanetDie || (() => { })
    this.spawnCb = params.onSpawn || (() => { })
    this.lifespan = params.lifeSpan
    Planet.initGui(context, this)
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
    this.output = new THREE.Mesh(geometry, this.fluidMaterial.material)
    this.output.rotation.set(randomRotation.x - Math.PI / 2, randomRotation.y, randomRotation.z)
    this.radius = radius
    this.startRadius = radius
    this.output.position.fromArray(position)
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
    if (this.isDying) {
      const lastLifeTime = this.lifetime
      this.lifetime = Math.min(this.lifetime + deltaTime / this.lifespan, 1)
      this.radius = remap(
        Easing.Quadratic.Out(this.lifetime),
        [0, 1],
        [this.startRadius, this.startRadius * 0.6],
      )
      if (this.lifetime >= 1 && lastLifeTime < 1) {
        this.killAll()
        this.planetDiedCb()
      }
      this.fluidMaterial.updateLifetime(this.lifetime)
    }

    const minDistSq = Planet.spawnParams.minimumDist * Planet.spawnParams.minimumDist

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
        let newRotation = data.rotation + clampValue * 0.005
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

        if (closeNeighbour > Planet.spawnParams.neighbourLimit) this.kill(controller)
        else if (Math.random() < Planet.spawnParams.spawnProba)
          this.spawnCb(this, this.peopleData.get(controller)!)
      })
    }
    this.fluidMaterial.tick(time, deltaTime)
  }
}
