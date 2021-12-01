import * as THREE from "three"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import spritesheetImage from "../../../../assets/spritesheets/spritesheet.png"

export default class PeopleMesh {
  private maxAmount: number
  private material: THREE.ShaderMaterial
  public mesh: THREE.InstancedMesh

  constructor(maxAmount: number) {
    this.maxAmount = maxAmount
    const geom = this.genGeometry()
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(spritesheetImage) },
      },
    })

    const instancedPeople = new THREE.InstancedMesh(geom, this.material, this.maxAmount)

    instancedPeople.instanceMatrix.needsUpdate = true

    this.mesh = instancedPeople
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
    const uvOffsets = new Float32Array(new Array(this.maxAmount * 4).fill(0))
    geometry.setAttribute("aUvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    return geometry
  }
}
