
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// DECKS 4 CANCER — PHOTOREALISTIC BLANK MAPLE DECK

const DECK_HALF_LENGTH = 4.0;
const DECK_HALF_WIDTH = 1.03;
const DECK_THICKNESS = 0.05;
const DECK_BEVEL_THICKNESS = 0.025;
const DECK_BEVEL_SIZE = 0.03;
const DECK_KICK = 0.22;
const TRUCK_CENTER_X = 2.6;
const TRUCK_HOLE_SPACING_X = 0.25;
const TRUCK_HOLE_SPACING_Y = 0.19;
const TRUCK_HOLE_RADIUS = 0.05;
const DECK_WIDTH_DESKTOP = 0.675;
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
renderer.toneMappingExposure = 1.05;

stage.appendChild(renderer.domElement);

// LIGHTING

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.6);
keyLight.position.set(-3, 7, 9);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(6, -2, 8);
scene.add(fillLight);

// PIVOT FOR FUTURE LONGITUDINAL (X-AXIS) ROTATION

const boardRoll = new THREE.Group();
const skateboard = new THREE.Group();
skateboard.rotation.y = Math.PI;
boardRoll.add(skateboard);
scene.add(boardRoll);

// MAPLE TEXTURES

function createRandom(seed) {
    let state = seed;
    return () => {
        state |= 0;
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function drawGrainStreak(ctx, startX, y, length, amplitude, frequency, phase) {
    ctx.beginPath();
    for (let x = 0; x <= length; x += 6) {
        const wave = Math.sin(x * frequency + phase) * amplitude;
        if (x === 0) {
            ctx.moveTo(startX, y + wave);
        } else {
            ctx.lineTo(startX + x, y + wave);
        }
    }
    ctx.stroke();
}

function createMapleTextures() {
    const width = 2048;
    const height = 512;
    const random = createRandom(7);

    const colorCanvas = document.createElement("canvas");
    const bumpCanvas = document.createElement("canvas");
    colorCanvas.width = bumpCanvas.width = width;
    colorCanvas.height = bumpCanvas.height = height;

    const colorCtx = colorCanvas.getContext("2d");
    const bumpCtx = bumpCanvas.getContext("2d");

    colorCtx.fillStyle = "#ebd1a4";
    colorCtx.fillRect(0, 0, width, height);
    bumpCtx.fillStyle = "#808080";
    bumpCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 16; i++) {
        const y = random() * height;
        colorCtx.strokeStyle = `rgba(214,176,118,${0.05 + random() * 0.05})`;
        colorCtx.lineWidth = 6 + random() * 18;
        drawGrainStreak(colorCtx, -50, y, width + 100, 3 + random() * 8, 0.002 + random() * 0.003, random() * Math.PI * 2);
    }

    for (let i = 0; i < 900; i++) {
        const dark = random() < 0.6;
        const alpha = 0.04 + random() * 0.12;
        const y = random() * height;
        const startX = random() * width - 200;
        const length = 300 + random() * 1100;
        const amplitude = 0.4 + random() * 2.5;
        const frequency = 0.004 + random() * 0.01;
        const phase = random() * Math.PI * 2;
        const lineWidth = 0.4 + random() * 1.5;

        colorCtx.strokeStyle = dark
            ? `rgba(180,128,74,${alpha})`
            : `rgba(252,240,216,${alpha})`;
        colorCtx.lineWidth = lineWidth;
        drawGrainStreak(colorCtx, startX, y, length, amplitude, frequency, phase);

        const bumpShade = dark ? 70 : 200;
        bumpCtx.strokeStyle = `rgba(${bumpShade},${bumpShade},${bumpShade},${alpha * 2})`;
        bumpCtx.lineWidth = lineWidth;
        drawGrainStreak(bumpCtx, startX, y, length, amplitude, frequency, phase);
    }

    for (let i = 0; i < 6000; i++) {
        const x = random() * width;
        const y = random() * height;
        const dark = random() < 0.5;
        colorCtx.fillStyle = dark
            ? `rgba(170,120,66,${0.02 + random() * 0.04})`
            : `rgba(255,246,228,${0.02 + random() * 0.04})`;
        colorCtx.fillRect(x, y, 1 + random() * 2, 1);
    }

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);

    for (const texture of [colorTexture, bumpTexture]) {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1 / (2 * DECK_HALF_LENGTH), 1 / (2 * DECK_HALF_WIDTH));
        texture.offset.set(0.5, 0.5);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    return { colorTexture, bumpTexture };
}

const mapleTextures = createMapleTextures();

const mapleFaceMaterial = new THREE.MeshPhysicalMaterial({
    map: mapleTextures.colorTexture,
    bumpMap: mapleTextures.bumpTexture,
    bumpScale: 0.6,
    roughness: 0.5,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45
});

const mapleEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b888,
    roughness: 0.62
});

// DECK SHAPE

function deckHalfWidthAt(t) {
    return DECK_HALF_WIDTH * Math.pow(1 - Math.pow(Math.abs(t), 6), 0.5);
}

function createDeckOutline() {
    const samples = 180;
    const outline = new THREE.Shape();

    for (let i = 0; i <= samples; i++) {
        const t = Math.sin(-Math.PI / 2 + (i / samples) * Math.PI);
        const x = t * DECK_HALF_LENGTH;
        const y = deckHalfWidthAt(t);
        if (i === 0) {
            outline.moveTo(x, y);
        } else {
            outline.lineTo(x, y);
        }
    }

    for (let i = samples - 1; i >= 1; i--) {
        const t = Math.sin(-Math.PI / 2 + (i / samples) * Math.PI);
        outline.lineTo(t * DECK_HALF_LENGTH, -deckHalfWidthAt(t));
    }

    outline.closePath();

    for (const truckX of [-TRUCK_CENTER_X, TRUCK_CENTER_X]) {
        for (const dx of [-TRUCK_HOLE_SPACING_X, TRUCK_HOLE_SPACING_X]) {
            for (const dy of [-TRUCK_HOLE_SPACING_Y, TRUCK_HOLE_SPACING_Y]) {
                const hole = new THREE.Path();
                hole.absarc(truckX + dx, dy, TRUCK_HOLE_RADIUS, 0, Math.PI * 2, false);
                outline.holes.push(hole);
            }
        }
    }

    return outline;
}

const deckGeometry = new THREE.ExtrudeGeometry(createDeckOutline(), {
    depth: DECK_THICKNESS,
    bevelEnabled: true,
    bevelThickness: DECK_BEVEL_THICKNESS,
    bevelSize: DECK_BEVEL_SIZE,
    bevelSegments: 4,
    curveSegments: 24
});

const deckPositions = deckGeometry.attributes.position;
for (let i = 0; i < deckPositions.count; i++) {
    const kickT = Math.max(0, (Math.abs(deckPositions.getX(i)) / DECK_HALF_LENGTH - 0.55) / 0.45);
    deckPositions.setZ(i, deckPositions.getZ(i) + DECK_KICK * kickT * kickT);
}
deckGeometry.computeVertexNormals();

const deck = new THREE.Mesh(deckGeometry, [
    mapleFaceMaterial,
    mapleEdgeMaterial
]);

skateboard.add(deck);

// FITTING THE DECK TO THE STAGE

function fitDeckToStage() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const deckWidthRatio = width < MOBILE_BREAKPOINT ? DECK_WIDTH_MOBILE : DECK_WIDTH_DESKTOP;

    renderer.setSize(width, height);
    camera.aspect = width / height;

    const visibleWidth = (2 * DECK_HALF_LENGTH) / deckWidthRatio;
    const visibleHeight = visibleWidth / camera.aspect;
    const distance = (visibleHeight / 2) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
}

window.addEventListener("resize", fitDeckToStage);
fitDeckToStage();
