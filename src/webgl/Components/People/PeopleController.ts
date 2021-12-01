import * as THREE from "three"
import cremap from "../../../utils/math/cremap"
import Easing from "easing-functions"

type Planet = { radius: number; position: THREE.Vector3 }

type PeopleState = "alive" | "dead" | "projected" | "onPlanet"

type PeopleData = {
  planetRotation: number
}

const DEFAULT_DATA: PeopleData = {
  planetRotation: 0,
}

export default class PeopleController {
  private object: THREE.Object3D
  private mesh: THREE.InstancedMesh
  private index: number

  public data: PeopleData

  // public planetPosition: {
  //   rotation: number
  //   tilt: number
  // }
  // private nextPlanetPosition: {
  //   rotation: number
  //   tilt: number
  // }
  // private data: {
  //   planetState: {
  //     rotation: number
  //     tilt: number
  //   }
  //   deadState: {
  //     velocity: THREE.Vector2Tuple
  //     position: THREE.Vector2Tuple
  //   }
  //   projectedState: {
  //     lifespan: number
  //   }
  // }

  constructor(
    index: number,
    mesh: THREE.InstancedMesh,
    defaultData: PeopleData = { ...DEFAULT_DATA },
  ) {
    this.index = index
    this.mesh = mesh
    this.object = new THREE.Object3D()
    this.data = defaultData
    // this.planetPosition = { ...startPlanetPos }
    // this.nextPlanetPosition = { ...this.planetPosition }
  }

  public updatePeople(transform: (object: THREE.Object3D, data: PeopleController["data"]) => void) {
    transform(this.object, this.data)
    this.object.updateMatrix()
    this.mesh.setMatrixAt(this.index, this.object.matrix)
  }
}
