precision mediump float;

uniform float uGridScale;
uniform vec2 uGridOffset;
uniform vec2 uScreenResolution;
uniform sampler2D uBackgroundImage;
uniform float uImageTranslateOffset;
uniform float uImageRotation;
uniform float uImageScale;

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
