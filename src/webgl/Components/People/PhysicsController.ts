import PeopleController from "./PeopleController";
import AbstractObjectNoContext from "../../Abstract/AbstractObjectNoContext";

export default class PhysicsController extends AbstractObjectNoContext {
  peopleController: PeopleController

  constructor(peopleController: PeopleController) {
    super()
    this.peopleController = peopleController
  }

  public tick(time: number, delta: number) {
    this.peopleController.updatePeople((object) => {
      object.position.copy(this.output.position)
    })
  }
}