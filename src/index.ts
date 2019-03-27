import t = require('./TetrisGame');
var conf = require('./confColored.json');

const app = new t();
app.startGame(conf);

// start with default conf
//app.startGame();

// override props
//app.startGame( {"contWidth":15, "contHeight":20} );
