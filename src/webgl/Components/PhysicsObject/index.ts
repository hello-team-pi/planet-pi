import { Vector3 } from "three";
import { WebGLAppContext } from "../..";
import tuple from "../../../utils/types/tuple";
import AbstractObject from "../../Abstract/AbstractObject";
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext";
import Planet from "../Planet";

// https://natureofcode.com/book/chapter-2-forces/

// For ticking performance reasons
const temporaryVectors = {
  attraction: new Vector3(),
  force: new Vector3()
}

export default abstract class PhysicsObject extends AbstractObjectNoContext {
  mass: number
  forces: Map<string, Vector3>
  acceleration: Vector3
  velocity: Vector3

  constructor(mass: number) {
    super()
    this.mass = mass
    this.forces = new Map()
    this.acceleration = new Vector3()
    this.velocity = new Vector3()
  }

  // attract(origin: Vector3, target: Vector3, limit = 10, targetMass = 2, G = 0.4) {
  //   temporaryVectors.attraction.setScalar(0)

  //   temporaryVectors.attraction.subVectors(origin, target)
  //   const distance = temporaryVectors.attraction.length()

  //   temporaryVectors.attraction.normalize()

  //   const strength = (G * this.mass * targetMass) / (distance * distance);
  //   temporaryVectors.attraction.multiplyScalar(strength);

  //   return temporaryVectors.attraction
  // }

  attractToPlanet(origin: Planet, target: Vector3, targetMass = 2, G = 0.4) {
    temporaryVectors.attraction.setScalar(1)

    temporaryVectors.attraction.subVectors(origin.position, target)
    const distance = temporaryVectors.attraction.length()

    temporaryVectors.attraction.normalize()

    const strength = (G * this.mass * targetMass) / (distance * distance);
    temporaryVectors.attraction.multiplyScalar(strength);

    if (distance <= origin.radius + 0.3) {
      return tuple(temporaryVectors.attraction, true)
    }

    return tuple(temporaryVectors.attraction, false)
  }

  addForce(force: Vector3) {
    temporaryVectors.force.copy(force)
    temporaryVectors.force.divideScalar(this.mass)
    this.acceleration.add(temporaryVectors.force)
  }

  tickPhysics() {
    for (const force of this.forces.values()) {
      this.addForce(force)
    }
    this.velocity.add(this.acceleration)
    this.acceleration.setScalar(0)
  }
}