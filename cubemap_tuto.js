"use strict";

async function loadShader(url) {
    const response = await fetch(url);
    return await response.text();
}

// 셰이더를 컴파일하는 함수
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('shader compile error!:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#glcanvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var vs = await loadShader("vertexShader.glsl");
  var fs = await loadShader("fragmentShader.glsl");
    
  // Use our boilerplate utils to compile the shaders and link into a program
  var program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // look up where the vertex data needs to go.
  var position_location = gl.getAttribLocation(program, "a_position");
  var normal_location = gl.getAttribLocation(program, "a_normal");

  // lookup uniforms
  var projection_location = gl.getUniformLocation(program, "u_projection");
  var view_location= gl.getUniformLocation(program, "u_view"); 
  var world_location = gl.getUniformLocation(program, "u_world");
  var texture_location = gl.getUniformLocation(program, "u_texture");
  var worldCamera_pos_location = gl.getUniformLocation(program, "u_worldCameraPosition");

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer for positions
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put the positions in the buffer
  setGeometry(gl);

  // Turn on the position attribute
  gl.enableVertexAttribArray(position_location);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      position_location, size, type, normalize, stride, offset);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  setNormals(gl);

  gl.enableVertexAttribArray(normal_location);
  gl.vertexAttribPointer(normal_location, size, type, normalize, stride, offset);

  // Create a texture.
  var texture = gl.createTexture();
  // bind to the TEXTURE_CUBE_MAP bind point of texture unit 0
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,      url: 'resources/images/computer-history-museum/pos-x.jpg', },
    {      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,      url: 'resources/images/computer-history-museum/neg-x.jpg', },
    {      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,      url: 'resources/images/computer-history-museum/pos-y.jpg', },
    {      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,      url: 'resources/images/computer-history-museum/neg-y.jpg', },
    {      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,      url: 'resources/images/computer-history-museum/pos-z.jpg', },
    {      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,      url: 'resources/images/computer-history-museum/neg-z.jpg', },
  ];

  //  const faceInfos = [ {
  //     target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-x.jpg',
  //   },
  //   {
  //     target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-x.jpg',
  //   },
  //   {
  //     target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-y.jpg',
  //   },
  //   {
  //     target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-y.jpg',
  //   },
  //   {
  //     target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-z.jpg',
  //   },
  //   {
  //     target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  //     url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-z.jpg',
  //   },
  // ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;
    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    gl.texImage2D(target, level, internalFormat, width, height, 0,  format, type, null);

    const image = new Image();
    requestCORSIfNotSameOrigin(image, url)
    image.src = url;
    image.addEventListener('load', function() {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

// Draw the scene.
  function drawScene(time) {
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    gl.uniformMatrix4fv(projection_location, false, projectionMatrix)

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var worldMatrix = m4.xRotation(modelXRotationRadians);
    worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

    // Set the matrix.
    gl.uniformMatrix4fv(projection_location, false, projectionMatrix);
    gl.uniformMatrix4fv(view_location, false, viewMatrix);
    gl.uniformMatrix4fv(world_location, false, worldMatrix)
    gl.uniform3fv(worldCamera_pos_location, cameraPosition);

    // Tell the shader to use texture unit 0 for u_texture
    gl.uniform1i(texture_location, 0);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

    requestAnimationFrame(drawScene);
  }
}

function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
    var positions = new Float32Array(
      [
      -0.5, -0.5,  -0.5,
      -0.5,  0.5,  -0.5,
       0.5, -0.5,  -0.5,
      -0.5,  0.5,  -0.5,
       0.5,  0.5,  -0.5,
       0.5, -0.5,  -0.5,
  
      -0.5, -0.5,   0.5,
       0.5, -0.5,   0.5,
      -0.5,  0.5,   0.5,
      -0.5,  0.5,   0.5,
       0.5, -0.5,   0.5,
       0.5,  0.5,   0.5,
  
      -0.5,   0.5, -0.5,
      -0.5,   0.5,  0.5,
       0.5,   0.5, -0.5,
      -0.5,   0.5,  0.5,
       0.5,   0.5,  0.5,
       0.5,   0.5, -0.5,
  
      -0.5,  -0.5, -0.5,
       0.5,  -0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,  -0.5,  0.5,
       0.5,  -0.5, -0.5,
       0.5,  -0.5,  0.5,
  
      -0.5,  -0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,   0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,   0.5,  0.5,
      -0.5,   0.5, -0.5,
  
       0.5,  -0.5, -0.5,
       0.5,   0.5, -0.5,
       0.5,  -0.5,  0.5,
       0.5,  -0.5,  0.5,
       0.5,   0.5, -0.5,
       0.5,   0.5,  0.5,
  
      ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  }
  function setNormals(gl) {
    var normals = new Float32Array(
      [
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
  
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
  
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
  
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
  
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
  
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
      ]);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  }

main();

// This is needed if the images are not on the same domain
// NOTE: The server providing the images must give CORS permissions
// in order to be able to use the image with WebGL. Most sites
// do NOT give permission.
// See: http://webgl2fundamentals.org/webgl/lessons/webgl-cors-permission.html
function requestCORSIfNotSameOrigin(img, url) {
    if((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}
