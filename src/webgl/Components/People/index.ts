import * as THREE from "three"
import tuple from "../../../utils/types/tuple"
import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import peopleImage from "../../../assets/images/perso.png"
import Planet from "../Planet"
import PeopleController from "./PeopleController"
import CursorController from "./CursorController"

export default class People extends AbstractObject<MainSceneContext> {
  private amount: number
  private maxAmount = 20_000
  private material: THREE.RawShaderMaterial
  private planetMap: Map<Planet, PeopleController[]> = new Map()
  private cursorPeoples: PeopleController[] = []
  private cursor: CursorController
  private mesh: THREE.InstancedMesh

  constructor(context: MainSceneContext, startPlanet: Planet) {
    super(context)
    this.initMesh(50, startPlanet)
  }

  private initMesh(startAmount: number, startPlanet: Planet) {
    this.amount = startAmount
    const geom = this.genGeometry()
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(peopleImage) },
      },
    })

    const instancedPeople = new THREE.InstancedMesh(geom, this.material, this.maxAmount)
    instancedPeople.count = this.amount

    const controllers: PeopleController[] = []
    for (let index = 0; index < this.amount; index++) {
      const controller = new PeopleController(
        { rotation: Math.random() * Math.PI * 2, tilt: Math.random() - 0.5 },
        index,
      )

      controllers.push(controller)
    }
    this.cursorPeoples.push(...controllers)
    // this.planetMap.set(startPlanet, controllers)

    instancedPeople.instanceMatrix.needsUpdate = true

    this.mesh = instancedPeople
    this.output = instancedPeople
    // this.output = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshNormalMaterial())
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

  tick() {
    for (const [planet, peoples] of this.planetMap.entries()) {
      for (const people of peoples) {
        people.collideOnPlanet(peoples)
      }
      for (const people of peoples) {
        people.setPositionOnPlanet(planet, this.mesh)
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }
}
