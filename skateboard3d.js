
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// DECKS 4 CANCER — REALISTIC 3D SKATEBOARD

const stage = document.querySelector(".skateboard-stage");

if (!stage) {
    throw new Error("Skateboard stage not found");
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    40, 800 / 350, 0.1, 100
);

camera.position.set(1.5, -3.2, -12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(800, 350);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

stage.appendChild(renderer.domElement);

// LIGHTING

scene.add(new THREE.AmbientLight(0xffffff, 1.6));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(4, 6, -8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 2);
fillLight.position.set(-5, -4, 7);
scene.add(fillLight);

// SKATEBOARD

const skateboard = new THREE.Group();
scene.add(skateboard);

// MATERIALS

const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4ad72,
    roughness: 0.82
});

const undersideMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0ede5,
    roughness: 0.58
});

const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9bec3,
    metalness: 0.85,
    roughness: 0.27
});

const darkMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x555b60,
    metalness: 0.7,
    roughness: 0.38
});

const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc107,
    roughness: 0.48
});

const bearingMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.8,
    roughness: 0.3
});

// PROCEDURAL GRIP TAPE TEXTURE

const textureCanvas = document.createElement("canvas");
textureCanvas.width = 256;
textureCanvas.height = 256;

const ctx = textureCanvas.getContext("2d");

ctx.fillStyle = "#171717";
ctx.fillRect(0, 0, 256, 256);

for (let i = 0; i < 18000; i++) {
    const shade = 22 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(
        Math.random() * 256,
        Math.random() * 256,
        1,
        1
    );
}

const gripTexture = new THREE.CanvasTexture(textureCanvas);
gripTexture.colorSpace = THREE.SRGBColorSpace;

const gripMaterial = new THREE.MeshStandardMaterial({
    map: gripTexture,
    roughness: 1,
    side: THREE.DoubleSide
});

// DECK SHAPE

function createDeckShape(inset = 0) {
    const s = new THREE.Shape();

    const halfWidth = 1.0 - inset;
    const end = 4.45 - inset;
    const shoulder = 3.5;

    s.moveTo(-shoulder, -halfWidth);
    s.lineTo(shoulder, -halfWidth);
    s.quadraticCurveTo(end, -halfWidth, end, 0);
    s.quadraticCurveTo(end, halfWidth, shoulder, halfWidth);
    s.lineTo(-shoulder, halfWidth);
    s.quadraticCurveTo(-end, halfWidth, -end, 0);
    s.quadraticCurveTo(-end, -halfWidth, -shoulder, -halfWidth);
    s.closePath();

    return s;
}

const deckGeometry = new THREE.ExtrudeGeometry(
    createDeckShape(),
    {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 3,
        curveSegments: 48
    }
);

const deck = new THREE.Mesh(deckGeometry, [
    undersideMaterial,
    woodMaterial
]);

skateboard.add(deck);

// WOOD LAMINATION STRIPES

const edgeGeometry = new THREE.EdgesGeometry(deckGeometry, 35);

const edgeLines = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
        color: 0x85633d,
        transparent: true,
        opacity: 0.55
    })
);

skateboard.add(edgeLines);

// GRIP TAPE

const grip = new THREE.Mesh(
    new THREE.ShapeGeometry(createDeckShape(0.065)),
    gripMaterial
);

grip.position.z = 0.215;
skateboard.add(grip);

// GRIP TAPE MOUNTING BOLTS

const boltGeometry = new THREE.CylinderGeometry(
    0.038, 0.038, 0.012, 16
);

for (const x of [-2.65, 2.65]) {
    for (const y of [-0.48, 0.48]) {
        for (const offsetX of [-0.22, 0.22]) {
            const bolt = new THREE.Mesh(
                boltGeometry,
                darkMetalMaterial
            );

            bolt.rotation.x = Math.PI / 2;
            bolt.position.set(x + offsetX, y, 0.227);
            skateboard.add(bolt);
        }
    }
}

// TRUCK GEOMETRY

const baseGeometry = new THREE.BoxGeometry(
    0.75, 0.72, 0.13
);

const hangerGeometry = new THREE.BoxGeometry(
    0.34, 1.65, 0.24
);

const axleGeometry = new THREE.CylinderGeometry(
    0.075, 0.075, 2.8, 24
);

const supportGeometry = new THREE.CylinderGeometry(
    0.14, 0.19, 0.48, 20
);

const wheelGeometry = new THREE.CylinderGeometry(
    0.35, 0.35, 0.31, 40
);

const bearingGeometry = new THREE.CylinderGeometry(
    0.105, 0.105, 0.322, 24
);

function createTruck(x) {
    const truck = new THREE.Group();
    truck.position.x = x;

    const base = new THREE.Mesh(
        baseGeometry,
        darkMetalMaterial
    );
    base.position.z = -0.15;
    truck.add(base);

    const support = new THREE.Mesh(
        supportGeometry,
        metalMaterial
    );
    support.rotation.x = Math.PI / 2;
    support.position.z = -0.43;
    truck.add(support);

    const hanger = new THREE.Mesh(
        hangerGeometry,
        metalMaterial
    );
    hanger.position.z = -0.68;
    truck.add(hanger);

    const axle = new THREE.Mesh(
        axleGeometry,
        darkMetalMaterial
    );
    axle.position.z = -0.68;
    truck.add(axle);

    for (const side of [-1, 1]) {
        const wheel = new THREE.Mesh(
            wheelGeometry,
            wheelMaterial
        );

        wheel.position.set(
            0,
            side * 1.24,
            -0.68
        );

        truck.add(wheel);

        const bearing = new THREE.Mesh(
            bearingGeometry,
            bearingMaterial
        );

        bearing.position.copy(wheel.position);
        truck.add(bearing);
    }

    skateboard.add(truck);
}

createTruck(-2.65);
createTruck(2.65);

// INITIAL POSITION

const restingRotation = {
    x: 0.15,
    y: -0.18,
    z: -0.12
};

skateboard.rotation.set(
    restingRotation.x,
    restingRotation.y,
    restingRotation.z
);

// ANIMATION

const clock = new THREE.Clock();

let trickStarted = false;
let trickStartTime = 0;

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    if (!trickStarted) {
        skateboard.position.y =
            Math.sin(time * 1.5) * 0.08;

        skateboard.rotation.x =
            restingRotation.x +
            Math.sin(time * 0.8) * 0.05;

        skateboard.rotation.y =
            restingRotation.y +
            Math.sin(time * 0.6) * 0.1;

        skateboard.rotation.z = restingRotation.z;
    } else {
        const elapsed = time - trickStartTime;
        const duration = 2.4;
        const progress = Math.min(elapsed / duration, 1);

        const eased =
            progress * progress * (3 - 2 * progress);

        skateboard.rotation.x =
            restingRotation.x + eased * Math.PI * 2;

        skateboard.rotation.y = restingRotation.y;
        skateboard.rotation.z = restingRotation.z;

        skateboard.position.y =
            Math.sin(progress * Math.PI) * 1.0;

        if (progress >= 1) {
            trickStarted = false;
            skateboard.rotation.x = restingRotation.x;
            skateboard.position.y = 0;
        }
    }

    renderer.render(scene, camera);
}

renderer.domElement.style.cursor = "pointer";

renderer.domElement.addEventListener("click", () => {
    if (!trickStarted) {
        trickStarted = true;
        trickStartTime = clock.getElapsedTime();
    }
});

animate();

console.log("Decks 4 Cancer realistic skateboard loaded!");
