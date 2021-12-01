uniform sampler2D uTexture;
uniform vec3 uTint;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uTexture, vUv);
  gl_FragColor = vec4(texel.rgb * uTint, texel.a);
}