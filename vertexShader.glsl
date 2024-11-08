#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_viewProjection;
uniform mat4 u_world;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_viewProjection *  u_world * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}