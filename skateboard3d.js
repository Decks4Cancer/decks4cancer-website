
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// DECKS 4 CANCER — BLANK MAPLE DECK STAGE

const DECK_LENGTH = 2 * 4.45 * 1.2;
const DECK_WIDTH_DESKTOP = 0.65;
const DECK_WIDTH_MOBILE = 0.9;
const MOBILE_BREAKPOINT = 750;
const CAMERA_FOV = 40;

const stage = document.querySelector(".skateboard-stage");

if (!stage) {
    throw new Error("Skateboard stage not found");
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

stage.appendChild(renderer.domElement);

// LIGHTING

scene.add(new THREE.AmbientLight(0xffffff, 1.4));

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(4, 8, 10);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.6);
fillLight.position.set(-6, 3, 8);
scene.add(fillLight);

// PIVOT FOR FUTURE LONGITUDINAL (X-AXIS) ROTATION

const boardRoll = new THREE.Group();
const skateboard = new THREE.Group();
skateboard.scale.setScalar(1.2);
skateboard.rotation.y = Math.PI;
boardRoll.add(skateboard);
scene.add(boardRoll);

// MAPLE MATERIALS

function createMapleGrainTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e6caa0";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 70; i++) {
        const y = Math.random() * 512;
        const amplitude = 2 + Math.random() * 6;
        const tone = Math.random() > 0.5 ? "214,178,122" : "250,236,208";
        ctx.strokeStyle = `rgba(${tone},${0.2 + Math.random() * 0.3})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.4;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 8) {
            const wave = Math.sin(x * 0.02 + i) * amplitude;
            if (x === 0) {
                ctx.moveTo(x, y + wave);
            } else {
                ctx.lineTo(x, y + wave);
            }
        }
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.15, 0.4);
    return texture;
}

const mapleCapMaterial = new THREE.MeshStandardMaterial({
    map: createMapleGrainTexture(),
    roughness: 0.6
});

const mapleEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0c595,
    roughness: 0.65
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
    mapleCapMaterial,
    mapleEdgeMaterial
]);

skateboard.add(deck);

// LAMINATION LINES

const edgeGeometry = new THREE.EdgesGeometry(deckGeometry, 35);

const edgeLines = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
        color: 0xb8905a,
        transparent: true,
        opacity: 0.35
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

// FITTING THE DECK TO THE STAGE

function fitDeckToStage() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const deckWidthRatio = width < MOBILE_BREAKPOINT ? DECK_WIDTH_MOBILE : DECK_WIDTH_DESKTOP;

    renderer.setSize(width, height);
    camera.aspect = width / height;

    const visibleWidth = DECK_LENGTH / deckWidthRatio;
    const visibleHeight = visibleWidth / camera.aspect;
    const distance = (visibleHeight / 2) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
}

window.addEventListener("resize", fitDeckToStage);
fitDeckToStage();
