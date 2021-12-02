import "./style.css"
import WebGL from "./webgl"
import Stats from "stats.js"
import observableState from "./utils/observableState"
const canvas = document.querySelector<HTMLCanvasElement>("#webgl")!

type GameStep = "start" | "game"

const globalState = observableState<{ step: GameStep }>({ step: "start" })
export type GlobalState = typeof globalState

const mainMenu = document.querySelector<HTMLElement>("#mainMenu")!
const hud = document.querySelector<HTMLElement>("#hud")!
const startButton = mainMenu.querySelector<HTMLButtonElement>(".button")!

startButton.addEventListener("click", () => (globalState.step = "game"))

globalState.__onChange(
  "step",
  (step) => {
    mainMenu.style.display = step !== "start" ? "none" : "flex"
    hud.style.display = step === "start" ? "none" : "flex"
  },
  true,
)

setTimeout(() => {
  // "Dev mode"
  globalState.step = "game"
  mainMenu.style.display = "none"
}, 700);

const webgl = new WebGL(canvas, globalState)

const stats = new Stats()
document.body.appendChild(stats.dom)

const raf = () => {
  stats.begin()
  webgl.tick()
  stats.end()
  requestAnimationFrame(raf)
}

raf()
