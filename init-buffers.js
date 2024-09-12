function initBuffers(gl){
    const positionBuffer = initpositionBuffer(gl);
    const colorBuffer = initColorBuffer(gl);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function initpositionBuffer(gl){
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
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
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function initColorBuffer(gl)  {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    const colors = [
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
        1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,
        1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,
        0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}

export { initBuffers };