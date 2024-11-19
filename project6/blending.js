//Tejas Bhadoria
//CS 435, Project #6
//I couldn't source images directly because of webgl's CORS restrictions in browsers so had to convert them into base64 and include them in assets.js

// Shader source code for vertex and fragment shaders
// The vertex shader handles vertex positions, texture coordinates, and normals
const vsSource = `
    // Input vertex attributes
    attribute vec3 aVertexPosition;  // Position of each vertex
    attribute vec2 aTextureCoord;    // Texture coordinates
    attribute vec3 aNormal;          // Normal vector for lighting

    // Transformation matrices
    uniform mat4 uModelViewMatrix;   // Combined model and view matrix
    uniform mat4 uProjectionMatrix;  // Projection matrix

    // Output variables to fragment shader
    varying highp vec2 vTextureCoord;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Flag to determine if normals should be used (for 3D objects)
    uniform bool uUseNormals;
    
    void main(void) {
        if (uUseNormals) {
            vNormal = aNormal;
            vPosition = (uModelViewMatrix * vec4(aVertexPosition, 1.0)).xyz;
        }
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
    }
`;

// Fragment shader handles texture mapping and lighting calculations
const fsSource = `
    precision mediump float;

    // Input variables from vertex shader
    varying highp vec2 vTextureCoord;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Texture samplers for different materials
    uniform sampler2D uWallSampler;
    uniform sampler2D uFloorSampler;
    uniform sampler2D uTableSampler;
    uniform sampler2D uTVSampler;

    // Object properties
    uniform int uObjectType;         // Determines which texture to use
    uniform bool uUseNormals;        // Whether to use lighting calculations
    uniform vec3 uColor;             // Base color for 3D objects
    uniform float uAlpha;            // Transparency value

    void main(void) {
        if (uUseNormals) {
            // Lighting calculations for 3D objects
            vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
            vec3 normal = normalize(vNormal);
            vec3 viewDirection = normalize(-vPosition);
            float facing = dot(normal, viewDirection);
            
            // Flip normal if needed for back-face lighting
            if (facing < 0.0) {
                normal = -normal;
                lightDirection = -lightDirection;
            }
            
            // Calculate lighting components
            float diffuse = max(dot(normal, lightDirection), 0.0);
            vec3 reflection = reflect(-lightDirection, normal);
            float specular = pow(max(dot(viewDirection, reflection), 0.0), 16.0) * 0.3;
            float fresnel = pow(1.0 - abs(dot(viewDirection, normal)), 2.0) * 0.2;
            
            // Combine lighting components
            vec3 ambient = uColor * 0.3;
            vec3 diffuseColor = uColor * diffuse * 0.7;
            vec3 specularColor = vec3(1.0) * specular;
            vec3 fresnelColor = vec3(0.9) * fresnel;
            
            vec3 finalColor = ambient + diffuseColor + specularColor + fresnelColor;
            gl_FragColor = vec4(finalColor, uAlpha);
        } else {
            // Texture mapping for room objects
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
    }
`;

// Initialize WebGL context and canvas
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
let sphereVisible = true;

// UI Controls setup
const toggleButton = document.getElementById("toggleButton");
toggleButton.addEventListener("click", () => {
    sphereVisible = !sphereVisible;
    toggleButton.textContent = sphereVisible ? "Remove Ball" : "Add Ball";
});

// Shader initialization functions
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    // Create and link shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader program initialization failed:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}


// Room geometry initialization
function initRoomBuffers(gl) {
    // Define vertices for room geometry (floor, walls, table, TV)
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
    
    // Create and initialize WebGL buffers
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

// Texture loading and initialization
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

// 3D cylindrical cup creation function
function createCup(radius, height, segments) {
    const positions = [];
    const normals = [];
    const indices = [];

    // Create the vertices for the outer wall
    for (let i = 0; i <= segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const x = Math.cos(angle);
        const z = Math.sin(angle);

        // Outer wall 
        positions.push(radius * x, 0, radius * z); // Bottom ring
        positions.push(radius * x, height, radius * z); // Top ring

        // Normals pointing outward for the walls
        normals.push(x, 0, z);
        normals.push(x, 0, z);
    }

    // Create indices for the sides with correct winding order
    for (let i = 0; i < segments; i++) {
        const bottom1 = i * 2;
        const top1 = i * 2 + 1;
        const bottom2 = (i + 1) * 2;
        const top2 = (i + 1) * 2 + 1;

        // Maintain counter-clockwise winding order
        indices.push(bottom1, bottom2, top1);
        indices.push(top1, bottom2, top2);
    }

    // Add base vertices
    const baseCenterIndex = positions.length / 3;
    positions.push(0, 0, 0); // Center of the base
    normals.push(0, -1, 0); // Normal pointing downward

    // Create base vertices
    const baseStartIndex = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const x = Math.cos(angle);
        const z = Math.sin(angle);

        positions.push(radius * x, 0, radius * z);
        normals.push(0, -1, 0); // All base normals point down
    }

    // Create base triangles 
    for (let i = 0; i < segments; i++) {
        const current = baseStartIndex + i;
        const next = baseStartIndex + i + 1;
        indices.push(baseCenterIndex, next, current); // Counter-clockwise winding
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices)
    };
}



// 3D sphere ball creation function
function createSphere(radius, latitudeBands, longitudeBands) {
    const positions = [];
    const normals = [];
    const indices = [];
    
    // Generate vertices
    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = (lat * Math.PI) / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = (lon * 2 * Math.PI) / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            // Calculate position
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            // Use position as normal for sphere
            normals.push(x, y, z);
            positions.push(radius * x, radius * y, radius * z);
        }
    }
    
    // Generate indices
    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let lon = 0; lon < longitudeBands; lon++) {
            const first = lat * (longitudeBands + 1) + lon;
            const second = first + longitudeBands + 1;
            
            // Counter-clockwise
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices)
    };
}

// Create the objects with appropriate dimensions
const sphere = createSphere(0.4, 30, 30); // Set sphere setttings
const cup = createCup(0.3, 0.6, 30); // Set cup settings

// Initialize buffers for the sphere
function initSphereBuffers(gl, sphere) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
    
    return {
        position: positionBuffer,
        normal: normalBuffer,
        indices: indexBuffer,
        vertexCount: sphere.indices.length
    };
}

// Initialize buffers for the cup
function initCupBuffers(gl, cup) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cup.positions, gl.STATIC_DRAW);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cup.normals, gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cup.indices, gl.STATIC_DRAW);
    
    return {
        position: positionBuffer,
        normal: normalBuffer,
        indices: indexBuffer,
        vertexCount: cup.indices.length
    };
}

// Initialize program and get attribute/uniform locations
const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        normal: gl.getAttribLocation(shaderProgram, 'aNormal')
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uWallSampler: gl.getUniformLocation(shaderProgram, 'uWallSampler'),
        uFloorSampler: gl.getUniformLocation(shaderProgram, 'uFloorSampler'),
        uTableSampler: gl.getUniformLocation(shaderProgram, 'uTableSampler'),
        uTVSampler: gl.getUniformLocation(shaderProgram, 'uTVSampler'),
        uObjectType: gl.getUniformLocation(shaderProgram, 'uObjectType'),
        uUseNormals: gl.getUniformLocation(shaderProgram, 'uUseNormals'),
        uColor: gl.getUniformLocation(shaderProgram, 'uColor'),
        uAlpha: gl.getUniformLocation(shaderProgram, 'uAlpha')
    },
};

// Initialize all buffers
const roomBuffers = initRoomBuffers(gl);
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

/// Buffers for sphere
const spherePositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);

const sphereNormalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);

const sphereIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

// Buffers for cup
const cupPositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cupPositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cup.positions), gl.STATIC_DRAW);

const cupNormalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cupNormalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cup.normals), gl.STATIC_DRAW);

const cupIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cupIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cup.indices), gl.STATIC_DRAW);

// Matrix setup
const fieldOfView = 45 * Math.PI / 180;
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const zNear = 0.1;
const zFar = 100.0;
const projectionMatrix = mat4.create();
const modelViewMatrix = mat4.create();
mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);


// Camera controls
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

function drawScene() {
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Use the shader program
    gl.useProgram(programInfo.program);

    // Update projection and view matrices
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, zoom]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0, 1, 0]);

    // Set shared uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    // Draw room
    gl.uniform1i(programInfo.uniformLocations.uUseNormals, false);
    
    // Set up vertex attributes for room
    gl.bindBuffer(gl.ARRAY_BUFFER, roomBuffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, roomBuffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, roomBuffers.indices);

    // Draw floor
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    gl.uniform1i(programInfo.uniformLocations.uFloorSampler, 0);
    gl.uniform1i(programInfo.uniformLocations.uObjectType, 1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Draw walls
    gl.bindTexture(gl.TEXTURE_2D, wallTexture);
    gl.uniform1i(programInfo.uniformLocations.uObjectType, 0);
    gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 12);

    // Draw table
    gl.bindTexture(gl.TEXTURE_2D, tableTexture);
    gl.uniform1i(programInfo.uniformLocations.uObjectType, 2);
    gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_SHORT, 48);

    // Draw TV screen
    gl.bindTexture(gl.TEXTURE_2D, tvOn ? tvVideoTexture : tvOffTexture);
    gl.uniform1i(programInfo.uniformLocations.uObjectType, 3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 96);

    // Enable normal attributes for 3D objects
    gl.uniform1i(programInfo.uniformLocations.uUseNormals, true);

    // Create buffer objects for sphere and cup
    const sphereBuffers = {
        position: spherePositionBuffer,
        normal: sphereNormalBuffer,
        indices: sphereIndexBuffer,
        vertexCount: sphere.indices.length
    };

    const cupBuffers = {
        position: cupPositionBuffer,
        normal: cupNormalBuffer,
        indices: cupIndexBuffer,
        vertexCount: cup.indices.length
    };

    if (sphereVisible) {
        // Draw the sphere (opaque)
        const sphereModelViewMatrix = mat4.create();
        mat4.copy(sphereModelViewMatrix, modelViewMatrix);
        mat4.translate(sphereModelViewMatrix, sphereModelViewMatrix, [-1.2, 0.11, -1.5]);
        mat4.scale(sphereModelViewMatrix, sphereModelViewMatrix, [0.25, 0.25, 0.25]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, sphereModelViewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normal);
        gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.indices);
        gl.uniform3fv(programInfo.uniformLocations.uColor, [0.2, 0.2, 1.0]);
        gl.uniform1f(programInfo.uniformLocations.uAlpha, 1.0);
        gl.drawElements(gl.TRIANGLES, sphereBuffers.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
    
    // Enable blending for translucent objects
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Draw the translucent cup after ball
    const cupModelViewMatrix = mat4.create();
    mat4.copy(cupModelViewMatrix, modelViewMatrix);
    mat4.translate(cupModelViewMatrix, cupModelViewMatrix, [-1.2, 0.01, -1.5]);
    mat4.scale(cupModelViewMatrix, cupModelViewMatrix, [0.5, 0.5, 0.5]);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, cupModelViewMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, cupBuffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cupBuffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cupBuffers.indices);
    gl.uniform3fv(programInfo.uniformLocations.uColor, [0.8, 0.8, 0.8]);
    gl.uniform1f(programInfo.uniformLocations.uAlpha, 0.5);
    gl.drawElements(gl.TRIANGLES, cupBuffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}

function render() {
    drawScene();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);