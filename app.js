// 1. Configuração do Cenário, Câmera e Renderizador
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Altera a cor de fundo interna do Three.js para casar com o CSS
scene.background = new THREE.Color(0xdc6a2c); 

// Câmera posicionada de frente para a TV
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8); 

// Renderizador com Antialias e suporte a cores lineares do glTF
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Controles de Câmera (Permite que você interaja com a TV pelo mouse no Lively)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 2. Iluminação Avançada para o Modelo 3D (Mantém os materiais fiéis)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight1.position.set(5, 10, 7);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-5, -5, -2);
scene.add(dirLight2);

// 3. Configuração da Textura do Vídeo (Desenho Animado)
const video = document.getElementById('tv-video');
video.play().catch(e => console.log("Aguardando interação do Lively para tocar o vídeo: ", e));

const videoTexture = new THREE.VideoTexture(video);
videoTexture.encoding = THREE.sRGBEncoding;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

// Material que será injetado na malha da tela da TV
const videoMaterial = new THREE.MeshBasicMaterial({ 
    map: videoTexture,
    side: THREE.DoubleSide
});

// 4. Carregamento do seu Modelo 3D da TV
const loader = new THREE.GLTFLoader();

// Carrega o arquivo scene.gltf (certifique-se de que ele e o scene.bin estão na mesma pasta)
loader.load('scene.gltf', (gltf) => {
    const tvModel = gltf.scene;

    // --- LÓGICA DE CENTRALIZAÇÃO PERFEITA ---
    // Calcula a caixa delimitadora (Bounding Box) do modelo para descobrir o centro real dele
    const box = new THREE.Box3().setFromObject(tvModel);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Move o modelo para que o centro dele fique exatamente na coordenada (0, 0, 0)
    tvModel.position.x += (tvModel.position.x - center.x);
    tvModel.position.y += (tvModel.position.y - center.y);
    tvModel.position.z += (tvModel.position.z - center.z);
    
    // Rotaciona a TV para ficar de frente para a câmera padrão
    tvModel.rotation.y = Math.PI; 

    // --- ENCONTRAR E MAPEAR A TELA ---
    tvModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Detecta a parte do vidro da tela do seu modelo e aplica o vídeo nela
            if (child.material.name.includes('Glass') || child.name.includes('Screen') || child.name.includes('Glass')) {
                child.material = videoMaterial;
            }
        }
    });

    scene.add(tvModel);
    animate();
}, 
(xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% carregado');
}, 
(error) => {
    console.error('Erro ao carregar o modelo da TV:', error);
});

// 5. Loop de Animação e Renderização
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Ajuste responsivo caso o Lively mude a resolução da tela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
