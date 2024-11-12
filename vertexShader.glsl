#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec3 a_position;

// translation to add to position
uniform vec3 u_translation;

// rotation values
uniform vec3 u_rotation;

// scale values
uniform vec3 u_scale;

// all shaders have a main function
void main() {
    vec3 position = a_position + u_translation;
gl_Position = vec4(position, 1);
}
