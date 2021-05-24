const SIMULATION_TIME = 500.0;
const MAX_SCORE = 131072;
const MAX_SIMULATIONS = 1024;
const C = 1;

function Node(parent, score) {
  this.score = score;
  this.visits = 0;
  this.factor = 1.0;

  this.parent = parent;
  this.children = {};
  this.possibleChildren = [0, 1, 2, 3];
}

Node.prototype.setResult = function (finalScore) {
  this.score = this.score * this.visits + finalScore;
  this.visits += 1;
  this.score /= this.visits;

  if (this.parent) {
    const exploitation = this.score / MAX_SCORE;
    const exploration =
      C * Math.sqrt(Math.log(this.parent.visits + 1) / this.visits);
    this.factor = exploitation + exploration;
  }
};

Node.prototype.addChildren = function (move, score) {
  child = new Node(this, score);
  this.children[move] = child;
  return child;
};

Node.prototype.isAlreadyExplored = function () {
  return Object.keys(this.children).length == this.possibleChildren.length;
};

Node.prototype.removeInvalidMove = function (move) {
  const index = this.possibleChildren.indexOf(move);
  if (index > -1) {
    this.possibleChildren.splice(index, 1);
  }
};

function AIManager(GameManager) {
  this.gameManager = GameManager;
  this.root = new Node(null, GameManager.score);
}

AIManager.prototype.compareScores = function (a, b) {
  if (a[1].score > b[1].score) {
    return -1;
  } else if (b[1].score > a[1].score) {
    return 1;
  } else {
    return 0;
  }
};

AIManager.prototype.compareFactors = function (a, b) {
  if (a[1].factor > b[1].factor) {
    return -1;
  } else if (b[1].factor > a[1].factor) {
    return 1;
  } else {
    return 0;
  }
};

AIManager.prototype.getNextMove = function () {
  const begin = performance.now();
  while (performance.now() - begin < SIMULATION_TIME) {
    this.gameManager.restart();
    this.executeMCTS(this.root);
  }

  const moves = Object.entries(this.root.children);
  moves.sort(this.compareScores);

  const bestMove = moves[0][0];
  return +bestMove;
};

AIManager.prototype.executeMCTS = function (node) {
  while (node.isAlreadyExplored()) {
    node = this.selection(node);
  }
  if (!this.gameManager.over && !this.gameManager.won) {
    node = this.expansion(node);
    let simulations = 0;
    while (
      !this.gameManager.over &&
      !this.gameManager.won &&
      simulations < MAX_SIMULATIONS
    ) {
      this.simulation();
      ++simulations;
    }
  }
  this.retropropagation(node);
};

AIManager.prototype.selection = function (node) {
  const moves = Object.entries(node.children);
  moves.sort(this.compareFactors);

  const bestChild = moves[0][1];
  this.gameManager.move(moves[0][0]);
  return bestChild;
};

AIManager.prototype.selectRandomMove = function () {
  return Math.floor(Math.random() * 4);
};

AIManager.prototype.expansion = function (node) {
  let randomMove = this.selectRandomMove();
  while (!this.gameManager.move(randomMove)) {
    node.removeInvalidMove(randomMove);
    randomMove = this.selectRandomMove();
  }

  if (node.children[randomMove]) {
    return node.children[randomMove];
  }

  node = node.addChildren(randomMove, this.gameManager.score);
  return node;
};

AIManager.prototype.simulation = function () {
  this.gameManager.move(this.selectRandomMove());
};

AIManager.prototype.retropropagation = function (node) {
  while (node) {
    node.setResult(this.gameManager.score);
    node = node.parent;
  }
};
