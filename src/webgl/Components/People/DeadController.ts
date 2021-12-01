import PeopleController from "./PeopleController"
import * as THREE from "three"
import { MainSceneContext } from "../../Scenes/MainScene"

const vec = new THREE.Vector3()

export default class DeadController {
  public peopleController: PeopleController
  private speed: THREE.Vector3
  private removeCb: (controller: this) => void
  private context: MainSceneContext

  constructor(
    peopleController: PeopleController,
    {
      speed,
      context,
      removeCb = () => {},
    }: {
      speed: THREE.Vector3Tuple
      context: MainSceneContext
      removeCb?: DeadController["removeCb"]
    },
  ) {
    this.peopleController = peopleController
    this.context = context
    this.removeCb = removeCb
    this.speed = new THREE.Vector3().fromArray(speed)
  }

  public tick(time: number, delta: number) {
    this.peopleController.updatePeople((object) => {
      object.position.add(this.speed)
      vec.copy(object.position)
      vec.project(this.context.camera)
      if (Math.abs(vec.x) > 1.1 || Math.abs(vec.y) > 1.1) this.removeCb(this)
    })
  }
}
