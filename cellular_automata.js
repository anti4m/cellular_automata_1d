p5.disableFriendlyErrors = true;

const rulesetBits = 8;
let ruleset;
let stateHistory;
let numRows;
let cellWidth;
let started = false;

// GUI
let canvasWidth = 800;
let canvasHeight = 600;
let userControls;
let controlsHeight = canvasHeight / 12;
let gridHeight = 1.8 * controlsHeight;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(4);
  userControls = new UserControls(canvasWidth, canvasHeight, controlsHeight);
}

function start() {
  clear();
  ruleset = createRuleset(userControls.getRuleChoice());
  let numCells = userControls.getNumCellsChoice();
  cellWidth = floor(canvasWidth / numCells);
  numRows = floor((canvasHeight - gridHeight) / cellWidth);

  stateHistory = new StateHistory(numRows, numCells);
  stateHistory.append(createCells(numCells));
  started = true;
}

function stop() {
  started = false;
  stateHistory = null;
}

function draw() {
  if (started) {
    clear();
    stateHistory.draw(cellWidth, gridHeight);
    stateHistory.append(generateNextState(stateHistory.getLast(), ruleset));
  }
  userControls.drawUpdate();
}

function createRuleset(number) {
  // Array is the binary representation of the given number, reversed so that it is indexed by neighborhood configuration value.
  return integerStringToDigits(decimalNumberToBinaryString(number, rulesetBits)).reverse();
}

function integerStringToDigits(string) {
  // Return array containing all digits in a string.
  return string.split("").map((x) => parseInt(x, 10));
}

function decimalNumberToBinaryString(decimalNumber, minBits) {
  let binaryString = decimalNumber.toString(2);
  let missingBits = max(0, minBits - binaryString.length);
  return "0".repeat(missingBits) + binaryString;
}

function binaryStringToDecimalNumber(binaryString) {
  return parseInt(binaryString, 2);
}

function createCells(n) {
  // Array of cells, 1 at middle index (or middle-1 if n even), rest 0.
  let cells = Array(n).fill(0);
  cells[floor(n / 2)] = 1;
  return cells;
}

function getNeighborhood(cells, index) {
  // Return the binary value of the neighborhood. Last cell is treated as left neighbor of first cell.
  let leftNeighbor, rightNeighbor;
  if (index == 0) {
    leftNeighbor = cells[cells.length - 1];
    rightNeighbor = cells[1];
  } else if (index == (cells.length - 1)) {
    rightNeighbor = cells[0];
    leftNeighbor = cells[index - 1];
  } else {
    leftNeighbor = cells[index - 1];
    rightNeighbor = cells[index + 1];
  }
  return parseInt(leftNeighbor.toString() + cells[index].toString() + rightNeighbor.toString(), 
                  2);
}

function generateNextState(currentState, ruleset) {
  let nextState = Array(currentState.length);
  for (let i = 0; i < currentState.length; ++i) {
    nextState[i] = ruleset[getNeighborhood(currentState, i)];
  }
  return nextState;
}

function drawCells(cells, y, cellWidth) {
  stroke(0);
  for (let i = 0; i < cells.length; ++i) {
    if (cells[i]) fill(0);
    else fill(255);
    rect(i * cellWidth, y, cellWidth, cellWidth);
  }
}

class UserControls {
  constructor(canvasWidth, canvasHeight, controlsHeight) {
    this.controlsHeight = controlsHeight;
    this.ruleSelect = createSelect();
    this.ruleLabel = createElement('h4', 'Rule');
    this.cellsSlider = createSlider(5, 200, 51, 1);
    this.cellsSliderValue = createElement('h5', this.cellsSlider.value().toString());
    this.cellsLabel = createElement('h4', 'Number of Cells');
    this.startButton = createButton('Start');
    this.stopButton = createButton('Stop');

    this.ruleSelect.position(canvasWidth / 16, controlsHeight);
    this.ruleLabel.position(this.ruleSelect.x, this.ruleSelect.y - 40);
    this.cellsSlider.position(3 * canvasWidth / 16, this.ruleSelect.y);
    this.cellsSliderValue.position(this.cellsSlider.x + this.cellsSlider.width, this.cellsSlider.y - 5);
    this.cellsLabel.position(this.cellsSlider.x + 1, this.cellsSlider.y - 40);
    this.startButton.position(11 * canvasWidth / 16, controlsHeight);
    this.stopButton.position(15 * canvasWidth / 16 - this.startButton.width, controlsHeight);
    
    for (let i = 0; i < 256; ++i) this.ruleSelect.option(i);
    this.ruleSelect.selected(30);
    this.startButton.mouseClicked(start);
    this.stopButton.mouseClicked(stop);
  }
  
  getRuleChoice() { return parseInt(this.ruleSelect.value()); }
  getNumCellsChoice() { return this.cellsSlider.value(); }
  
  drawUpdate() {
    this.cellsSliderValue.remove();
    this.cellsSliderValue = createElement('h5', this.cellsSlider.value().toString());
    this.cellsSliderValue.position(this.cellsSlider.x + this.cellsSlider.width, this.cellsSlider.y - 5);
  }
}

class StateHistory {
  constructor(maxSize, numCellsPerState) {
    this.maxSize = maxSize;
    this.states = new List();

    let emptyState = Array(numCellsPerState).fill(0);
    for (let i = 0; i < maxSize; ++i)
      this.states.putRear(emptyState);
  }

  getLast() {
    return this.states.getRear().getValue();
  }

  append(state) {
    this.states.deleteFront();
    this.states.putRear(state);
  }

  draw(cellWidth, y0) {
    let y = y0;
    let node = this.states.getFront();
    while (node) {
      drawCells(node.getValue(), y, cellWidth);
      y += cellWidth;
      node = node.getNext();
    }
  }
}

class List {
  constructor() {
    this.frontNode = null;
    this.rearNode = null;
  }

  getFront() {
    return this.frontNode;
  }
  getRear() {
    return this.rearNode;
  }
  isEmpty() {
    return this.frontNode == null;
  }

  putFront(value) {
    let newNode = new ListNode(value, null, this.frontNode);
    if (this.isEmpty()) this.frontNode = this.rearNode = newNode;
    else this.frontNode = newNode;
  }

  putRear(value) {
    let newNode = new ListNode(value, this.rearNode, null);
    if (this.isEmpty()) this.rearNode = this.frontNode = newNode;
    else this.rearNode = newNode;
  }

  deleteFront() {
    if (this.isEmpty()) console.warn("Attempted to delete from empty list.")
    else {
      this.frontNode = this.frontNode.getNext();
      if (this.frontNode == null) this.rearNode = null;
      else this.frontNode.setPrevious(null);
    }
  }

  deleteRear() {
    if (this.isEmpty()) console.warn("Attempted to delete from empty list.")
    else {
      this.rearNode = this.rearNode.getPrevious();
      if (this.rearNode == null) this.frontNode = null;
      else this.rearNode.setNext(null);
    }
  }

  print() {
    let node = this.frontNode;
    while (node) {
      console.log(node.getValue())
      node = node.getNext();
    }
  }
}

class ListNode {
  constructor(value, previousNode, nextNode) {
    this.value = value;
    this.previousNode = null;
    this.nextNode = null;

    this.setPrevious(previousNode);
    this.setNext(nextNode);
  }

  getValue() {
    return this.value;
  }
  getPrevious() {
    return this.previousNode;
  }
  getNext() {
    return this.nextNode;
  }

  setValue(newValue) {
    this.value = newValue;
  }
  setPrevious(node) {
    this.previousNode = node;
    if (node != null)
      node.nextNode = this;
  }
  setNext(node) {
    this.nextNode = node;
    if (node != null)
      node.previousNode = this;
  }
}