export default abstract class AbstractObjectNoContext {
  private unbinders: (() => void)[] = []
  public output: THREE.Object3D

  constructor() {
  }

  protected toUnbind(...unbinders: (() => void)[]) {
    this.unbinders.push(...unbinders)
  }

  public tick(time: number, delta: number) { }

  public destroy() {
    for (const unbinder of this.unbinders) unbinder()
  }
}
