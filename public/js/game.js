const board = document.getElementById("board");

const floor = document.createElement("div");
floor.className = "floor h-100";
board.appendChild(floor);

document.addEventListener("keypress", (key) => {
  switch (key.code) {
    case "KeyW":
      alert("W!");
      break;

    case "KeyA":
      alert("A!");
      break;

    case "KeyS":
      alert("S!");
      break;
    case "KeyD":
      alert("D!");
      break;
  }
});
