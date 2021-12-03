import PeopleController from "./PeopleController";
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext";
import { Object3D, Vector3 } from "three";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import GrabObject, { OnDeath, OnLanding } from "../GrabObject";
import tuple from "../../../utils/types/tuple";
import remap from "../../../utils/math/remap";
import getViewport, { Viewport } from "../../../utils/webgl/viewport";

type PhysicsState = "ATTRACTING" | "REPULSING"

const temporaryVectors = {
  empty: new Vector3(),
  target: new Vector3(),
}

export default class PhysicsController extends PhysicsObject {
  public index: number
  private currentPlanet: Planet
  private planets: Planet[]
  public peopleController: PeopleController
  public grabObject: GrabObject
  public releasedCursorPosition = new Vector3()
  private state: PhysicsState = "ATTRACTING"
  private onLanding: OnLanding
  private onDeath: OnDeath
  private hasLanded = false
  private repulsedBeginningPosition = new Vector3()
  private lifespanLength : number

  constructor(index: number, peopleController: PeopleController, currentPlanet: Planet, planets: Planet[], grabObject: GrabObject, viewport: Viewport, onLanding: OnLanding, onDeath: OnDeath, mass = 1) {
    super(mass)
    this.index = index
    this.currentPlanet = currentPlanet
    this.peopleController = peopleController
    this.planets = planets
    this.grabObject = grabObject
    this.onLanding = onLanding
    this.onDeath = onDeath

    this.lifespanLength = remap(Math.random(), [0, 1], [2, viewport.width/ 3])

    this.output = new Object3D()
    this.output.position.copy(peopleController.object.position)
    this.velocity.copy(peopleController.object.position)
  }

  private repulse(origin: Vector3, target: Vector3) {
    temporaryVectors.target.copy(origin)
    temporaryVectors.target.sub(target)
    const distance = temporaryVectors.target.length()
    temporaryVectors.target.normalize()
    temporaryVectors.target.multiplyScalar(distance)
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
    const distancesTuples = this.planets.filter((planet) => !planet.isDead).map((planet, i) => tuple(i, this.output.position.distanceTo(planet.output.position)))

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
    if(newState === "REPULSING") this.repulsedBeginningPosition.copy(this.grabObject.output.position)
  }

  public tick(time: number, delta: number) {
    if(this.hasLanded) return //TODO: hlep

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
            const [attractToPlanetForce, stop] = this.attractToPlanet(this.planets[this.getClosestPlanetIndex()], this.output.position)

            if (stop) {
              this.onLanding(this.currentPlanet, this.planets[this.getClosestPlanetIndex()], this, this.grabObject)
              this.hasLanded = true
              return
            }

            const distanceFromBeginning = this.output.position.distanceTo(this.repulsedBeginningPosition)
            if(distanceFromBeginning > this.lifespanLength) this.onDeath(this)

            this.forces.set("attractToPlanet", attractToPlanetForce)
            const repulsion = this.repulse(this.output.position, this.releasedCursorPosition)
            repulsion.multiplyScalar(0.01)
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