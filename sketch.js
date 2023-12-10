let target;
let vehicles = [];
let bullets = [];
let enemies = [];
let score = 0;
let imgEnemi;
let imgFire; // Nouvelle image pour les tirs
let obstacles = [];
let vehicules = [];
let demo = "snake";
let imgVaisseau;
let targetRadius = 100; // Rayon du cercle blanc
let shotSound;
function preload() {
  console.log("preload");
  imgVaisseau = loadImage('assets/images/vaisseau.png');
  imgEnemi = loadImage('assets/images/enemi.png');
  imgFire = loadImage('assets/images/fire.png'); // Chargement de la nouvelle image

  shotSound = loadSound('assets/audio/tire.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pursuer1 = new Vehicle(100, 100, imgVaisseau);
  pursuer2 = new Vehicle(random(width), random(height), imgVaisseau);

  vehicules.push(pursuer1);
  vehicules.push(pursuer2);



  // obstacles.push(new Obstacle(width / 2, height / 2, 100));
}

function draw() {
  background(0);
  // Utiliser la position du point bleu comme nouvelle cible
  target = createVector(mouseX + targetRadius, mouseY);

  drawTarget();

  obstacles.forEach(o => o.show());
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();

    if (enemies[i] && enemies[i].isOffscreen()) {
      enemies.splice(i, 1);
    }
  }
  
  switch (demo) {
    case "leader":
      drawLeaderDemo();
      break;

    case "snake":
      drawSnakeDemo();
      break;

    case "wander":
      drawWanderDemo();
      break;
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (enemies[j] && dist(bullets[i].pos.x, bullets[i].pos.y, enemies[j].pos.x, enemies[j].pos.y) < bullets[i].radius + enemies[j].radius) {
        enemies[j].health--;
        if (enemies[j].health <= 0) {
          score++;
          enemies.splice(j, 1);
        }
        bullets.splice(i, 1);
        break;
      }
    }

    if (bullets[i] && (bullets[i].isOffscreen() || bullets[i].life <= 0)) {
      bullets.splice(i, 1);
    }
  }

  fill(255);
  textSize(24);
  textAlign(RIGHT);
  text('Score: ' + score, width - 20, 30);
  fill(255);
  textSize(18);
  textAlign(LEFT);
  fill(0, 255, 0);
  text('Instructions:', 10, 30);
  fill(255);
  text('Press "v" pour ajouter un vehicule', 20, 50);
  text('Press "d" to toggle debug mode', 20, 70);
  text('Press "f" pour ajouter 10 vehicles', 20, 90);
  text('Press "s" pour le snake', 20, 110);
  text('Press "l" pour le mode leader ', 20, 130);
  text('Press "e" to add an enemy', 20, 150);
  fill(255, 165, 0);
  text('Press "t" pour tirer', 20, 170);
  fill(255);
}


function drawTarget() {
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 32);

  fill(255, 0);
  stroke(255);
  strokeWeight(2);
  circle(target.x, target.y, 140);

  fill(255, 0);
  noStroke();
  ellipse(target.x, target.y, 100);

  // Changez la couleur de remplissage à bleu
  fill(0, 0, 255);
  noStroke();

  // Limiter la position de la souris à l'intérieur du cercle blanc
  let angle = atan2(mouseY - target.y, mouseX - target.x);
  let distance = min(dist(mouseX, mouseY, target.x, target.y), 190);
  let x = target.x + cos(angle) * distance;
  let y = target.y + sin(angle) * distance;

  // Dessiner le point bleu à la position calculée sur le cercle blanc
  ellipse(x, y, 10, 10);
}

function drawLeaderDemo() {
  vehicules.forEach((vehicle, index) => {
    let forceArrive;
    vehicle.separationWeight = 1;

    // Définir des limites pour empêcher les véhicules de sortir de l'écran
    let boundaryForce = createVector(0, 0);
    let boundaryMargin = 50; // Marge à l'intérieur des limites de la fenêtre

    // Si le véhicule s'approche du bord gauche
    if (vehicle.pos.x < boundaryMargin) {
      boundaryForce.x = 1;
    }
    // Si le véhicule s'approche du bord droit
    else if (vehicle.pos.x > width - boundaryMargin) {
      boundaryForce.x = -1;
    }

    // Si le véhicule s'approche du bord supérieur
    if (vehicle.pos.y < boundaryMargin) {
      boundaryForce.y = 1;
    }
    // Si le véhicule s'approche du bord inférieur
    else if (vehicle.pos.y > height - boundaryMargin) {
      boundaryForce.y = -1;
    }

    // Normaliser la force pour la maintenir à une magnitude constante
    boundaryForce.normalize();
    
    if (index == 0) {
      // Le premier véhicule suit la cible sans restriction
      forceArrive = vehicle.applyLeader(createVector(mouseX, mouseY), obstacles, vehicules, 1, true);

      // Vérifier si le premier véhicule entre dans le cercle blanc
      let distanceToTarget = dist(vehicle.pos.x, vehicle.pos.y, target.x, target.y);
      let totalRadius = vehicle.r + targetRadius; // Rayon du véhicule + distance minimale souhaitée

      if (distanceToTarget < totalRadius) {
        // Calculer la direction depuis le centre du cercle blanc vers le véhicule
        let direction = createVector(vehicle.pos.x - target.x, vehicle.pos.y - target.y);
        direction.normalize();
        
        // Déplacer le premier véhicule à la périphérie du cercle blanc
        vehicle.pos.set(target.x + direction.x * totalRadius, target.y + direction.y * totalRadius);
      }
    } else {
      // Les autres véhicules suivent le premier véhicule, mais ne peuvent pas entrer dans le cercle blanc
      let separationForce = vehicle.separate(vehicules);
      let followForce = vehicle.applyBehaviors(pursuer1.pos, obstacles, vehicules, 1);
      forceArrive = p5.Vector.add(separationForce.mult(2), followForce);

      // Vérifier si le véhicule entre dans le cercle blanc
      let distanceToTarget = dist(vehicle.pos.x, vehicle.pos.y, target.x, target.y);
      let totalRadius = vehicle.r + targetRadius; // Rayon du véhicule + distance minimale souhaitée

      if (distanceToTarget < totalRadius) {
        // Repousser le véhicule à l'extérieur du cercle blanc
        let direction = createVector(vehicle.pos.x - target.x, vehicle.pos.y - target.y);
        direction.normalize();
        vehicle.pos.set(target.x + direction.x * totalRadius, target.y + direction.y * totalRadius);
      }
    }

    // Ajouter la force pour maintenir le véhicule à l'intérieur des limites
    vehicle.applyForce(boundaryForce);
    
    vehicle.applyForce(forceArrive);
    vehicle.update();
    vehicle.show();
  });
}


function drawSnakeDemo() {
  vehicules.forEach((vehicle, index) => {
    let forceArrive;
    vehicle.separationWeight = 0;

    if (index == 0) {
      forceArrive = vehicle.applyBehaviors(target, obstacles, vehicules, 0);

      // Vérifier si le premier véhicule entre dans le cercle blanc
      let distanceToTarget = dist(vehicle.pos.x, vehicle.pos.y, target.x, target.y);
      let totalRadius = vehicle.r + targetRadius; // Rayon du véhicule + distance minimale souhaitée

      if (distanceToTarget < totalRadius) {
        // Calculer la direction depuis le centre du cercle blanc vers le véhicule
        let direction = createVector(vehicle.pos.x - target.x, vehicle.pos.y - target.y);
        direction.normalize();
        
        // Déplacer le véhicule à la périphérie du cercle blanc
        vehicle.pos.set(target.x + direction.x * totalRadius, target.y + direction.y * totalRadius);
      }
    } else {
      let vehiculePrecedent = vehicules[index - 1];
      forceArrive = vehicle.applyBehaviors(vehiculePrecedent.pos, obstacles, vehicules, 40);
    }

    vehicle.update();
    vehicle.show();
  });
}

function drawWanderDemo() {
  vehicules.forEach((vehicle, index) => {
    vehicle.checkScreenBoundaries();
    let forceWander = vehicle.wander(obstacles); 
    vehicle.applyForce(forceWander); 
    vehicle.update();
    vehicle.show();
  });
}



function mousePressed() {
  obstacles.push(new Obstacle(mouseX, mouseY, random(30, 100)));
}

function keyPressed() {
  if (key == "v") {
    vehicules.push(new Vehicle(random(width), random(height), imgVaisseau));
  }
  if (key == "d") {
    Vehicle.debug = !Vehicle.debug;
  }
  if (key == "f") {
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(random(10, 20), random(height / 2 - 10, height / 2 + 10), imgVaisseau)
      v.maxSpeed = 10;
      v.color = "purple";
      vehicules.push(v);
    }
  }
  if (key == "s" || key == "S") {
    demo = "snake";
  }
  if (key == 'l'|| key == "L") {
    demo = "leader";
  }
  if (key == 'w'|| key == "W") {
    demo = "wander";
  }
  if (key == "e"|| key == "E") {
    let enemy = new Enemy(random(width), random(height), imgEnemi);
    enemies.push(enemy);
  }
  if (key == "t" || key == "T") {
    // Logique de tir
    if (vehicules.length > 0) {
      vehicules.forEach(v => {
        let bullet = new Bullet(v.pos.x, v.pos.y, imgFire);
        bullets.push(bullet);
      });
  
      // Jouer le son de tir (une seule fois pour tous les véhicules)
      shotSound.setVolume(0.5);
      shotSound.play();
      shotSound.playbackRate(1.5);
    }
  }
  
  
  

}


class Bullet {
  constructor(x, y, img) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(8);
    this.acc = createVector(0, 0);
    this.radius = 8;
    this.life = 100;
    this.img = img; // Nouvelle image pour les tirs
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.life--;
  }

  show() {
    // Utiliser l'image pour afficher le tir
    image(this.img, this.pos.x - this.radius, this.pos.y - this.radius, this.radius * 2, this.radius * 2);
  }

  isOffscreen() {
    return (
      this.pos.x < 0 ||
      this.pos.x > width ||
      this.pos.y < 0 ||
      this.pos.y > height
    );
  }
}

class Enemy {
  constructor(x, y, img) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(2);
    this.radius = 15;
    this.img = img; // Image pour l'ennemi

    //ca c'est pour ajout de la barre de vie
    this.health = 3; // Ajout de la barre de vie avec une valeur initiale de 3
  }

  update() {
    this.pos.add(this.vel);
  }

  show() {
    // Utiliser l'image pour afficher l'ennemi
    image(this.img, this.pos.x - this.radius, this.pos.y - this.radius, this.radius * 2, this.radius * 2);
    
    // Dessiner la barre de vie
    noStroke();
    fill(255, 0, 0);
    rect(this.pos.x - this.radius, this.pos.y - this.radius - 10, this.radius * 2, 5);
    fill(0, 255, 0);
    let healthWidth = map(this.health, 0, 3, 0, this.radius * 2);
    rect(this.pos.x - this.radius, this.pos.y - this.radius - 10, healthWidth, 5);
  }

  isOffscreen() {
    return (
      this.pos.x < 0 ||
      this.pos.x > width ||
      this.pos.y < 0 ||
      this.pos.y > height
    );
  }
}