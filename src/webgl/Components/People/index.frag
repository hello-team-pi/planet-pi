
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uTexture, vUv);
  gl_FragColor = texel;
  // gl_FragColor = vec4(.rgb, 1.);
  if (gl_FragColor.a < 0.9) discard;
  // gl_FragColor = vec4(1., 0., 0., 1.);
}