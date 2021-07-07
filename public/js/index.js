var path = window.location.pathname;
var page = path.split("/").pop();


if (page!='alumni'){
    // BACKGROUND
    var renderer, scene, camera, composer, particle;

    window.onload = function () {
    init();
    animate();
    };

    function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize((window.innerWidth - (13)), window.innerHeight);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);
    document.getElementById("canvas").appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        95,
        (window.innerWidth - (13)) / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 500;
    scene.add(camera);

    particle = new THREE.Object3D();

    scene.add(particle);

    var geometry = new THREE.TetrahedronGeometry(2, 0);

    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading,
    });
    // number of particles - 1000
    for (var i = 0; i < 1000; i++) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize();
        // closeness of particles
        mesh.position.multiplyScalar(90 + Math.random() * 1800);
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        particle.add(mesh);
    }

    var ambientLight = new THREE.AmbientLight(0x999999);
    scene.add(ambientLight);

    var lights = [];
    lights[0] = new THREE.DirectionalLight(0x00d3f7, 1);
    lights[0].position.set(1, 0, 0);
    lights[1] = new THREE.DirectionalLight(0x00d3f7, 1);
    lights[1].position.set(0.75, 1, 0.5);
    lights[2] = new THREE.DirectionalLight(0x0000ff, 1);
    lights[2].position.set(-0.75, -1, 0.5);
    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    window.addEventListener("resize", onWindowResize, false);
    }

    function onWindowResize() {
    camera.aspect = (window.innerWidth - (13)) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize((window.innerWidth - (13)), window.innerHeight);
    }

    function animate() {
    requestAnimationFrame(animate);
    particle.rotation.x += 0.0;
    particle.rotation.y -= 0.0002;

    renderer.clear();
    renderer.render(scene, camera);
    }
}
else if (page==='alumni'){
        // BACKGROUND
        var renderer, scene, camera, composer, particle;

        window.onload = function () {
        init();
        animate();
        };
    
        function init() {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
        renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
        renderer.setSize((window.innerWidth - (13)), window.innerHeight);
        renderer.autoClear = false;
        renderer.setClearColor(0x000000, 0.0);
        document.getElementById("canvas").appendChild(renderer.domElement);
    
        scene = new THREE.Scene();
    
        camera = new THREE.PerspectiveCamera(
            95,
            (window.innerWidth - (13)) / window.innerHeight,
            1,
            1000
        );
        camera.position.z = 500;
        scene.add(camera);
    
        particle = new THREE.Object3D();
    
        scene.add(particle);
    
        var geometry = new THREE.TetrahedronGeometry(2, 0);
    
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shading: THREE.FlatShading,
        });
        // number of particles - 1000
        for (var i = 0; i < 1000; i++) {
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position
            .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
            .normalize();
            // closeness of particles
            mesh.position.multiplyScalar(90 + Math.random() * 1800);
            mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
            particle.add(mesh);
        }
    
        var ambientLight = new THREE.AmbientLight(0x999999);
        scene.add(ambientLight);
    
        var lights = [];
        lights[0] = new THREE.DirectionalLight(0xFFBF00, 1);
        lights[0].position.set(1, 0, 0);
        lights[1] = new THREE.DirectionalLight(0xFFBF00, 1);
        lights[1].position.set(0.75, 1, 0.5);
        lights[2] = new THREE.DirectionalLight(0xFFCF40, 1);
        lights[2].position.set(-0.75, -1, 0.5);
        scene.add(lights[0]);
        scene.add(lights[1]);
        scene.add(lights[2]);
    
        window.addEventListener("resize", onWindowResize, false);
        }
    
        function onWindowResize() {
        camera.aspect = (window.innerWidth - (13)) / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize((window.innerWidth - (13)), window.innerHeight);
        }
    
        function animate() {
        requestAnimationFrame(animate);
        particle.rotation.x += 0.0;
        particle.rotation.y -= 0.0002;
    
        renderer.clear();
        renderer.render(scene, camera);
        }
}

// CURSOR

var cursor = document.querySelector("#cursor");
var cursorCircle = cursor.querySelector(".cursor__circle");

var mouse = { x: -100, y: -100 };
var pos = { x: 0, y: 0 };
var speed = 1;
var updateCoordinates = (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
};

window.addEventListener("mousemove", updateCoordinates);

function getAngle(diffX, diffY) {
  return (Math.atan2(diffY, diffX) * 180) / Math.PI;
}

function getSqueeze(diffX, diffY) {
  var distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  var maxSqueeze = 0.15;
  var accelerator = 1500;
  return Math.min(distance / accelerator, maxSqueeze);
}

var updateCursor = () => {
  var diffX = Math.round(mouse.x - pos.x);
  var diffY = Math.round(mouse.y - pos.y);

  pos.x += diffX * speed;
  pos.y += diffY * speed;

  var angle = getAngle(diffX, diffY);
  var squeeze = getSqueeze(diffX, diffY);

  var scale =
    "scale(" + ((1 + squeeze) * 2) / 3 + ", " + ((1 - squeeze) * 2) / 3 + ")";
  var rotate = "rotate(" + angle + "deg)";
  var translate = "translate3d(" + pos.x + "px ," + pos.y + "px, 0)";

  cursor.style.transform = translate;
  cursorCircle.style.transform = rotate + scale;
};

function loop() {
  updateCursor();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

var cursorModifiers = document.querySelectorAll("[cursor-class]");

cursorModifiers.forEach((curosrModifier) => {
  curosrModifier.addEventListener("mouseenter", function () {
    var className = this.getAttribute("cursor-class");
    cursor.classList.add(className);
  });

  curosrModifier.addEventListener("mouseleave", function () {
    var className = this.getAttribute("cursor-class");
    cursor.classList.remove(className);
  });
});

if (page==='home'){
    // Timer

    var countdown = () => {
        var countDate = new Date("August 02,2021 00:00:00").getTime();
        var now = new Date().getTime();
        var gap = countDate - now;
    
        var second = 1000;
        var minute = second * 60;
        var hour = minute * 60;
        var day = hour * 24;
    
        var textDay = Math.floor(gap / day);
        var textHour = Math.floor((gap % day) / hour);
        var textMinute = Math.floor((gap % hour) / minute);
        var textSecond = Math.floor((gap % minute) / second);
    
        document.querySelector(".day").innerText = textDay;
        document.querySelector(".hour").innerText = textHour;
        document.querySelector(".minute").innerText = textMinute;
        document.querySelector(".second").innerText = textSecond;
    };
    setInterval(countdown, 1000);
}

  function navfunction() {
	document.getElementsByClassName('js-toggle-menu')[0].classList.toggle('open');
	document.querySelector('#main').classList.toggle('temp-body')
	document.getElementsByClassName("hidden")[0].classList.toggle("notHidden")
  };
function hideit() {
    loader.style.display = 'none'
}
var loader = document.querySelector(".loader");
var side = document.querySelector(".side");
function loadFunction() {
    loader.className += " hidden"; // class "loader hidden"
}
window.addEventListener("load", function() {
    side.className += " outro"
    setTimeout(loadFunction, 500);
    setTimeout(hideit, 1000);
    
});