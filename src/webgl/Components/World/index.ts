import AbstractObject from "../../Abstract/AbstractObject"
import * as THREE from "three"
import { MainSceneContext } from "../../Scenes/MainScene"
import Planet from "../Planet"
import { clamp } from "three/src/math/MathUtils"
import CompanionCube from "../CompanionCube"
import PeopleMesh from "../People/PeopleMesh"
import PeopleController from "../People/PeopleController"

export default class World extends AbstractObject<MainSceneContext> {
  private tickingObjects: AbstractObject[] = []
  private peopleMesh: PeopleMesh
  private planets: Planet[]

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
        tint: "#00ff00",
        lifeSpan: 10,
        onPlanetDie: () => console.log("slt"),
      }),
      new Planet(this.context, {
        position: [
          clamp(Math.random() * 9, 7, 9) * Math.sin(Math.random() * Math.PI * 2),
          clamp(Math.random() * 9, 7, 9) * Math.cos(Math.random() * Math.PI * 2),
          0,
        ],
        radius: clamp(Math.random() * 3, 1, 3),
        tint: "#f40000",
        lifeSpan: 10,
      }),
    ]
    this.tickingObjects.push(...this.planets)
    for (const planet of this.planets) {
      this.output.add(planet.output)
    }

    this.peopleMesh = new PeopleMesh(1000, this.context)

    const startAmount = 20
    this.peopleMesh.mesh.count = startAmount

    for (let index = 0; index < startAmount; index++) {
      this.planets[0].addPeopleController(
        new PeopleController(index, this.peopleMesh.mesh, {
          planetRotation: Math.PI * 2 * Math.random(),
        }),
      )
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
  }

  public tick(...params: Parameters<AbstractObject["tick"]>) {
    for (const obj of this.tickingObjects) {
      obj.tick(...params)
    }
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
  }
}
