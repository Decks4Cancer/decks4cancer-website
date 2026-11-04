
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// DECKS 4 CANCER — PHOTOREALISTIC BLANK MAPLE DECK

const DECK_HALF_LENGTH = 4.0;
const DECK_HALF_WIDTH = 1.0;
const DECK_FLAT_RATIO = 0.68;
const DECK_THICKNESS = 0.05;
const DECK_BEVEL_THICKNESS = 0.025;
const DECK_BEVEL_SIZE = 0.03;
const DECK_KICK = 0.08;
const TRUCK_CENTER_X = 2.2;
const TRUCK_HOLE_SPACING = 0.22;
const TRUCK_HOLE_RADIUS = 0.035;
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
renderer.toneMappingExposure = 1.1;

stage.appendChild(renderer.domElement);

// LIGHTING

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.7);
keyLight.position.set(-3, 7, 9);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(6, -2, 8);
scene.add(fillLight);

// PIVOT FOR FUTURE LONGITUDINAL (X-AXIS) ROTATION

const boardRoll = new THREE.Group();
const skateboard = new THREE.Group();
skateboard.rotation.y = Math.PI;
boardRoll.add(skateboard);
scene.add(boardRoll);

// MAPLE TEXTURES

function createValueNoise(seed) {
    const hash = (x, y) => {
        let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };

    const noise = (x, y) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi);
        const b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1);
        const d = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };

    return (x, y, octaves) => {
        let sum = 0;
        let total = 0;
        let amplitude = 0.5;
        let frequency = 1;
        for (let o = 0; o < octaves; o++) {
            sum += amplitude * noise(x * frequency, y * frequency);
            total += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return sum / total;
    };
}

function mixColor(from, to, t) {
    return from.map((value, index) => value + (to[index] - value) * t);
}

function createMapleTextures() {
    const width = 1024;
    const height = 256;
    const fbm = createValueNoise(11);
    const knotX = width * 0.42;
    const knotY = height * 0.77;
    const dark = [185, 120, 63];
    const mid = [224, 167, 102];
    const light = [245, 208, 152];

    const colorCanvas = document.createElement("canvas");
    const bumpCanvas = document.createElement("canvas");
    colorCanvas.width = bumpCanvas.width = width;
    colorCanvas.height = bumpCanvas.height = height;

    const colorCtx = colorCanvas.getContext("2d");
    const bumpCtx = bumpCanvas.getContext("2d");
    const colorImage = colorCtx.createImageData(width, height);
    const bumpImage = bumpCtx.createImageData(width, height);

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const u = px / width;
            const v = py / height;
            const warp = fbm(u * 3, v * 2, 2) * 2.2;
            const figure = fbm(u * 2.2 + warp * 0.6, v * 9 + warp * 1.5, 3);
            const bands = 0.5 + 0.5 * Math.sin(v * 26 + warp * 5 + figure * 9);
            const blotch = fbm(u * 6, v * 4, 2);

            let grain = 0.45 * figure + 0.25 * bands + 0.3 * blotch;
            grain = Math.min(Math.max((grain - 0.3) / 0.5, 0), 1);

            const knotDistance = Math.hypot((px - knotX) * 0.5, py - knotY);
            if (knotDistance < 12) {
                const ring = 0.5 + 0.5 * Math.sin(knotDistance * 2.2);
                grain *= (0.15 + 0.85 * (knotDistance / 12)) * (0.75 + 0.25 * ring);
            }

            const color = grain < 0.5
                ? mixColor(dark, mid, grain * 2)
                : mixColor(mid, light, (grain - 0.5) * 2);
            const pixel = (py * width + px) * 4;
            colorImage.data[pixel] = color[0];
            colorImage.data[pixel + 1] = color[1];
            colorImage.data[pixel + 2] = color[2];
            colorImage.data[pixel + 3] = 255;

            const height8 = 128 + (grain - 0.5) * 90;
            bumpImage.data[pixel] = height8;
            bumpImage.data[pixel + 1] = height8;
            bumpImage.data[pixel + 2] = height8;
            bumpImage.data[pixel + 3] = 255;
        }
    }

    colorCtx.putImageData(colorImage, 0, 0);
    bumpCtx.putImageData(bumpImage, 0, 0);

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
    bumpScale: 0.35,
    roughness: 0.45,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35
});

const mapleEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3b27a,
    roughness: 0.5
});

// DECK SHAPE

function createDeckOutline() {
    const flatEnd = DECK_HALF_LENGTH * DECK_FLAT_RATIO;
    const noseRadiusX = DECK_HALF_LENGTH - flatEnd;
    const steps = 48;
    const outline = new THREE.Shape();

    const nosePoint = (theta, sideSign, widthSign) => [
        sideSign * (flatEnd + noseRadiusX * Math.sin(theta)),
        widthSign * DECK_HALF_WIDTH * Math.cos(theta)
    ];
    const arcAngle = (i) => (i / steps) * (Math.PI / 2);

    outline.moveTo(-flatEnd, DECK_HALF_WIDTH);
    outline.lineTo(flatEnd, DECK_HALF_WIDTH);

    for (let i = 1; i <= steps; i++) {
        outline.lineTo(...nosePoint(arcAngle(i), 1, 1));
    }
    for (let i = steps - 1; i >= 0; i--) {
        outline.lineTo(...nosePoint(arcAngle(i), 1, -1));
    }

    outline.lineTo(-flatEnd, -DECK_HALF_WIDTH);

    for (let i = 1; i <= steps; i++) {
        outline.lineTo(...nosePoint(arcAngle(i), -1, -1));
    }
    for (let i = steps - 1; i >= 1; i--) {
        outline.lineTo(...nosePoint(arcAngle(i), -1, 1));
    }

    outline.closePath();

    for (const truckX of [-TRUCK_CENTER_X, TRUCK_CENTER_X]) {
        for (const dx of [-TRUCK_HOLE_SPACING, TRUCK_HOLE_SPACING]) {
            for (const dy of [-TRUCK_HOLE_SPACING, TRUCK_HOLE_SPACING]) {
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
