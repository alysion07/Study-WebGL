import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

main();

// 
// start here 
// 
function main() {
    const canvas = document.querySelector("#c");
    
    const gl = canvas.getContext("webgl2");
    if(gl === null){
        alert(
            "Unable to initialize WebGL. Your browser or machine may not support it."
        );
        return;
    }

      // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

   // 외부 파일에서 버텍스 셰이더 로드
   const shaderProgram = initShaderProgram(gl);

   const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

   const buffers = initBuffers(gl);

   drawScene(gl, programInfo, buffers);
}

async function initShaderProgram(gl) {
    const vs = await loadShader(gl,gl.VERTEX_SHADER, 'vertexShader.glsl');
    const fs = await loadShader(gl,gl.FRAGMENT_SHADER, 'fragmentShader.glsl');

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(
              shaderProgram
            )}`
        );
        return null;
    }

    return shaderProgram;
}

async function loadShader(gl, type, url) {
    const shader = gl.createShader(type);
    const source =  await fetch(url).then(response => response.text());
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the Shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}