#version 300 es
precision highp float;
in vec4 vColor;
out vec4 outColor;
 
 void main() {
//     outColor = vec4(0.64f, 0.89f, 1.0f, 1.0f); // Red color
     outColor = vColor; // Red color
}
