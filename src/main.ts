import "./style.css"
import WebGL from "./webgl"
import Stats from "stats.js"
const canvas = document.querySelector<HTMLCanvasElement>("#webgl")!

const webgl = new WebGL(canvas)

const stats = new Stats()
document.body.appendChild(stats.dom)

const raf = () => {
  stats.begin()
  webgl.tick()
  stats.end()
  requestAnimationFrame(raf)
}

raf()
