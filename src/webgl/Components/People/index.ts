import * as THREE from "three"
import tuple from "../../../utils/types/tuple"
import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
// import peopleImage from "../../../assets/images/perso.png"
import json from "../../../assets/spritesheets/spritesheet.json"
import SpritesheetParser from "../SpritesheetParser"
import Planet from "../Planet"
import PeopleController from "./PeopleController"
import CursorController from "./CursorController"
import Animator from "../Animator"
import PeopleMesh from "./PeopleMesh"

export default class People extends AbstractObject<MainSceneContext> {
  private amount: number
  private planetMap: Map<Planet, PeopleController[]> = new Map()
  private spritesheet: SpritesheetParser
  private cursorPeoples: PeopleController[] = []
  private cursor: CursorController
  private peopleMesh: PeopleMesh
  private animators: Animator[] = []

  constructor(context: MainSceneContext, startPlanet: Planet) {
    super(context)
    this.spritesheet = new SpritesheetParser(json)

    this.initMesh(10, startPlanet)

    for (const animator of this.animators) {
      animator.setAnimation("walk")
    }
  }

  private initMesh(startAmount: number, startPlanet: Planet) {
    this.amount = startAmount
    this.peopleMesh = new PeopleMesh(1_000, this.context)
    this.peopleMesh.mesh.count = this.amount

    const controllers: PeopleController[] = []
    for (let index = 0; index < this.amount; index++) {
      const controller = new PeopleController(
        { rotation: Math.random() * Math.PI * 2, tilt: Math.random() - 0.5 },
        index,
      )
      this.animators.push(new Animator(5))

      controllers.push(controller)
    }
    this.planetMap.set(startPlanet, controllers)
    this.output = this.peopleMesh.mesh
    // this.output = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial())
  }

  tick() {
    for (const [planet, peoples] of this.planetMap.entries()) {
      for (const people of peoples) {
        people.collideOnPlanet(peoples)
      }
      for (const people of peoples) {
        people.setPositionOnPlanet(planet, this.peopleMesh.mesh)
      }
    }
    for (let index = 0; index < this.animators.length; index++) {
      const animator = this.animators[index]
      animator.tick()
      const frame = animator.getFrame()
      const offset = this.spritesheet.getByName(frame)

      this.peopleMesh.mesh.geometry.attributes["aUvOffset"].setXYZW(
        index,
        offset.x,
        offset.y,
        offset.z,
        offset.w,
      )
      this.peopleMesh.mesh.geometry.attributes["aUvOffset"].needsUpdate = true
    }
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
  }
}
