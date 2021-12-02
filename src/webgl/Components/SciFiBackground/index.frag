precision mediump float;

uniform float uGridScale;
uniform vec2 uGridOffset;
uniform vec2 uScreenResolution;
uniform sampler2D uBackgroundImage;
uniform float uImageTranslateOffset;
uniform float uImageRotation;
uniform float uImageScale;


float random(float n){return fract(sin(n) * 43758.5453123);}

float random(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float remap(float value, float start1, float stop1, float start2, float stop2)
{
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

float cremap(float value, float start1, float stop1, float start2, float stop2) {
    float r = remap(value, start1, stop1, start2, stop2);
    return clamp(r, start2, stop2);
}

vec2 adjustUvToImage(vec2 _st, vec2 center, float texRatio, float quadRatio, bool fit) {
  float correctedRatio = quadRatio / texRatio;
  vec2 imageUv = _st - center;
  imageUv *= vec2(correctedRatio, 1.);
  if (fit)
    imageUv /= mix(1. / correctedRatio, correctedRatio, step(correctedRatio, 1.));
  imageUv /= mix(correctedRatio, 1., step(correctedRatio, 1.));
  imageUv += center;
  return imageUv;
}

vec2 rotateUV(vec2 uv, float rotation)
{
    float mid = 0.5;
    return vec2(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

void main()
{
  // uv = adjustUvToImage(uv, vec2(0.5), 1., uScreenResolution.x / uScreenResolution.y, false);
  // vec2 size = adjustUvToImage(vec2(1.), vec2(0.5), 1., uScreenResolution.x / uScreenResolution.y, false);

  // float scale = 20.;
  // vec2 gridUv = fract((uv + .5) * scale);
  // float pixelSize = 0.02;
  // float pixelSize = (size.x * scale) / uScreenResolution.x;
  // float pixelSize2 = (size.y * scale) / uScreenResolution.y;

  // float v = max(step(gridUv.x, pixelSize2), step(gridUv.y, pixelSize));
  float scale = uGridScale;
  vec2 gridOffset = - floor(uScreenResolution * 0.5) + uGridOffset;
  vec2 gridCoord = mod(((gl_FragCoord.xy + gridOffset) * scale), uScreenResolution.x);
  float grid = max(
    step(ceil(gridCoord.x / scale), 1.),
    step(ceil(gridCoord.y / scale), 1.)
  );


  vec2 imageuv = (gl_FragCoord.xy + gridOffset * uImageTranslateOffset) / uScreenResolution.x;
  imageuv = rotateUV(imageuv, uImageRotation);
  vec3 color = texture2D(uBackgroundImage, imageuv * uImageScale).rgb;
  color = mix(color,vec3(1.), grid * 0.3);


  gl_FragColor = vec4(color, 1.);
}
