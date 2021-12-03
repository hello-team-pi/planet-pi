import "./style.css"
import WebGL from "./webgl"
import Stats from "stats.js"
import observableState from "./utils/observableState"
import { Howl } from "howler"
import uiSoundUrl from "./assets/sounds/ui/ui.mp3"
import ambiantSoundUrl from "./assets/sounds/ambiant/espace.mp3"
import planetWarningSoundUrl from "./assets/sounds/planets/alerte.mp3"
import planetExplosionSoundUrl from "./assets/sounds/planets/explosion.mp3"

const canvas = document.querySelector<HTMLCanvasElement>("#webgl")!

type GameStep = "start" | "game"

const globalState = observableState<{ step: GameStep; deadPeople: number; deadPlanet: number }>({
  step: "start",
  deadPeople: 0,
  deadPlanet: 0,
})

const sounds = {
  ui: new Howl({ src: [uiSoundUrl] }),
  ambiant: new Howl({ src: [ambiantSoundUrl], loop: true, volume: 0.2 }),
  planetWarning: new Howl({ src: [planetWarningSoundUrl], volume: 0.3 }),
  planetExplosion: new Howl({ src: [planetExplosionSoundUrl], volume: 0.3 }),
}

export type Sounds = typeof sounds
export type GlobalState = typeof globalState

const mainMenu = document.querySelector<HTMLElement>("#mainMenu")!
const hud = document.querySelector<HTMLElement>("#hud")!
const startButton = mainMenu.querySelector<HTMLButtonElement>(".button")!
const peopleCounter = hud.querySelector<HTMLElement>("#peoples")!
const planetCounter = hud.querySelector<HTMLElement>("#planets")!

const start = () => {
  globalState.step = "game"
  sounds.ui.play()
  sounds.ambiant.play()
}
startButton.addEventListener("click", start)

globalState.__onChange(
  "step",
  (step) => {
    mainMenu.style.display = step !== "start" ? "none" : "flex"
    hud.style.display = step === "start" ? "none" : "flex"
  },
  true,
)

globalState.__onChange(
  "deadPeople",
  (v) => {
    peopleCounter.innerText = v.toString().padStart(4, "0")
  },
  true,
)
globalState.__onChange(
  "deadPlanet",
  (v) => {
    planetCounter.innerText = v.toString().padStart(2, "0")
  },
  true,
)

// "Dev mode"
setTimeout(start, 700)

const webgl = new WebGL(canvas, globalState, sounds)

const stats = new Stats()
document.body.appendChild(stats.dom)

const raf = () => {
  stats.begin()
  webgl.tick()
  stats.end()
  requestAnimationFrame(raf)
}

raf()
