import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';





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
// set up the scene, camera, and renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const composer = new EffectComposer(renderer);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const perspectiveCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//ortho camera
const orthographicCamera = new THREE.OrthographicCamera();

// initial position of the orthographic camera
orthographicCamera.position.copy(perspectiveCamera.position);

// ortho camera's minimum height
const minHeight = 1;

// calculate orthographic camera parameters based on perspective camera frustum
function calculateOrthographicParameters(perspectiveCamera, minHeight) {
  const frustumHeight =
    2 *
    Math.tan(THREE.Math.degToRad(perspectiveCamera.fov) / 2) *
    perspectiveCamera.position.z;
  const frustumWidth = frustumHeight * perspectiveCamera.aspect;

  const orthoHeight = frustumHeight * 1.5; // increase the height by a factor of 1.5

  const cameraBottom = orthographicCamera.position.y - orthoHeight / 2;

  // adjust the camera position if it falls below the floor
  if (cameraBottom < minHeight) {
    orthographicCamera.position.y += minHeight - cameraBottom;
  }

  return {
    left: -frustumWidth / 2,
    right: frustumWidth / 2,
    top: orthographicCamera.position.y + orthoHeight / 2,
    bottom: orthographicCamera.position.y - orthoHeight / 2,
    near: orthographicCamera.near,
    far: orthographicCamera.far,
  };
}

// perspective camera as default
let camera = perspectiveCamera;

// define the camera movement speed
var movementSpeed = 7; // units per second

// toggle between perspective and orthographic camera
function toggleCamera() {
  if (camera === perspectiveCamera) {
    // switch to orthographic camera
    const orthoParams = calculateOrthographicParameters(
      perspectiveCamera,
      minHeight
    );
    orthographicCamera.left = orthoParams.left;
    orthographicCamera.right = orthoParams.right;
    orthographicCamera.top = orthoParams.top;
    orthographicCamera.bottom = orthoParams.bottom;
    orthographicCamera.near = orthoParams.near;
    orthographicCamera.far = orthoParams.far;
    orthographicCamera.updateProjectionMatrix();
    camera = orthographicCamera;
    camera.position.copy(perspectiveCamera.position);
    movementSpeed = 30;
  } else {
    // switch to perspective camera
    movementSpeed = 7;
    camera = perspectiveCamera;
    camera.position.copy(orthographicCamera.position);
  }
}

//register keydown event listener to toggle orthographic camera
document.addEventListener("keydown", function (event) {
  if (event.key === "q") {
    toggleCamera();
  }
});

//camera position inside the skysphere
camera.position.set(1, 1, 20);

//post processing vars
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const glitchPass = new GlitchPass();
//blurry
const bloomPass = new BloomPass(1,    // strength
  25,   // kernel size
  4,    // sigma ?
  256,  // blur render target resolution
);

const filmPass = new FilmPass(
  0.2,   // noise intensity
  0.025,  // scanline intensity
  648,    // scanline count
  false,  // grayscale
);
filmPass.renderToScreen = true;

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
    if (nextPosition.y >= 1 || nextPosition.y <= 1) {
      movementDirection.y -= nextPosition.y - 1; // adjust y to stay below y=1
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
const controls = new PointerLockControls(camera, document.body);

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

const ambientLight = new THREE.AmbientLight("white", 0.4);
scene.add(ambientLight);

// create a directional light
const directionalLight = new THREE.DirectionalLight("pink", 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(
  "purple",
  "purple",
  0.5
);
scene.add(hemisphereLight);

//create a spotlight
const spotLight = new THREE.SpotLight(
  "purple",
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
sphere2.position.y = 4.7; //head
sphere3.position.y = 4.6; //nose height
sphere3.position.x = 1; //nose prominence

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

// create the hat brim (torus)
var torusGeometry = new THREE.TorusGeometry(0.8, 0.2, 16, 100);
var torusMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
var torus = new THREE.Mesh(torusGeometry, NoseMaterial);
torus.position.y = 5.2;
torus.rotation.x = -Math.PI / 2;

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

// create the objects
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

// set positions and rotations for the objects
cylinder1.position.y = 6.8;
cone3.position.y = 6;
cylinder3.position.y = 2;
cylinder2.position.y = 4.5;
cone2.position.y = 0;
cone2.rotation.x = Math.PI;

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

//soda pop event

// Add event listener for key press
document.addEventListener("keypress", popcleanse, false);

// Handle the keypress
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
    //blurr
    drinking.play(); // play sfx
    // add a delay of 2 seconds before changing the texture
    setTimeout(function () {
      toggleSidebar();
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
              composer.addPass(bloomPass);
              composer.addPass(filmPass);

            });
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
        computer.position.set(20, 2.5, 0);
        scene.add(computer);
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
  var distance = computer.position.distanceTo(camera.position);

  if (event.key === "e" && distance <= 14 && !blueScreenEventOccurred) {
    // event has occurred
    blueScreenEventOccurred = true;
    hideSidebar(); //hide controls
    csong.play(); // play sfx
    // add a delay of 1 second before changing the texture
    setTimeout(function () {
      //post processing
      composer.addPass(glitchPass);
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
  var pcPosition = computer.position;
  var distance = cameraPosition.distanceTo(pcPosition);

  if (distance < 12) {
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
      .subVectors(camera.position, computer.position)
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

  TWEEN.update();
  renderer.render(scene, camera);
  composer.render();
}

animate();