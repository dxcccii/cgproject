
		
    
        // Set up the scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Create the skysphere
        const textureLoader = new THREE.TextureLoader();

// Load the texture image
const texture = textureLoader.load('skysphere.png');
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
        const floorMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
   

        // Create the cube
        const cubeGeometry = new THREE.BoxGeometry();
        const cubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.y = 1;
        scene.add(cube);

        // Set the camera position inside the skysphere
        camera.position.set(1, 1, 1);
      
        // Listen for arrow key events to move the camera
        document.addEventListener('keydown', (event) => {
            const arrowKey = event.key.replace('Arrow', '');
            const arrowDirection = new THREE.Vector3();
            switch (arrowKey) {
                case 'Up':
                    arrowDirection.z = -1;
                    break;
                case 'Down':
                    arrowDirection.z = 1;
                    break;
                case 'Left':
                    arrowDirection.x = -1;
                    break;
                case 'Right':
                    arrowDirection.x = 1;
                    break;
                default:
                    return;
            }
            arrowDirection.applyQuaternion(camera.quaternion);
            arrowDirection.multiplyScalar(10);
            const newPosition = camera.position.clone().add(arrowDirection);
            new TWEEN.Tween(camera.position)
                .to(newPosition, 500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
        });

        // Render the scene
        function animate() {
   requestAnimationFrame(animate);
    TWEEN.update();
    cube.position.copy(camera.position);
        cube.position.z -= 5;
    renderer.render(scene, camera);

        }
        animate();