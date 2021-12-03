uniform vec4 uUvOffset;
varying vec2 vUv;
varying vec4 vUvOffset;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  vUvOffset = uUvOffset;
}