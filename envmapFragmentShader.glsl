#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec3 v_worldPosition;
in vec3 v_worldNormal;

// The texture.
uniform samplerCube u_texture;

// The position of the camera
uniform vec3 u_worldCameraPosition;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  outColor = texture(u_texture, direction);
}