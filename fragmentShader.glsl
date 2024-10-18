#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec3 v_worldNormal;
in vec3 v_worldPosition;

uniform samplerCube u_texture;

uniform vec3 u_worldCameraPosition;

out vec4 outColor;

void main() {
   vec3 worldNormal = normalize(v_worldNormal);
   vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
   vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

   outColor = texture(u_texture, direction);
}
