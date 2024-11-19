//Tejas Bhadoria
//CS 435, Project #5
//I couldn't source images directly because of webgl's CORS restrictions in browsers so had to convert them into base64 and include them in assets.js

const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert("WebGL not supported in this browser!");
}

// Vertex shader program
const vsSource = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
    }
`;

// Fragment shader program
const fsSource = `
precision mediump float;
varying highp vec2 vTextureCoord;
uniform sampler2D uWallSampler;
uniform sampler2D uFloorSampler;
uniform sampler2D uTableSampler;
uniform sampler2D uTVSampler;
uniform int uObjectType; // 0 = wall, 1 = floor, 2 = table, 3 = TV
void main(void) {
    if (uObjectType == 1) {
        gl_FragColor = texture2D(uFloorSampler, vTextureCoord);
    } else if (uObjectType == 2) {
        gl_FragColor = texture2D(uTableSampler, vTextureCoord);
    } else if (uObjectType == 3) {
        gl_FragColor = texture2D(uTVSampler, vTextureCoord);
    } else {
        gl_FragColor = texture2D(uWallSampler, vTextureCoord);
    }
}
`;

// Initialize shader program
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize shader program:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Initialize buffers with indexed drawing
function initBuffers(gl) {
    const positions = [
      // Floor
      -3.0, -1.0,  2.0,   // Bottom-left corner
       3.0, -1.0,  2.0,   // Bottom-right corner
       3.0, -1.0, -2.0,   // Top-right corner
      -3.0, -1.0, -2.0,   // Top-left corner
  
      // Back wall
      -3.0, -1.0, -2.0,   // Bottom-left corner of the back wall
       3.0, -1.0, -2.0,   // Bottom-right corner
       3.0,  2.0, -2.0,   // Top-right corner
      -3.0,  2.0, -2.0,   // Top-left corner
  
      // Left wall
      -3.0, -1.0,  2.0,   // Bottom-right corner facing left
      -3.0, -1.0, -2.0,   // Bottom-left corner facing left
      -3.0,  2.0, -2.0,   // Top-left corner facing left
      -3.0,  2.0,  2.0,   // Top-right corner facing left
  
      // Right wall
       3.0, -1.0,  2.0,   // Bottom-left corner facing right
       3.0, -1.0, -2.0,   // Bottom-right corner facing right
       3.0,  2.0, -2.0,   // Top-right corner facing right
       3.0,  2.0,  2.0,   // Top-left corner facing right
  
      // Table top
      -1.5,  0.0, -1.0,   // Front-left corner
       1.5,  0.0, -1.0,   // Front-right corner
       1.5,  0.0, -2.0,   // Back-right corner
      -1.5,  0.0, -2.0,   // Back-left corner
  
       // Front face of table
      -1.5, -1.0, -1.0,   // Bottom-left corner
       1.5, -1.0, -1.0,   // Bottom-right corner
       1.5,  0.0, -1.0,   // Top-right corner
      -1.5,  0.0, -1.0,   // Top-left corner
     
       // Left face of table
      -1.5, -1.0, -2.0,   // Bottom-left corner
      -1.5, -1.0, -1.0,  // Bottom-right corner
      -1.5,  0.0, -1.0,   // Top-right corner
      -1.5,  0.0, -2.0,   // Top-left corner
      
      // Right face of table
       1.5, -1.0, -1.0,   // Bottom-left corner
       1.5, -1.0, -2.0,   // Bottom-right corner
       1.5,  0.0, -2.0,   // Top-right corner
       1.5,  0.0, -1.0,   // Top-left corner
       
       // TV screen
      -1.0,  0.0, -1.7,   // Bottom-left corner
       1.0,  0.0, -1.7,   // Bottom-right corner
       1.0,  1.0, -1.7,   // Top-right corner
      -1.0,  1.0, -1.7,   // Top-left corner

  ];
  
  const textureCoordinates = [
      // Floor
      0.0, 0.0,
      1.5, 0.0,
      1.5, 1.5,
      0.0, 1.5,
  
      // Back wall
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.5,
      0.0, 1.5,
  
      // Left wall
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.5,
      0.0, 1.5,
  
      // Right wall
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.5,
      0.0, 1.5,
  
      // Table top
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
  
      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
  
      // Right face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
  
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // TV screen
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
  ];
  
  const indices = [
      0, 1, 2,      0, 2, 3,    // Floor
      4, 5, 6,      4, 6, 7,    // Back wall
      8, 9, 10,     8, 10, 11,  // Left wall
      12, 13, 14,   12, 14, 15, // Right wall
      16, 17, 18,   16, 18, 19, // Table top
      20, 21, 22,   20, 22, 23, // Front face of the table
      24, 25, 26,   24, 26, 27, // Left face of the table
      28, 29, 30,   28, 30, 31,  // Right face of the table
      32, 33, 34,   32, 34, 35, // TV screen
  ];
  
  
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
      const textureCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
      return {
          position: positionBuffer,
          textureCoord: textureCoordBuffer,
          indices: indexBuffer,
          vertexCount: indices.length,
      };
  }

// Load texture
function loadTexture(gl, data) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture wrapping and filtering parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Load image data from the Base64 string
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = data; // Set Base64 data as the source

    return texture;
}


const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uWallSampler: gl.getUniformLocation(shaderProgram, 'uWallSampler'),
        uFloorSampler: gl.getUniformLocation(shaderProgram, 'uFloorSampler'),
        uTableSampler: gl.getUniformLocation(shaderProgram, 'uTableSampler'),
        uTVSampler: gl.getUniformLocation(shaderProgram, 'uTVSampler'),
        uObjectType: gl.getUniformLocation(shaderProgram, 'uObjectType'),
    },
};

const buffers = initBuffers(gl);
// Load textures for the wall, floor, table, and TV
const wallTexture = loadTexture(gl, assets.wallTexture);
const floorTexture = loadTexture(gl, assets.floorTexture);
const tableTexture = loadTexture(gl, assets.tableTexture);
const tvOffTexture = loadTexture(gl, assets.tvOffTexture); // Placeholder for screen off texture
const tvVideoTexture = gl.createTexture(); // Texture for video frame updates

gl.bindTexture(gl.TEXTURE_2D, tvVideoTexture);

// Set up texture parameters once
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

const fieldOfView = 45 * Math.PI / 180;
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const zNear = 0.1;
const zFar = 100.0;
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

const modelViewMatrix = mat4.create();
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);

let rotation = [0, 0];
let zoom = -7;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

canvas.addEventListener("mousedown", (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        rotation[0] += deltaY * 0.01;
        rotation[1] += deltaX * 0.01;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
});
canvas.addEventListener("mouseup", () => { isDragging = false; });
canvas.addEventListener("wheel", (event) => { zoom += event.deltaY * 0.01; });

// TV control elements and logic
let tvOn = false;
const video = document.getElementById("tv-video");
video.src = assets.tvVideoTexture;
video.load();
const powerButton = document.getElementById("power-button");
const playPauseButton = document.getElementById("play-pause-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");

powerButton.addEventListener("click", () => {
    tvOn = !tvOn;
    if (tvOn) {
        video.play();
        updateVideoTexture();
    } else {
        video.pause();
        gl.bindTexture(gl.TEXTURE_2D, tvVideoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tvOffTexture);
    }
});

playPauseButton.addEventListener("click", () => {
    if (tvOn) {
        if (video.paused) {
            video.play();
            updateVideoTexture();
        } else {
            video.pause();
        }
    }
});

prevButton.addEventListener("click", () => {
    if (tvOn) {
        video.currentTime = Math.max(0, video.currentTime - 10); // Rewind 10 seconds
    }
});

nextButton.addEventListener("click", () => {
    if (tvOn) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10); // Forward 10 seconds
    }
});

// Update video texture
function updateVideoTexture() {
    if (tvOn && !video.paused && !video.ended) {
        gl.bindTexture(gl.TEXTURE_2D, tvVideoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        requestAnimationFrame(updateVideoTexture);
    }
}

function resizeCanvasToDisplaySize(canvas) {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

// Render scene with TV update
function drawScene(gl, programInfo, buffers, wallTexture, floorTexture, tableTexture, tvOffTexture, tvVideoTexture) {
    resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Set up the perspective matrix
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  mat4.identity(modelViewMatrix);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, zoom]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0, 1, 0]);

  // Bind position buffer
  {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Bind texture coordinate buffer
  {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, numComponents, type, normalize, stride, offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  // Bind the index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Use the program
  gl.useProgram(programInfo.program);

  // Set the projection and model view matrices
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

  // Draw the floor
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.uniform1i(programInfo.uniformLocations.uFloorSampler, 0);
  gl.uniform1i(gl.getUniformLocation(programInfo.program, 'uObjectType'), 1);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // Draw the walls
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(gl.getUniformLocation(programInfo.program, 'uObjectType'), 0);
  gl.drawElements(gl.TRIANGLES, 6 * 3, gl.UNSIGNED_SHORT, 6 * 2);  // Adjust offset based on index count

  // Draw the table
  gl.bindTexture(gl.TEXTURE_2D, tableTexture);
  gl.uniform1i(gl.getUniformLocation(programInfo.program, 'uObjectType'), 2);
  gl.drawElements(gl.TRIANGLES, 6 * 4, gl.UNSIGNED_SHORT, 24 * 2);  // Adjust offset for the table

    // Render the TV with either the video or the off texture
    // Draw the TV screen
    gl.bindTexture(gl.TEXTURE_2D, tvOn ? tvVideoTexture : tvOffTexture);
    gl.uniform1i(gl.getUniformLocation(programInfo.program, 'uObjectType'), 3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 48 * 2);
}

function render() {
    drawScene(gl, programInfo, buffers, wallTexture, floorTexture, tableTexture, tvOffTexture, tvVideoTexture);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
