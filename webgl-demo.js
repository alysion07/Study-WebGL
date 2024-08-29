main();

// 
// start here 
// 
function main() {
    const canvas = document.querySelector("#c");
    
    const gl= canvas.getContext("webgl");
    if(gl === null){
        alert(
            "Unable to initialize WebGL. Your browser or machine may not support it."
        );
        return;
    }

    gl.clearColor(1.0, 0.7, 0.8, 1.0)   ;
    gl.clear(gl.COLOR_BUFFER_BIT);
}