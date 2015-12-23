// Classes
class Point {}
class Range {}
class Matrix {
  constructor(x = 1,y = 1) {
    this.Matrix = Array(+y).fill("").map(() => Array(+x).fill(""));
  }
  
  set(x,y,value) { this.Matrix[y - 1][x - 1] = value; }
  expand(x,y) { this.Matrix = Array(+y).fill(Array(+x).fill(""))
    .map((Column, IndexY) => Column.map((_, IndexX) => (this.Matrix[IndexY] || [])[IndexX] || _ )); }
}

const Handle = {
  AlignRight(Matrix) {
    
  },
  AlignLeft (Matrix) {
  }
};

const Blocks = (code, inputs, opts) => {
  // Setup
  let [SetupSize, SetupOpt, ...SetupCode] = code.split(`:`);
  SetupCode = SetupCode.join(`:`);

  // Main data
  let MainMatrix = new Matrix(0,0); // Matrix
  let MainVars   = {}; // Variables

  /*=== SETUP START ===*/
  let [SetupSizeX, SetupSizeY] = SetupSize.split(",");
  if (SetupSizeY) MainMatrix.expand(SetupSizeX, SetupSizeY);
  else if (SetupSizeX !== "?") MainMatrix.expand(SetupSizeX, SetupSizeX);
  
  /*=== Options Start ===*/
  const Options = {
    a: Handle.AlignLeft,
    A: Handle.AlignRight
  };

  return JSON.stringify(MainMatrix.Matrix);
};

Blocks.Golf = (input, ungolf) => input;
