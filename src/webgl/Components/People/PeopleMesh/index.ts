import * as THREE from "three"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import spritesheetImage from "../../../../assets/spritesheets/spritesheet.png"
import { MainSceneContext } from "../../../Scenes/MainScene"

type PeopleColors = {
  head: string
  body: string
  mouth: string
}

export default class PeopleMesh {
  private maxAmount: number
  private material: THREE.ShaderMaterial
  private context: MainSceneContext
  public mesh: THREE.InstancedMesh

  private theme: PeopleColors

  constructor(
    maxAmount: number,
    context: MainSceneContext,
    theme: PeopleColors = { body: "#ebebeb", head: "#d9d9d9", mouth: "#373431" },
  ) {
    this.theme = theme
    this.context = context
    this.maxAmount = maxAmount
    const geom = this.genGeometry()
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(spritesheetImage) },
        uBodyColor: { value: new THREE.Color(this.theme.body) },
        uHeadColor: { value: new THREE.Color(this.theme.head) },
        uMouthColor: { value: new THREE.Color(this.theme.mouth) },
      },
    })

    const instancedPeople = new THREE.InstancedMesh(geom, this.material, this.maxAmount)

    instancedPeople.instanceMatrix.needsUpdate = true

    this.mesh = instancedPeople

    const folder = this.context.gui.addFolder({ title: "People Mesh" })
    folder
      .addInput(this.theme, "body")
      .on("change", ({ value }) => this.material.uniforms.uBodyColor.value.set(value))
    folder
      .addInput(this.theme, "head")
      .on("change", ({ value }) => this.material.uniforms.uHeadColor.value.set(value))
    folder
      .addInput(this.theme, "mouth")
      .on("change", ({ value }) => this.material.uniforms.uMouthColor.value.set(value))
  }

  private genGeometry() {
    const origGeometry = new THREE.PlaneGeometry()

    origGeometry.scale(1, 1, 1)

    const geometry = new THREE.InstancedBufferGeometry()

    geometry.instanceCount = this.maxAmount
    Object.keys(origGeometry.attributes).forEach((attributeName) => {
      geometry.attributes[attributeName] = origGeometry.attributes[attributeName]
    })
    geometry.index = origGeometry.index
    const index = new Float32Array(this.maxAmount)
    for (let i = 0; i < this.maxAmount; i++) index[i] = i
    geometry.setAttribute("aIndex", new THREE.InstancedBufferAttribute(index, 1, false))

    // UV offsets
    const uvOffsets = new Float32Array(this.maxAmount * 4)
    for (let index = 0; index < this.maxAmount; index++) {
      uvOffsets[index * 4 + 0] = 0
      uvOffsets[index * 4 + 1] = 0
      uvOffsets[index * 4 + 2] = 0.2
      uvOffsets[index * 4 + 3] = 0.2
    }
    geometry.setAttribute("aUvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    return geometry
  }
}
