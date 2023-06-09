//-----------------------------------------------------------------------------------------------
// imports
//-----------------------------------------------------------------------------------------------
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

//-----------------------------------------------------------------------------------------------
// declare renderer and composer
//-----------------------------------------------------------------------------------------------
let renderer, composer;

//-----------------------------------------------------------------------------------------------
// html and css events
//-----------------------------------------------------------------------------------------------

// show controls
function toggleSidebar() {
  var sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show-sidebar");
  sidebar.classList.remove("hide-sidebar");
}

// hide controls
function hideSidebar() {
  var sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hide-sidebar");
  sidebar.classList.remove("show-sidebar");
}

// toggles for the blocks
// show blocks jumpscare
function toggleBlocks() {
  var blocksevent = document.getElementById("blocks");
  blocksevent.classList.remove("show-blocks");
  blocksevent.classList.toggle("hide-blocks");
}

// hide blocks jumpscare
function hideBlocks() {
  var blocksevent = document.getElementById("blocks");
  blocksevent.classList.remove("hide-blocks");
  blocksevent.classList.toggle("show-blocks");
}

// end
function ending() {
  var ending = document.getElementById("end");
  ending.classList.toggle("end-fade");
}
//-----------------------------------------------------------------------------------------------
// set up the scene, camera, renderer and composer
//-----------------------------------------------------------------------------------------------
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

//-----------------------------------------------------------------------------------------------
// lighting
//-----------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------
// Perspective camera
//-----------------------------------------------------------------------------------------------
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var width = window.innerWidth;
var height = window.innerHeight;
var aspectRatio = width / height;
var cameraWidth = 700;
var cameraHeight = cameraWidth / aspectRatio;
var orthographicCamera = new THREE.OrthographicCamera(
  cameraWidth / -22,
  cameraWidth / 22,
  cameraHeight / 22,
  cameraHeight / -22,
  -500,
  1000
);
// Define the camera movement speed
let movementSpeed = 7; // units per second

// Set the default camera to perspective camera
let camera = perspectiveCamera;

// prespective camera position inside the skysphere
camera.position.set(1, 1, 20);

//-----------------------------------------------------------------------------------------------
//pointer controls for mouse interaction
//-----------------------------------------------------------------------------------------------
var controls = new PointerLockControls(camera, document.body);

//-----------------------------------------------------------------------------------------------
// function that toggle between perspective and orthographic camera and sets it up
//-----------------------------------------------------------------------------------------------
function toggleCamera() {
  if (camera === perspectiveCamera) {
    // Switch to orthographic camera if "Q" is pressed
    console.log(camera)
    // orthographic camera starting position
    camera = orthographicCamera;
    orthographicCamera.position.set(0, 7, 3);
    orthographicCamera.rotation.y = Math.PI / 8; 
    orthographicCamera.rotation.z = Math.PI / 2; 
    camera.lookAt(grandfather.position);
    // faster movement speed
    movementSpeed = 30; 
    // pass new camera to composer
    composer.removePass(renderPass);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // pointer controls during othographic view
    controls = new PointerLockControls(camera, document.body);
    controls.maxPolarAngle = Math.PI
    controls.minPolarAngle = Math.PI / 1.9
    controls.lock();
    // allow movement during orthographic view
    moveCamera();
  } else {
    // Switch to perspective camera when "Q" is pressed again
    camera = perspectiveCamera;
    movementSpeed = 7;
    // pass new view to composer
    composer.removePass(renderPass);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // same controls as before
    controls = new PointerLockControls(camera, document.body);
    controls.lock();
    moveCamera();
  }
}

// keydown event listener to toggle orthographic camera
document.addEventListener("keydown", function (event) {
  if (event.key === "q") {
    toggleCamera();
  }
});

//-----------------------------------------------------------------------------------------------
// post processing effects
//-----------------------------------------------------------------------------------------------

// pass to composer
var renderPass = new RenderPass(scene, camera);
console.log(renderPass)
composer.addPass(renderPass);

// glitch pass
const glitchPass = new GlitchPass();

// depth of field pass
const bokehPass = new BokehPass(scene, camera, {
  focus: 1,
  aperture: 0.0002,
  maxblur: 0.01
});

//maintain depth of fied affect from the beginning
composer.addPass(bokehPass)
//possible movement directions
const directions = {
  KeyW: new THREE.Vector3(0, 0, -1),
  KeyS: new THREE.Vector3(0, 0, 1),
  KeyA: new THREE.Vector3(-1, 0, 0),
  KeyD: new THREE.Vector3(1, 0, 0),
};

// compose two effect for blurry effect
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

//-----------------------------------------------------------------------------------------------
// movement event listeners
//-----------------------------------------------------------------------------------------------

// keep track of the pressed keys
const pressedKeys = {};

// set up jump animation variables
const gravity = 0.01;
const jumpHeight = 2; // height of the jump in units
const jumpDuration = 500; // duration of the jump animation
let isJumping = false; // flag to prevent multiple jumps
let jumpStart = null; // starting height of the jump

// keep track of the current movement direction variables
let movementDirection = null;
let movementTween = null;

console.log(camera)

// jump when "SPACE" is pressed
document.addEventListener("keydown", (event) => {
  if (isJumping) {
    // dont double jump
    return;
  }
  const keyCode = event.code;
  if (keyCode in directions) {
    pressedKeys[keyCode] = true;
    updateMovementDirection();
    moveCamera();
  } else if (keyCode === "Space") {
    //simple jump
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

// movement direction based on pressed keys "WASD"
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
    if (nextPosition.y >= 1 && camera === perspectiveCamera || nextPosition.y <= 1 && camera === perspectiveCamera) {
      console.log(camera)
      movementDirection.y -= nextPosition.y - 1; // adjust y to stay below y=1
    }
    else if (camera === orthographicCamera && nextPosition.y >= 7 || camera === orthographicCamera && nextPosition.y <= 7) {
      movementDirection.y -= nextPosition.y + 7; // 
      console.log(nextPosition.y)
    }
  } else {
    movementDirection = null;
  }
}

//-----------------------------------------------------------------------------------------------
// smooth camera movement
//-----------------------------------------------------------------------------------------------
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

// add event listener to start game with click
document.body.addEventListener('click', function () {
  controls.lock();
});

//-----------------------------------------------------------------------------------------------
// jumping
//-----------------------------------------------------------------------------------------------
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

//-----------------------------------------------------------------------------------------------
// grandfather model
//-----------------------------------------------------------------------------------------------

// add grandfather (fist model uau)
var grandfather = new THREE.Group();
var head = new THREE.Group();
var hat = new THREE.Group();

// spotlight position for grandfather event
spotLight.position.set(0, 14, 8);

// where the spotlight is pointing at
const targetPosition = new THREE.Vector3(0, 0, 8);
spotLight.target.position.copy(targetPosition);

// textures
const ClownTexture = textureLoader.load("/Images/clown_lower.png");
const ClownMaterial = new THREE.MeshStandardMaterial({
  map: ClownTexture,
  displacementMap: ClownTexture, // set the displacement map texture
  displacementScale: 0.1, // adjust the strength of the displacement effect
});

const FaceTexture = textureLoader.load("/Images/face.png");
const FaceMaterial = new THREE.MeshStandardMaterial({
  map: FaceTexture,
  displacementMap: FaceTexture, // set the displacement map texture
  displacementScale: 0.1, // adjust the strength of the displacement effect
});

const NoseTexture = textureLoader.load("/Images/nose.png");
const NoseMaterial = new THREE.MeshStandardMaterial({
  map: NoseTexture,
  displacementMap: NoseTexture, 
  displacementScale: 0, 
});

// create body, head and nose (spheres)
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
  displacementMap: HatTexture, 
  displacementScale: 0, 
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

// group head
head.add(sphere2);
head.add(sphere3);

// group hat
hat.add(cone);
hat.add(torus);

// group grandfather
grandfather.add(hat);
grandfather.add(head);
grandfather.add(sphere1);


// rotate grandfather model to make it face the camera in the initial position
grandfather.rotation.y = -Math.PI / 2;
grandfather.scale.set(2, 2, 2);
grandfather.position.z = 8;

// add grandfather model to scene
scene.add(grandfather);

//-----------------------------------------------------------------------------------------------
//gandfather event, audio and sfx
//-----------------------------------------------------------------------------------------------

// create a listener for audio
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

// grandfather song
var gfsong = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/grandfather song.mp3", function (buffer) {
  gfsong.setBuffer(buffer);
  gfsong.setLoop(false);
  gfsong.setVolume(0.3);
});

// grandfather event
var isRotating = false;
document.addEventListener("keydown", function (event) {
  var distance = grandfather.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 7 && !isRotating) {
    hideSidebar(); // hide controls during event
    // lower lighting
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 0.3;
    spotLight.intensity = 5;
    // activate the spotlight for animation
    scene.add(spotLight); // turn on spotlight
    scene.add(spotLight.target);
    bgsong.pause(); // stop background song
    //rotating animation
    isRotating = true;
    var rotationAmount = Math.PI / 100;
    grandfather.rotation.y += rotationAmount;
    console.log("click");
    var startTime = Date.now();
    gfsong.play(); // stop background song
    // if untouched, animation lasts 54 seconds
    var rotateInterval = setInterval(function () {
      var elapsedTime = Date.now() - startTime;
      if (elapsedTime >= 54000) {
        clearInterval(rotateInterval);
        isRotating = false;
        // return lighting back to normal
        spotLight.intensity = 0;
        ambientLight.intensity = 0.4;
        hemisphereLight.intensity = 0.5;
        toggleSidebar(); // show controls after event again
        gfsong.stop(); // stop the sound when the animation is over
        bgsong.play(); // resume bg song
      }
    }, 54);
  } else if (event.key === "e" && distance <= 7 && isRotating) {
    //press "E" again to stop event
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

//-----------------------------------------------------------------------------------------------
//gandfather collision
//-----------------------------------------------------------------------------------------------

// collision sfx
var uhoh = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/uhoh.mp3", function (buffer) {
  uhoh.setBuffer(buffer);
  uhoh.setLoop(false);
  uhoh.setVolume(0.1);
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

//-----------------------------------------------------------------------------------------------
// soda pop model
//-----------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------
// soda pop bubbles
//-----------------------------------------------------------------------------------------------

// shine 1
var shine1 = new THREE.PointLight(0xe62117, 100, 2, 20);
shine1.position.set(7, 7.5, -10); // Update the position to be higher above the object
shine1.rotation.x = Math.PI / 2; // Set the rotation to point upwards
scene.add(shine1);

// create a sphere geometry for the light
var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);

// create a material that emits light
var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffffff, emissive: 0xe62117 });

// increase the intensity and color of the material
lightMaterial.emissiveIntensity = 1;
lightMaterial.emissiveDistance = 2;
lightMaterial.emissiveDecay = 200;
lightMaterial.color.setHex(0xe62117);

// create a mesh with the light geometry and updated material
var lightSphere1 = new THREE.Mesh(lightGeometry, lightMaterial);

// position the light sphere at the same position as the point light
lightSphere1.position.copy(shine1.position);

// add the light sphere to the scene
scene.add(lightSphere1);

// shine 2
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

// shine 3
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

// shine 4
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

// shine 5
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

//-----------------------------------------------------------------------------------------------
// soda pop event
//-----------------------------------------------------------------------------------------------

// soda pop sfx
var drinking = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/drink.mp3", function (buffer) {
  drinking.setBuffer(buffer);
  drinking.setLoop(false);
  drinking.setVolume(0.3);
});

// add event listener for key press
document.addEventListener("keypress", popcleanse, false);

// handle the keypress
function popcleanse(event) {
  var distance = pop.position.distanceTo(camera.position);

  if (event.key === "e" && distance <= 6) {
    // event has occurred
    hideSidebar(); //hide controls
    //cleanse effects from computer event
    cry.stop(); 
    composer.removePass(renderPass);
    composer.removePass(glitchPass);
    //cleanse effects from blanket effect
    composer.removePass(bloomPass);
    composer.removePass(filmPass);
    //keep depth of field effects
    composer.addPass(renderPass);
    composer.addPass(bokehPass);
    // lighting changes
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
    // add a delay of 2 seconds (so the light only return to normal after the drinking sound is over)
    setTimeout(function () {
      toggleSidebar(); // show controls again
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

//-----------------------------------------------------------------------------------------------
// soda pop collision
//-----------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------
// blanket model
//-----------------------------------------------------------------------------------------------

//blanket geometry
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

//-----------------------------------------------------------------------------------------------
// blanket event
//-----------------------------------------------------------------------------------------------

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

  // doesnt allow event to run ifacing forwardf not 
  const distance = camera.position.distanceTo(blanket.position);
  const threshold = 4; 

  // get the yaw (rotation around the y-axis)
  const yaw = camera.rotation.y;

  // calculate the angle between the current rotation and facing forward (0 degrees)
  const angleToForward = Math.abs(yaw) % (Math.PI * 2);
  if (
    event.key === interactKey &&
    !isAnimationInProgress &&
    distance < threshold &&
    camera.rotation.y >= minRotationX &&
    camera.rotation.y <= maxRotationX &&
    angleToForward < Math.PI / 4 // allow up to 45 degrees yaw deviation from facing forward
  ) {
    // stop keyboard, mouse inputs, and mouse movement during event
    document.addEventListener("keydown", preventDefaultHandler, true);
    document.addEventListener("mousedown", preventDefaultHandler, true);
    document.addEventListener("mousemove", preventDefaultHandler, true);
    console.log(camera.rotation);
    // sound shenannigans
    bgsong.pause();
    blsong.play();
    hideSidebar(); // hide menu during event

    if (!isRotatingSky) {
      isAnimationInProgress = true;

      // tilt up animation
      const tiltUpTween = new TWEEN.Tween(camera.rotation)
        .to({ x: Math.PI / 3 }, 5000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

      tiltUpTween.onComplete(() => {
        const targetRotationZ = rotationZ + Math.PI;
        //rotate sky
        new TWEEN.Tween(skySphere.rotation)
          .to({ x: targetRotationZ * 8 }, 20000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onComplete(() => {
            // tilt back animation
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
              // resume keyboard, mouse inputs, and mouse movement
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
            //add post prossecing effects after event
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

// stop movement inputs
function preventDefaultHandler(event) {
  event.preventDefault();
  event.stopPropagation();
}

//-----------------------------------------------------------------------------------------------
// computer model import
//-----------------------------------------------------------------------------------------------

// declare the computer variables for model and group
var PC = new THREE.Group();
var computer;

// load the model
var loader = new OBJLoader();
loader.load(
  "./models/computer/desktop_shortwires.obj",
  function (object) {
    // assign the loaded object to the computer variable
    computer = object;

    // load the texture
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "./models/computer/computer_texture.png",
      function (texture) {
        // create a material with the loaded texture
        var material = new THREE.MeshBasicMaterial({ map: texture });

        // apply the texture to the computer
        computer.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = material;
          }
        });

        // computer position
        computer.scale.set(20, 20, 20); // Modify the scale values as needed
        PC.add(computer);
        PC.position.x = 35;
        PC.position.y = 2.5;
        PC.position.z = -10;
        scene.add(PC);
      }
    );
  }
);

//-----------------------------------------------------------------------------------------------
// computer event
//-----------------------------------------------------------------------------------------------

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

// add event listener for key press
document.addEventListener("keypress", blueScreen, false);

// set up a flag to track if the blue screen event has already occurred since it's a one time event
var blueScreenEventOccurred = false;

// handle the keypress
function blueScreen(event) {
  var distance = PC.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 14 && !blueScreenEventOccurred) {
    // event has occurred
    blueScreenEventOccurred = true;
    hideSidebar(); //hide controls
    csong.play(); // play sfx
    // add a delay of 1 second before changing the texture
    setTimeout(function () {
      // post processing
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

    // return controls
    setTimeout(function () {
      toggleSidebar();
      cry.play();
    }, 7000); // Delay of 7 seconds (duration of sfx) to return controls
  }
}

//-----------------------------------------------------------------------------------------------
// computer collision
//-----------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------
// blocks model import 
//-----------------------------------------------------------------------------------------------

// declare the block variables for group and loader
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

//-----------------------------------------------------------------------------------------------
// blocks event
//-----------------------------------------------------------------------------------------------

// blocks sfx
var uboa = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/uboa.mp3", function (buffer) {
  uboa.setBuffer(buffer);
  uboa.setLoop(true);
  uboa.setVolume(0.05);
});

// flag for event
var isShowing = false;

// add event listener for key press
document.addEventListener("keydown", function (event) {
  var distance = block.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 3 && !isShowing) {
    hideSidebar(); // hide menu during event
    toggleBlocks(); // show blocks jumpscare
    isShowing = true;
    // sound shenannigans
    bgsong.pause();
    uboa.play();
    //turn off all lights
    ambientLight.intensity = 0;
    hemisphereLight.intensity = 0;
    directionalLight.intensity = 0;
  } else if (event.key === "e" && distance <= 3 && isShowing) {
    // press "E" again to stop event
    isShowing = false;
    uboa.stop(); // stop the sound when the animation is over
    bgsong.play(); // resume bg song
    toggleSidebar(); // show controls after event again
    hideBlocks(); // hide jumpscare
    //return lighting to normal
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 1;
    directionalLight.intensity = 2;
  } else if (distance > 3 && isShowing) {
    // run away to stop event
    isShowing = false;
    uboa.stop(); // stop the sound when the animation is over
    bgsong.play(); // resume bg song
    toggleSidebar(); // show controls after event again
    hideBlocks(); // hide jumscare
    //return lighting to normal
    ambientLight.intensity = 0.2;
    hemisphereLight.intensity = 1;
    directionalLight.intensity = 2;
  };
});

//-----------------------------------------------------------------------------------------------
// blocks collision
//-----------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------
// bed model import
//-----------------------------------------------------------------------------------------------

// variables for group and loader
var bed = new THREE.Group();
const coiso = new FBXLoader()

coiso.load('./models/bed/Bed.fbx',
  (end) => {

    // bed position
    end.scale.set(0.05, 0.05, 0.05); // Modify the scale values as needed
    bed.add(end);
    bed.position.x = 30;
    bed.position.y = 0;
    bed.position.z = -40;
    scene.add(bed);
  });

//-----------------------------------------------------------------------------------------------
// bed event (game end)
//-----------------------------------------------------------------------------------------------

// bed sfx
var uboa = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/uboa.mp3", function (buffer) {
  uboa.setBuffer(buffer);
  uboa.setLoop(true);
  uboa.setVolume(0.05);
});

// ending sfx
var home = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();
audioLoader.load("./sounds/home.mp3", function (buffer) {
  home.setBuffer(buffer);
  home.setLoop(false);
  home.setVolume(0.1);
});

// Add event listener for key press
document.addEventListener("keydown", function (event) {
  var distance = bed.position.distanceTo(camera.position);
  if (event.key === "e" && distance <= 7) {
    //sound shenannigans
    bgsong.pause();
    home.play();
    //display end screen
    ending();
  }
});

//-----------------------------------------------------------------------------------------------
// bed collision
//-----------------------------------------------------------------------------------------------

var cameraCollisionBed = false; // flag to track camera collision

// check for collision between the camera and computer
function checkCameraCollisionBed() {
  var cameraPosition = camera.position;
  var bedPosition = bed.position;
  var distance = cameraPosition.distanceTo(bedPosition);

  if (distance < 6) {
    // collision detected
    cameraCollisionBed = true;
  }
}

// animate the camera's bounce-back motion
function animateCameraBounceBed() {
  if (cameraCollisionBed) {
    uhoh.play(); // play collision sfx
    // calculate the approach position
    var direction = new THREE.Vector3()
      .subVectors(camera.position, bed.position)
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
        cameraCollisionBed = false; // reset the camera collision flag
      })
      .start();
  }
}

//-----------------------------------------------------------------------------------------------
// render and animate scene
//-----------------------------------------------------------------------------------------------

// render the scene
function animate() {

  //animate grandfather
  requestAnimationFrame(animate);
  if (isRotating) {
    grandfather.rotation.y += Math.PI / 100;
  } else {
    grandfather.rotation.y += null;
  }

  //collision checkers
  checkCameraCollision();
  checkCameraCollisionPop();
  animateCameraBounce();
  animateCameraBouncePop();
  checkCameraCollisionPC();
  animateCameraBouncePC();
  checkCameraCollisionBlocks();
  animateCameraBounceBlocks();
  checkCameraCollisionBed();
  animateCameraBounceBed();

  TWEEN.update();

  composer.render(1 / 60);

}

animate();