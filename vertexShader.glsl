    #version 300 es

    in vec4 aVertexPosition;
    in vec4 aColor;
    out vec4 vColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    //  gl_PointSize = 30.0; // Set the size of each point
        vColor = aColor;
    }