import * as THREE from "three"
import cremap from "../../../utils/math/cremap"
import Easing from "easing-functions"

type Planet = { radius: number; position: THREE.Vector3 }

type PeopleState = "alive" | "dead" | "projected" | "onPlanet"

export default class PeopleController {
  private object: THREE.Object3D
  private mesh: THREE.InstancedMesh
  private index: number

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

  constructor(index: number, mesh: THREE.InstancedMesh) {
    this.index = index
    this.mesh = mesh
    this.object = new THREE.Object3D()
    // this.planetPosition = { ...startPlanetPos }
    // this.nextPlanetPosition = { ...this.planetPosition }
  }

  public updatePeople(transform: (object: THREE.Object3D) => void) {
    transform(this.object)
    this.object.updateMatrix()
    this.mesh.setMatrixAt(this.index, this.object.matrix)
  }
}
