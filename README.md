# Blocks
A language designed for matrix manipulation

[**NEW SITE / INTERPRETER**](http://vihanserver.tk/p/langs/Blocks/)

[**WIKI ARTICLE**](http://esolangs.org/wiki/Unnamed)

---

The code is in `src/blocks.es6.js`, the transpiled (ES5) version is at: `src/blocks.js`

---

**Note:** This language is also called "Unnamed", what happend is I forgot I named this language so I called it "Unnamed" and it kinda stuck

**Another NOTE:** Blocks will be rewritten soon with ES6 (and ES5), I've already started on this.

## Documentation

The shorthand is a shorter alternative to the command name so Blocks could be sutible for code-golfing.

Command | Shorthand |Description
--------|-----------|-----------
Set     |    ""     | Sets specified range with value
NSet    |    "n"    | Sets everything *except* within range with value
Expand  |    "U"    | Expands the matrix to a specified size size

To-be added:

Command | Shorthand |Description
--------|-----------|-----------
Origin  |    "O"    | Sets the origin (NOT WORKING)
Each    |    "e"    | Loop through each matrix item
Row     |    "r"    | Loops through a specified row
Column  |    "c"    | Loops through a specified column


## Example Code

```
2,1 : A :
"Hello, World!"         | $my_str
1+2*3                   | $my_num
2,1 = [$my_str+$my_num] | Set
```
