uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uTexture, vUv);
  // gl_FragColor = vec4(texel.rgb, 0.1);
  gl_FragColor = texel;
}