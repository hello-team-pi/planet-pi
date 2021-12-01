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

  private data: PeopleData

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

// collideOnPlanet(otherPeople: PeopleController[]) {
//   // TODO : Increase Perf
//   let value = 0
//   for (const people of otherPeople) {
//     const diff = this.planetPosition.rotation - people.planetPosition.rotation
//     const factor = Easing.Exponential.Out(cremap(Math.abs(diff), [0, 0.2], [1, 0]))
//     value += Math.sign(diff) * factor
//   }
//   for (const people of otherPeople) {
//     const compareRotation =
//       this.planetPosition.rotation > people.planetPosition.rotation
//         ? people.planetPosition.rotation + Math.PI * 2
//         : people.planetPosition.rotation - Math.PI * 2
//     const diff = this.planetPosition.rotation - compareRotation
//     const factor = Easing.Exponential.Out(cremap(Math.abs(diff), [0, 0.2], [1, 0]))
//     value += Math.sign(diff) * factor
//   }
//   const clampValue = Math.sign(value) * (Math.abs(value) > 0.2 ? 2 : 0)
//   let newRotation = this.planetPosition.rotation + clampValue * 0.005
//   if (newRotation > Math.PI * 2) newRotation -= Math.PI * 2
//   if (newRotation < 0) newRotation += Math.PI * 2
//   this.nextPlanetPosition.rotation = newRotation
// }

// setPositionOnPlanet(planet: Planet, mesh: THREE.InstancedMesh) {
//   this.planetPosition.rotation = this.nextPlanetPosition.rotation
//   const radius = planet.radius + 0.4

//   this.object.position.set(
//     planet.position.x + Math.cos(this.planetPosition.rotation) * radius,
//     planet.position.y + Math.sin(this.planetPosition.rotation) * radius,
//     planet.position.z,
//   )

//   const q = new THREE.Quaternion()
//   q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.planetPosition.tilt)
//   this.object.quaternion.setFromAxisAngle(
//     new THREE.Vector3(0, 0, 1),
//     this.planetPosition.rotation - Math.PI / 2,
//   )
//   this.object.quaternion.multiply(q)
//   this.object.updateMatrix()
//   mesh.setMatrixAt(this.index, this.object.matrix)
// }
