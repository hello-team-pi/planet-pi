precision highp float;
#define GLSLIFY 1

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

attribute vec3 position;
attribute vec3 normal;

uniform sampler2D uGradient;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vFirstColor;
varying vec3 vLastColor;

void main(void) {
	vWorldNormal = normalize(modelViewMatrix * vec4(normal, 0.0)).xyz;
	vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz * 0.1;
	vPosition = position * 0.1;

  vFirstColor = texture2D(uGradient, vec2(0., 0.5)).xyz;
  vLastColor = texture2D(uGradient, vec2(1., 0.5)).xyz;
    
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}