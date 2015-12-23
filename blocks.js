(function () {
  'use strict';

  var Blocks = function (code, input) {
    var Matrix = [['']],
        options = {
          'f': true
        },
        variables = {};

    /* Structures */
    var Point = function (x,y) {
      this.x = +x;
      this.y = +y;

      this.Set = function (x, y) {
        this.x = x instanceof Point ? x.x : +x;
        this.y = x instanceof Point ? x.y : +y;

        return this;
      }

      return this;
    };

    var Range = function (a, b) {

      this.a = new Point( Math.min(a.x, b.x), Math.min(a.y, b.y) );
      this.b = new Point( Math.max(a.x, b.x), Math.max(a.y, b.y) );

      this.contains = function (point) {
        return (point.x >= this.a.x && point.x < this.b.x)
          && (point.y >= this.a.y && point.y < this.b.y);  
      };

      return this;
    };

    /* Private Functions */
    /*
                        collapse - Collapse Array 
                        generateMatrix - creates NxM matrix, with null as Z
                        drop - Reduces to one dimension
                        length - Returns largest item in array
                        each - Each item in array
                    */
    var _collapse = function (matrix, x, y) {
      return matrix.map(function (l) {
        return l.join(x);
      }).join(y);
    }, _generateMatrix = function (x, y, d) {
      return Array(y).fill( Array(x).fill(d) );
    }, _drop = function (matrix) {
      return matrix.reduce(function(ret, iter){
        return ret.concat(iter)
      }, []);
    }, _max = function (matrix) {
      return _drop(matrix).reduce(function (lead, iter) {
        return lead.trim().length > iter.trim().length ? lead : iter; 
      }).length;
    }, _each = function (matrix, func) {
      return matrix.map(function (x, i) {
        return x.map(function (a, b, c) {
          return func.apply(this, [a, x.length * i + b, c]);
        });
      }); 
    }, _size = function (matrix) {
      return new Point(matrix[0].length, matrix.length);
    }, _range = function (matrix, format, a, b) {
      var size   = _size(matrix),
          input  = format.match(/\d+/g),
          range  = new Range({}, {}),
          valid  = new Point();

      if (/(-?\d+,){3}-?\d+/.test(format))
        range = new Range(new Point( input[0], input[1] ) ,
                          new Point( input[2], input[3] ) );
      else
        range = new Range(new Point( input[0], input[2] ),
                          new Point( eval( format.match(/-?\d+[+-]\d+/g)[0] ), eval( format.match(/-?\d+[+-]\d+/g)[1] ) ) );

      return _each(matrix, function (item, index) {
        valid.Set( index % size.x, Math.floor( index / size.x ) );

        var sandbox = { '$_': item };

        if ( range.contains(valid) ) return a || item;
        else return b || item;

      });
    };

    /* LEXER */
    /* Matrix Generation */
    var size = code.split(':')[0];
    if (/^\d+,\d+$/.test(size)) {
      var dm = size.match(/(\d+),(\d+)/).slice(1).map(Number);
      Matrix = _generateMatrix(dm[0], dm[1], '');
    } else if (/^\d+$/.test(size)) {
      console.log('test', size.match(/\d+/)[0]);
      Matrix = _generateMatrix( +size.match(/\d+/)[0], +size.match(/\d+/)[0], '');
    } else {
      // options.dynamic = true;
    }

    /* Options */
    var opt = code.split(':')[1];
    ( opt.match(/[^A-Za-z\d]?[A-Za-z]!?/g) || []).forEach(function (option) {
      options[ option.replace(/!/,'') ] = option.slice(-1) !== '!';
    });

    /* Option Setup */
    /*
                        f - Fixed LEFT
                        F - Fixed RIGHT
                    */
    var handle = {
      'f' : function (matrix) { // Fixed LEFT
        var len = _max(matrix);

        return _each(matrix, function (y) { 
          return y.trim().length < len ? y.trim() + ' '.repeat(len - y.trim().length) : y.trim();
        });
      },
      'F' : function (matrix) { // Fixed RIGHT
        var len = _max(matrix);

        return _each(matrix, function (y) { 
          return y.trim().length < len ? ' '.repeat(len - y.trim().length) + y.trim() : y.trim();
        });
      }
    };

    /* Parsing */
    var raw = code.split(':')[2].replace(/\$(\d+)\$/g, function (_,char) {
      return input[+char] || '';
    }).replace(/`(\d*)/g, function (_, char) {
      return char ? input[+char] : input[0];
    }).replace(/\/\*[\S\s]*?\*\/|\s/g, "").split(';').map(function (letter) {
      return (~letter.indexOf('|') ? letter.split('|').concat("").splice(0,2) : ["", letter]).reverse();
    }), instructions = {
      /*
                            Origin - Sets the Origin quadrant
                            Set - Modifies a block in the matrix
                        */
      'Set': function (instruction) {
        Matrix = _range(Matrix, instruction, instruction.split('=')[1], null);
      },
      'NSet': function (instrunction) {
        Matrix = _range(Matrix, instrunction, null, instrunction.split('=')[1]);
      },
      'SetAll': function(instruction) {
        Matrix = _each(Matrix, function () {
          return instruction;
        });
      },
      'Origin': function (instruction) {
      },
      'Expand': function (instruction) {
        instruction = eval(instruction);
        Array(+instruction).join().split(',').forEach(function (z,y,a) {
          if (y) Matrix.push(a);
        });
        Matrix = Matrix.map(function (x) {
          if (x.length < instruction) {
            return x.concat(Array(instruction - x.length).join().split(','))
          } else {
            return x;
          }
        });
      },
      'Map': function (instruction) {
        Matrix = _each(Matrix, function (item) {
          return ''+eval( instruction.replace(/@/g, item) );
        });
      },

      /* */
      'Fibonacci': function (instruction) {
         
      }
    }, min = {
      '': 'Set',
      'n': 'NSet',
      'A': 'SetAll',
      'M': 'Map',
      'O': 'Origin',
      'U': 'Expand',

      /* */
      'Fib': 'Fibonacci'
    };

    raw.forEach(function (item) {
      if ( item[0][0] == '$' ) {
        variables[item[0].slice(1)] = item[1].replace(/\$(?=[A-Za-z_])(\w+)\$/g, function (_, name) {
          return variables[name] || "";
        });
      }

      ( instructions[ item[0] ] || instructions[ min[ item[0] ] ] || new Function )( item[1].replace(/{(.+?)}/g, function (_, expr) {
        return eval(expr.replace(/(\d+)\^(\d+)/g, 'Math.pow($1, $2)'));
      }).replace(/\$(?=[A-Za-z_])(\w+)\$?/g, function (_, name) {
        return variables[name] || "";
      }));

      Object.keys(options).forEach(function (opt) {
        if (options[opt]) Matrix = handle[opt](Matrix);
      });
    });


    return _collapse(Matrix, ' ', '\n');
  };

  window.Blocks = Blocks;
}());
