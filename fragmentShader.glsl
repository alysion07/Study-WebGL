#version 300 es
precision highp float;
in vec4 vColor;
out vec4 outColor;
 
 void main() {
            // If the distance is less than 0.5, color it red, otherwise make it transparent
//            if (distance < 0.5) {
//                outColor = vec4(0.64f, 0.89f, 1.0f, 1.0f); // Red color
//            } else {
//                discard; // Make the fragment transparent
//            }

            outColor = vec4(0.64f, 0.89f, 1.0f, 1.0f); // Red color

}
