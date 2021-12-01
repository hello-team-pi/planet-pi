import { Vector3 } from "three";
import { WebGLAppContext } from "../..";
import AbstractObject from "../../Abstract/AbstractObject";
import Planet from "../Planet";

// https://natureofcode.com/book/chapter-2-forces/

// For ticking performance reasons
const temporaryVectors = {
  attraction: new Vector3(),
  force: new Vector3()
}

export default abstract class PhysicsObject extends AbstractObject {
  mass: number
  forces: Vector3[]
  acceleration: Vector3
  velocity: Vector3

  constructor(context: WebGLAppContext, mass: number) {
    super(context)

    this.mass = mass
    this.forces = []
    this.acceleration = new Vector3()
    this.velocity = new Vector3()
  }

  attract(origin: Planet, target: Vector3, targetMass = 2, G = 0.4) {
    temporaryVectors.attraction.setScalar(1)

    temporaryVectors.attraction.subVectors(origin.position, target)
    const distance = temporaryVectors.attraction.length()

    temporaryVectors.attraction.normalize()

    const strength = (G * this.mass * targetMass) / (distance * distance);
    temporaryVectors.attraction.multiplyScalar(strength);

    if (distance <= origin.radius) temporaryVectors.attraction.negate()

    return temporaryVectors.attraction;
  }

  addForce(force: Vector3) {
    temporaryVectors.force.copy(force)
    temporaryVectors.force.divideScalar(this.mass)
    this.acceleration.add(temporaryVectors.force)
  }

  tickPhysics() {
    for (const force of this.forces) {
      this.addForce(force)
    }
    this.forces = []
    this.velocity.add(this.acceleration)
    this.acceleration.setScalar(0)
  }
}