// WebGL2 - 3D Camera
// from https://webgl2fundamentals.org/webgl/webgl-3d-camera.html
"use strict";

const vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_modelMatrix;
uniform mat4 u_projectionMatrix;

out vec4 v_color;

void main() {
  gl_Position = u_projectionMatrix * u_modelMatrix * a_position;
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
`;


function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    // Use our boilerplate utils to compile the shaders and link into a program
    const program = webglUtils.createProgramFromSources(gl,
        [vertexShaderSource, fragmentShaderSource]);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    // look up uniform locations
    const matrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
    const projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");

    // Create a buffer
    const positionBuffer = gl.createBuffer();

    // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();

    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set Geometry.
   //setGeometry(gl);
    setCube(gl);

    {
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 3;          // 3 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }
    // create the color buffer, make it the current ARRAY_BUFFER
    // and copy in the color values
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    setColors(gl);

    // Turn on the attribute
    gl.enableVertexAttribArray(colorAttributeLocation);

    {// Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
        const size = 3;          // 3 components per iteration
        const type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
        const normalize = true;  // convert from 0-255 to 0.0-1.0
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);
    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    // First let's make some variables
    // to hold the translation,
    const fieldOfViewRadians = degToRad(40);
    let cameraPosition = [0,0,10];
    let modelPosition = [0,0,0];
    let modelRotation = [degToRad(0), degToRad(0), degToRad(0)];

    drawScene();

    // Setup a ui.
    webglLessonsUI.setupSlider("#x", {value: modelPosition[0], slide: updateModelPosition(0), min: -canvas.width/2, max: canvas.width/2, step: 0.1, precision: 1});
    webglLessonsUI.setupSlider("#y", {value: modelPosition[1], slide: updateModelPosition(1), min: -canvas.height/2, max: canvas.height/2, step: 0.1, precision: 1});
    webglLessonsUI.setupSlider("#z", {value: modelPosition[2], slide: updateModelPosition(2), min: -360, max: 360, step: 0.1, precision: 1});
    webglLessonsUI.setupSlider("#rotate_x", {value: radToDeg(modelRotation[0]), slide: updateModelAngle(0), min: 0, max: 360});
    webglLessonsUI.setupSlider("#rotate_y", {value: radToDeg(modelRotation[1]), slide: updateModelAngle(1), min: 0, max: 360});
    webglLessonsUI.setupSlider("#rotate_z", {value: radToDeg(modelRotation[2]), slide: updateModelAngle(2), min: 0, max: 360});

    function updateModelPosition(index) {
        return function (event, ui){
            // if (index === 0) {
            //     cameraPosition[0] = ui.value/canvas.clientWidth * 0.5;
            // } else if (index === 1) {
            //     cameraPosition[1] = ui.value/canvas.clientHeight *  0.5;
            // } else {
            //     cameraPosition[2] = ui.value/180;
            // }
            modelPosition[index] = ui.value * 0.01;
            drawScene();
        }
    }

    function updateModelAngle(index) {
        return function(event, ui) {
            modelRotation[index] = degToRad(360 - ui.value);
            drawScene();
        }
    }
    // Draw the scene.
    function drawScene() {
        //const objectCount = 5;
        //const radius = 200;
        const objectCount = 1;
        const radius = 6;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // turn on depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Bind the attribute/buffer set we want.
        gl.bindVertexArray(vao);

        // Compute the matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = 2000; // near 와 far의 차이가 10^6 이상 차이나면 재미있어짐.
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        const  up = [0, 1, 0];
        const targetPosition = [0, 0, 0];

        let modelMatrix = m4.identity();
        modelMatrix = m4.translate(modelMatrix, modelPosition[0],modelPosition[1], modelPosition[2]);
        modelMatrix = m4.zRotate(modelMatrix, modelRotation[2]);
        modelMatrix = m4.xRotate(modelMatrix, modelRotation[0]);
        modelMatrix = m4.yRotate(modelMatrix, modelRotation[1]);
        const modelMatrix2 = modelMatrix;

        // lookAt Cam
        const cameraMatrix = m4.lookAt(cameraPosition, targetPosition, up);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        // create a viewProjection matrix. This will both apply perspective
        // AND move the world so that the camera is effectively the origin
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Draw 'F's in a circle
        for (let ii = 0; ii < objectCount; ++ii) {
            // Set the matrix.
             gl.uniformMatrix4fv(matrixLocation, false, modelMatrix2);
             gl.uniformMatrix4fv(projectionMatrixLocation, false, viewProjectionMatrix);

            // Draw the geometry.
            const primitiveType = gl.TRIANGLES;
            const offset = 0;
            const count = 6 * 6; // 16 face , 6 coordinates
            gl.drawArrays(primitiveType, offset, count);
        }

        requestAnimationFrame(drawScene);

    }
    requestAnimationFrame(drawScene);
}

function setCube(gl) {
    const positions = new Float32Array([
        // 앞면 (z = 1.0)
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        0.6,  1.0,  0.6,
        -1.0, -1.0,  1.0,
        0.6,  1.0,  0.6,
        -0.6,  1.0,  0.6,

        // 뒷면 (z = -1.0)
        -1.0, -1.0, -1.0,
        -0.6,  1.0, -0.6,
        0.6,  1.0, -0.6,
        0.6,  1.0, -0.6,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,

        // 윗면
        -0.6,  1.0, -0.6,
        -0.6,  1.0,  0.6,
        0.6,  1.0,  0.6,
        -0.6,  1.0, -0.6,
        0.6,  1.0,  0.6,
        0.6,  1.0, -0.6,

        // 아랫면
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,

        // 오른쪽면
        1.0, -1.0, -1.0,
        0.6,  1.0, -0.6,
        0.6,  1.0,  0.6,
        1.0, -1.0, -1.0,
        0.6,  1.0,  0.6,
        1.0, -1.0,  1.0,

        // 왼쪽면
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -0.6,  1.0,  0.6,
        -1.0, -1.0, -1.0,
        -0.6,  1.0,  0.6,
        -0.6,  1.0, -0.6
    ]);

 //   let matrix  = m4.translation(0.5, 0.5, 0.5);
    let matrix  = m4.translation(0, 0, 0);

    for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.transformVector(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

}

// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
function setGeometry(gl) {
    const positions = new Float32Array([
        // left column front
        0,   0,  0,
        0, 150,  0,
        30,   0,  0,
        0, 150,  0,
        30, 150,  0,
        30,   0,  0,

        // top rung front
        30,   0,  0,
        30,  30,  0,
        100,   0,  0,
        30,  30,  0,
        100,  30,  0,
        100,   0,  0,

        // middle rung front
        30,  60,  0,
        30,  90,  0,
        67,  60,  0,
        30,  90,  0,
        67,  90,  0,
        67,  60,  0,

        // left column back
        0,   0,  30,
        30,   0,  30,
        0, 150,  30,
        0, 150,  30,
        30,   0,  30,
        30, 150,  30,

        // top rung back
        30,   0,  30,
        100,   0,  30,
        30,  30,  30,
        30,  30,  30,
        100,   0,  30,
        100,  30,  30,

        // middle rung back
        30,  60,  30,
        67,  60,  30,
        30,  90,  30,
        30,  90,  30,
        67,  60,  30,
        67,  90,  30,

        // top
        0,   0,   0,
        100,   0,   0,
        100,   0,  30,
        0,   0,   0,
        100,   0,  30,
        0,   0,  30,

        // top rung right
        100,   0,   0,
        100,  30,   0,
        100,  30,  30,
        100,   0,   0,
        100,  30,  30,
        100,   0,  30,

        // under top rung
        30,   30,   0,
        30,   30,  30,
        100,  30,  30,
        30,   30,   0,
        100,  30,  30,
        100,  30,   0,

        // between top rung and middle
        30,   30,   0,
        30,   60,  30,
        30,   30,  30,
        30,   30,   0,
        30,   60,   0,
        30,   60,  30,

        // top of middle rung
        30,   60,   0,
        67,   60,  30,
        30,   60,  30,
        30,   60,   0,
        67,   60,   0,
        67,   60,  30,

        // right of middle rung
        67,   60,   0,
        67,   90,  30,
        67,   60,  30,
        67,   60,   0,
        67,   90,   0,
        67,   90,  30,

        // bottom of middle rung.
        30,   90,   0,
        30,   90,  30,
        67,   90,  30,
        30,   90,   0,
        67,   90,  30,
        67,   90,   0,

        // right of bottom
        30,   90,   0,
        30,  150,  30,
        30,   90,  30,
        30,   90,   0,
        30,  150,   0,
        30,  150,  30,

        // bottom
        0,   150,   0,
        0,   150,  30,
        30,  150,  30,
        0,   150,   0,
        30,  150,  30,
        30,  150,   0,

        // left side
        0,   0,   0,
        0,   0,  30,
        0, 150,  30,
        0,   0,   0,
        0, 150,  30,
        0, 150,   0,
    ]);

    // Center the F around the origin and Flip it around. We do this because
    // we're in 3D now with and +Y is up where as before when we started with 2D
    // we had +Y as down.

    // We could do by changing all the values above but I'm lazy.
    // We could also do it with a matrix at draw time but you should
    // never do stuff at draw time if you can do it at init time.
    // let matrix = m4.xRotation(Math.PI);
    // matrix = m4.translate(matrix, -50, -75, -15);
    //
    // for (let ii = 0; ii < positions.length; ii += 3) {
    //     const vector = m4.transformVector(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    //     positions[ii + 0] = vector[0];
    //     positions[ii + 1] = vector[1];
    //     positions[ii + 2] = vector[2];
    // }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // left column front
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,

            // top rung front
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,

            // middle rung front
            120,  70, 120,
            120,  70, 120,
            120,  70, 120,
            120,  70, 120,
            120,  70, 120,
            120,  70, 120,
            // middle rung back
            70, 255, 135,
            70, 255, 135,
            70, 255, 135,
            70, 255, 135,
            70, 255, 135,
            70, 255, 135,

            // left column back
            80, 70, 150,
            80, 70, 150,
            80, 70, 150,
            80, 70, 150,
            80, 70, 150,
            80, 70, 150,



            // top rung back
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,



            // // top
            // 70, 200, 210,
            // 70, 200, 210,
            // 70, 200, 210,
            // 70, 200, 210,
            // 70, 200, 210,
            // 70, 200, 210,
            //
            // // top rung right
            // 200, 200, 70,
            // 200, 200, 70,
            // 200, 200, 70,
            // 200, 200, 70,
            // 200, 200, 70,
            // 200, 200, 70,
            //
            // // under top rung
            // 210, 100, 70,
            // 210, 100, 70,
            // 210, 100, 70,
            // 210, 100, 70,
            // 210, 100, 70,
            // 210, 100, 70,
            //
            // // between top rung and middle
            // 210, 160, 70,
            // 210, 160, 70,
            // 210, 160, 70,
            // 210, 160, 70,
            // 210, 160, 70,
            // 210, 160, 70,
            //
            // // top of middle rung
            // 70, 180, 210,
            // 70, 180, 210,
            // 70, 180, 210,
            // 70, 180, 210,
            // 70, 180, 210,
            // 70, 180, 210,
            //
            // // right of middle rung
            // 100, 70, 210,
            // 100, 70, 210,
            // 100, 70, 210,
            // 100, 70, 210,
            // 100, 70, 210,
            // 100, 70, 210,
            //
            // // bottom of middle rung.
            // 76, 210, 100,
            // 76, 210, 100,
            // 76, 210, 100,
            // 76, 210, 100,
            // 76, 210, 100,
            // 76, 210, 100,
            //
            // // right of bottom
            // 140, 210, 80,
            // 140, 210, 80,
            // 140, 210, 80,
            // 140, 210, 80,
            // 140, 210, 80,
            // 140, 210, 80,
            //
            // // bottom
            // 90, 130, 110,
            // 90, 130, 110,
            // 90, 130, 110,
            // 90, 130, 110,
            // 90, 130, 110,
            // 90, 130, 110,
            //
            // // left side
            // 160, 160, 220,
            // 160, 160, 220,
            // 160, 160, 220,
            // 160, 160, 220,
            // 160, 160, 220,
            // 160, 160, 220,
        ]),
        gl.STATIC_DRAW);
}

const  m4 = {

    perspective: function(fieldOfViewInRadians, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        const rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0,
        ];
    },

    projection: function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1,
        ];
    },

    multiply: function(a, b) {
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];
        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },

    identity: function() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },

    translation: function(tx, ty, tz) {
        return [
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1,
        ];
    },

    xRotation: function(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    },

    yRotation: function(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    },

    zRotation: function(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },

    scaling: function(sx, sy, sz) {
        return [
            sx, 0,  0,  0,
            0, sy,  0,  0,
            0,  0, sz,  0,
            0,  0,  0,  1,
        ];
    },

    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },

    yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },

    zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },

    scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

    inverse: function(m) {
        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];
        const tmp_0  = m22 * m33;
        const tmp_1  = m32 * m23;
        const tmp_2  = m12 * m33;
        const tmp_3  = m32 * m13;
        const tmp_4  = m12 * m23;
        const tmp_5  = m22 * m13;
        const tmp_6  = m02 * m33;
        const tmp_7  = m32 * m03;
        const tmp_8  = m02 * m23;
        const tmp_9  = m22 * m03;
        const tmp_10 = m02 * m13;
        const tmp_11 = m12 * m03;
        const tmp_12 = m20 * m31;
        const tmp_13 = m30 * m21;
        const tmp_14 = m10 * m31;
        const tmp_15 = m30 * m11;
        const tmp_16 = m10 * m21;
        const tmp_17 = m20 * m11;
        const tmp_18 = m00 * m31;
        const tmp_19 = m30 * m01;
        const tmp_20 = m00 * m21;
        const tmp_21 = m20 * m01;
        const tmp_22 = m00 * m11;
        const tmp_23 = m10 * m01;

        const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
        ];
    },

    transformVector: function(m, v) {
        const dst = [];
        for (let i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (let j = 0; j < 4; ++j) {
                dst[i] += v[j] * m[j * 4 + i];
            }
        }
        return dst;
    },

    subtractVectors: function(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    },

    cross: function(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    },
    normalize: function(v) {
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        // make sure we don't divide by 0.
        if (length > 0.00001) {
            return [v[0] / length, v[1] / length, v[2] / length];
        } else {
            return [0, 0, 0];
        }
    },

    lookAt: function(cameraPosition, target, up) {
        const zAxis = m4.normalize(
            m4.subtractVectors(cameraPosition, target));
        const xAxis = m4.normalize(m4.cross(up, zAxis));
        const yAxis = m4.normalize(m4.cross(zAxis, xAxis));

        return [
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            cameraPosition[0], cameraPosition[1], cameraPosition[2], 1,
        ];
    },

};

main();

