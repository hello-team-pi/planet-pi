import "./style.css";
import WebGL from "./webgl";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#webgl")!;

const webgl = new WebGL(canvas);

const raf = () => {
  webgl.tick();
  requestAnimationFrame(raf);
};

raf();
