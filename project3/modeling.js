//Tejas Bhadoria
//CS435, Project #3

let scene, camera, renderer, sign, post, gasPrices, textGroup;
let rotating = false;
let selectedGasType = 'unleaded';

// Initialize the prices
gasPrices = {
    unleaded: 249,
    midgrade: 289,
    supreme: 329
};

// Create the 3D scene
function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // Create a cylindrical post
    let postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 9, 32);
    let postMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = -2.9;
    scene.add(post);
    // Create a rectangular frame for the sign
    let signGeometry = new THREE.BoxGeometry(10, 5, 0.2);  // Size of the sign
    let signMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.y = 4;
    scene.add(sign);

    // Add custom lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10).normalize();
    scene.add(directionalLight);

    // Add gas prices text
    updateGasPrices();

    animate();
}

// Update the displayed gas prices with dollars and cent format
function updateGasPrices() {
    
    if (textGroup) {
        sign.remove(textGroup);
    }

    textGroup = new THREE.Group();

    const loader = new THREE.FontLoader();

    // Load the font asynchronously
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const texts = [
            { text: `UNLEADED $${(gasPrices.unleaded / 100).toFixed(2)}`, y: 1.2 },
            { text: `MIDGRADE $${(gasPrices.midgrade / 100).toFixed(2)}`, y: 0 },
            { text: `SUPREME $${(gasPrices.supreme / 100).toFixed(2)}`, y: -1.2 }
        ];

        texts.forEach((item) => {
            const textGeometry = new THREE.TextGeometry(item.text, {
                font: font,
                size: 0.7,  
                height: 0.05,
            });

            const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(-4.5, item.y, 0.15);  
            textGroup.add(textMesh);
        });

        sign.add(textGroup);
    });
}

// Resize canvas based on window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (rotating) {
        sign.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

// Event listeners for buttons
document.getElementById('up').addEventListener('click', () => {
    gasPrices[selectedGasType]++;
    updateGasPrices();
});

document.getElementById('down').addEventListener('click', () => {
    gasPrices[selectedGasType]--;
    updateGasPrices();
});

document.getElementById('toggleRotation').addEventListener('click', (e) => {
    rotating = !rotating;
    e.target.innerText = rotating ? 'Stop' : 'Start';
});

// Handle gas type selection
document.getElementById('gasType').addEventListener('change', (e) => {
    selectedGasType = e.target.value;
});

// Initialize the scene
init();
