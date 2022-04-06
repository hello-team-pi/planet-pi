import AbstractObject from "../../Abstract/AbstractObject"
import * as THREE from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import Planet from "../Planet"
import { clamp } from "three/src/math/MathUtils"
import PeopleMesh from "../People/PeopleMesh"
import GrabObject, { OnDeath, OnLanding } from "../GrabObject"
import PeopleController from "../People/PeopleController"
import DeadController from "../People/DeadController"
import remap from "../../../utils/math/remap"
import SpritesheetParser from "../SpritesheetParser"
import json from "../../../assets/spritesheets/spritesheet.json"
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext"
import planetRepartition from "./planetsRepartition.json"
import tuple from "../../../utils/types/tuple"

export default class World extends AbstractObject<MainSceneContext> {
  private tickingObjects: AbstractObjectNoContext[] = []
  private peopleMesh: PeopleMesh
  private planets: Planet[]
  private dead: DeadController[] = []
  private grabObjects: GrabObject[] = []
  private controllerStock: PeopleController[] = []
  private nextIndex = 0
  private spritesheet = new SpritesheetParser(json)
  private activeGrabObjectIndex = 0 //TODO: hlep

  constructor(context: MainSceneContext) {
    super(context)

    this.setWorld()
  }

  public getAliveNumber() {
    let alive = 0
    for (const planet of this.planets) {
      alive += planet.peopleAmount
    }
    for (const [controller] of this.grabObjects[this.activeGrabObjectIndex]
      .peopleControllerTuples) {
      if (controller) alive++
    }

    return alive
  }

  private setWorld = () => {
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
        lifeSpan: remap(Math.random(), [0, 1], [4, 7]),
        onPlanetDie: () => {
          this.context.globalState.deadPlanet++
          const alive = this.getAliveNumber()
          if (alive === 0)
            setTimeout(() => {
              this.context.globalState.step = "end"
            }, 800)
        },
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
      this.context.sceneState.currentPlanet.addPeopleController(
        this.queryController(),
        Math.PI * 2 * Math.random(),
      )
    }
    this.output.add(this.peopleMesh.mesh)

    const onProjectionDeath: OnDeath = (physicsController) => {
      physicsController.grabObject.removePeopleControllerTuple(physicsController.index)

      this.handleDeadFromPlanet(physicsController.peopleController, {
        rotation: Math.random() * Math.PI * 2,
      })

      const alive = this.getAliveNumber()

      if (alive === 0)
        setTimeout(() => {
          this.context.globalState.step = "end"
        }, 800)
    }

    const onLanding: OnLanding = (previousPlanet, landedPlanet, physicsController, grabObject) => {
      landedPlanet.addPeopleController(
        physicsController.peopleController,
        Math.random() * Math.PI * 2,
      )
      grabObject.removePeopleControllerTuple(physicsController.index)

      if (this.context.sceneState.currentPlanet !== landedPlanet) {
        // /TODO: hlep
        // First one has landed

        const newGrabObject = new GrabObject(
          this.context,
          landedPlanet,
          remap(Math.random(), [0, 1], [15, 105]),
          onLanding,
          onProjectionDeath,
        )
        this.grabObjects.push(newGrabObject)
        this.tickingObjects.push(newGrabObject)
        this.output.add(newGrabObject.output)
        this.activeGrabObjectIndex++

        this.context.sceneState.currentPlanet = landedPlanet

        this.context.sounds.propulsionImpact.play()
        this.context.sounds.propulsionImpact.rate(remap(Math.random(), [0, 1], [0.5, 3]))
      }
    }
    const grabObject = new GrabObject(
      this.context,
      this.context.sceneState.currentPlanet,
      remap(Math.random(), [0, 1], [15, 105]),
      onLanding,
      onProjectionDeath,
    )

    this.grabObjects.push(grabObject)
    this.tickingObjects.push(grabObject)
    this.output.add(grabObject.output)
    // this.context.globalState.__onChange("isIntro", () => this.setEvents())
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
      ;(window as any).i = this.nextIndex
      return controller
    }
    return this.controllerStock.pop()!
  }

  private handleDeadFromPlanet = (
    controller: PeopleController,
    { rotation }: { rotation: number },
  ) => {
    this.context.globalState.deadPeople++
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
    peopleController.updatePeople((o) => void o.position.set(-1000, -1000, -1000))
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
    const planet = this.context.sceneState.currentPlanet!
    const controllers = Array.from(planet.peopleData.keys())

    this.context.sounds.propulsionLoop.play()
    this.context.sounds.propulsionLoop.loop()

    for (const controller of controllers) {
      planet.removePeopleController(controller)
    }

    this.grabObjects[this.activeGrabObjectIndex].setPhysicalPeopleControllers(
      controllers,
      this.planets,
    )
  }

  private onMouseUp = () => {
    this.context.sounds.propulsionLoop.stop()
    this.context.sounds.launch.play()
    this.context.sounds.launch.rate(remap(Math.random(), [0, 1], [0.5, 3]))

    this.grabObjects[this.activeGrabObjectIndex].repulsePhysicalPeopleControllers()
    this.grabObjects[this.activeGrabObjectIndex].disappear()
  }

  setEvents() {
    this.context.renderer.domElement.addEventListener("pointerdown", this.onMouseDown)
    window.addEventListener("pointerup", this.onMouseUp)

    this.toUnbind(() => {
      this.context.renderer.domElement.removeEventListener("pointerdown", this.onMouseDown)
      window.removeEventListener("pointerup", this.onMouseUp)
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
        if (!peopleController[0]) continue //TODO: hlep
        const physicsObject = peopleController[1]
        physicsObject.tick(...params)
      }
      grabObject.tick()
    }
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
    this.peopleMesh.mesh.geometry.attributes["aIsDead"].needsUpdate = true
  }
}
