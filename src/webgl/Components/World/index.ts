import AbstractObject from "../../Abstract/AbstractObject"
import * as THREE from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import Planet from "../Planet"
import { clamp } from "three/src/math/MathUtils"
import CompanionCube from "../CompanionCube"
import PeopleMesh from "../People/PeopleMesh"
import GrabObject from "../GrabObject"
import PeopleController from "../People/PeopleController"
import DeadController from "../People/DeadController"
import remap from "../../../utils/math/remap"
import SpritesheetParser from "../SpritesheetParser"
import json from "../../../assets/spritesheets/spritesheet.json"
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext"
import planetRepartition from "./planetsRepartition.json"
import tuple from "../../../utils/types/tuple"
import PhysicsController from "../People/PhysicsController"

export default class World extends AbstractObject<MainSceneContext> {
  private tickingObjects: AbstractObjectNoContext[] = []
  private peopleMesh: PeopleMesh
  private planets: Planet[]
  private dead: DeadController[] = []
  private grabObjects: GrabObject[] = []
  private controllerStock: PeopleController[] = []
  private nextIndex = 0
  private spritesheet = new SpritesheetParser(json)

  constructor(context: MainSceneContext) {
    super(context)

    this.setWorld()
  }

  private setWorld() {
    this.output = new THREE.Group()
    const planetTypes = tuple("blue" as const, "green" as const, "purple" as const)
    this.planets = planetRepartition.map((pos) => {
      const size = 75
      const scale = 3
      const newPos = tuple((pos.x - size / 2) * scale, (pos.y - size / 2) * scale, pos.z)
      return new Planet(this.context, {
        position: newPos,
        radius: remap(Math.random(), [0, 1], [1.5, 3]),
        type: planetTypes[Math.floor(Math.random() * planetTypes.length)],
        lifeSpan: remap(Math.random(), [0, 1], [10, 30]),
        onPlanetDie: () => console.log("slt"),
        onPeopleDie: this.handleDeadFromPlanet,
        onSpawn: this.handleSpawn,
      })
    })
    this.context.sceneState.currentPlanet = this.planets[0]

    for (const planet of this.planets) {
      this.output.add(planet.output)
    }

    this.peopleMesh = new PeopleMesh(1000, this.context)

    const startAmount = 5
    this.peopleMesh.mesh.count = startAmount

    for (let index = 0; index < startAmount; index++) {
      this.context.sceneState.currentPlanet.addPeopleController(this.queryController(), Math.PI * 2 * Math.random())
    }
    this.output.add(this.peopleMesh.mesh)

    const grabObject = new GrabObject(
      this.context,
      this.context.sceneState.currentPlanet,
      70,
      (planet: Planet, physicsController: PhysicsController) => {
        planet.addPeopleController(physicsController.peopleController, 0)
        this.context.sceneState.currentPlanet = planet
      }
    )
    this.grabObjects.push(grabObject)
    this.tickingObjects.push(grabObject)
    this.output.add(grabObject.output)

    this.setEvents()
  }

  private queryController() {
    if (this.controllerStock.length === 0) {
      const controller = new PeopleController(
        this.nextIndex,
        this.peopleMesh.mesh,
        this.spritesheet,
      )
      this.peopleMesh.mesh.count++
      this.nextIndex++
        ; (window as any).i = this.nextIndex
      return controller
    }
    return this.controllerStock.pop()!
  }

  private handleDeadFromPlanet = (
    controller: PeopleController,
    { rotation }: { rotation: number },
  ) => {
    const speed = remap(Math.random(), [0, 1], [0.01, 0.02])
    const finalRotation = remap(Math.random(), [0, 1], [-0.01, 0.01]) + rotation
    this.dead.push(
      new DeadController(controller, {
        speed: [Math.cos(finalRotation) * speed, Math.sin(finalRotation) * speed, 0],
        context: this.context,
        removeCb: this.handleDeadRemoval,
      }),
    )
  }

  private handleDeadRemoval = (controller: DeadController) => {
    const peopleController = controller.peopleController
    peopleController.updatePeople((o) => o.position.set(-1000, -1000, -1000))
    const index = this.dead.indexOf(controller)
    if (index > -1) this.dead.splice(index, 1)
    return this.controllerStock.push(peopleController)
  }

  private handleSpawn = (planet: Planet, { rotation }: { rotation: number }) => {
    planet.addPeopleController(
      this.queryController(),
      rotation + Math.sign(Math.random() - 0.5) * 0.1,
    )
  }

  // EVENTS
  // Au click :
  // Choper la planete plus proche [not used]
  // Choper les people controllers a un certain angle grace à peopleData [not used]
  // Set les people controllers du grabobject [x]
  // Remove les people controllers de la planete [x]
  // Activer les grabobject [x]
  private onMouseDown = () => {
    const planet = this.planets[0]
    const controllers = Array.from(planet.peopleData.keys())

    for (const controller of controllers) {
      planet.removePeopleController(controller)
    }

    this.grabObjects[0].setPhysicalPeopleControllers(controllers, this.planets)
  }

  private onMouseUp = () => {
    this.grabObjects[0].repulsePhysicalPeopleControllers()
  }

  setEvents() {
    window.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)

    this.toUnbind(() => {
      window.removeEventListener("mousedown", this.onMouseDown)
      window.removeEventListener("mouseup", this.onMouseUp)
    })
  }

  public tick(...params: Parameters<AbstractObject["tick"]>) {
    // const m = new THREE.Matrix4()
    // this.peopleMesh.mesh.getMatrixAt(1, m)
    // console.log(m.toArray())
    for (const obj of this.tickingObjects) {
      obj.tick(...params)
    }
    for (const planet of this.planets) {
      planet.tick(...params)
    }
    for (const dead of this.dead) {
      dead.tick(...params)
    }
    for (const grabObject of this.grabObjects) {
      for (const peopleController of grabObject.peopleControllerTuples) {
        const physicsObject = peopleController[1]
        physicsObject.tick(...params)
      }
      grabObject.tick()
    }
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
  }
}