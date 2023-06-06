import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import TWEEN from '@tweenjs/tween.js'

let renderer, composer;

// show menu
function toggleSidebar() {
  var sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show-sidebar");
  sidebar.classList.remove("hide-sidebar");
}

// hide menu
function hideSidebar() {
  var sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hide-sidebar");
  sidebar.classList.remove("show-sidebar");
}

//toggles for the blocks
// show blocks jumpscare
function toggleBlocks() {
  var sidebar = document.getElementById("blocks");
  sidebar.classList.remove("show-blocks");
  sidebar.classList.toggle("hide-blocks");
}

// hide blocks jumpscare
function hideBlocks() {
  var sidebar = document.getElementById("blocks");
  sidebar.classList.remove("hide-blocks");
  sidebar.classList.toggle("show-blocks");
}

// set up the scene, camera, and renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);
composer = new EffectComposer(renderer);

const scene = new THREE.Scene();

// Perspective camera
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var width = window.innerWidth;
var height = window.innerHeight;
var aspectRatio = width / height;
var cameraWidth = 700; // Adjust this value to control the visible width of the scene
var cameraHeight = cameraWidth / aspectRatio;
var orthographicCamera = new THREE.OrthographicCamera(
  cameraWidth / -22,
  cameraWidth / 22,
  cameraHeight / 22,
  cameraHeight / -22,
  -500,
  1000
);


// Set the default camera to perspective camera
let camera = perspectiveCamera;

var controls = new PointerLockControls(camera, document.body);
// Define the camera movement speed
let movementSpeed = 7; // units per second

// Toggle between perspective and orthographic camera
function toggleCamera() {
  if (camera === perspectiveCamera) {
    // Switch to orthographic camera
   // Set position from perspective camera
    console.log(camera)
    camera = orthographicCamera;
    orthographicCamera.position.set(0, 7, 3);
orthographicCamera.rotation.y = Math.PI / 8;
orthographicCamera.rotation.z = Math.PI / 2;
    camera.lookAt(grandfather.position);
    movementSpeed = 30;
    composer.removePass(renderPass);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    controls = new PointerLockControls(camera, document.body);
    controls.maxPolarAngle = Math.PI
    controls.minPolarAngle = Math.PI/1.9
    controls.lock();
    moveCamera();
  } else {
    // Switch to perspective camera
    camera = perspectiveCamera;
    movementSpeed = 7;
    composer.removePass(renderPass);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    controls = new PointerLockControls(camera, document.body);
    controls.lock();
    moveCamera(); // Resume camera movement when switching back to perspective camera
  }
}

// Register keydown event listener to toggle orthographic camera
document.addEventListener("keydown", function (event) {
  if (event.key === "q") {
    toggleCamera();
  }
});

// prespective camera position inside the skysphere
camera.position.set(1, 1, 20);

//post processing vars
var renderPass = new RenderPass(scene, camera);
console.log(renderPass)
composer.addPass(renderPass);
const glitchPass = new GlitchPass();

const bokehPass = new BokehPass(scene, camera, {
  focus: 1,
  aperture: 0.0002,
  maxblur: 0.01
});
//blurry
const bloomPass = new BloomPass(1,    // strength
  25,   // kernel size
  4,    // sigma ?
  256,  // blur render target resolution
);


const filmPass = new FilmPass(
  0.035,   // noise intensity
  0.025,  // scanline intensity
  648,    // scanline count
  false,  // grayscale
);

composer.addPass(bokehPass)
//possible movement directions
const directions = {
  KeyW: new THREE.Vector3(0, 0, -1),
  KeyS: new THREE.Vector3(0, 0, 1),
  KeyA: new THREE.Vector3(-1, 0, 0),
  KeyD: new THREE.Vector3(1, 0, 0),
};

// keep track of the pressed keys
const pressedKeys = {};

//set up jump animation variables
const gravity = 0.01;
const jumpHeight = 2; // height of the jump in world units
const jumpDuration = 500; // duration of the jump animation in milliseconds
let isJumping = false; // flag to prevent multiple jumps
let jumpStart = null; // starting height of the jump

//keep track of the current movement direction and tween
let movementDirection = null;
let movementTween = null;

  console.log(camera)
  //event listeners to for movement and jumping
document.addEventListener("keydown", (event) => {
  if (isJumping) {
    return;
  }
  const keyCode = event.code;
  if (keyCode in directions) {
    pressedKeys[keyCode] = true;
    updateMovementDirection();
    moveCamera();
  } else if (keyCode === "Space") {
    jump();
  }
});

document.addEventListener("keyup", (event) => {
  const keyCode = event.code;
  if (keyCode in directions) {
    pressedKeys[keyCode] = false;
    updateMovementDirection();
    if (!Object.values(pressedKeys).some((value) => value)) {
      stopMovement();
    }
  }
});

let initialCameraDirection = new THREE.Vector3();
camera.getWorldDirection(initialCameraDirection);

//movement direction based on pressed keys
function updateMovementDirection() {
  let x = 0;
  let z = 0;
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  if (pressedKeys.KeyW) {
    z -= 1;
  }
  if (pressedKeys.KeyS) {
    z += 1;
  }
  if (pressedKeys.KeyA) {
    x -= 1;
  }
  if (pressedKeys.KeyD) {
    x += 1;
  }

  if (x !== 0 || z !== 0) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      initialCameraDirection,
      cameraDirection
    );
    movementDirection = new THREE.Vector3(x, 0, z)
      .applyQuaternion(rotationQuaternion)
      .normalize();
    const nextPosition = camera.position.clone().add(movementDirection);
    console.log(nextPosition)
    if (nextPosition.y >= 1 && camera === perspectiveCamera || nextPosition.y <= 1 && camera === perspectiveCamera ) {
      console.log(camera)
      movementDirection.y -= nextPosition.y - 1; // adjust y to stay below y=1
  }
  else if (camera === orthographicCamera && nextPosition.y >= 7 ||camera === orthographicCamera && nextPosition.y <= 7 ) {
    movementDirection.y -= nextPosition.y + 7  ; // 
    console.log(nextPosition.y)
  }
  } else {
    movementDirection = null;
  }
}

// camera movement
//DO NOT TOUCH
function moveCamera() {
  if (movementDirection) {
    const distance = movementDirection
      .clone()
      .multiplyScalar(movementSpeed);
    const duration = (distance.length() * 1000) / movementSpeed;
    if (movementTween) {
      movementTween.stop();
    }
    movementTween = new TWEEN.Tween(camera.position)
      .to(camera.position.clone().add(distance), duration)
      .easing(TWEEN.Easing.Linear.None)
      .onComplete(() => {
        movementTween = null;
        //to make the camera keep moving in the direction still being pressed after it hits the ground
        //set the movementTween variable to null when the tween completes

        if (!isJumping) {
          if (camera.position.y <= 1.05 && !isJumping) {
            camera.position.y += camera.velocity ? camera.velocity : 0;
            camera.velocity -= gravity;
            moveCamera(); // keep moving in the same direction
          } else {
            camera.velocity = 0;
          }
          camera.position.y += camera.velocity ? camera.velocity : 0;
        } else {
          let x = camera.position.x;
          let z = camera.position.z;
        }
      })
      .start();
  }
}

// stop camera movement
function stopMovement() {
  if (movementTween) {
    movementTween.stop();
    movementTween = null;
  }
}



// add event listener to show/hide a UI (e.g., the game's menu
document.body.addEventListener('click', function () {
  controls.lock();
});

// jumping (off the cliff)
//DO NOT TOUCH
function jump() {
  if (isJumping) return; // no double jumping
  isJumping = true;
  jumpStart = camera.position.y;
  const jumpTween = new TWEEN.Tween(camera.position)
    .to({ y: jumpStart + jumpHeight }, jumpDuration / 2)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => {
      const direction = movementDirection
        ? movementDirection.clone()
        : null;
      new TWEEN.Tween(camera.position)
        .to({ y: jumpStart }, jumpDuration / 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => {
          isJumping = false;
          if (direction) {
            //bunny hop exploit for speed runners, thank me later
            updateMovementDirection();
            moveCamera();
          }
        })
        .start();
    })
    .start();
}



// store direction (for science, trust me, i wont give it to NSA)
function getKeyCode(direction) {
  if (direction.equals(directions.ArrowUp)) {
    return "ArrowUp";
  } else if (direction.equals(directions.ArrowDown)) {
    return "ArrowDown";
  } else if (direction.equals(directions.ArrowLeft)) {
    return "ArrowLeft";
  } else if (direction.equals(directions.ArrowRight)) {
    return "ArrowRight";
  } else {
    return null;
  }
}

//ambient light
const ambientLight = new THREE.AmbientLight(0.2);
scene.add(ambientLight);

// create a directional light
const directionalLight = new THREE.DirectionalLight(0xff7443, 2);
directionalLight.castShadow = true;
directionalLight.position.set(-30, 10, 20);
scene.add(directionalLight);

//hemisphere light
const hemisphereLight = new THREE.HemisphereLight(
  0xffc0cb,
  0xffc0cb,
  1
);
scene.add(hemisphereLight);

//create a spotlight
const spotLight = new THREE.SpotLight(
  0x9452a5,
  1,
  75,
  Math.PI / 6,
  0.2,
  0
);

//spotlight position
spotLight.position.set(0, 7, 0);

//where the spotlight is pointing at
const targetPosition = new THREE.Vector3(0, 0, 0);
spotLight.target.position.copy(targetPosition);

//skysphere
const textureLoader = new THREE.TextureLoader();

//beautiful texture i made for the sky
const texture = textureLoader.load("/Images/skysphere.png");
const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.BackSide,
});

// skysphere
const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
skySphere.material.side = THREE.BackSide;
scene.add(skySphere);

// floor(ed by my ability to still understand whats going on)
const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const floorTexture = textureLoader.load("./Images/floortile.png");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(200, 200);
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

//add grandfather (fist model uau)
var grandfather = new THREE.Group();

// create body, head and nose (spheres)
const ClownTexture = textureLoader.load("/Images/clown_lower.png");
const ClownMaterial = new THREE.MeshStandardMaterial({
  map: ClownTexture,
  displacementMap: ClownTexture, // Set the displacement map texture
  displacementScale: 0.1, // Adjust the strength of the displacement effect
});

const FaceTexture = textureLoader.load("/Images/face.png");
const FaceMaterial = new THREE.MeshStandardMaterial({
  map: FaceTexture,
  displacementMap: FaceTexture, // Set the displacement map texture
  displacementScale: 0.1, // Adjust the strength of the displacement effect
});

const NoseTexture = textureLoader.load("/Images/nose.png");
const NoseMaterial = new THREE.MeshStandardMaterial({
  map: NoseTexture,
  displacementMap: NoseTexture, // set the displacement map texture
  displacementScale: 0, // adjust the strength of the displacement effect
});

const sphereGeometry1 = new THREE.SphereGeometry(2, 32, 32); //body
const sphereGeometry2 = new THREE.SphereGeometry(1, 32, 32); //head
const sphereGeometry3 = new THREE.SphereGeometry(0.25, 32, 32); //nose
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const sphere1 = new THREE.Mesh(sphereGeometry1, ClownMaterial); //body
const sphere2 = new THREE.Mesh(sphereGeometry2, FaceMaterial); //head
const sphere3 = new THREE.Mesh(sphereGeometry3, NoseMaterial); //nose
sphere1.position.y = 2; //body
sphere1.castShadow = true;
sphere2.position.y = 4.7; //head
sphere2.castShadow = true;
sphere3.position.y = 4.6; //nose height
sphere3.position.x = 1; //nose prominence
sphere3.castShadow = true;

// create the hat (cone)
const HatTexture = textureLoader.load("/Images/hat buttons.png");
const HatMaterial = new THREE.MeshStandardMaterial({
  map: HatTexture,
  displacementMap: HatTexture, // Set the displacement map texture
  displacementScale: 0, // Adjust the strength of the displacement effect
});

const coneGeometry = new THREE.ConeGeometry(1, 2, 32);
const coneMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
const cone = new THREE.Mesh(coneGeometry, HatMaterial);
cone.position.y = 6.2;
cone.rotation.y = -Math.PI / 2; // Apply a 90 degree rotation around the X axis
cone.castShadow = true;

// create the hat brim (torus)
var torusGeometry = new THREE.TorusGeometry(0.8, 0.2, 16, 100);
var torusMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
var torus = new THREE.Mesh(torusGeometry, NoseMaterial);
torus.position.y = 5.2;
torus.rotation.x = -Math.PI / 2;
torus.castShadow = true;

//const axesHelper = new THREE.AxesHelper( 10 );
//axesHelper.position.y = 6.2;
//scene.add( axesHelper );

// add the shapes to the group grandfather
grandfather.add(torus);
grandfather.add(sphere1);
grandfather.add(sphere2);
grandfather.add(sphere3);
grandfather.add(cone);

// rotate grandfather model to make it face the camera in the initial position
grandfather.rotation.y = -Math.PI / 2;

// create a listener
var listener = new THREE.AudioListener();

// add the listener to the camera
camera.add(listener);

// background song
var bgsong = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/background song.mp3", function (buffer) {
  bgsong.setBuffer(buffer);
  bgsong.setLoop(true);
  bgsong.setVolume(0.1);

  // start sound if autoplay is supported
  const playPromise = bgsong.play();
  if (playPromise instanceof Promise) {
    playPromise
      .then(() => {
        // autoplay started successfully
      })
      .catch((error) => {
        // if autoplay was prevented by the browser
        // handle the error or display a play button for the user to manually start playback
        console.error("Autoplay failed:", error);
      });
  } else {
    // old browser that doesn't support Promises
    bgsong.addEventListener("error", (error) => {
      console.error("Playback error:", error);
    });
  }
});

// collision sfx
var uhoh = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/uhoh.mp3", function (buffer) {
  uhoh.setBuffer(buffer);
  uhoh.setLoop(false);
  uhoh.setVolume(0.1);
});

// grandfather song
var gfsong = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/grandfather song.mp3", function (buffer) {
  gfsong.setBuffer(buffer);
  gfsong.setLoop(false);
  gfsong.setVolume(0.3);
});

// add grandfather model to scene
scene.add(grandfather);

// grandfather event
var isRotating = false;
document.addEventListener("keydown", function (event) {
  var distance = grandfather.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 7 && !isRotating) {
    hideSidebar(); // hide menu during event
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 0.3;
    spotLight.intensity = 5;
    // activate the spotlight for animation
    scene.add(spotLight);
    scene.add(spotLight.target);
    bgsong.pause();
    isRotating = true;
    var rotationAmount = Math.PI / 100;
    grandfather.rotation.y += rotationAmount;
    console.log("click");
    var startTime = Date.now();
    gfsong.play();
    var rotateInterval = setInterval(function () {
      var elapsedTime = Date.now() - startTime;
      if (elapsedTime >= 54000) {
        clearInterval(rotateInterval);
        isRotating = false;
        // return lighting back to normal
        spotLight.intensity = 0;
        ambientLight.intensity = 0.4;
        hemisphereLight.intensity = 0.5;
        toggleSidebar(); // show menu after event again
        gfsong.stop(); // stop the sound when the animation is over
        bgsong.play(); // resume bg song
      }
    }, 54);
  } else if (event.key === "e" && distance <= 7 && isRotating) {
    isRotating = false;
    gfsong.stop(); // stop the sound when the animation is over
    bgsong.play(); // resume bg song
    spotLight.intensity = 0;
    // return lighting back to normal
    ambientLight.intensity = 0.4;
    hemisphereLight.intensity = 0.5;
    toggleSidebar(); // show menu after event again
  }
});

var cameraCollision = false; // flag to track camera collision

// check for collision between the camera and grandfather
function checkCameraCollision() {
  var cameraPosition = camera.position;
  var grandfatherPosition = grandfather.position;
  var distance = cameraPosition.distanceTo(grandfatherPosition);

  if (distance < 3) {
    // collision detected
    cameraCollision = true;
  }
}

// animate the camera's bounce-back motion
function animateCameraBounce() {
  if (cameraCollision) {
    uhoh.play(); // play collision sfx
    // calculate the approach position
    var direction = new THREE.Vector3()
      .subVectors(camera.position, grandfather.position)
      .normalize();

    // calculate the target position of bounce-back
    var targetPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    targetPosition.add(direction.multiplyScalar(4));

    // use TWEEN to animate the bounce-back motion of x and z
    new TWEEN.Tween(camera.position)
      .to(targetPosition, 200) // set the duration of the animation
      .easing(TWEEN.Easing.Back.Out) // use an easing function for the bounce effect
      .onComplete(function () {
        animateCameraYPosition();
        cameraCollision = false; // reset the camera collision flag
      })
      .start();
  }
}

// use TWEEN to animate the bounce-back motion of y
function animateCameraYPosition() {
  new TWEEN.Tween(camera.position)
    .to({ y: 1 }, 200) // set the duration of the animation
    .easing(TWEEN.Easing.Quadratic.InOut) // easing function for smoother motion
    .start();
}

// soda pop
// create a group to hold components of soda pop
var pop = new THREE.Group();

// call textures for the objects
const poptexture = textureLoader.load("/Images/pop.jpg");
const popmaterial = new THREE.MeshStandardMaterial({
  map: poptexture,
  displacementMap: poptexture, // Set the displacement map texture
  displacementScale: 0, // Adjust the strength of the displacement effect
});

const labeltexture = textureLoader.load("/Images/sodapoplabel.png");
const labelmaterial = new THREE.MeshStandardMaterial({
  map: labeltexture,
  displacementMap: labeltexture, // Set the displacement map texture
  displacementScale: 0, // Adjust the strength of the displacement effect
});

const captexture = textureLoader.load("/Images/cap.png");
const capmaterial = new THREE.MeshStandardMaterial({
  map: captexture,
  displacementMap: captexture, // Set the displacement map texture
  displacementScale: 0, // Adjust the strength of the displacement effect
});

// create the objects that compose soda pop
var cylinder1 = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 0.5, 32),
  capmaterial
);
var cone2 = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 1.5, 1, 32),
  popmaterial
);
var cylinder2 = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 2, 32),
  labelmaterial
);
var cylinder3 = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 3, 32),
  popmaterial
);
var cone3 = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 1.5, 1, 32),
  popmaterial
);

// set positions, shadows and rotations for the objects
cylinder1.position.y = 6.8;
cylinder1.castShadow = true;
cone3.position.y = 6;
cone3.castShadow = true;
cylinder3.position.y = 2;
cylinder3.castShadow = true;
cylinder2.position.y = 4.5;
cylinder2.castShadow = true;
cone2.position.y = 0;
cone2.rotation.x = Math.PI;
cone2.castShadow = true;

// add the objects to the create soda pop
pop.add(cylinder1);
pop.add(cone2);
pop.add(cylinder2);
pop.add(cylinder3);
pop.add(cone3);
pop.position.x = 7;

// add the soda pop to the scene
scene.add(pop);
pop.position.z = -10;

// soda pop sfx
var drinking = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/drink.mp3", function (buffer) {
  drinking.setBuffer(buffer);
  drinking.setLoop(false);
  drinking.setVolume(0.3);
});

// soda pop lights (point lights)

// light 1
var shine1 = new THREE.PointLight(0xe62117, 100, 2, 20);
shine1.position.set(7, 7.5, -10); // Update the position to be higher above the object
shine1.rotation.x = Math.PI / 2; // Set the rotation to point upwards
scene.add(shine1);

// Create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// Create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// Increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// Create a mesh with the light geometry and updated material
var lightSphere1 = new THREE.Mesh(lightGeometry, lightMaterial);

// Position the light sphere at the same position as the point light
lightSphere1.position.copy(shine1.position);

// Add the light sphere to the scene
scene.add(lightSphere1);

//shine 2
var shine2 = new THREE.PointLight(0xe62117, 100, 2, 20);
shine2.position.set(5, 5, -10); // Update the position to be higher above the object

scene.add(shine2);

// Create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// Create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// Increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// Create a mesh with the light geometry and updated material
var lightSphere2 = new THREE.Mesh(lightGeometry, lightMaterial);

// Position the light sphere at the same position as the point light
lightSphere2.position.copy(shine2.position);

// Add the light sphere to the scene
scene.add(lightSphere2);

//light 3
var shine3 = new THREE.PointLight(0xe62117, 100, 2, 20);
shine3.position.set(9, 2, -10); // Update the position to be higher above the object
scene.add(shine3);

// Create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// Create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// Increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// Create a mesh with the light geometry and updated material
var lightSphere3 = new THREE.Mesh(lightGeometry, lightMaterial);

// Position the light sphere at the same position as the point light
lightSphere3.position.copy(shine3.position);

// Add the light sphere to the scene
scene.add(lightSphere3);

//light 4
var shine4 = new THREE.PointLight(0xe62117, 100, 2, 20);
shine4.position.set(7, 3, -8.5); // Update the position to be higher above the object
shine4.rotation.x = Math.PI / 2; // Set the rotation to point upwards
scene.add(shine4);

// Create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// Create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// Increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// Create a mesh with the light geometry and updated material
var lightSphere4 = new THREE.Mesh(lightGeometry, lightMaterial);

// Position the light sphere at the same position as the point light
lightSphere4.position.copy(shine4.position);

// Add the light sphere to the scene
scene.add(lightSphere4);

//light 5
var shine5 = new THREE.PointLight(0xe62117, 1, 2, 20);
shine5.position.set(7, 6.5, -11); // Update the position to be higher above the object
shine5.rotation.x = Math.PI / 2; // Set the rotation to point upwards
scene.add(shine5);

// Create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// Create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// Increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// Create a mesh with the light geometry and updated material
var lightSphere5 = new THREE.Mesh(lightGeometry, lightMaterial);

// Position the light sphere at the same position as the point light
lightSphere5.position.copy(shine5.position);

// Add the light sphere to the scene
scene.add(lightSphere5);

//initial intencitY
lightSphere1.intensity = 0;
shine1.intensity = 0;
lightSphere2.intensity = 0;
shine2.intensity = 0;
lightSphere3.intensity = 0;
shine3.intensity = 0;
lightSphere4.intensity = 0;
shine4.intensity = 0;
lightSphere5.intensity = 0;
shine5.intensity = 0;


// soda pop event
// add event listener for key press
document.addEventListener("keypress", popcleanse, false);

// handle the keypress
function popcleanse(event) {
  var distance = pop.position.distanceTo(camera.position);

  if (event.key === "e" && distance <= 6) {
    // event has occurred
    hideSidebar(); //hide controls
    console.log("bitchy");
    cry.stop();
    composer.removePass(renderPass);
    composer.removePass(glitchPass);
    composer.removePass(bloomPass);
    composer.removePass(filmPass);
    composer.addPass(renderPass);
    composer.addPass(bokehPass);
    //event intencitY
    hemisphereLight.intensity = 0;
    lightSphere1.intensity = 1;
    shine1.intensity = 1;
    lightSphere2.intensity = 1;
    shine2.intensity = 1;
    lightSphere3.intensity = 1;
    shine3.intensity = 1;
    lightSphere4.intensity = 1;
    shine4.intensity = 1;
    lightSphere5.intensity = 1;
    shine5.intensity = 1;
    drinking.play(); // play sfx
    // add a delay of 2 seconds 
    setTimeout(function () {
      toggleSidebar();
      hemisphereLight.intensity = 1;
      lightSphere1.intensity = 0;
      shine1.intensity = 0;
      lightSphere2.intensity = 0;
      shine2.intensity = 0;
      lightSphere3.intensity = 0;
      shine3.intensity = 0;
      lightSphere4.intensity = 0;
      shine4.intensity = 0;
      lightSphere5.intensity = 0;
      shine5.intensity = 0;
    }, 2000); // Delay of 2 seconds
  }
}

var cameraCollisionPop = false; // flag to track camera collision

// check for collision between the camera and pop
function checkCameraCollisionPop() {
  var cameraPosition = camera.position;
  var popPosition = pop.position;
  var distance = cameraPosition.distanceTo(popPosition);

  if (distance < 3) {
    // collision detected
    cameraCollisionPop = true;
  }
}

// animate the camera's bounce-back motion
function animateCameraBouncePop() {
  if (cameraCollisionPop) {
    uhoh.play(); // play collision sfx
    // calculate the approach position
    var direction = new THREE.Vector3()
      .subVectors(camera.position, pop.position)
      .normalize();

    // calculate the target position of bounce-back
    var targetPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    targetPosition.add(direction.multiplyScalar(4));

    // use TWEEN to animate the bounce-back motion of x and z
    new TWEEN.Tween(camera.position)
      .to(targetPosition, 200) // set the duration of the animation
      .easing(TWEEN.Easing.Back.Out) // use an easing function for the bounce effect
      .onComplete(function () {
        animateCameraYPosition();
        cameraCollisionPop = false; // reset the camera collision flag
      })
      .start();
  }
}

// use TWEEN to animate the bounce-back motion of y
function animateCameraYPositionPop() {
  new TWEEN.Tween(camera.position)
    .to({ y: 1 }, 200) // set the duration of the animation
    .easing(TWEEN.Easing.Quadratic.InOut) // easing function for smoother motion
    .start();
}

// make blanket
var blanketgeometry = new THREE.BoxGeometry(10, 0.5, 7); // Adjust the dimensions as desired

// call textures for blanket
const blankettexture = textureLoader.load("/Images/blanket.png");
var bumpTexture = new THREE.TextureLoader().load("/Images/blanket.png");
const blanketmaterial = new THREE.MeshStandardMaterial({
  map: blankettexture,
  displacementMap: blankettexture, // Set the displacement map texture
  displacementScale: 0, // Adjust the strength of the displacement effect
});

// Set the bump map property of the material
blanketmaterial.bumpMap = blankettexture;
// Adjust the bump scale to control the intensity of the effect (optional)
blanketmaterial.bumpScale = 0.8;

// apply blanket texture
var blanket = new THREE.Mesh(blanketgeometry, blanketmaterial);

// blanket position
blanket.position.x = -20;
blanket.position.y = 0;
blanket.castShadow = true;

// add blanket to scene
scene.add(blanket);

// blanket sound
var blsong = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/blanket song.mp3", function (buffer) {
  blsong.setBuffer(buffer);
  blsong.setLoop(false);
  blsong.setVolume(0.1);
});

//blanket event

document.addEventListener("keypress", rotateSky, false);
let rotationZ = 0;
let isRotatingSky = false;
let isAnimationInProgress = false;
const minRotationX = (-10 * Math.PI) / 180; // -10 degrees in radians
const maxRotationX = (10 * Math.PI) / 180; // 10 degrees in radians

function rotateSky(event) {
  const interactKey = "e";
  const distance = camera.position.distanceTo(blanket.position);
  const threshold = 4; // Adjust this value according to your needs

  // Get the yaw (rotation around the y-axis)
  const yaw = camera.rotation.y;

  // Calculate the angle between the current rotation and facing forward (0 degrees)
  const angleToForward = Math.abs(yaw) % (Math.PI * 2);
  if (
    event.key === interactKey &&
    !isAnimationInProgress &&
    distance < threshold &&
    camera.rotation.y >= minRotationX &&
    camera.rotation.y <= maxRotationX &&
    angleToForward < Math.PI / 4 // Allow up to 45 degrees yaw deviation from facing forward
  ) {
    // Stop keyboard, mouse inputs, and mouse movement
    document.addEventListener("keydown", preventDefaultHandler, true);
    document.addEventListener("mousedown", preventDefaultHandler, true);
    document.addEventListener("mousemove", preventDefaultHandler, true);
    console.log(camera.rotation);
    bgsong.pause();
    blsong.play();
    hideSidebar(); // hide menu during event

    if (!isRotatingSky) {
      isAnimationInProgress = true;

      // Tilt up animation
      const tiltUpTween = new TWEEN.Tween(camera.rotation)
        .to({ x: Math.PI / 3 }, 5000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

      tiltUpTween.onComplete(() => {
        const targetRotationZ = rotationZ + Math.PI;

        new TWEEN.Tween(skySphere.rotation)
          .to({ x: targetRotationZ * 8 }, 20000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onComplete(() => {
            // Tilt back animation
            const tiltBackTween = new TWEEN.Tween(camera.rotation)
              .to({ x: 0 }, 1000)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start();

            tiltBackTween.onComplete(() => {
              isAnimationInProgress = false;
              isRotatingSky = false;
              blsong.stop();
              bgsong.play();
              toggleSidebar(); // show menu after event again
              // Resume keyboard, mouse inputs, and mouse movement
              document.removeEventListener(
                "keydown",
                preventDefaultHandler,
                true
              );
              document.removeEventListener(
                "mousedown",
                preventDefaultHandler,
                true
              );
              document.removeEventListener(
                "mousemove",
                preventDefaultHandler,
                true
              );


            });
            composer.addPass(renderPass);
            composer.addPass(bloomPass);
            composer.addPass(filmPass);
            composer.addPass(bokehPass);
          })
          .start();
        rotationZ = targetRotationZ;
      });
    }

  }
}

function preventDefaultHandler(event) {
  event.preventDefault();
  event.stopPropagation();
}

// add computer model
// Declare the computer variable

var PC = new THREE.Group();

var computer;

// Load the model
var loader = new OBJLoader();
loader.load(
  "./models/computer/desktop_shortwires.obj",
  function (object) {
    // Assign the loaded object to the computer variable
    computer = object;

    // Load the texture
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "./models/computer/computer_texture.png",
      function (texture) {
        // Create a material with the loaded texture
        var material = new THREE.MeshBasicMaterial({ map: texture });

        // Apply the texture to the computer
        computer.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = material;
          }
        });

        // computer position
        computer.scale.set(20, 20, 20); // Modify the scale values as needed
        PC.add(computer);
        PC.position.x = 25;
        PC.position.y = 2.5;
        scene.add(PC);
      }
    );
  }
);

// computer sfx
var csong = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/bsod.mp3", function (buffer) {
  csong.setBuffer(buffer);
  csong.setLoop(false);
  csong.setVolume(0.1);
});

// crying sfx
var cry = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/crying.mp3", function (buffer) {
  cry.setBuffer(buffer);
  cry.setLoop(true);
  cry.setVolume(0.03);
});

//computer event
// Add event listener for key press
document.addEventListener("keypress", blueScreen, false);

// Set up a flag to track if the blue screen event has already occurred
var blueScreenEventOccurred = false;

// Handle the keypress
function blueScreen(event) {
  var distance = PC.position.distanceTo(camera.position);

  if (event.key === "e" && distance <= 14 && !blueScreenEventOccurred) {
    // event has occurred
    blueScreenEventOccurred = true;
    hideSidebar(); //hide controls
    csong.play(); // play sfx
    // add a delay of 1 second before changing the texture
    setTimeout(function () {
      //post processing
      composer.addPass(renderPass);
      composer.addPass(glitchPass);
      composer.addPass(bokehPass);
      // load new texture
      var textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        "./models/computer/computer_texture_bsod.png",
        function (texture) {
          // new material with the new texture
          var material = new THREE.MeshBasicMaterial({ map: texture });

          // apply new texture
          computer.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
              child.material = material;
            }

          });
        }
      );
    }, 1500); // Delay of 1.5 second

    //retunr controls
    setTimeout(function () {
      toggleSidebar();
      cry.play();
    }, 7000); // Delay of 7 seconds (duration of sfx) to return controls
  }
}

var cameraCollisionPC = false; // flag to track camera collision

// check for collision between the camera and computer
function checkCameraCollisionPC() {
  var cameraPosition = camera.position;
  var pcPosition = PC.position;
  var distance = cameraPosition.distanceTo(pcPosition);

  if (distance < 10) {
    // collision detected
    cameraCollisionPC = true;
  }
}

// animate the camera's bounce-back motion
function animateCameraBouncePC() {
  if (cameraCollisionPC) {
    uhoh.play(); // play collision sfx
    // calculate the approach position
    var direction = new THREE.Vector3()
      .subVectors(camera.position, PC.position)
      .normalize();

    // calculate the target position of bounce-back
    var targetPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    targetPosition.add(direction.multiplyScalar(4));

    // use TWEEN to animate the bounce-back motion of x and z
    new TWEEN.Tween(camera.position)
      .to(targetPosition, 200) // set the duration of the animation
      .easing(TWEEN.Easing.Back.Out) // use an easing function for the bounce effect
      .onComplete(function () {
        animateCameraYPositionPC();
        cameraCollisionPC = false; // reset the camera collision flag
      })
      .start();
  }
}

// use TWEEN to animate the bounce-back motion of y
function animateCameraYPositionPC() {
  new TWEEN.Tween(camera.position)
    .to({ y: 1 }, 200) // set the duration of the animation
    .easing(TWEEN.Easing.Quadratic.InOut) // easing function for smoother motion
    .start();
}

// add blocks model
// Declare the computer variable

var block = new THREE.Group();

const fbxLoader = new FBXLoader()

fbxLoader.load('./models/blocks/blocks.fbx',
(blocks) => {
  // blocks position
  blocks.scale.set(0.01, 0.01, 0.01); // Modify the scale values as needed
  block.add(blocks);
  block.position.x = -20;
  block.position.y = 0;
  block.position.z = -25;
  scene.add(block);
});

//blocks event

// blocks sfx
// crying sfx
var uboa = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/uboa.mp3", function (buffer) {
  uboa.setBuffer(buffer);
  uboa.setLoop(true);
  uboa.setVolume(0.05);
});

// Add event listener for key press
var isShowing = false;
document.addEventListener("keydown", function (event) {
  var distance = block.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 3 && !isShowing) {
    hideSidebar(); // hide menu during event
    toggleBlocks();
    bgsong.pause();
    isShowing = true;
    uboa.play();
    ambientLight.intensity = 0;
    hemisphereLight.intensity = 0;
    directionalLight.intensity = 0;
  } else if (event.key === "e" && distance <= 3 && isShowing) {
    isShowing = false;
    uboa.stop(); // stop the sound when the animation is over
    bgsong.play(); // resume bg song
    toggleSidebar(); // show menu after event again
    hideBlocks();
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 1;
    directionalLight.intensity = 2;
  } else if ( distance > 3 && isShowing) {
    isShowing = false;
    uboa.stop(); // stop the sound when the animation is over
    bgsong.play(); // resume bg song
    toggleSidebar(); // show menu after event again
    hideBlocks();
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 1;
    directionalLight.intensity = 2;
  };
});

//blocks collision
var cameraCollisionBlocks = false; // flag to track camera collision

// check for collision between the camera and computer
function checkCameraCollisionBlocks() {
  var cameraPosition = camera.position;
  var blocksPosition = block.position;
  var distance = cameraPosition.distanceTo(blocksPosition);

  if (distance < 2) {
    // collision detected
    cameraCollisionBlocks = true;
  }
}

// animate the camera's bounce-back motion
function animateCameraBounceBlocks() {
  if (cameraCollisionBlocks) {
    uhoh.play(); // play collision sfx
    // calculate the approach position
    var direction = new THREE.Vector3()
      .subVectors(camera.position, block.position)
      .normalize();

    // calculate the target position of bounce-back
    var targetPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    targetPosition.add(direction.multiplyScalar(4));

    // use TWEEN to animate the bounce-back motion of x and z
    new TWEEN.Tween(camera.position)
      .to(targetPosition, 200) // set the duration of the animation
      .easing(TWEEN.Easing.Back.Out) // use an easing function for the bounce effect
      .onComplete(function () {
        animateCameraYPosition();
        cameraCollisionBlocks = false; // reset the camera collision flag
      })
      .start();
  }
}


// render the scene
function animate() {
  requestAnimationFrame(animate);
  if (isRotating) {
    grandfather.rotation.y += Math.PI / 100;
  } else {
    grandfather.rotation.y += null;
  }
  checkCameraCollision();
  checkCameraCollisionPop();
  animateCameraBounce();
  animateCameraBouncePop();
  checkCameraCollisionPC();
  animateCameraBouncePC();
  checkCameraCollisionBlocks();
  animateCameraBounceBlocks();

  TWEEN.update();

  composer.render(1/60);

}

animate();