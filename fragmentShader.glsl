#version 300 es
precision highp float;

in vec4 v_color; // passed in from vertex shader

uniform vec4 u_colorMult;

out vec4 outColor;

void main() {
  outColor = v_color * u_colorMult;
}