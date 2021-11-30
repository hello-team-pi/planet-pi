
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uTexture, vUv);
  gl_FragColor = texel;
}