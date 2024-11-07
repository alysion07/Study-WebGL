// WebGL2 - Picking - GPU
// from https://webgl2fundamentals.org/webgl/webgl-picking-w-gpu.html
"use strict";

async function loadShader(url) {
    const response = await fetch(url);
    return response.text();
}
async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    // 쉐이더 로드
    const vs = await loadShader('vertexShader.glsl');
    const fs = await loadShader('fragmentShader.glsl');
    const pickingVS = await loadShader('picking_vs.glsl');
    const pickingFS = await loadShader('picking_fs.glsl');

    // Tell the twgl to match position with a_position, n
    // normal with a_normal etc
    twgl.setAttributePrefix("a_");

    // setup GLSL program
    // note: we need the attribute positions to match across programs
    // so that we only need one vertex array per shape
    const options = {
        attribLocations: {
            a_position: 0,
            a_color: 1,
        },
    };
    const programInfo = twgl.createProgramInfo(gl, [vs, fs], options);
    const pickingProgramInfo = twgl.createProgramInfo(gl, [pickingVS, pickingFS], options);

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);
    const cubeBufferInfo   = flattenedPrimitives.createCubeBufferInfo(gl, 20);
    const coneBufferInfo   = flattenedPrimitives.createTruncatedConeBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

    const sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
    const cubeVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);
    const coneVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, coneBufferInfo);

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    function rand(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
    }

    function positiveModulo(x, n) {
        return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
    }

    const fieldOfViewRadians = degToRad(60);

    // put the shapes in an array so it's easy to pick them at random
    const shapes = [
        { bufferInfo: sphereBufferInfo, vertexArray: sphereVAO, },
        { bufferInfo: cubeBufferInfo,   vertexArray: cubeVAO, },
        { bufferInfo: coneBufferInfo,   vertexArray: coneVAO, },
    ];

    const objectsToDraw = [];
    const objects = [];

    // Make infos for each object for each object.
    const baseHue = rand(0, 360);
    const numObjects = 400;
    for (let ii = 0; ii < numObjects; ++ii) {
        const id = ii + 1;

        // pick a shape
        const shape = shapes[rand(shapes.length) | 0];

        // make an object.
        const object = {
            uniforms: {
                u_color_multiply: chroma.hsv(positiveModulo(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
                u_matrix: m4.identity(),
                u_id: [
                    ((id >>  0) & 0xFF) / 0xFF, // '& 0xFF' 8비트 추출을 위한 비트 마스킹
                    ((id >>  8) & 0xFF) / 0xFF, // '/ 0xFF' 0 ~ 1 사이값으로 정규화
                    ((id >> 16) & 0xFF) / 0xFF,
                    ((id >> 24) & 0xFF) / 0xFF,
                ],
            },
            translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
            xRotationSpeed: rand(0.8, 1.2),
            yRotationSpeed: rand(0.8, 1.2),
        };
        objects.push(object);

        // Add it to the list of things to draw.
        objectsToDraw.push({
            programInfo: programInfo,
            bufferInfo: shape.bufferInfo,
            vertexArray: shape.vertexArray,
            uniforms: object.uniforms,
        });
    }

    // Create a texture to render to
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    function setFramebufferAttachmentSizes(width, height) {
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        // define size and format of level 0
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border,
            format, type, data);

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    }

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

    // make a depth buffer and the same size as the targetTexture
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
        let matrix = m4.translate(viewProjectionMatrix,
            translation[0],
            translation[1],
            translation[2]);
        matrix = m4.xRotate(matrix, xRotation);
        return m4.yRotate(matrix, yRotation);
    }

    requestAnimationFrame(drawScene);

    function drawObjects(objectsToDraw, overrideProgramInfo) {
        objectsToDraw.forEach(function(object) {
            const programInfo = overrideProgramInfo || object.programInfo;
            const vertexArray = object.vertexArray;

            gl.useProgram(programInfo.program);

            // Setup all the needed attributes.
            gl.bindVertexArray(vertexArray);

            // Set the uniforms.
            twgl.setUniforms(programInfo, object.uniforms);

            // Draw (calls gl.drawArrays or gl.drawElements)
            twgl.drawBufferInfo(gl, object.bufferInfo);
        });
    }

    // mouseX and mouseY are in CSS display space relative to canvas
    let mouseX = -1;
    let mouseY = -1;
    let oldPickNdx = -1;
    let oldPickColor;
    let frameCount = 0;

    // Draw the scene.
    function drawScene(time) {
        time *= 0.0005;
        ++frameCount;

        if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
            // 캔버스가 리사이즈 되었다면 framebuffer attachment 를 맞춰준다.
            setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
        }

        // Compute the projection matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        // Compute the camera's matrix using look at.
        const cameraPosition = [0, 0, 100];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Compute the matrices for each object.
        objects.forEach(function(object) {
            object.uniforms.u_matrix = computeMatrix(
                viewProjectionMatrix,
                object.translation,
                object.xRotationSpeed * time,
                object.yRotationSpeed * time);
        });

        // ------ Draw the objects to the texture --------

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawObjects(objectsToDraw, pickingProgramInfo);

        // ------ Figure out what pixel is under the mouse and read it

        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);
        gl.readPixels(
            pixelX,            // x
            pixelY,            // y
            1,           // width
            1,           // height
            gl.RGBA,           // format
            gl.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result
        const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

        // restore the object's color
        if (oldPickNdx >= 0) {
            const object = objects[oldPickNdx];
            object.uniforms.u_color_multiply = oldPickColor;
            oldPickNdx = -1;
        }

        // highlight object under mouse
        if (id > 0) {
            const pickNdx = id - 1;
            oldPickNdx = pickNdx;
            const object = objects[pickNdx];
            oldPickColor = object.uniforms.u_color_multiply;
            // frameCount 값 축소 후, 값에 따라 색상을 Red or Yellow 설정
            object.uniforms.u_color_multiply = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1]; // red : yellow
        }

        // ------ Draw the objects to the canvas

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        drawObjects(objectsToDraw);

        requestAnimationFrame(drawScene);
    }

    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
}

main().then(r => console.log(r));
