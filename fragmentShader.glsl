#version 300 es
precision highp float;

out vec4 outColor;
 
 void main() {
     // Calculate the distance from the center of the point
            float dx = gl_PointCoord.x - 0.5;
            float dy = gl_PointCoord.y - 0.5;
            float distance = sqrt(dx * dx + dy * dy);

            // If the distance is less than 0.5, color it red, otherwise make it transparent
            if (distance < 0.5) {
                outColor = vec4(0.64f, 0.89f, 1.0f, 1.0f); // Red color
            } else {
                discard; // Make the fragment transparent
            }
}
