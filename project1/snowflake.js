//CS 435
//Project #1
//Tejas Bhadoria

//This code generates and displays Koch Snowflake using webgl, first I initialized some valid x and y coordinates of an equilateral triangle, then I setted up webgl context, shaders and buffers
//the vertex shader are responsible for the positioning of the snowflake while the fragment is for colour, Users can adjust the iterations they want to perform using a button, then there is a
//function that finds the third vertex of our smaller equilateral triangles outside the bigger triangle, then we find the remaining two vertices on each sides, then we use recursion to do it for
//n iterations.


// Initialize global variables
let points = [
    [-0.5, 0],
    [0.5, 0],
    [0, 0.5 * Math.sqrt(3)]
];
let iterations = 0;  // Start at 0 iterations
let vertices = [];

// Function to create the WebGL context and its error handling
function initWebGL(canvas) {
    let gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported, falling back on experimental-webgl");
        gl = canvas.getContext("experimental-webgl");
    }
    if (!gl) {
        alert("Your browser does not support WebGL");
    }
    return gl;
}

// Function to compile a shader from source and its error handling
function compileShader(gl, sourceCode, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to create and link a shader program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// Function to find the third vertex to create the smaller equilateral triangles
function findThirdVertex(x1, y1, x2, y2) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const lengthAB = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const height = Math.sqrt(3) / 2 * lengthAB;

    const dx = (height * (y2 - y1)) / lengthAB;
    const dy = (height * (x2 - x1)) / lengthAB;

    return [midX + dx, midY - dy];
}

// Function to recursively generate the Koch snowflake's vertices
function generateKochSnowflake(p1, p2, iter) {
    if (iter === 0) {
        vertices.push(p1[0], p1[1]);
        vertices.push(p2[0], p2[1]);
    } else {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const s1 = [p1[0] + dx / 3, p1[1] + dy / 3];
        const s2 = [p1[0] + 2 * dx / 3, p1[1] + 2 * dy / 3];
        const s3 = findThirdVertex(s1[0], s1[1], s2[0], s2[1]);
        
        generateKochSnowflake(p1, s1, iter - 1);
        generateKochSnowflake(s1, s3, iter - 1);
        generateKochSnowflake(s3, s2, iter - 1);
        generateKochSnowflake(s2, p2, iter - 1);
    }
}

// Function to initialize and draw the snowflake
function initSnowflake() {
    const canvas = document.getElementById("glCanvas");
    const gl = initWebGL(canvas);

    // Set the canvas size to match the window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Vertex shader program
    const vsSource = `
        attribute vec2 aPosition;
        void main(void) {
            vec2 position = aPosition;
            position.y -= 0.1; // Shifting snowflake downward
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment shader program
    const fsSource = `
        void main(void) {
            gl_FragColor = vec4(0.776, 0.984, 1.0, 1.0); // #c6fbff in RGBA
        }
    `;

    const shaderProgram = createProgram(gl, vsSource, fsSource);
    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    // Clear the previous vertices and generate new ones for the current iteration
    vertices = [];
    generateKochSnowflake(points[0], points[1], iterations);
    generateKochSnowflake(points[1], points[2], iterations);
    generateKochSnowflake(points[2], points[0], iterations);

    // Create buffer and load the vertex data into WebGL
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Specify the format of the vertex data
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear the canvas and draw the snowflake
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, vertices.length / 2);
}

// Function to update the snowflake when iteration count changes
function updateSnowflake() {
    document.getElementById("iterationCount").innerText = `Iterations: ${iterations}`;
    initSnowflake();
}

// Event listeners for buttons to increase/decrease iterations
document.getElementById("increase").addEventListener("click", () => {
    if (iterations < 10) { // Limit max iterations to 10 for performance reasons
        iterations++;
        updateSnowflake();
    }
});

document.getElementById("decrease").addEventListener("click", () => {
    if (iterations > 0) {
        iterations--;
        updateSnowflake();
    }
});

// Run the initial snowflake render on page load
window.onload = initSnowflake;
