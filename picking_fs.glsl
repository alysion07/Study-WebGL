#version 300 es
precision highp float;

// Passed in from the vertex shader.
uniform vec4 u_id;

out vec4 outColor;

void main() {
  outColor = u_id;
}