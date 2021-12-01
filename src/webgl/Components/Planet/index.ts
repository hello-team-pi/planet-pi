import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import planetTexture from "../../../assets/images/planet-texture.jpg"
import * as THREE from "three"
import PeopleController from "../People/PeopleController"
import Easing from "easing-functions"
import cremap from "../../../utils/math/cremap"

export default class Planet extends AbstractObject<MainSceneContext> {
  private material: THREE.ShaderMaterial
  private peoplesControllers: Set<PeopleController>

  public radius: number
  public get position(): THREE.Vector3 {
    return this.output.position
  }

  constructor(
    context: MainSceneContext,
    position: THREE.Vector3,
    radius: number,
    tint = new THREE.Color("#fff"),
  ) {
    super(context)
    this.peoplesControllers = new Set()
    this.radius = radius
    this.initMesh(position, tint)
  }

  private initMesh(position: THREE.Vector3, tint: THREE.Color) {
    const geometry = new THREE.SphereBufferGeometry(this.radius, 32, 32)
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(planetTexture) },
        uTint: { value: tint },
      },
      transparent: true,
    })

    this.output = new THREE.Mesh(geometry, this.material)
    this.output.position.copy(position)
  }

  public addPeopleController(controller: PeopleController) {
    this.peoplesControllers.add(controller)
  }
  public removePeopleController(controller: PeopleController) {
    this.peoplesControllers.delete(controller)
  }

  public tick() {
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
