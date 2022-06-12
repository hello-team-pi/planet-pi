import "./style.css"
import WebGL from "./webgl"
import Stats from "stats.js"
import observableState from "./utils/observableState"
import { Howl } from "howler"
import uiSoundUrl from "./assets/sounds/ui/ui.mp3"
import ambiantSoundUrl from "./assets/sounds/ambiant/espace.mp3"
import planetWarningSoundUrl from "./assets/sounds/planets/alerte.mp3"
import planetExplosionSoundUrl from "./assets/sounds/planets/explosion.mp3"
import propulsionChargeBuildUp from "./assets/sounds/propulsion/charge_build_up.mp3"
import propulsionLoop from "./assets/sounds/propulsion/charge_loop.mp3"
import propulsionImpact from "./assets/sounds/propulsion/impact.mp3"
import launch from "./assets/sounds/propulsion/launch.mp3"
import endGameSound from "./assets/sounds/game_over/game_over.mp3"
import musicUrl from "./assets/sounds/music/planete_loop.mp3"
import aliens from "./assets/aliens.json"
import planets from "./assets/planets.json"

const canvas = document.querySelector<HTMLCanvasElement>("#webgl")!

type GameStep = "start" | "game" | "end"

const globalState = observableState<{
  step: GameStep
  deadPeople: number
  deadPlanet: number
  isIntro: boolean
}>({
  step: "start",
  deadPeople: 0,
  deadPlanet: 0,
  isIntro: false,
})

const sounds = {
  ui: new Howl({ src: [uiSoundUrl], volume: 0.1 }),
  ambiant: new Howl({ src: [ambiantSoundUrl], loop: true, volume: 0.4 }),
  endGame: new Howl({ src: [endGameSound], volume: 0.2 }),
  planetWarning: new Howl({ src: [planetWarningSoundUrl], volume: 0.1 }),
  planetExplosion: new Howl({ src: [planetExplosionSoundUrl], volume: 0.2 }),
  propulsionChargeBuildUp: new Howl({ src: [propulsionChargeBuildUp], volume: 0.1 }),
  propulsionLoop: new Howl({ loop: true, src: [propulsionLoop], volume: 0.0 }),
  propulsionImpact: new Howl({ src: [propulsionImpact], volume: 0.1 }),
  launch: new Howl({ src: [launch], volume: 0.05 }),
  music: new Howl({ src: [musicUrl], loop: true, volume: 0.05 }),
}

export type Sounds = typeof sounds
export type GlobalState = typeof globalState

const mainMenu = document.querySelector<HTMLElement>("#mainMenu")!
const hud = document.querySelector<HTMLElement>("#hud")!
const endScreen = document.querySelector<HTMLElement>("#endScreen")!
const startButton = mainMenu.querySelector<HTMLButtonElement>(".button")!
const endButton = endScreen.querySelector<HTMLButtonElement>(".button")!
const peopleCounter = hud.querySelector<HTMLElement>("#peoples")!
const planetCounter = hud.querySelector<HTMLElement>("#planets")!
const intro = hud.querySelector<HTMLElement>(".intro")!
const planet = intro.querySelector<HTMLElement>("#planet")!
const species = intro.querySelector<HTMLElement>("#species")!

const scoreboardPlanet = document.querySelector<HTMLElement>("#scoreboard-planet")!
const scoreboardPeople = document.querySelector<HTMLElement>("#scoreboard-people")!
const scoreboardName = document.querySelector<HTMLElement>("#scoreboard-name")!
const table = document.querySelector<HTMLElement>("#table")!
const entry1 = document.querySelector<HTMLElement>("#entry1")!
const entry2 = document.querySelector<HTMLElement>("#entry2")!
const entry3 = document.querySelector<HTMLElement>("#entry3")!
const usableEntry1 = entry1.cloneNode() as HTMLElement
entry1.remove()
const usableEntry2 = entry2.cloneNode() as HTMLElement
entry2.remove()
const usableEntry3 = entry3.cloneNode() as HTMLElement
entry3.remove()

const alienName = aliens[Math.floor(Math.random() * aliens.length)]
const planetName = planets[Math.floor(Math.random() * planets.length)]

const data = localStorage.getItem("data")
const finalData: { name: string; planet: number; people: number }[] = data ? JSON.parse(data) : []

const addEntry = (d: { name: string; planet: number; people: number }) => {
  const n1 = usableEntry1.cloneNode() as HTMLElement
  const n2 = usableEntry2.cloneNode() as HTMLElement
  const n3 = usableEntry3.cloneNode() as HTMLElement
  n1.innerText = d.name
  n2.innerText = d.planet.toString()
  n3.innerText = d.people.toString()
  table.appendChild(n1)
  table.appendChild(n2)
  table.appendChild(n3)
}

const start = () => {
  globalState.step = "game"
  sounds.ambiant.stop()
}
startButton.addEventListener("click", start)

const end = () => {
  document.location.reload()
}
endButton.addEventListener("click", end)

document.addEventListener("keypress", (e) => {
  if ((e.key === " " || e.key === "Enter") && globalState.step === "start") start()
})

globalState.__onChange(
  "isIntro",
  (isIntro) => {
    if (!isIntro) intro.style.display = "none"
  },
  true,
)

globalState.__onChange(
  "step",
  (step, previousStep) => {
    mainMenu.style.display = step !== "start" ? "none" : "flex"
    hud.style.display = step === "game" ? "flex" : "none"
    endScreen.style.display = step !== "end" ? "none" : "flex"
    if (step === "end" && previousStep !== "end") {
      sounds.music.stop()

      sounds.endGame.play()
      scoreboardPeople.innerText = globalState.deadPeople.toString()
      scoreboardPlanet.innerText = globalState.deadPlanet.toString()
      scoreboardName.innerText = alienName
      const d = { name: alienName, people: globalState.deadPeople, planet: globalState.deadPlanet }

      finalData.push(d)
      for (const data of finalData.sort((a, b) => {
        const diff = Number(b.planet) - Number(a.planet)
        return diff === 0 ? Number(b.people) - Number(a.people) : diff
      })) {
        addEntry(data)
      }
      localStorage.setItem("data", JSON.stringify(finalData))
    }
    if (step === "game") {
      species.innerText = alienName
      planet.innerText = planetName

      sounds.music.play()
      sounds.ui.play()

      document.addEventListener("cursordown", () => {
        if (globalState.isIntro) globalState.isIntro = false
      })

      setTimeout(() => {
        document.querySelector<HTMLElement>(".hudWrapper .hint")!.style.opacity = "0"
      }, 3000)
    }
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

sounds.ambiant.play()

const webgl = new WebGL(canvas, globalState, sounds)

const stats = new Stats()

// "Dev mode"
// setTimeout(start, 700)
// document.body.appendChild(stats.dom)

const raf = () => {
  stats.begin()
  webgl.tick()
  stats.end()
  requestAnimationFrame(raf)
}

raf()
