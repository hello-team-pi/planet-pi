import PeopleController from "./PeopleController";
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext";
import { Object3D, Vector3 } from "three";
import PhysicsObject from "../PhysicsObject";
import Planet from "../Planet";
import tuple from "../../../utils/types/tuple";
import remap from "../../../utils/math/remap";
import planetsRepartition from "../World/planetsRepartition.json"
import getViewport, { Viewport } from "../../../utils/webgl/viewport";

type PhysicsState = "DISABLED" | "ATTRACTING" | "REPULSING"

const temporaryVectors = {
  empty: new Vector3(),
  target: new Vector3(),
}

export default class PhysicsController extends PhysicsObject {
  public index: number
  public peopleController: PeopleController
  public target = new Object3D()
  public releasedCursorPosition = new Vector3()

  private positions: Vector3[]
  private currentPlanet: Planet | null
  private state: PhysicsState = "DISABLED"
  private repulsedBeginningPosition = new Vector3()
  private lifespanLength : number

  constructor(index: number, peopleController: PeopleController, currentPlanet: Planet | null, mass = 1) {
    super(mass)
    this.index = index
    this.currentPlanet = currentPlanet
    this.peopleController = peopleController

    this.lifespanLength = remap(Math.random(), [0, 1], [2, 4])

    this.positions = planetsRepartition.map((pos)=>{
      const size = 75
      const scale = 3
      return new Vector3((pos.x - size / 2) * scale, (pos.y - size / 2) * scale, pos.z)
    })

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
    // const aliveAndFarPlanets = this.planets.filter((planet) => !planet.isDead && planet !== this.currentPlanet)
    const distancesTuples = this.positions.map((position, i) => tuple(i, this.output.position.distanceTo(position)))

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
    if(newState === "REPULSING") this.repulsedBeginningPosition.copy(this.target.position)
  }

  setCurrentPlanet(planet: Planet){
    this.currentPlanet = planet
  }

  public tick() {
    ;(window as any).debug = this.state

    if(this.state === 'DISABLED') return //TODO: hlep
    
    switch (this.state) {
      case "ATTRACTING":
        {
          const attraction = this.follow(this.output.position, this.target.position)
          attraction.multiplyScalar(0.05)
          this.forces.set("attraction", attraction)
        }
        break;

      // case "REPULSING":
      //   {
      //     const closestPlanet = this.planets[this.getClosestPlanetIndex()]
      //     const [attractToPlanetForce, stop] = this.attractToPlanet(closestPlanet, this.output.position)

      //     if (stop && !closestPlanet.isDead && closestPlanet !== this.currentPlanet) {              
      //       // this.onLanding(this.currentPlanet, this.planets[this.getClosestPlanetIndex()], this, this.grabObject)
      //       this.hasLanded = true
      //       return
      //     }

      //     const distanceFromBeginning = this.output.position.distanceTo(this.repulsedBeginningPosition)
      //     if(distanceFromBeginning > this.lifespanLength) this.peopleController.onDeath(this)

      //     if(!closestPlanet.isDead && closestPlanet !== this.currentPlanet) this.forces.set("attractToPlanet", attractToPlanetForce)
      //     const repulsion = this.repulse(this.output.position, this.releasedCursorPosition)
      //     repulsion.multiplyScalar(0.01)
      //     this.forces.set("repulsion", repulsion)
      //   }
      //   break;

      default:
        break;
    }

    this.tickPhysics()
    this.output.position.copy(this.velocity)
    this.peopleController.object.position.copy(this.output.position)

  }
}