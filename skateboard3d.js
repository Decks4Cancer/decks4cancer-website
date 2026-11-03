
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// DECKS 4 CANCER — REALISTIC 3D SKATEBOARD

const stage = document.querySelector(".skateboard-stage");

if (!stage) {
    throw new Error("Skateboard stage not found");
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    40, 1000 / 440, 0.1, 100
);

camera.position.set(8, 10, 29);
camera.lookAt(0, 9, 0);

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(1000, 440);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

stage.appendChild(renderer.domElement);

// LIGHTING

scene.add(new THREE.AmbientLight(0xffffff, 1.6));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(4, 8, 8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 2);
fillLight.position.set(-5, 3, 6);
scene.add(fillLight);

// SKATEBOARD

const rideGroup = new THREE.Group();
const boardPivot = new THREE.Group();
const skateboard = new THREE.Group();
const rollingWheels = [];
let skaterRig = null;
let frontFoot = null;
let frontFootRestPosition = null;
boardPivot.position.x = -2.65 * 1.2;
skateboard.position.x = 2.65 * 1.2;
boardPivot.add(skateboard);
rideGroup.add(boardPivot);
scene.add(rideGroup);

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

// STATIC SKATEBOARDER SILHOUETTE

const silhouetteMaterial = new THREE.MeshStandardMaterial({
    color: 0x010203,
    roughness: 0.94,
    metalness: 0.05
});

const silhouetteAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    roughness: 0.82,
    metalness: 0.12
});

function addSilhouetteSegment(parent, start, end, radius, material = silhouetteMaterial) {
    const startPoint = new THREE.Vector3(...start);
    const endPoint = new THREE.Vector3(...end);
    const direction = endPoint.clone().sub(startPoint);
    const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.08, direction.length(), 12),
        material
    );

    segment.position.copy(startPoint).add(endPoint).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
    );
    parent.add(segment);
    return segment;
}

function addSilhouetteSkater() {
    const skater = new THREE.Group();
    const depth = 0.05;
    const riderScale = 6.5 * 0.9;
    const truckMountX = 2.65 * 1.2;
    const rearFootX = -truckMountX / riderScale;
    const frontFootX = truckMountX / riderScale;
    skaterRig = skater;

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 24, 18),
        silhouetteMaterial
    );
    head.scale.set(0.92, 1.08, 0.94);
    head.position.set(0.03, 3.05, depth);
    skater.add(head);

    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.18, 0.32, 14),
        silhouetteMaterial
    );
    neck.position.set(0.03, 2.67, depth);
    skater.add(neck);

    const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.31, 0.43, 1.18, 18),
        silhouetteMaterial
    );
    torso.scale.z = 0.82;
    torso.rotation.z = -0.08;
    torso.position.set(0, 1.88, depth);
    skater.add(torso);

    const shoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 20, 14),
        silhouetteMaterial
    );
    shoulder.scale.set(1.5, 0.72, 0.75);
    shoulder.position.set(-0.02, 2.36, depth);
    skater.add(shoulder);

    addSilhouetteSegment(skater, [-0.24, 2.42, depth], [-0.42, 1.52, depth], 0.27);
    addSilhouetteSegment(skater, [0.24, 2.42, depth], [0.38, 1.52, depth], 0.27);

    const hip = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 20, 14),
        silhouetteAccentMaterial
    );
    hip.scale.set(1.2, 0.8, 0.82);
    hip.position.set(0, 1.32, depth);
    skater.add(hip);

    function addJoint(position, radius, material = silhouetteMaterial) {
        const joint = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 12),
            material
        );
        joint.position.set(...position);
        skater.add(joint);
    }

    const backKnee = [-0.42, 0.78, depth];
    const frontKnee = [0.42, 0.7, depth];
    const rearAnkle = [rearFootX, 0.22, depth];
    const frontAnkle = [frontFootX, 0.2, depth];
    addSilhouetteSegment(skater, [-0.24, 1.25, depth], backKnee, 0.19);
    addSilhouetteSegment(skater, [0.24, 1.25, depth], frontKnee, 0.19);
    addSilhouetteSegment(skater, backKnee, rearAnkle, 0.15);
    addSilhouetteSegment(skater, frontKnee, frontAnkle, 0.15);
    addJoint([...backKnee], 0.21, silhouetteAccentMaterial);
    addJoint([...frontKnee], 0.21, silhouetteAccentMaterial);
    addJoint([...rearAnkle], 0.14);
    addJoint([...frontAnkle], 0.14);

    addSilhouetteSegment(skater, [-0.3, 2.38, depth], [-1.0, 1.9, depth], 0.12);
    addSilhouetteSegment(skater, [-1.0, 1.9, depth], [-1.36, 1.36, depth], 0.1);
    addSilhouetteSegment(skater, [0.3, 2.38, depth], [1.02, 1.94, depth], 0.12);
    addSilhouetteSegment(skater, [1.02, 1.94, depth], [1.45, 1.48, depth], 0.1);
    addJoint([-1.0, 1.9, depth], 0.14, silhouetteAccentMaterial);
    addJoint([1.02, 1.94, depth], 0.14, silhouetteAccentMaterial);
    addJoint([-1.36, 1.36, depth], 0.11);
    addJoint([1.45, 1.48, depth], 0.11);

    addSilhouetteSegment(skater, [rearFootX - 0.16, 0.22, depth], [rearFootX + 0.16, 0.16, depth + 0.01], 0.065, silhouetteAccentMaterial);
    frontFoot = addSilhouetteSegment(
        skater,
        [frontFootX - 0.16, 0.2, depth],
        [frontFootX + 0.16, 0.14, depth + 0.01],
        0.065,
        silhouetteAccentMaterial
    );
    frontFootRestPosition = frontFoot.position.clone();

    skater.scale.setScalar(riderScale);
    skater.position.y = -0.47;
    rideGroup.add(skater);
}

addSilhouetteSkater();

// SUBTLE RIM LIGHTING FOR THE SILHOUETTE

const cyanRimLight = new THREE.PointLight(0x00d7f2, 3.2, 8, 2);
cyanRimLight.position.set(-4.5, 4.2, 5.4);
scene.add(cyanRimLight);

const pinkRimLight = new THREE.PointLight(0xff2da6, 2.6, 8, 2);
pinkRimLight.position.set(4.2, 3.2, 4.2);
scene.add(pinkRimLight);

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
        rollingWheels.push(wheel);

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
skateboard.scale.setScalar(1.2);
skateboard.rotation.x = -Math.PI / 2;

// INITIAL POSITION

const restingRotation = {
    x: 0,
    y: 0,
    z: 0
};

boardPivot.rotation.set(
    restingRotation.x,
    restingRotation.y,
    restingRotation.z
);

// ANIMATION

const clock = new THREE.Clock();

let trickStarted = false;
let trickStartTime = 0;
let previousRideX = -7.2;
const riderBaseY = -0.47;

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const rideDuration = 4.2;
    const rideProgress = Math.min(time / rideDuration, 1);
    const rideEase = 1 - Math.pow(1 - rideProgress, 3);
    const cruiseMotion = rideProgress === 1
        ? Math.sin((time - rideDuration) * 0.45) * 0.22
        : 0;
    const rideX = -7.2 + (7.2 * rideEase) + cruiseMotion;
    const rideDelta = rideX - previousRideX;

    rideGroup.position.x = rideX;
    previousRideX = rideX;

    for (const wheel of rollingWheels) {
        wheel.rotation.y -= rideDelta / (0.35 * 1.2);
    }

    skaterRig.rotation.z = Math.sin(time * 1.7) * 0.025;

    if (!trickStarted) {
        rideGroup.position.y =
            Math.sin(time * 1.5) * 0.08;
        boardPivot.position.y = 0;
        boardPivot.rotation.x = restingRotation.x;
        boardPivot.rotation.y = restingRotation.y;
        boardPivot.rotation.z = restingRotation.z;
        skaterRig.position.y = riderBaseY;
        skaterRig.scale.y = skaterRig.scale.x;
    } else {
        const elapsed = time - trickStartTime;
        const duration = 3.4;
        const progress = Math.min(elapsed / duration, 1);
        const smoothstep = (value) => value * value * (3 - 2 * value);
        const phase = (start, end) =>
            smoothstep(Math.min(Math.max((progress - start) / (end - start), 0), 1));
        const crouch = phase(0.02, 0.2) * (1 - phase(0.2, 0.42));
        const pop = phase(0.18, 0.3);
        const ascent = phase(0.25, 0.43);
        const rotationProgress = phase(0.34, 0.75);
        const catchEase = phase(0.75, 0.84);
        const landingCompression = 1 - phase(0.9, 1);
        const boardLift = 0.78 * phase(0.28, 0.78) * (1 - phase(0.78, 0.98));
        const boardPitch = 0.14 * pop * (1 - phase(0.28, 0.48));
        const riderFlight =
            2.6 * ascent * (1 - phase(0.63, 0.82));
        const flickClearance = rotationProgress * (1 - catchEase);
        const noseRise = Math.sin(boardPitch) * (4.45 * 1.2);
        const footCompression = crouch * 0.16 + landingCompression * 0.08;

        rideGroup.position.y = 0;
        boardPivot.position.y = boardLift;
        boardPivot.rotation.x =
            restingRotation.x + rotationProgress * Math.PI * 2;
        boardPivot.rotation.y = restingRotation.y;
        boardPivot.rotation.z = boardPitch;

        skaterRig.position.y =
            riderBaseY + footCompression + boardLift + riderFlight;
        skaterRig.scale.y =
            skaterRig.scale.x * (1 - crouch * 0.14 - landingCompression * 0.06);
        skaterRig.rotation.z =
            Math.sin(time * 4.2) * 0.035 + (1 - crouch) * 0.018;
        frontFoot.position.x =
            frontFootRestPosition.x + flickClearance * 0.12;
        frontFoot.position.y =
            frontFootRestPosition.y + noseRise / skaterRig.scale.x + flickClearance * 0.14;

        if (progress >= 1) {
            trickStarted = false;
            boardPivot.position.y = 0;
            boardPivot.rotation.x = restingRotation.x;
            boardPivot.rotation.z = restingRotation.z;
            skaterRig.position.y = riderBaseY;
            skaterRig.scale.y = skaterRig.scale.x;
            frontFoot.position.copy(frontFootRestPosition);
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
