		
    
        // Set up the scene, camera, and renderer
        const scene = new THREE.Scene();
        const cameraInitialY = 1; // define the initial Y position of the camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);


        

// Set the camera position inside the skysphere
camera.position.set(1, 1, 20);
        
        
// Define the movement directions
// Define the movement directions
const directions = {
  ArrowUp: new THREE.Vector3(0, 0, -1),
  ArrowDown: new THREE.Vector3(0, 0, 1),
  ArrowLeft: new THREE.Vector3(-1, 0, 0),
  ArrowRight: new THREE.Vector3(1, 0, 0),
};

// Define the camera movement speed
const movementSpeed = 7; // units per second

// Set up jump animation variables
const gravity = 0.01;
const jumpHeight = 2; // height of the jump in world units
const jumpDuration = 500; // duration of the jump animation in milliseconds
let isJumping = false; // flag to prevent multiple jumps
let jumpStart = null; // starting height of the jump

// Keep track of the current movement direction and tween
let movementDirection = null;
let movementTween = null;

// Keep track of the pressed keys
const pressedKeys = {};

// Add key event listeners to detect movement and jumping
document.addEventListener('keydown', (event) => {
  if (isJumping) {
    return;
  }    
  const keyCode = event.code;
  if (keyCode in directions) {
    pressedKeys[keyCode] = true;
    updateMovementDirection();
    moveCamera();
  } else if (keyCode === 'Space') {
    jump();
  }
});

document.addEventListener('keyup', (event) => {
  const keyCode = event.code;
  if (keyCode in directions) {
    pressedKeys[keyCode] = false;
    updateMovementDirection();
    if (!Object.values(pressedKeys).some((value) => value)) {
      stopMovement();
    }
  }
});

// Define a function to update the movement direction based on the pressed keys
function updateMovementDirection() {
  let x = 0;
  let z = 0;
  if (pressedKeys.ArrowUp) {
    z -= 1;
  }
  if (pressedKeys.ArrowDown) {
    z += 1;
  }
  if (pressedKeys.ArrowLeft) {
    x -= 1;
  }
  if (pressedKeys.ArrowRight) {
    x += 1;
  }
  if (x !== 0 || z !== 0) {
    movementDirection = new THREE.Vector3(x, 0, z).normalize();
  } else {
    movementDirection = null;
  }
}

// Define a function to handle camera movement
// DO NOT TOUCH
function moveCamera() {
  if (movementDirection) {
    const distance = movementDirection.clone().multiplyScalar(movementSpeed);
    const duration = distance.length() * 1000 / movementSpeed;
    if (movementTween) {
      movementTween.stop();
    }
    movementTween = new TWEEN.Tween(camera.position)
      .to(camera.position.clone().add(distance), duration)
      .easing(TWEEN.Easing.Linear.None)
      .onComplete(() => {
        movementTween = null;
        
          
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
//To make the camera keep moving in the direction still pressed after it hits the ground, 
//we need to set the movementTween variable to null when the tween completes


// Define a function to stop camera movement
function stopMovement() {
  if (movementTween) {
    movementTween.stop();
    movementTween = null;
  }
}

// Define a function to handle jumping
// DO NOT TOUCH
function jump() {
  if (isJumping) return; // Don't jump if already jumping
  isJumping = true;
  jumpStart = camera.position.y;
  const jumpTween = new TWEEN.Tween(camera.position)
    .to({ y: jumpStart + jumpHeight }, jumpDuration / 2)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => {
      const direction = movementDirection ? movementDirection.clone() : null;
      new TWEEN.Tween(camera.position)
        .to({ y: jumpStart }, jumpDuration / 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => { 
          isJumping = false; 
          if (direction) {
            
            updateMovementDirection();
            moveCamera();
          }
        })
        .start();
    })
    .start();
}

// Define a helper function to get the key code for a given direction
function getKeyCode(direction) {
  if (direction.equals(directions.ArrowUp)) {
    return 'ArrowUp';
  } else if (direction.equals(directions.ArrowDown)) {
    return 'ArrowDown';
  } else if (direction.equals(directions.ArrowLeft)) {
    return 'ArrowLeft';
  } else if (direction.equals(directions.ArrowRight)) {
    return 'ArrowRight';
  } else {
    return null;
  }
}
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Create the skysphere
        const textureLoader = new THREE.TextureLoader();

        // Load the texture image
        const texture = textureLoader.load('./Images/skysphere.png');
        const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
        const skyMaterial = new THREE.MeshBasicMaterial({
             map: texture,
             side: THREE.BackSide,
        });

        const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
        skySphere.material.side = THREE.BackSide;
        scene.add(skySphere);

        // Create the floor
        const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
        const textureLoaderFloor = new THREE.TextureLoader();
        const floorTexture = textureLoaderFloor.load('/Images/LSD_Coverart.png');
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Create grandfather
const sphereGeometry = new THREE.SphereGeometry(10, 10, 10);
const sphereMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.y = 10;

// Create a bounding sphere around the grandfather's mesh
const sphereBoundingSphere = new THREE.Sphere(sphere.position, 10);

scene.add(sphere);





        // Render the scene
        function animate() {
        requestAnimationFrame(animate);
         TWEEN.update();
         
         renderer.render(scene, camera);

        }
        animate();




