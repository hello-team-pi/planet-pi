import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import planetTexture from "../../../assets/images/planet-texture.jpg"
import * as THREE from "three"
import PeopleController from "../People/PeopleController"
import Easing from "easing-functions"
import cremap from "../../../utils/math/cremap"

type PlanetParams = {
  position: THREE.Vector3Tuple
  lifeSpan: number
  radius: number
  tint: THREE.ColorRepresentation
  onPeopleDie: (p: Iterable<PeopleController>) => void
  onPlanetDie: () => void
}

export default class Planet extends AbstractObject<MainSceneContext> {
  private material: THREE.ShaderMaterial
  private peoplesControllers: Set<PeopleController>
  private peopleDiedCb: PlanetParams["onPeopleDie"]
  private planetDiedCb: PlanetParams["onPlanetDie"]
  private lifespan: number
  private lifetime: number = 0
  private isDying = false

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
    params: Omit<PlanetParams, "onPlanetDie" | "onPeopleDie"> & {
      onPeopleDie?: PlanetParams["onPeopleDie"]
      onPlanetDie?: PlanetParams["onPlanetDie"]
    },
  ) {
    super(context)
    this.peoplesControllers = new Set()
    this.initMesh(params)
    this.peopleDiedCb = params.onPeopleDie || (() => {})
    this.planetDiedCb = params.onPlanetDie || (() => {})
    this.lifespan = params.lifeSpan
  }

  private initMesh({
    position,
    tint,
    radius,
  }: {
    position: PlanetParams["position"]
    tint: PlanetParams["tint"]
    radius: PlanetParams["radius"]
  }) {
    const geometry = new THREE.SphereBufferGeometry(1, 32, 32)
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(planetTexture) },
        uTint: { value: new THREE.Color(tint) },
      },
      transparent: true,
    })

    this.output = new THREE.Mesh(geometry, this.material)
    this.radius = radius
    this.startRadius = radius
    this.output.position.fromArray(position)
  }

  public addPeopleController(controller: PeopleController) {
    this.isDying = true
    this.peoplesControllers.add(controller)
  }
  public removePeopleController(controller: PeopleController) {
    this.peoplesControllers.delete(controller)
  }

  public tick(time: number, deltaTime: number) {
    if (this.isDying) {
      const lastLifeTime = this.lifetime
      this.lifetime = Math.min(this.lifetime + deltaTime / this.lifespan, 1)
      this.radius = (1 - this.lifetime) * this.startRadius
      if (this.lifetime >= 1 && lastLifeTime < 1) {
        this.planetDiedCb()
        this.peopleDiedCb(this.peoplesControllers.values())
      }
    }

    for (const controller of this.peoplesControllers) {
      controller.updatePeople((object, data) => {
        let value = 0
        for (const { data: foreignData } of this.peoplesControllers) {
          const loopRotation =
            data.planetRotation > foreignData.planetRotation
              ? foreignData.planetRotation + Math.PI * 2
              : foreignData.planetRotation - Math.PI * 2
          const loopDiff = data.planetRotation - loopRotation
          const straightDiff = data.planetRotation - foreignData.planetRotation
          const finalDiff = Math.abs(loopDiff) > Math.abs(straightDiff) ? straightDiff : loopDiff
          const factor = Easing.Exponential.Out(cremap(Math.abs(finalDiff), [0, 0.2], [1, 0]))
          value += Math.sign(finalDiff) * factor
        }

        const clampValue = Math.sign(value) * (Math.abs(value) > 0.2 ? 2 : 0)
        let newRotation = data.planetRotation + clampValue * 0.005
        if (newRotation > Math.PI * 2) newRotation -= Math.PI * 2
        if (newRotation < 0) newRotation += Math.PI * 2
        data.planetRotation = newRotation

        const radius = this.radius + 0.4

        object.position.set(
          this.position.x + Math.cos(data.planetRotation) * radius,
          this.position.y + Math.sin(data.planetRotation) * radius,
          this.position.z,
        )

        const q = new THREE.Quaternion()
        object.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          data.planetRotation - Math.PI / 2,
        )
        object.quaternion.multiply(q)
        object.updateMatrix()
      })
    }
  }
}
