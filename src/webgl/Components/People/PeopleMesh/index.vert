attribute vec4 aUvOffset;
attribute float aIsDead;
varying float vIsDead;
varying vec2 vUv;
varying vec4 vUvOffset;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vIsDead = aIsDead;
  vUv = uv;
  vUvOffset = aUvOffset;
}