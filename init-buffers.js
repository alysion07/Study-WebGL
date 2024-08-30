function initBuffers(gl){
    const positionBuffer = initpositionBuffer(gl);

    return {
        position: positionBuffer,
    };
}

function initpositionBuffer(gl){
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = 
      [       
        1.0,  1.0,
        -1.5,  1.5,
        -1.0,  -1.5,
        7.0,  -3.0,
        5.0,  -7.0,
        -6.0,  2.0,
        -7.0,  -4.0,
        3.0,  -1.0,
        -5.0,   -5.0,
      ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

export { initBuffers };