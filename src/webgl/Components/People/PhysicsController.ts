import PeopleController from "./PeopleController";
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext";
import { Object3D, Vector3 } from "three";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import GrabObject from "../GrabObject";
import tuple from "../../../utils/types/tuple";

type PhysicsState = "ATTRACTING" | "REPULSING"

const temporaryVectors = {
  empty: new Vector3(),
  target: new Vector3(),
}

export default class PhysicsController extends PhysicsObject {
  private planets: Planet[]
  public peopleController: PeopleController
  private grabObject: GrabObject
  public releasedCursorPosition = new Vector3()
  private state: PhysicsState = "ATTRACTING"
  private onLanding: Function

  constructor(peopleController: PeopleController, planets: Planet[], grabObject: GrabObject, onLanding: Function, mass = 1) {
    super(mass)
    this.peopleController = peopleController
    this.planets = planets
    this.grabObject = grabObject
    this.onLanding = onLanding
    this.output = new Object3D()
    this.output.position.copy(peopleController.object.position)
    this.velocity.copy(peopleController.object.position)
  }

  private repulse(origin: Vector3, target: Vector3) {
    temporaryVectors.target.copy(origin)
    temporaryVectors.target.sub(target)
    const distance = temporaryVectors.target.length()
    temporaryVectors.target.normalize()
    temporaryVectors.target.multiplyScalar(1 / distance)
    return temporaryVectors.target
  }

  private follow(origin: Vector3, target: Vector3) {
    temporaryVectors.target.copy(target)
    temporaryVectors.target.sub(origin)
    const distance = temporaryVectors.target.length()
    temporaryVectors.target.normalize()
    temporaryVectors.target.multiplyScalar(distance)
    return temporaryVectors.target
  }

  private getClosestPlanetIndex() {
    const distancesTuples = this.planets.map((planet, i) => tuple(i, this.output.position.distanceTo(planet.output.position)))

    let closestIndex = distancesTuples[0][0]
    let closestDistance = distancesTuples[0][1]

    for (const tuple of distancesTuples) {
      if (tuple[1] < closestDistance) {
        closestIndex = tuple[0]
        closestDistance = tuple[1]
      }
    }

    return closestIndex
  }

  public setReleasedCursorPosition(position: Vector3) {
    this.releasedCursorPosition.copy(position)
  }

  public setState(newState: PhysicsState) {
    this.state = newState
  }

  public tick(time: number, delta: number) {
    this.peopleController.updatePeople((object) => {
      switch (this.state) {
        case "ATTRACTING":
          {
            const attraction = this.follow(this.output.position, this.grabObject.output.position)
            attraction.multiplyScalar(0.05)
            this.forces.set("attraction", attraction)
          }
          break;

        case "REPULSING":
          {
            const [attractToPlanet, stop] = this.attractToPlanet(this.planets[this.getClosestPlanetIndex()], this.output.position)

            if (stop) {
              this.onLanding(this.planets[this.getClosestPlanetIndex()], this)
              return
            }

            this.forces.set("attractToPlater", attractToPlanet)
            const repulsion = this.repulse(this.output.position, this.releasedCursorPosition)
            this.forces.set("repulsion", repulsion)
          }
          break;

        default:
          break;
      }

      this.tickPhysics()
      this.output.position.copy(this.velocity)
      object.position.copy(this.output.position)
    })
  }
}