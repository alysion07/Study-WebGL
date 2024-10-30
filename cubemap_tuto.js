"use strict";
var envmapVertexShaderSource = `#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_worldPosition;
out vec3 v_worldNormal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_projection * u_view * u_world * a_position;

  // send the view position to the fragment shader
  v_worldPosition = (u_world * a_position).xyz;

  // orient the normals and pass to the fragment shader
  v_worldNormal = mat3(u_world) * a_normal;
}
`;

var envmapFragmentShaderSource = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec3 v_worldPosition;
in vec3 v_worldNormal;

// The texture.
uniform samplerCube u_texture;

// The position of the camera
uniform vec3 u_worldCameraPosition;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  outColor = texture(u_texture, direction);
}
`;

var skyboxVertexShaderSource = `#version 300 es
in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = vec4(a_position.xy, 1, 1);
}
`;

var skyboxFragmentShaderSource = `#version 300 es
precision highp float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

in vec4 v_position;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}
`;

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
  twgl.setAttributePrefix("a_");
  
  // var env_vs = await loadShader("envmapVertexShader.glsl");
  // var env_fs = await loadShader("envmapFragmentShader.glsl");
  // var sky_vs = await loadShader("skyboxVertexShader.glsl");
  // var sky_fs = await loadShader("skyboxFragmentShader.glsl");
  
  // const envmap_ProgramInfo = twgl.createProgramInfo(gl, env_vs, env_fs);
  // const skybox_ProgramInfo = twgl.createProgramInfo(gl, sky_vs, sky_fs);

  //-------------
  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..

  // Use twgl to compile the shaders and link into a program
  const envmap_ProgramInfo = twgl.createProgramInfo(
      gl, [envmapVertexShaderSource, envmapFragmentShaderSource]);
  const skybox_ProgramInfo = twgl.createProgramInfo(
      gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);

// ------------------------
  const cube_BufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
  const quad_BufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

  const cube_VAO = twgl.createVAOFromBufferInfo(gl, envmap_ProgramInfo, cube_BufferInfo);
  const quad_VAO = twgl.createVAOFromBufferInfo(gl, skybox_ProgramInfo, quad_BufferInfo);

 const texture = twgl.createTexture(gl, {
  target: gl.TEXTURE_CUBE_MAP,
  src: [
    'resources/images/computer-history-museum/pos-x.jpg',
    'resources/images/computer-history-museum/neg-x.jpg',
    'resources/images/computer-history-museum/pos-y.jpg',
    'resources/images/computer-history-museum/neg-y.jpg',
    'resources/images/computer-history-museum/pos-z.jpg',
    'resources/images/computer-history-museum/neg-z.jpg',
  ],
  min: gl.LINEAR_MIPMAP_LINEAR,
}); 

function degToRad(d) {
  return d * Math.PI / 180;
}
  
var fieldOfViewRadians = degToRad(60);

requestAnimationFrame(drawScene);

// Draw the scene.
  function drawScene(time) {
    // convert to seconds
    time *= 0.001;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // camera going in circle 2 units from origin looking at origin
    var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
    var target = [0, 0, 0];
    var up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Rotate the cube around the x axis
    var worldMatrix = m4.xRotation(time * 0.11);

    var viewDirectionMatrix = m4.copy(viewMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(projectionMatrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    // draw the cube
    gl.depthFunc(gl.LESS);  // use the default depth test
    gl.useProgram(envmap_ProgramInfo.program);
    gl.bindVertexArray(cube_VAO);
    twgl.setUniforms(envmap_ProgramInfo, {
      u_world: worldMatrix,
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_texture: texture,
      u_worldCameraPosition: cameraPosition,
    });
    twgl.drawBufferInfo(gl, cube_BufferInfo);

    //----  draw the skybox ----
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(skybox_ProgramInfo.program);
    gl.bindVertexArray(quad_VAO);
    twgl.setUniforms(skybox_ProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: texture,
    });
    twgl.drawBufferInfo(gl,quad_BufferInfo);

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

//for Quad
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
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
