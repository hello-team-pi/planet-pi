import * as THREE from "three"
import tuple from "../../utils/types/tuple"
import AbstractObject from "../abstract/AbstractObject"
import { MainSceneContext } from "../Scenes/MainScene"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import peopleImage from "../../assets/images/perso.png"

export default class People extends AbstractObject<MainSceneContext> {
  private positions: THREE.Vector3Tuple[]
  private amount: number
  private maxAmount = 20_000
  private material: THREE.RawShaderMaterial

  constructor(context: MainSceneContext) {
    super(context)
    this.initPositions(1_000)
    this.initMesh()
  }

  private initPositions(startAmount: number) {
    this.amount = startAmount
    this.positions = new Array(this.amount)
    const radius = 10
    const center = tuple(0, 0)

    for (let i = 0; i < this.amount; i++) {
      const r = radius * Math.sqrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      this.positions[i] = [Math.sin(theta) * r + center[0], 0, Math.cos(theta) * r + center[1]]
    }
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

    const offsets = new Float32Array(this.maxAmount * 3)

    const radius = 10
    const center = tuple(0, 0)

    for (let index = 0; index < this.maxAmount; index++) {
      const r = radius * Math.sqrt(Math.random())
      const theta = Math.random() * Math.PI * 2

      offsets[index * 3 + 0] = Math.sin(theta) * r + center[0]
      offsets[index * 3 + 1] = 0
      offsets[index * 3 + 2] = Math.cos(theta) * r + center[1]
    }
    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3))

    return geometry
  }

  private initMesh() {
    const geom = this.genGeometry()
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(peopleImage) },
      },
      // side: THREE.DoubleSide,
    })

    const particles = new THREE.InstancedMesh(geom, this.material, this.maxAmount)
    particles.count = this.amount

    particles.setMatrixAt(0, new THREE.Object3D().matrix)

    this.output = particles
    // this.output = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshNormalMaterial())
  }
}
