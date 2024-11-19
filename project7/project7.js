//Tejas Bhadoria
//CS 435, Project #7
//This is a 3d webgl model of solar system with 8 planets and a sun, I put a lot of effort into textures and detailing as you can see they are all accurate to the real thing, from rotation speed to revolution speed to saturn's rings, when you zoom on to sun you can actually see the solar flares refracting of its surface. I tried to make it as accurate as I could. I couldn't source images directly because of webgl's CORS restrictions in browsers so had to convert them into base64 and include them in assets.js

// Initialize WebGL context
const canvas = document.querySelector("#glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL not available");
    throw new Error("WebGL not available");
}

// Background vertex shader
const backgroundVsSource = `
    attribute vec4 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;

    void main() {
        gl_Position = aPosition;
        vTexCoord = aTexCoord;
    }
`;

// Background fragment shader
const backgroundFsSource = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D uBackgroundTexture;

    void main() {
        gl_FragColor = texture2D(uBackgroundTexture, vTexCoord);
    }
`;

// Create and initialize background rendering
function initBackground(gl) {
    // Create shader program for background
    const backgroundProgram = initShaderProgram(gl, backgroundVsSource, backgroundFsSource);

    // Get attribute and uniform locations
    const backgroundProgramInfo = {
        program: backgroundProgram,
        attribLocations: {
            position: gl.getAttribLocation(backgroundProgram, 'aPosition'),
            texCoord: gl.getAttribLocation(backgroundProgram, 'aTexCoord'),
        },
        uniformLocations: {
            backgroundTexture: gl.getUniformLocation(backgroundProgram, 'uBackgroundTexture'),
        },
    };

    // Create a plane that fills the screen
    const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
    ]);

    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    ]);

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Create and bind texture coordinate buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Load background texture
    const backgroundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 255]));

    const backgroundImage = new Image();
    backgroundImage.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    backgroundImage.src = textureData.background;
    
    return {
        programInfo: backgroundProgramInfo,
        buffers: {
            position: positionBuffer,
            texCoord: texCoordBuffer,
        },
        texture: backgroundTexture,
    };
}

// Initialize background
const background = initBackground(gl);

// Vertex shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTextureCoord;

    void main() {
        vPosition = (uModelViewMatrix * aVertexPosition).xyz;
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
        vTextureCoord = aTextureCoord;
    }
`;

// Fragment shader program
const fsSource = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTextureCoord;

    uniform vec3 uLightPosition;
    uniform vec3 uAmbientLight;
    uniform sampler2D uSampler;

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDirection = normalize(uLightPosition - vPosition);
        float diffuse = max(dot(normal, lightDirection), 0.0);

        vec4 texColor = texture2D(uSampler, vTextureCoord);
        vec3 color = texColor.rgb * (uAmbientLight + diffuse);

        gl_FragColor = vec4(color, texColor.a);
    }
`;

// Shader compilation utility functions
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Shader compilation error: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Shader program initialization error: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

// Create sphere geometry
function createSphere(radius, latitudeBands, longitudeBands) {
    const positions = [];
    const normals = [];
    const textureCoords = [];
    const indices = [];

    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = lon * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            textureCoords.push(lon / longitudeBands, lat / latitudeBands);
        }
    }

    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let lon = 0; lon < longitudeBands; lon++) {
            const first = lat * (longitudeBands + 1) + lon;
            const second = first + longitudeBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        textureCoords: new Float32Array(textureCoords),
        indices: new Uint16Array(indices)
    };
}

// Create ring geometry (flat disk with hole in middle)
function createRing(innerRadius, outerRadius, segments) {
    const positions = [];
    const normals = [];
    const textureCoords = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Inner vertex
        positions.push(
            innerRadius * cosTheta,
            0,
            innerRadius * sinTheta
        );
        normals.push(0, 1, 0);
        textureCoords.push(0, i / segments);

        // Outer vertex
        positions.push(
            outerRadius * cosTheta,
            0,
            outerRadius * sinTheta
        );
        normals.push(0, 1, 0);
        textureCoords.push(1, i / segments);

        // Create triangles between current and next segment
        if (i < segments) {
            const baseIndex = i * 2;
            indices.push(
                baseIndex, baseIndex + 1, baseIndex + 2,
                baseIndex + 1, baseIndex + 3, baseIndex + 2
            );
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        textureCoords: new Float32Array(textureCoords),
        indices: new Uint16Array(indices)
    };
}

// Planet class
class Planet {
    constructor(gl, radius, orbitRadius, orbitSpeed, rotationSpeed, texturePath, hasRings = false, ringTexturePath = null) {
        this.gl = gl;
        this.radius = radius;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed;
        this.rotationSpeed = rotationSpeed;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.hasRings = hasRings;

        // Create planet geometry
        const geometry = createSphere(radius, 30, 30);

        // Create planet buffers
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.textureCoords, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

        this.indexCount = geometry.indices.length;

        // Load planet texture
        this.loadTexture(texturePath);

        // Initialize rings if needed
        if (hasRings && ringTexturePath) {
            this.initializeRings(ringTexturePath);
        }
    }

    initializeRings(ringTexturePath) {
        const gl = this.gl;

        // Create ring geometry
        const ringGeometry = createRing(this.radius * 1.2, this.radius * 2.3, 100);

        // Create ring buffers
        this.ringBuffers = {
            position: gl.createBuffer(),
            normal: gl.createBuffer(),
            textureCoord: gl.createBuffer(),
            index: gl.createBuffer()
        };

        // Initialize ring buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, ringGeometry.positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, ringGeometry.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.textureCoord);
        gl.bufferData(gl.ARRAY_BUFFER, ringGeometry.textureCoords, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ringBuffers.index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ringGeometry.indices, gl.STATIC_DRAW);

        this.ringIndexCount = ringGeometry.indices.length;

        // Load ring texture
        this.ringTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.ringTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255]));

    const ringImage = new Image();
        ringImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.ringTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ringImage);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        // ringTexturePath is the base64 string
        ringImage.src = ringTexturePath;
    }

    loadTexture(path) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Placeholder color while loading
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([255, 255, 255, 255]));

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        image.src = path;

        this.texture = texture;
    }

    update(deltaTime) {
        this.angle += this.orbitSpeed * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;
    }

    drawPlanet(programInfo, modelViewMatrix, projectionMatrix, normalMatrix) {
        const gl = this.gl;

        // Set uniforms
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

        // Bind planet texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        // Bind planet buffers and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    drawRings(programInfo, modelViewMatrix, projectionMatrix, normalMatrix) {
        const gl = this.gl;

        // Set uniforms
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

        // Bind ring texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.ringTexture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        // Bind ring buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.normal);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ringBuffers.index);

        // Enable alpha blending for rings
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawElements(gl.TRIANGLES, this.ringIndexCount, gl.UNSIGNED_SHORT, 0);

        // Disable blending after drawing rings
        gl.disable(gl.BLEND);
    }

    draw(programInfo, projectionMatrix, viewMatrix) {
        const gl = this.gl;
        const modelMatrix = mat4.create();

        // Apply orbit transformation
        mat4.translate(modelMatrix, modelMatrix, [
            Math.cos(this.angle) * this.orbitRadius,
            0,
            Math.sin(this.angle) * this.orbitRadius
        ]);

        // Apply rotation
        mat4.rotate(modelMatrix, modelMatrix, this.rotation, [0, 1, 0]);

        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        // Draw planet
        this.drawPlanet(programInfo, modelViewMatrix, projectionMatrix, normalMatrix);

        // Draw rings if present
        if (this.hasRings) {
            const ringModelMatrix = mat4.create();
            mat4.translate(ringModelMatrix, modelMatrix, [0, 0, 0]);
            // Add tilt to rings
            mat4.rotate(ringModelMatrix, ringModelMatrix, Math.PI * 0.2, [1, 0, 0]);

            const ringModelViewMatrix = mat4.create();
            mat4.multiply(ringModelViewMatrix, viewMatrix, ringModelMatrix);

            const ringNormalMatrix = mat4.create();
            mat4.invert(ringNormalMatrix, ringModelViewMatrix);
            mat4.transpose(ringNormalMatrix, ringNormalMatrix);

            this.drawRings(programInfo, ringModelViewMatrix, projectionMatrix, ringNormalMatrix);
        }
    }
}

// Initialize program
const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        uLightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
        uAmbientLight: gl.getUniformLocation(shaderProgram, 'uAmbientLight'),
        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
};

// Create planets with base64 textures
const planets = [
    new Planet(gl, 5.0, 0, 0, 0.04, textureData.sun),         // Sun
    new Planet(gl, 0.2, 8, 0.3, 0.04, textureData.mercury),  // Mercury
    new Planet(gl, 0.4, 12, 0.1, -0.02, textureData.venus),    // Venus
    new Planet(gl, 0.5, 16, 0.08, 0.2, textureData.earth),    // Earth
    new Planet(gl, 0.3, 20, 0.04, 0.18, textureData.mars),     // Mars
    new Planet(gl, 3.0, 30, 0.02, 0.5, textureData.jupiter),  // Jupiter
    new Planet(gl, 2.4, 40, 0.015, 0.4, textureData.saturn, true, textureData.saturnRings),  // Saturn with rings
    new Planet(gl, 1.6, 50, 0.01, 0.3, textureData.uranus),  // Uranus
    new Planet(gl, 1.5, 60, 0.007, 0.33, textureData.neptune),  // Neptune
];

// Camera and interaction variables
let cameraRotationX = 0;
let cameraRotationY = 0;
let cameraDistance = 100;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let isAnimating = true;

// Event listeners
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    cameraRotationY += deltaX * 0.01;
    cameraRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotationX + deltaY * 0.01));

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance = Math.max(1, Math.min(200, cameraDistance + e.deltaY * 0.1));
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        isAnimating = !isAnimating;
    }
});

// Resize handler
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Render loop
let lastTime = 0;

    function render(currentTime) {
        currentTime *= 0.001;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // Draw background first
        gl.useProgram(background.programInfo.program);

        // Disable depth testing for background
        gl.disable(gl.DEPTH_TEST);

        // Bind background vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, background.buffers.position);
        gl.vertexAttribPointer(
            background.programInfo.attribLocations.position,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(background.programInfo.attribLocations.position);

        // Bind background texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, background.buffers.texCoord);
        gl.vertexAttribPointer(
            background.programInfo.attribLocations.texCoord,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(background.programInfo.attribLocations.texCoord);

        // Bind background texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, background.texture);
        gl.uniform1i(background.programInfo.uniformLocations.backgroundTexture, 0);

        // Draw background
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Re-enable depth testing for planets
        gl.enable(gl.DEPTH_TEST);

        // Continue with planet rendering
        const viewMatrix = mat4.create();
                      const cameraX = cameraDistance * Math.sin(cameraRotationY) * Math.cos(cameraRotationX);
                      const cameraY = cameraDistance * Math.sin(cameraRotationX);
                      const cameraZ = cameraDistance * Math.cos(cameraRotationY) * Math.cos(cameraRotationX);

                      mat4.lookAt(
                          viewMatrix,
                          [cameraX, cameraY, cameraZ],  // Camera position
                          [0, 0, 0],                    // Look at point
                          [0, 1, 0]                     // Up vector
                      );

                      // Set up projection matrix
                      const projectionMatrix = mat4.create();
                      const fieldOfView = 45 * Math.PI / 180;
                      const aspect = canvas.clientWidth / canvas.clientHeight;
                      mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 1000.0);

                      // Use shader program
                      gl.useProgram(programInfo.program);

                      // Set lighting uniforms
                      gl.uniform3fv(programInfo.uniformLocations.uLightPosition, [0, 0, 0]);  // Light at sun's position
                      gl.uniform3fv(programInfo.uniformLocations.uAmbientLight, [0.2, 0.2, 0.2]);

                      // Update and draw planets
                      if (isAnimating) {
                          planets.forEach(planet => planet.update(deltaTime));
                      }
                      planets.forEach(planet => planet.draw(programInfo, projectionMatrix, viewMatrix));

                      // Request next frame
                      requestAnimationFrame(render);
                  }

                  // Start the render loop
                  requestAnimationFrame(render);

                  // Helper function to load textures
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


                  // Error handling function
                  function handleContextLost(event) {
                      event.preventDefault();
                      cancelAnimationFrame(render);
                  }

                  function handleContextRestored(event) {
                      initWebGL();
                      requestAnimationFrame(render);
                  }

                  canvas.addEventListener('webglcontextlost', handleContextLost, false);
                  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);