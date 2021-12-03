attribute vec4 aUvOffset;
attribute float aIsDead;
attribute mat4 aRotationMatrix;
varying float vIsDead;
varying vec2 vUv;
varying vec4 vUvOffset;
varying float vLight;


vec3 transform(inout vec3 position, vec3 T, vec4 R, vec3 S) {
  //applies the scale
  position *= S;
  //computes the rotation where R is a (vec4) quaternion
  position += 2.0 * cross(R.xyz, cross(R.xyz, position) + R.w * position);
  //translates the transformed 'blueprint'
  position += T;
  //return the transformed position
  return position;
}

void main() {
  vLight = dot((modelMatrix * instanceMatrix * aRotationMatrix * vec4(normal, 1.0)).xyz, vec3(0., 0., 1.));
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * aRotationMatrix * vec4(position, 1.0);
  vIsDead = aIsDead;
  vUv = uv;
  vUvOffset = aUvOffset;
}