import * as PIXI from 'pixi.js';

// todo move to conf
const contWidth:number = 15;
const contHeight:number = 30;
const contFieldSize:number = 24;
const poolSize:number = 2;
const figureDropDt:number = 100; // 1000
const figureDropMult:number = 2;

const app = new PIXI.Application(contWidth*contFieldSize, contHeight*contFieldSize, {backgroundColor : 0x1099bb});
const gr = new PIXI.Graphics();

document.body.appendChild(app.view);
app.stage.addChild(gr);

// describe types

export type Int = number & { __int__: void };

export const roundToInt = (num: number): Int => Math.round(num) as Int;

class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) {}
    contains (x:number, y:number) 
    {
        return this.x <= x && x <= this.x + this.width &&
               this.y <= y && y <= this.y + this.height;
    }

    containsRect (r:Rectangle) 
    {
        return this.contains(r.x,           r.y) 
            && this.contains(r.x + r.width, r.y) 
            && this.contains(r.x + r.width, r.y + r.height) 
            && this.contains(r.x,           r.y + r.height);
    }
}

function getRandomColor():number
{
    return Math.random() * 0xffffff;
}

/*
export const toInt = (value: string): Int => {
  return Number.parseInt(value) as Int;
};
*/
export const checkIsInt = (num: number): num is Int =>  num % 1 === 0;

export const assertAsInt = (num: number): Int => {
  try {
    if (checkIsInt(num)) {
      return num;
    }
  } catch (err) {
    throw new Error(`Invalid Int value (error): ${num}`);
  }

  throw new Error(`Invalid Int value: ${num}`);
};

// load the texture we need
/*
PIXI.loader.add([{name:'bunny', url:'bunny.png', crossOrigin:'true'}]).load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    const bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny 
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add((deltaTime) => {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.01;
    });
});
*/

class EFigureType 
{
    static I = [[0,1,0,0], 
                [0,1,0,0], 
                [0,1,0,0], 
                [0,1,0,0]]; 
    static J = [[0,0,0,0], 
                [0,1,0,0], 
                [0,1,1,1], 
                [0,0,0,0]]; 
    static L = [[0,0,0,0], 
                [0,0,0,1], 
                [0,1,1,1], 
                [0,0,0,0]];  
    static O = [[0,0,0,0], 
                [0,1,1,0], 
                [0,1,1,0], 
                [0,0,0,0]];  
    static S = [[0,0,0,0], 
                [0,0,1,1], 
                [0,1,1,0], 
                [0,0,0,0]];  
    static T = [[0,0,1,0], 
                [0,1,1,1], 
                [0,0,0,0], 
                [0,0,0,0]]; 
    static Z = [[0,0,0,0], 
                [0,1,1,0], 
                [0,0,1,1], 
                [0,0,0,0]];

    static all = [EFigureType.I, EFigureType.J, EFigureType.L, EFigureType.O, EFigureType.S, EFigureType.T, EFigureType.Z];

    static getRandomShape():number[][]
    {
        return EFigureType.all[Math.floor(Math.random() * EFigureType.all.length)];
    }
}

class Figure
{
    color:number;
    shape:number[][];
    x:number = 0;
    y:number = 0;
    _w:number = 0;
    _h:number = 0;

    constructor(newPerfectShape:number[][], color:number)
    {
        this.color = color;
        this.shape = newPerfectShape;
        this._w = newPerfectShape[0].length;
        this._h = newPerfectShape.length;
    }

    getWidth():number
    {
        return this._w;
    }

    getHeight():number
    {
        return this._h;
    }

    respawn(x:number, y:number)
    {
        console.log(`new spawn: ${x}-${y}`);
        this.x = x;
        this.y = y;
    }

    dropByDelta(dx:number, dy:number)
    {
        this.x += dx;
        this.y += dy;
    }

    getRect():Rectangle
    {
        let l:number = Number.MAX_VALUE;
        let t:number = Number.MAX_VALUE;
        let r:number = 0;
        let b:number = 0;

        for(var row:number = 0; row < this.shape.length; row++) 
            for(var col:number = 0; col< this.shape[row].length; col++)
                if (this.shape[row][col])
                {
                    if (col < l) l = col+1;
                    if (row < t) t = row+1;
                    if (col > r) r = col+1;
                    if (row > b) b = row+1;
                }
                    

        return new Rectangle(this.x+l, this.y+t, r-l, b-t);
    }

    rotateLeft()
    {

    }

    rotateRight()
    {
        
    }
}


class Model
{
	public nextItems:Array<Figure>;
	public completedItems:Array<Figure>;
    public curItem:Figure;
    
    constructor()
    {
        this.clean();
    }

    resetNewGame(poolSize:number)
    {
        while(poolSize--)
            this.nextItems.push( new Figure(EFigureType.getRandomShape(), getRandomColor()) );
    }
	
    genNextItem() 
    {
        this.curItem = this.nextItems.shift();
    }

    putCompleted() 
    {
        this.completedItems.push(this.curItem);
        this.curItem = null;
    }

    clean() 
    {
        this.nextItems = [];
        this.completedItems = [];
        this.curItem = null;
    }
}

class Canvas
{
    colsNum:number;
    rowsNum:number;
    grid:number[][];

    constructor(colsNum, rowsNum)
    {
        this.colsNum = colsNum;
        this.rowsNum = rowsNum;
        this.fillNewGrid();
    }

    fillNewGrid()
    {
        this.grid = [];
        for(var row:number = 0; row < this.rowsNum; row++) 
            this.cleanRow(row);
    }

    fillFigure(figure:Figure)
    {
        for(var row:number = 0; row < figure.shape.length; row++) 
            for(var col:number = 0; col< figure.shape[row].length; col++)
                if (figure.shape[row][col])
                    this.grid[row+figure.y][col+figure.x] = 1;
    }

    cleanRow(row:number)
    {
        this.grid[row] = [];
        for(var col:number = 0; col < this.colsNum; col++)
                this.grid[row][col] = 0;
    }

    render(gr:PIXI.Graphics, curItem:Figure)
    {
        const s = contFieldSize;

        gr.clear();
        gr.lineStyle(1, 0xffffff, 1);
        gr.beginFill(curItem.color, 1);

        // draw completed moves
        for(var row:number = 0; row < this.rowsNum; row++) 
            for(var col:number = 0; col < this.colsNum; col++)
                if(this.grid[row][col])
                    gr.drawRect(col*s, row*s, s, s);

        // draw item
        for(var row:number = 0; row < curItem.getHeight(); row++) 
            for(var col:number = 0; col < curItem.getWidth(); col++)
                if(curItem.shape[row][col])
                    gr.drawRect(curItem.x*s + col*s, curItem.y*s + row*s, s, s);

        gr.endFill();
    }

    checkStopMoving(curItem:Figure):boolean
    {
        // item is out of holst
        let holstRect:Rectangle = new Rectangle(0, 0, contWidth, contHeight);
        let itemRect:Rectangle = curItem.getRect();
        let one:boolean = (holstRect.containsRect(itemRect));

        return !one;
        
        // item intersects with others


    }

    checkRowsForRemove():Int[]
    {
        let r = [];
        // todo
        for(var row:number = 0; row < this.rowsNum; row++) 
            for(var col:number = 0; col < this.colsNum; col++)
                if(!this.grid[row][col])
                    break;

        return [];
    }

    // new spawn does not possible, Canvas is full!
    checkGameIsOver()
    {
        return false;
    }

}

let model = new Model();
let holst = new Canvas(contWidth, contHeight);
var dt:number = 0;
var steps:number = 0;
var oldSteps:number;
var state:number = 0;

app.ticker.add(() => {
    
    dt += PIXI.ticker.shared.elapsedMS;
    oldSteps = steps;
    steps = roundToInt(dt / figureDropDt);

    if (oldSteps != steps)
    {
        oldSteps = steps;
        console.log(`State reched: ${state}`);

        switch(state)
        {
            case 0: // newgame
            {
                model.resetNewGame(poolSize);
                model.genNextItem();

                state = 1;
            }
            case 1: //spawn
            {
                model.curItem.respawn(roundToInt(contWidth/2 - model.curItem.getWidth()/2), 0);
                holst.render(gr, model.curItem);

                state = 2;
                break;
            }        
    
            case 2: // move
            {
                model.curItem.dropByDelta(0, 1);
                holst.render(gr, model.curItem);
                model.curItem.dropByDelta(0, 1);
                if (holst.checkStopMoving(model.curItem)) 
                {
                    state = 3;
                }
                model.curItem.dropByDelta(0, -1);

                break;
            }
    
            case 3: // remove rows or game over
            {
                holst.fillFigure(model.curItem);
                state = 1;
                // check move end (bottom border reached or another Fig collision)
                // check row to delete (Canvas del rows and increment scores)
                // check the game is over! (new spawn does not possible, Canvas is full!)
                
                /*
                holst.checkRowsForRemove();
                if (holst.checkGameIsOver())
                {

                }*/

                break;
            }
        }

        
        

        
        
    }

});