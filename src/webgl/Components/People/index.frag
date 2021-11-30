uniform sampler2D uTexture;

varying vec2 vUv;
varying vec4 vUvOffset;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  // Affine transformation on original UV of a vertex
  float startU = vUvOffset.x; // The constants are to avoid black pixels
  float endU = vUvOffset.y * 0.99;
  float startV = vUvOffset.z;
  float endV = vUvOffset.w;

  // float offsetX = map(vUv, 0., 1., vUvOffset.x, vUvOffset.x + vUvOffset.z);
  // float offsetX = map(vUv, 0., 1., vUvOffset.y, vUvOffset.y + vUvOffset.w);

  // vec4 texel = texture2D(uTexture, vec2(offsetX, offsetY));
  vec4 texel = texture2D(uTexture, vUv);
  gl_FragColor = texel;
  // gl_FragColor = vec4(vec3(vUvOffset.x), 1.);
  // if (gl_FragColor.a < 0.9) discard;
  // gl_FragColor = vec4(1., 0., 0., 1.);
}