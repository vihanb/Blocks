// Classes
class Point {
  constructor(x=0,y=0) {
    this.x = x;
    this.y = y;
  }
}
class Range {}
class Matrix {
  constructor(x = 1,y = 1) {
    this.Matrix = Array(+y).fill("").map(() => Array(+x).fill(""));
  }

  toString(x=" ",y="\n") { return this.Matrix.map(Row => Row.join(x)).join(y ) }

  set(x,y,value) {
    if (x instanceof Point)
      this.Matrix[x.y][x.x] = y;
    else
      this.Matrix[y][x] = value;
  }
  fill(range){ return this }
  expand(x,y) { this.Matrix = Array(+y).fill(Array(+x).fill(""))
    .map((Column, IndexY) => Column.map((_, IndexX) => (this.Matrix[IndexY] || [])[IndexX] || _ )) }
  each(func) { return this.Matrix.map((Row, Y) => Row.map((Value, X) => func(Value, new Point(X,Y)))) }
  map(func) { this.Matrix = this.each(func); return this }
}

const Handle = {
  // == Items ==
  // CastString
  // AlignLeft
  // AlignRight

  CastString(matrix) {
    return matrix.map(Value => (Value + "").trim());
  },

  AlignLeft(matrix) {
    // Assuming matrix instance of Matrix
    const Length = Math.max(...[].concat(...matrix.each(Value => +Value.length)));
    return matrix.map(Value => Value + " ".repeat(Length - Value.length));
  },
  AlignRight (matrix) {
    const Length = Math.max(...[].concat(...matrix.each(Value => +Value.length)));
    return matrix.map(Value => " ".repeat(Length - Value.length) + Value);
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
  let [SetupSizeX, SetupSizeY] = SetupSize.match(/(?:\d+|\?)/g);
  if (SetupSizeY) MainMatrix.expand(SetupSizeX, SetupSizeY);
  else if (SetupSizeX !== "?") MainMatrix.expand(SetupSizeX, SetupSizeX);

  /*=== OPTIONS START ===*/
  const Options = {
    $S: Handle.CastString,

    a: Handle.AlignLeft,
    A: Handle.AlignRight
  };
  const OptsDefault = ["$S"]; // CastString
  const Opts = () => [...SetupOpt, ...OptsDefault].forEach(opt => {
    const Response = MainOptions[opt](MainMatrix);
    if (Response) MainMatrix = Response;
  });

  /*=== PARSING START  ===*/
  const Code = SetupCode;

  // The reason I'm using a 2D array is that Map doesn't allow duplicates so $n|Fib can't be used twice
  const CodeTokens = []; // [Statement Body, Statement Name]

  // Parsing Closures
  // Contains all the data needed for parsing
  {
    let Location = 0; // Negative represents a header,
    let StatementHead = "";
    let StatementBody = "";

    let StatementBodyIgnoreIndex   = -1;
    let StatementBodyIgnoreLiteral = "";

    const StatementBodyIgnore = [`""\\`,`''\\`]; // Start, End, Escape. If Escape === End, no escape
    const StatementBodyIgnoreStart  = StatementBodyIgnore.map(group => group[0]);
    const StatementBodyIgnoreEnd    = StatementBodyIgnore.map(group => group[1]);
    const StatementBodyIgnoreEscape = StatementBodyIgnore.map(group => group[2]);

    const StatementReset = () => { StatementBody = StatementHead = StatementBodyIgnoreLiteral = ""; StatementBodyIgnoreIndex = -1; Location = 0 };

    // Maximum Variables
    const MAX_ESCAPE = 65536; // 2^16
    const MAX_NESTED = 256; // 2 ^ 8
    const MAX_NUMLEN = 16;  

    // Parsing Closure - A
    // Simplified the input to a bare representation
    {
      for (let i = 0; i < Code.length; i++) {
        let Char = Code[i];
        if (Location >= 0) { // Statement Body
          if (StatementBodyIgnoreStart.includes(Char)) {
            StatementBodyIgnoreIndex   = StatementBodyIgnoreStart.indexOf(Char);
            StatementBodyIgnoreLiteral = StatementBodyIgnoreEnd[StatementBodyIgnoreIndex] === StatementBodyIgnoreEscape[StatementBodyIgnoreIndex] ?
              "" : StatementBodyIgnoreEnd[StatementBodyIgnoreIndex];
            StatementBody += Code[i++];

            // If length < MAX_ESCAPE, and Char is not the statement end
            for (let j = i; (i - j) < MAX_ESCAPE && Code[i] !== StatementBodyIgnoreEnd[StatementBodyIgnoreIndex]; i++) {
              StatementBody += Code[
                Code[i] === StatementBodyIgnoreLiteral ? // Is The escape character?
                ++i : i // Yes? increment i No? i
              ];
              if (i - j + 1 === MAX_ESCAPE) console.warn("Approaching Statement Maximum");
            }
            StatementBody += Code[i];
          } else if (/\|/.test(Char)) { // Is a "|" character
            Location = -1;
          } else if (/\S/.test(Char)) { // Not whitespace
            StatementBody += Char;
          }
        } else { // Statement Head
          if (/\S/.test(Char)) { // Not Whitespace
            if (Char === ";") { // End of Line
              CodeTokens.push([StatementBody, StatementHead]);
              StatementReset();
            } else { // Header Char
              StatementHead += Char;
            }
          }
        }
      }
    }

    // Temporary Operator Data
    const OperatorList = new Map([
      ["+", (left=0, right) => left + right],
      ["-", (left=0, right) => left - right],
      ["/", (left, right) => left / right],
      ["*", (left, right) => left * right],
      ["%", (left, right) => left % right],
      ["^", (left, right) => left **right]
    ]);
    const OperatorArity = [ // Top is higher, bottom is lower
      ["^", "/", "*", "%"],
      ["-", "+"],
      [":"]
    ].reverse();

    const OperatorMatchAll = new RegExp(`[0-9()${[...OperatorList.keys()].join("")}]`);
    const OperatorMatchOperator = new RegExp(`[${[...OperatorList.keys()].join("")}]`)

    // Parsing Closure B
    // This handles expressions and inserts the input
    // Handles order of operations and replaces ` with input
    {
      CodeTokens.map(([CodeBody, CodeHeader]) => {
        for (let i = 0; i < CodeBody.length; i++) {
          let Char = CodeBody[i];
          // Ignore escapes
          if (StatementBodyIgnoreStart.includes(Char)) {
            StatementBodyIgnoreIndex   = StatementBodyIgnoreStart.indexOf(Char);
            StatementBodyIgnoreLiteral = StatementBodyIgnoreEnd[StatementBodyIgnoreIndex] === StatementBodyIgnoreEscape[StatementBodyIgnoreIndex] ?
              "" : StatementBodyIgnoreEnd[StatementBodyIgnoreIndex];
            StatementBody += CodeBody[i++];

            // If length < MAX_ESCAPE, and Char is not the statement end
            for (let j = i; (i - j) < MAX_ESCAPE && CodeBody[i] !== StatementBodyIgnoreEnd[StatementBodyIgnoreIndex]; i++) {
              StatementBody += CodeBody[
                CodeBody[i] === StatementBodyIgnoreLiteral ? // Is The escape character?
                ++i : i // Yes? increment i No? i
              ];
              if (i - j + 1 === MAX_ESCAPE) console.warn("Approaching Statement Maximum");
            }
            StatementBody += CodeBody[i];
          } else if (OperatorList.has(Char)) { // Is an operator
            const OperatorValue = Char;
            const OperatorValueArity = OperatorArity.findIndex(Level => Level.contains(OperatorValue));

            let DataLeft  = null;
            let DataRight = null;

            let ModLeft = null;
            let ModLeftStart = null;
            let ModLeftEnd = null;

            let ModRight = null;
            let ModRightStart = null;
            let ModRightEnd = null;

            let NewNestLevel = 0;
            let NewOperator = null;
            let NewDigit = null;

            ModLeftend = i - 1;
            ModRightStart = i + 1;
            // HALP I DONT KNOW HOW TO DO THIS
            for (let j = i; j > 0; j--) {
              if (OperatorMatchAll.test(CodeBody[j])) {
                if (OperatorMatchOperator.test(CodeBody[j])) {
                  // Operator encountered
                  NewOperator = OperatorArity.findIndex(Level => Level.contains(OperatorValue));
                  if (NewOperator > OperatorArity) {
                    
                  } else if (NewOperator < OperatorArity) {
                  } else if (NewOperator === OperatorArity) {
                  }
                } else if (/[\d]/.test(CodeBody[j])) {
                  // Digit encountered
                } else if (CodeBody[j] === "(") {
                  // Open paranthesis
                } else if (CodeBody[j] === ")") {
                  // Close parenthesis
                }
              } else {
                // Not an operator character
              }
            }
          } else {
            StatementBody += Char;
          }
        }
        return [CodeBody, CodeHeader];
      });
    }
    console.log(CodeTokens);
  }

  // Output
  return MainMatrix.Matrix.toString(" ", "\n");
};

Blocks.Golf = (input, ungolf) => input;
