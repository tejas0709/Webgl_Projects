//Tejas Bhadoria
//CS435, Project #4

const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");

let spotlightPosition = [0, 6, 0];  // Initial spotlight position
let spotlightDirection = [0, -1, 0];  // Spotlight pointing down
let spotlightCutoff = 6;           // Initial cutoff angle in degrees
let cameraPosition = [0.0, 12.0, 2.0]; // Initial camera position

let program;  // Declare program globally
let vertexBuffer, outlineBuffer;  // Declare buffers globally

let vertices, vertices1;  // Declare vertices globally

function start() {
    if (!gl) {
        alert("WebGL not supported.");
        return;
    }

    //Creating an outline of the room to enhance 3-d view
    vertices1 = new Float32Array([
       //Wall ABC
       -6.0,  4.5, -4.0,  6.0,  4.5, -4.0,  //top
       -6.0,  0.0, -4.0,  6.0,  0.0, -4.0,  //bottom
       6.0,  4.5, -4.0,  6.0,  0.0, -4.0,  //right
       //Wall AD
       -6.0,  4.5,  4.0, -6.0,  4.5, -4.0,  //top
       -6.0,  0.0, -4.0, -6.0,  0.0,  4.0,  //bottom
       -6.0,  4.5, -4.0, -6.0,  0.0, -4.0,  //right
       -6.0,  0.0,  4.0, -6.0,  4.5,  4.0,  //left
       //Wall CF
       6.0,  4.5, -4.0,  6.0,  4.5,  4.0,   //top
       6.0,  0.0, -4.0,  6.0,  0.0,  4.0,  //bottom
       6.0,  4.5,  4.0,  6.0,  0.0,  4.0,  //right
       //Wall DE
       -6.0,  4.5,  4.0,  -2.0,  4.5,  4.0,  //top
       -6.0,  0.0,  4.0, -2.0,  0.0,  4.0,  //bottom
       //Wall EF
       6.0,  4.5,  4.0,  2.0,  4.5,  4.0,  //top
       6.0,  0.0,  4.0,  2.0,  0.0,  4.0,  //bottom
       2.0,  4.5,  4.0,  2.0,  0.0,  4.0,  //right
       -2.0,  4.5,  4.0,  -2.0,  0.0,  4.0,  //left
       //Inner Walls
       -2.0,  4.5,  4.0,  -2.0,  4.5,  0.0,
       -2.0,  0.0,  4.0,  -2.0,  0.0,  0.0,
       2.0,  4.5,  4.0,  2.0,  4.5,  0.0,
       2.0,  0.0,  4.0,  2.0,  0.0,  0.0,
       -2.0,  4.5,  0.0,  2.0,  4.5,  0.0,
       -2.0,  0.0,  0.0,  2.0,  0.0,  0.0,
       -2.0,  4.5,  0.0,  -2.0,  0.0,  0.0,
       2.0,  4.5,  0.0,  2.0,  0.0,  0.0
    ]);
      
    //Filling the surface area with triangles
    vertices = new Float32Array([
        //Floor (surface)
        -6.0,  0.0,  -4.0,  6.0,  0.0,  -4.0,  6.0,  0.0,  0.0,
        -6.0,  0.0,  -4.0,  6.0,  0.0,  0.0,  -6.0,  0.0,  0.0,
        -6.0,  0.0,  4.0,  -2.0,  0.0,  4.0,  -6.0,  0.0,  0.0,
        -2.0,  0.0,  4.0,  -2.0,  0.0,  0.0,  -6.0,  0.0,  0.0,
        2.0,  0.0,  4.0,  6.0,  0.0,  4.0,  2.0,  0.0,  0.0,
        6.0,  0.0,  4.0,  2.0,  0.0,  0.0,  6.0,  0.0,  0.0,
       // Wall ABC (surface)
       -6.0,  4.5, -4.0,  6.0,  4.5, -4.0, -6.0,  0.0, -4.0, 
       -6.0,  0.0, -4.0,  6.0,  0.0, -4.0,  6.0,  4.5,  -4.0,
       //Wall AD (surface)
       -6.0,  4.5,  4.0, -6.0,  4.5, -4.0,  -6.0,  0.0, -4.0,
       -6.0,  0.0, -4.0, -6.0,  0.0,  4.0,  -6.0,  4.5,  4.0,
       // Wall CF (surface)
       6.0,  4.5, -4.0,  6.0,  4.5,  4.0,  6.0,  0.0,  4.0,
       6.0,  0.0, -4.0,  6.0,  0.0,  4.0,  6.0,  4.5, -4.0,
       // Wall DE (surface)
       -6.0,  4.5,  4.0,  -2.0,  4.5,  4.0,  -6.0,  0.0, 4.0,
       -6.0,  0.0,  4.0, -2.0,  0.0,  4.0,  -2.0,  4.5,  4.0,  
       // Wall EF (surface)
       6.0,  4.5,  4.0,  2.0,  4.5,  4.0,  2.0,  0.0,  4.0,  
       6.0,  0.0,  4.0,  2.0,  0.0,  4.0,  6.0,  4.5,  4.0,
       // Inner Walls (surface)
       -2.0,  4.5,  4.0,  -2.0,  4.5,  0.0, -2.0,  0.0,  0.0,
       -2.0,  0.0,  4.0,  -2.0,  0.0,  0.0, -2.0,  4.5,  4.0,
       2.0,  4.5,  4.0,  2.0,  4.5,  0.0,  2.0,  0.0,  0.0,
       2.0,  0.0,  4.0,  2.0,  0.0,  0.0,  2.0,  4.5,  4.0,
       -2.0,  4.5,  0.0,  2.0,  4.5,  0.0,  2.0,  0.0,  0.0,
       -2.0,  0.0,  0.0,  2.0,  0.0,  0.0,  -2.0,  4.5,  0.0
    ]);

    // Create and bind buffers for the vertices (walls and outlines)
    vertexBuffer = gl.createBuffer();
    outlineBuffer = gl.createBuffer();

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Initialize program globally here
    program = createProgram(gl, vertexShader, fragmentShader);
    
    const positionLocation = gl.getAttribLocation(program, "a_position");

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);

    // Attach event listeners for the UI elements
    
    document.getElementById("spotlightPosition").addEventListener("change", updateSpotlightPosition);
    document.getElementById("cameraPosition").addEventListener("change", updateCameraPosition);
    document.getElementById("increaseCutoff").addEventListener("click", () => changeCutoff(1));
    document.getElementById("decreaseCutoff").addEventListener("click", () => changeCutoff(-1));
    document.getElementById("moveLeft").addEventListener("click", () => moveSpotlight("left"));
    document.getElementById("moveRight").addEventListener("click", () => moveSpotlight("right"));
    document.getElementById("moveUp").addEventListener("click", () => moveSpotlight("up"));
    document.getElementById("moveDown").addEventListener("click", () => moveSpotlight("down"));

    requestAnimationFrame(render);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const u_matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const u_spotlightPosLocation = gl.getUniformLocation(program, "u_spotlightPosition");
    const u_spotlightDirLocation = gl.getUniformLocation(program, "u_spotlightDirection");
    const u_spotlightCutoffLocation = gl.getUniformLocation(program, "u_spotlightCutoff");
    const u_spotlightColorLocation = gl.getUniformLocation(program, "u_spotlightColor");

    // Setup projection and model-view matrix
    const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    const modelViewMatrix = mat4.lookAt(mat4.create(), cameraPosition, [0, 0, 0], [0, 1, 0]);


    const finalMatrix = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(u_matrixLocation, false, finalMatrix);

    // Set spotlight properties
    gl.uniform3fv(u_spotlightPosLocation, spotlightPosition);
    gl.uniform3fv(u_spotlightDirLocation, spotlightDirection);
    gl.uniform1f(u_spotlightCutoffLocation, spotlightCutoff);
    gl.uniform3fv(u_spotlightColorLocation, [1.0, 1.0, 0.0]);

    // Render filled walls with a light color
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);  // Upload vertices to GPU
    gl.vertexAttribPointer(gl.getAttribLocation(program, "a_position"), 3, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_isOutline"), 0);  // Render walls
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

    // Render black outlines
    gl.bindBuffer(gl.ARRAY_BUFFER, outlineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices1, gl.STATIC_DRAW);  // Upload outline vertices to GPU
    gl.vertexAttribPointer(gl.getAttribLocation(program, "a_position"), 3, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_isOutline"), 1);  // Render outlines
    gl.drawArrays(gl.LINES, 0, vertices1.length / 3);

    requestAnimationFrame(render);
}


function updateSpotlightPosition(event) {
    const position = parseInt(event.target.value);
    switch (position) {
        case 1: spotlightPosition = [-4, 4.5, 2]; spotlightDirection = [0.01, -1, 1]; break; // Position 1 in top-left
        case 2: spotlightPosition = [-4, 4.5, -2]; spotlightDirection = [0.1, 1, 7]; break;  // Position 2 at mid-left
        case 3: spotlightPosition = [0, 4.5, -2]; spotlightDirection = [0, 1, 7]; break;       // Center spotlight
        case 4: spotlightPosition = [4, 4.5, -2]; spotlightDirection = [-0.1, 1, 7]; break;  // Position 4 in top-right
        case 5: spotlightPosition = [4, 4.5, 2]; spotlightDirection = [-0.01, -1, 1]; break;   // Position 5 at mid-right
    }
}


function updateCameraPosition(event) {
    const position = event.target.value;
    switch (position) {
        case 'A': cameraPosition = [-6, 6, -4]; break;
        case 'B': cameraPosition = [0, 6, -4]; break;
        case 'C': cameraPosition = [6, 6, -4]; break;
        case 'D': cameraPosition = [-6, 6, 4]; break;
        case 'E': cameraPosition = [0, 6, 4]; break;
        case 'F': cameraPosition = [6, 6, 4]; break;
    }
}

function changeCutoff(delta) {
    spotlightCutoff += delta;
    spotlightCutoff = Math.max(5.0, Math.min(45.0, spotlightCutoff));  // Limit to a reasonable range
}

function moveSpotlight(direction) {
    const movement = 0.04;
    if (direction === "left") spotlightDirection[0] -= movement;
    if (direction === "right") spotlightDirection[0] += movement;
    if (direction === "up") spotlightDirection[2] -= movement;
    if (direction === "down") spotlightDirection[2] += movement;

}


// Utility functions for shader creation
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}


const vertexShaderSource = `
attribute vec4 a_position;
uniform mat4 u_matrix;
varying vec3 v_fragPosition;

void main() {
    gl_Position = u_matrix * a_position;
    v_fragPosition = (u_matrix * a_position).xyz;  // Pass the fragment position in world coordinates
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec3 u_spotlightPosition;
uniform vec3 u_spotlightDirection;
uniform float u_spotlightCutoff;  // In degrees
uniform vec3 u_spotlightColor;  
uniform int u_isOutline;
varying vec3 v_fragPosition;  // Fragment's world position

void main() {
    if (u_isOutline == 1) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);  // Black color for outlines
    } else {
      
    vec3 lightDir = normalize(u_spotlightPosition - v_fragPosition);  // Direction from spotlight to fragment
    float spotEffect = dot(lightDir, normalize(-u_spotlightDirection));  // Cosine of angle
    float cutoffRadians = radians(u_spotlightCutoff);  // Convert cutoff to radians
    if (spotEffect > cos(cutoffRadians)) {
        gl_FragColor = vec4(u_spotlightColor, 1.0);  // Bright light inside the cone
    } else {
        gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);  // Dim light outside the cone
    }

    }
}
`;

start();
