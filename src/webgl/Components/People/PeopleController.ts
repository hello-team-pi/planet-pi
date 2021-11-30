import * as THREE from "three"
import cremap from "../../../utils/math/cremap"

type Planet = { radius: number; position: THREE.Vector3 }

export default class PeopleController {
  private object: THREE.Object3D
  public planetPosition: {
    rotation: number
    tilt: number
  }
  private nextPlanetPosition: {
    rotation: number
    tilt: number
  }

  constructor(startRotation: number, startTilt: number) {
    this.object = new THREE.Object3D()
    this.planetPosition = {
      rotation: startRotation,
      tilt: startTilt,
    }
    this.nextPlanetPosition = { ...this.planetPosition }
  }

  collide(otherPeople: PeopleController[]) {
    let factors = 0
    let value = 0
    for (const people of otherPeople) {
      const diff = people.planetPosition.rotation - this.planetPosition.rotation
      const factor = cremap(Math.abs(diff), [0, 0.4], [1, 0])
      factors += factor
      value += Math.sign(diff) * factor
    }
    this.nextPlanetPosition.rotation = this.planetPosition.rotation + value
  }

  setPosition(planet: Planet, matrixSetter: (m: THREE.Matrix4) => void) {
    this.planetPosition.rotation = this.nextPlanetPosition.rotation
    this.object.position.set(
      planet.position.x + Math.cos(this.planetPosition.rotation) * planet.radius,
      planet.position.y + Math.sin(this.planetPosition.rotation) * planet.radius,
      planet.position.z,
    )
    this.object.updateMatrix()
    matrixSetter(this.object.matrix)
  }
}
