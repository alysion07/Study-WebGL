#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_projectionMatrix;

// all shaders have a main function
void main() {
    gl_Position = u_projectionMatrix * modelMatrix * vec4(a_position, 1.0) ;
}
