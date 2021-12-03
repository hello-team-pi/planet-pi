import * as THREE from "three"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import spritesheetImage from "../../../../assets/spritesheets/spritesheet.png"
import { MainSceneContext } from "../../../Scenes/MainScene"
import remap from "../../../../utils/math/remap"

type PeopleColors = {
  head: string
  body: string
  mouth: string
  dead: string
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
    theme: PeopleColors = { body: "#ebebeb", head: "#d9d9d9", mouth: "#373431", dead: "#b5e7ff" },
  ) {
    this.theme = theme
    this.context = context
    this.maxAmount = maxAmount
    const geom = this.genGeometry()
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: this.context.assets.peopleSpritesheet },
        uBodyColor: { value: new THREE.Color(this.theme.body) },
        uHeadColor: { value: new THREE.Color(this.theme.head) },
        uMouthColor: { value: new THREE.Color(this.theme.mouth) },
        uDeadColor: { value: new THREE.Color(this.theme.dead) },
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
    folder
      .addInput(this.theme, "dead")
      .on("change", ({ value }) => this.material.uniforms.uDeadColor.value.set(value))
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
    const isDead = new Float32Array(new Array(this.maxAmount).fill(0))
    geometry.setAttribute("aIsDead", new THREE.InstancedBufferAttribute(isDead, 1, false))

    // UV offsets
    const uvOffsets = new Float32Array(this.maxAmount * 4)
    for (let index = 0; index < this.maxAmount; index++) {
      uvOffsets[index * 4 + 0] = 0
      uvOffsets[index * 4 + 1] = 0
      uvOffsets[index * 4 + 2] = 0.2
      uvOffsets[index * 4 + 3] = 0.2
    }
    geometry.setAttribute("aUvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))

    const rotationMatrices = new Float32Array(this.maxAmount * 16)
    const obj = new THREE.Object3D()
    for (let index = 0; index < this.maxAmount; index++) {
      obj.rotation.y = remap(Math.random(), [0, 1], [-0.6, 0.6])
      obj.updateMatrix()
      const arr = obj.matrix.toArray()
      rotationMatrices[index * 16 + 0] = arr[0]
      rotationMatrices[index * 16 + 1] = arr[1]
      rotationMatrices[index * 16 + 2] = arr[2]
      rotationMatrices[index * 16 + 3] = arr[3]
      rotationMatrices[index * 16 + 4] = arr[4]
      rotationMatrices[index * 16 + 5] = arr[5]
      rotationMatrices[index * 16 + 6] = arr[6]
      rotationMatrices[index * 16 + 7] = arr[7]
      rotationMatrices[index * 16 + 8] = arr[8]
      rotationMatrices[index * 16 + 9] = arr[9]
      rotationMatrices[index * 16 + 10] = arr[10]
      rotationMatrices[index * 16 + 11] = arr[11]
      rotationMatrices[index * 16 + 12] = arr[12]
      rotationMatrices[index * 16 + 13] = arr[13]
      rotationMatrices[index * 16 + 14] = arr[14]
      rotationMatrices[index * 16 + 15] = arr[15]
    }
    geometry.setAttribute(
      "aRotationMatrix",
      new THREE.InstancedBufferAttribute(rotationMatrices, 16),
    )
    return geometry
  }
}
