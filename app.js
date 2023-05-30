const express = require('express')
const app = express()
const path = require('path')
 
// Defining port number
const PORT = 3000;
 
// Function to serve all static files
// inside public directory.
app.use(express.static('public'));
app.use('/Images', express.static('Images'));
app.use('/sounds', express.static('sounds'));
app.use('/models', express.static('models'));
app.use('/css', express.static('css'));

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));


 
// Server setup
app.listen(PORT, () => {
    console.log(`Running server on PORT ${PORT}...`);
})
