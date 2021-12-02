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

export default class World extends AbstractObject<MainSceneContext> {
  private tickingObjects: AbstractObject[] = []
  private peopleMesh: PeopleMesh
  private planets: Planet[]
  private dead: DeadController[] = []
  private controllerStock: PeopleController[] = []
  private nextIndex = 0
  private spritesheet = new SpritesheetParser(json)

  constructor(context: MainSceneContext) {
    super(context)

    this.setWorld()
  }

  private setWorld() {
    this.output = new THREE.Group()
    this.planets = [
      new Planet(this.context, {
        position: [0, 0, 0],
        radius: 2,
        type: "blue",
        lifeSpan: 15,
        onPlanetDie: () => console.log("slt"),
        onPeopleDie: this.handleDeadFromPlanet,
        onSpawn: this.handleSpawn,
      }),
      new Planet(this.context, {
        position: [
          clamp(Math.random() * 9, 7, 9) * Math.sin(Math.random() * Math.PI * 2),
          clamp(Math.random() * 9, 7, 9) * Math.cos(Math.random() * Math.PI * 2),
          0,
        ],
        type: "green",
        radius: clamp(Math.random() * 3, 1, 3),
        lifeSpan: 10,
      }),
    ]
    for (const planet of this.planets) {
      this.output.add(planet.output)
    }

    this.peopleMesh = new PeopleMesh(1000, this.context)

    const startAmount = 5
    this.peopleMesh.mesh.count = startAmount

    for (let index = 0; index < startAmount; index++) {
      this.planets[0].addPeopleController(this.queryController(), Math.PI * 2 * Math.random())
    }
    this.output.add(this.peopleMesh.mesh)

    const companions = [
      new CompanionCube(this.context, this.planets[0], this.planets[1], 70),
      new CompanionCube(this.context, this.planets[0], this.planets[1], 100),
      new CompanionCube(this.context, this.planets[0], this.planets[1], 50),
      new CompanionCube(this.context, this.planets[0], this.planets[1], 130),
    ]
    for (const companion of companions) {
      this.tickingObjects.push(companion)
      this.output.add(companion.output)
    }

    const grabObject = new GrabObject(
      this.context,
      this.planets[0],
      this.planets[1],
      companions,
      70,
    )
    this.tickingObjects.push(grabObject)
    this.output.add(grabObject.output)
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
      ;(window as any).i = this.nextIndex
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
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
  }
}
