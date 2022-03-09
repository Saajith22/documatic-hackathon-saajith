const board = document.getElementById("board");
const canvas = document.querySelector("canvas");

const originalHeight = canvas.height;
const originalWidth = canvas.width;

renderCanvas();

const ctx = canvas.getContext("2d");
ctx.fillStyle = "green";

let firstTime = true;
let day = 1;
let dayEnd = false;
let nightEnd = false;
let clocksEnded = 0;
let dayClock = 0;
let nightClock = 100;

let intervals = [];
let speedIndex = 0;
let speeds = [1, 1.5, 3, 4.5, 6];

const hero = {
  x: 10,
  y: canvas.height / 2 - 20,
  health: 3,
  zombieMax: 3,
  speed: 3,
  zombieSpeed: speeds[speedIndex],
  floor: "floor1",
  time: setInterval(() => {
    if (dayClock != 0) dayClock -= 1;
    else if (dayClock == 0 && !dayEnd) {
      dayEnd = true;
      nightClock = 100;
      clocksEnded += 1;
      hero.update();
    }

    if (nightClock != 0) nightClock -= 1;
    else if (nightClock == 0 && !nightEnd && clocksEnded != 0) {
      nightEnd = true;
      dayClock = 100;
      clocksEnded += 1;
      hero.update();
    }

    if (clocksEnded == 2) {
      day += 1;
      hero.zombieMax += 3;
      hero.zombieSpeed = speeds[++speedIndex];
      clocksEnded = 0;
      dayEnd = false;
      nightEnd = false;
    }
  }, 1000),
  update: () => {
    if (hero.health <= 0) {
      intervals.forEach((interval) => clearInterval(interval));

      ctx.font = "100px bold";
      ctx.fillStyle = "red";
      return ctx.fillText(
        "You Died!",
        canvas.width / 2 - 200,
        canvas.height / 2
      );
    }

    const floor = new Image();
    let floorName = hero.floor ? hero.floor : "floor1";
    floor.src = `images/${floorName}.png`;
    hero.floor = floorName;

    floor.addEventListener("load", () => {
      ctx.drawImage(floor, 0, 0, canvas.width, canvas.height);

      if (floorName != "shop") {
        ctx.fillStyle = "black";
        ctx.font = "40px sans-serif";
        ctx.fillText("SHOP", 217, 150);
      }

      ctx.fillStyle = "black";
      ctx.font = "20px sans-serif";
      let health = `Health: ${"❤".repeat(hero.health)}`;
      ctx.fillText(health, canvas.width - 150, 50);

      let dayOrNight = dayClock != 0 ? "Day" : "Night";
      hero.currentTime = dayOrNight;
      let time = `Time: ${dayOrNight} |`;
      let distanceForTime = dayOrNight == "Day" ? 260 : 275;
      ctx.fillText(time, canvas.width - distanceForTime, 50);

      let dayText = `Day: ${day}`;
      ctx.font = "bold 20pt sans-serif";
      ctx.fillText(dayText, 10 + dayText.length, 50);

      if (firstTime) {
        const heroImage = new Image();
        heroImage.src = "images/hero.png";

        heroImage.addEventListener("load", () => {
          let heroSize = hero.floor == "shop" ? 75 : 50;

          ctx.drawImage(heroImage, hero.x, hero.y, heroSize, heroSize);
        });

        firstTime = false;
      }

      if (hero.currentTime == "Night" && !hero.isCreatingZombie)
        createZombies();
    });

    if (!firstTime) {
      const heroImage = new Image();
      heroImage.src = "images/hero.png";

      heroImage.addEventListener("load", () => {
        let heroSize = hero.floor == "shop" ? 75 : 50;

        ctx.drawImage(heroImage, hero.x, hero.y, heroSize, heroSize);
      });

      if (hero.zombieLocations.length > 0 && floorName != "shop") {
        hero.zombieLocations.forEach((zombieLoc) => {
          const zombieImage = new Image();
          zombieImage.src = "images/zombie.png";

          zombieImage.addEventListener("load", () => {
            let { x, y } = zombieLoc;

            ctx.drawImage(zombieImage, x, y, 50, 50);
          });
        });
      }
    }
  },
  move: (direction) => {
    direction == "up"
      ? (hero.y -= hero.speed)
      : direction == "left"
      ? (hero.x -= hero.speed)
      : direction == "down"
      ? (hero.y += hero.speed)
      : (hero.x += hero.speed);

    updateScreen();
  },
  killZombie: (zombieIndex) => {
    hero.zombieLocations.splice(zombieIndex, 1);
  },
};

intervals.push(hero.time);

updateScreen();

document.addEventListener("keydown", (key) => {
  if (hero.pause) return;

  switch (key.code) {
    case "KeyW":
      hero.move("up");
      break;
    case "KeyA":
      hero.move("left");
      break;
    case "KeyS":
      hero.move("down");
      break;
    case "KeyD":
      hero.move("right");
      break;
  }
});

document.addEventListener("mousedown", (mouse) => {
  if (hero.zombieLocations.length > 0) {
    const findZombie = (loc) => {
      if (loc.x >= hero.x - hero.speed) return true;
      else if (loc.x <= hero.x + hero.speed) return true;
      else if (loc.y <= hero.y + hero.speed) return true;
      else if (loc.y >= hero.y - hero.speed) return true;
    };

    let zombieLocation = hero.zombieLocations.find(findZombie);
    if (zombieLocation) {
      hero.killZombie(hero.zombieLocations.indexOf(zombieLocation));
    }
  }
});

//function for spawning zombies
function createZombies() {
  console.log("Ran!");
  hero.zombieLocations = [];

  hero.isCreatingZombie = true;
  const zombieSpawnLocations = [
    { x: canvas.width / 2 - 50, y: 25 },
    {
      x: canvas.width - 50,
      y: canvas.height / 2 - 35,
    },
  ];

  let spawned = 0;
  let moved = false;
  let interval = setInterval(() => {
    if (hero.currentTime != "Night") {
      hero.isCreatingZombie = false;
      hero.zombieLocations = [];
      return clearInterval(interval);
    }

    let randomNumber = Math.floor(Math.random() * 10);
    if (randomNumber > 5) {
      if (spawned == hero.zombieMax) return;

      let zombieCoords =
        zombieSpawnLocations[
          Math.floor(Math.random() * zombieSpawnLocations.length)
        ];

      let zombieX = zombieCoords.x,
        zombieY = zombieCoords.y;

      hero.zombieLocations.push({ x: zombieX, y: zombieY });
      spawned += 1;
      if (!moved) {
        moveZombies();
        moved = true;
      }
    }
  }, 5000);

  intervals.push(interval);
}

//moving zombies towards the player
function moveZombies() {
  updateScreen();

  let interval = setInterval(() => {
    if (hero.currentTime != "Night") clearInterval(interval);
    if (hero.pause) return;
    if (hero.floor == "shop") return;

    const locations = hero.zombieLocations;
    locations.forEach((loc) => {
      let x = hero.x,
        y = hero.y;

      if (x == loc.x && y == loc.y) {
        return (hero.health -= 1);
      }

      if (y != loc.y) {
        if (y > loc.y) {
          loc.y += hero.zombieSpeed;
        } else {
          loc.y -= hero.zombieSpeed;
        }
      } else {
        if (x > loc.x) {
          loc.x += hero.zombieSpeed;
        } else {
          loc.x -= hero.zombieSpeed;
        }
      }
    });

    updateScreen();
  }, 200);

  intervals.push(interval);
}

//update screen function
function updateScreen() {
  if (hero.floor != "shop") {
    if (hero.x <= 289 && hero.x >= 207) {
      if (hero.y == 194) {
        return makeDialogue("Do you wish to enter the shop right now?");
      }
    }
  } else {
    if (hero.x >= 491 && hero.x <= 656 && hero.y >= 525) {
      hero.floor = "floor1";
      hero.x = 244;
      hero.y = 194;
    }
  }
  hero.update();
}

//dialogue function
function makeDialogue(dialogue) {
  hero.pause = true;

  ctx.font = "40px sans-serif";
  ctx.fillText(dialogue, 250, 400);
  //yes button
  const yesButton = document.createElement("div");
  yesButton.className = "but align-middle";
  yesButton.style.left = "40%";
  yesButton.style.bottom = "30%";
  yesButton.innerText = "Yes";
  board.appendChild(yesButton);
  //no button
  const noButton = document.createElement("div");
  noButton.className = "but";
  noButton.style.left = "53%";
  noButton.style.bottom = "30%";
  noButton.innerText = "No";
  board.appendChild(noButton);

  [yesButton, noButton].forEach((button) => {
    button.addEventListener("click", () => {
      if (button.innerText == "Yes") {
        hero.x = canvas.width / 2 - 45;
        hero.y = canvas.height - 150;
        hero.floor = "shop";
        firstTime = true;
      }

      board.removeChild(yesButton);
      board.removeChild(noButton);
      hero.pause = false;
      hero.y += hero.speed;

      return updateScreen();
    });
  });
}

// rendering the canvas with new height and width ratio
function renderCanvas() {
  let dimensions = getDimensions(
    true,
    canvas.clientWidth,
    canvas.clientHeight,
    canvas.width,
    canvas.height
  );
  const dpr = window.devicePixelRatio || 1;
  canvas.width = dimensions.width * dpr;
  canvas.height = dimensions.height * dpr;
}

// Blurry canvas removing part =>
function getDimensions(
  contains,
  containerWidth,
  containerHeight,
  width,
  height
) {
  let doRatio = width / height;
  let cRatio = containerWidth / containerHeight;
  let targetWidth = 0;
  let targetHeight = 0;
  let test = contains ? doRatio > cRatio : doRatio < cRatio;

  if (test) {
    targetWidth = containerWidth;
    targetHeight = targetWidth / doRatio;
  } else {
    targetHeight = containerHeight;
    targetWidth = targetHeight * doRatio;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    x: (containerWidth - targetWidth) / 2,
    y: (containerHeight - targetHeight) / 2,
  };
}
