uniform sampler2D uTexture;
uniform vec3 uBodyColor;
uniform vec3 uHeadColor;
uniform vec3 uMouthColor;
uniform vec3 uDeadColor;

varying float vIsDead;
varying vec2 vUv;
varying vec4 vUvOffset;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  float offsetX = map(vUv.x, 0., 1., vUvOffset.x, vUvOffset.x + vUvOffset.z);
  float offsetY = 1. - map(vUv.y, 1., 0., vUvOffset.y, vUvOffset.y + vUvOffset.w);

  vec4 texel = texture2D(uTexture, vec2(offsetX, offsetY));
  vec3 color = uBodyColor;
  color = mix(color, uHeadColor, texel.r);
  color = mix(color, uMouthColor, texel.b);
  color = color * mix(vec3(1.), uDeadColor, vIsDead);

  gl_FragColor = vec4(color, texel.a);
  if (gl_FragColor.a < 0.9) discard;
}