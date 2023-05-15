const directions = {
    ArrowUp: new THREE.Vector3(0, 0, -1),
    ArrowDown: new THREE.Vector3(0, 0, 1),
    ArrowLeft: new THREE.Vector3(-1, 0, 0),
    ArrowRight: new THREE.Vector3(1, 0, 0),
  };
  
  // Define the camera movement speed
  const movementSpeed = 10; // units per second
  
  // Set up jump animation variables
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
    const keyCode = event.code;
    if (keyCode in directions) {
      console.log(keyCode)
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
        .onComplete(() => { movementTween = null; })
        .start();
    }
  }
  
  // Define a function to stop camera movement
  function stopMovement() {
    if (movementTween) {
      movementTween.stop();
      movementTween = null;
    }
  }
  
  // Define a function to handle jumping
  function jump() {
    if (isJumping) return; // Don't jump if already jumping
    isJumping = true;
    jumpStart = camera.position.y;
    const currentDirection = movementDirection ? movementDirection.clone() : null;
    new TWEEN.Tween(camera.position)
      .to({ y: jumpStart + jumpHeight }, jumpDuration / 2)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        new TWEEN.Tween(camera.position)
          .to({ y: jumpStart }, jumpDuration / 2)
          .easing(TWEEN.Easing.Quadratic.In)
          .onComplete(() => {
            isJumping = false;
            if (currentDirection) {
              pressedKeys[currentDirection.key] = true;
              updateMovementDirection();
              moveCamera();
            }
          })
          .start();
      })
      .start();
  }
