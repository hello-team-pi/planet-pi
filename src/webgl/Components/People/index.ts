import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import PeopleController from "./PeopleController"
import PeopleMesh from "./PeopleMesh"

export default class People extends AbstractObject<MainSceneContext> {
  private amount: number
  private peopleMesh: PeopleMesh

  constructor(context: MainSceneContext) {
    super(context)
    this.initMesh(10)
  }

  private initMesh(startAmount: number) {
    this.amount = startAmount
    this.peopleMesh = new PeopleMesh(1_000, this.context)
    this.peopleMesh.mesh.count = this.amount

    const controllers: PeopleController[] = []
    for (let index = 0; index < this.amount; index++) {
      controllers.push(
        new PeopleController(index, this.peopleMesh.mesh, { planetRotation: Math.PI * 2 }),
      )
    }
  }

  tick() {
    this.peopleMesh.mesh.instanceMatrix.needsUpdate = true
  }
}

// for (let index = 0; index < this.animators.length; index++) {
//   const animator = this.animators[index]
//   animator.tick()
//   const frame = animator.getFrame()
//   const offset = this.spritesheet.getByName(frame)

//   this.peopleMesh.mesh.geometry.attributes["aUvOffset"].setXYZW(
//     index,
//     offset.x,
//     offset.y,
//     offset.z,
//     offset.w,
//   )
//   this.peopleMesh.mesh.geometry.attributes["aUvOffset"].needsUpdate = true
// }
