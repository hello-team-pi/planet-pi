import AbstractObject from "../../Abstract/AbstractObject";
import { MainSceneContext } from "../../Scenes/MainScene";
import fragmentShader from "./index.frag?raw"
import vertexShader from "./index.vert?raw"
import planetTexture from "../../../assets/images/planet-texture.jpg"
import * as THREE from "three"

export default class Planet extends AbstractObject<MainSceneContext> {
    radius : number
    position: THREE.Vector3
    private material: THREE.ShaderMaterial

    constructor(context: MainSceneContext, position: THREE.Vector3, radius: number) {
        super(context)
        this.position = position
        this.radius = radius
        this.initMesh()
    }

    initMesh(){
        const geometry = new THREE.SphereBufferGeometry(this.radius, 32, 32)
        this.material = new THREE.ShaderMaterial({
          fragmentShader,
          vertexShader,
          uniforms: {
            uTexture: { value: new THREE.TextureLoader().load(planetTexture) },
          },
        })
    
        this.output = new THREE.Mesh(geometry, this.material)
    }
}