let Game;
let running = false;
let interval;
let oldNextNumber = 0;
let nextNumber;
let iterations = -1;

function setNextNumber() {
  const tileElement = document.getElementById("next-number-tile");

  tileElement.classList.remove(...tileElement.classList);
  tileElement.classList.add("mini-tile");
  if (nextNumber > 2048) {
    tileElement.classList.add("mini-tile-super");
  } else {
    tileElement.classList.add(`mini-tile-${nextNumber}`);
  }
  tileElement.innerHTML = nextNumber;
}

function setIterations() {
  const timeElement = document.getElementById("next-number-time");

  timeElement.innerHTML = iterations * 0.75;
}

function refreshNextNumber() {
  nextNumber = Game.greaterNumber();
  ++iterations;
  if (oldNextNumber != nextNumber) {
    setNextNumber();
    setIterations();
    oldNextNumber = nextNumber;
  }
}

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  Game = new GameManager(
    4,
    KeyboardInputManager,
    HTMLActuator,
    LocalStorageManager
  );

  refreshNextNumber();
});

function parseMove(move) {
  // 0: up, 1: right, 2: down, 3: left
  const moves = ["Cima", "Direita", "Baixo", "Esquerda"];
  return moves[move];
}

function drawTable(children) {
  const tableElement = document.getElementById("table");

  let html =
    "<table><tr><th>Movimento</th><th>Score</th><th>Visitas</th><th>Fator</th></tr>";
  children.forEach((child) => {
    html += `<tr><td>${parseMove(child[0])}</td><td>${child[1].score.toFixed(
      2
    )}</td><td>${child[1].visits}</td><td>${child[1].factor.toFixed(
      6
    )}</td></tr>`;
  });
  html += "</table>";

  tableElement.innerHTML = html;
}

function toggleButton() {
  const button = document.getElementById("ia-button");
  running = !running;
  button.innerHTML = running ? "Parar IA" : "Começar IA";
}

function restartGame() {
  Game.restart();
  oldNextNumber = 0;
  iterations = -1;
  refreshNextNumber();
  document.getElementById("table").innerHTML = "";
}

function toggleAI() {
  if (!running) {
    if (!Game.over && !Game.won) {
      toggleButton();
      interval = window.setInterval(function () {
        if (!Game.over && !Game.won) {
          const AbstractGame = new AbstractGameManager(
            4,
            Game.grid,
            Game.score,
            Game.over,
            Game.won,
            Game.keepPlaying
          );
          const AI = new AIManager(AbstractGame);
          const nextMove = AI.getNextMove();
          Game.move(nextMove);
          drawTable(Object.entries(AI.root.children));
          refreshNextNumber();
        } else {
          clearInterval(interval);
          toggleButton();
        }
      }, 750);
    } else {
      restartGame();
      toggleAI();
    }
  } else {
    clearInterval(interval);
    toggleButton();
  }
}
