import * as THREE from "three"
import { Pane } from "tweakpane"
import * as EssentialsPlugin from "@tweakpane/plugin-essentials"
import MainScene from "./Scenes/MainScene"
import { GlobalState, Sounds } from "../main"

export default class WebGL {
  private renderer: THREE.WebGLRenderer
  private mainScene: MainScene

  private clock: THREE.Clock
  private gui: Pane
  private globalState: GlobalState
  private sounds: Sounds

  constructor(htmlElement: HTMLCanvasElement, state: GlobalState, sounds: Sounds) {
    this.clock = new THREE.Clock(true)
    this.sounds = sounds
    this.globalState = state
    this.setupRenderer(htmlElement)
    this.gui = new Pane({ title: "Planet PI" })
    this.gui.registerPlugin(EssentialsPlugin)
    this.mainScene = new MainScene(this.genContext())
  }

  private genContext = () => ({
    clock: this.clock,
    renderer: this.renderer,
    gui: this.gui,
    globalState: this.globalState,
    sounds: this.sounds,
  })

  private setupRenderer(htmlElement: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: htmlElement,
      antialias: true,
    })
    this.renderer.debug.checkShaderErrors = true
    const resize = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
    resize()
    window.addEventListener("resize", resize)
  }

  public tick() {
    const deltaTime = this.clock.getDelta()
    const elapsedTime = this.clock.elapsedTime
    this.mainScene.tick(elapsedTime, deltaTime)

    this.renderer.render(this.mainScene.scene, this.mainScene.camera)
  }
}

export type WebGLAppContext = ReturnType<WebGL["genContext"]>
