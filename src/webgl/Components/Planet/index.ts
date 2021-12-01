import AbstractObject from "../../Abstract/AbstractObject"
import { MainSceneContext } from "../../Scenes/MainScene"
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import planetTexture from "../../../assets/images/planet-texture.jpg"
import * as THREE from "three"
import { Color, Vector3 } from "three";

export default class Planet extends AbstractObject<MainSceneContext> {
  public radius: number
  public position: THREE.Vector3
  private material: THREE.ShaderMaterial

  constructor(context: MainSceneContext, position: THREE.Vector3, radius: number, tint = new Color("#fff")) {
    super(context)
    this.position = position
    this.radius = radius
    this.initMesh(tint)
  }

  private initMesh(tint: Color) {
    const geometry = new THREE.SphereBufferGeometry(this.radius, 32, 32)
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(planetTexture) },
        uTint: { value: tint }
      },
      transparent: true
    })

    this.output = new THREE.Mesh(geometry, this.material)
    this.output.position.copy(this.position)
  }

  setPosition(position: Vector3) {
    this.position = position
    this.output.position.copy(this.position)
  }
}
