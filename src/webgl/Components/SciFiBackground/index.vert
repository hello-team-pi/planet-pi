precision highp float;
#define GLSLIFY 1

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;

void main(void) {
    gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
}
