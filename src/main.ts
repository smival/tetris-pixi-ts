import * as PIXI from 'pixi.js';

// todo move to conf
const contWidth:number = 15;    // 15
const contHeight:number = 15;   // 30
const contFieldSize:number = 24;
const poolSize:number = 2;
const figureDropDt:number = 100; // 1000
const figureDropMult:number = 2;
const scores:number[] = [0, 100, 300, 700, 1500];

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
    static I = [[1,0,0,0], 
                [1,0,0,0], 
                [1,0,0,0], 
                [1,0,0,0]]; 
    static J = [[1,0,0,0], 
                [1,1,1,0], 
                [0,0,0,0], 
                [0,0,0,0]]; 
    static L = [[0,0,1,0], 
                [1,1,1,0], 
                [0,0,0,0], 
                [0,0,0,0]];  
    static O = [[1,1,0,0], 
                [1,1,0,0], 
                [0,0,0,0], 
                [0,0,0,0]];  
    static S = [[0,1,1,0], 
                [1,1,0,0], 
                [0,0,0,0], 
                [0,0,0,0]];  
    static T = [[0,1,0,0], 
                [1,1,1,0], 
                [0,0,0,0], 
                [0,0,0,0]]; 
    static Z = [[1,1,0,0], 
                [0,1,1,0], 
                [0,0,0,0], 
                [0,0,0,0]];

    static all = [EFigureType.I, EFigureType.J, EFigureType.L, EFigureType.O, EFigureType.S, EFigureType.T, EFigureType.Z];

    static getRandomShape():number[][]
    {
        return EFigureType.all[Math.floor(Math.random() * EFigureType.all.length)];
    }
}

class Point
{
    x:number;
    y:number;
}

class Figure
{
    static lastId:number = 0;
    id:number;
    color:number;
    shape:number[][];
    x:number = 0;
    y:number = 0;
    _w:number = 0;
    _h:number = 0;

    constructor(newPerfectShape:number[][], color:number)
    {
        this.id = Figure.lastId++;
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
        console.log(`fig ${this.id} new spawn: ${x}-${y}`);
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
                    if (col < l) l = col;
                    if (row < t) t = row;
                    if (col > r) r = col+1;
                    if (row > b) b = row+1;
                }
                    

        return new Rectangle(this.x+l, this.y+t, r-l, b-t);
    }

    getPoints():Point[]
    {
        var r:Point[] = [];
        for(var row:number = 0; row < this.shape.length; row++) 
            for(var col:number = 0; col< this.shape[row].length; col++)
                if (this.shape[row][col])
                    r.push({x:this.x + col, y:this.y + row});

        return r;
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
    _poolSize:Int;
	poolItems:Array<Figure>;
	completedItems:Array<Figure>;
    curItem:Figure;
    curScore:number;
    
    constructor()  {}

    resetNewGame(poolSize:Int)
    {
        this.curScore = 0;
        this.clean();
        this._poolSize = poolSize;
        this.fillPool();
    }

    fillPool()
    {
        while(this.poolItems.length < poolSize)
            this.poolItems.push( new Figure(EFigureType.getRandomShape(), getRandomColor()) );
    }
	
    genNextItem() 
    {
        this.curItem = this.poolItems.shift();
        this.fillPool();
    }

    putCompleted() 
    {
        this.completedItems.push(this.curItem);
        this.curItem = null;
    }

    clean() 
    {
        this.poolItems = [];
        this.completedItems = [];
        this.curItem = null;
    }
}

class Canvas
{
    colsNum:number;
    rowsNum:number;
    grid:number[][];

    constructor(colsNum:number, rowsNum:number)
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
                    this.grid[row+figure.y][col+figure.x] = figure.color;
    }

    removeRow(row:number)
    {
        this.grid.splice(row, 1);
        this.addRowToTop();
    }

    addRowToTop()
    {
        this.grid.unshift([]);
        for(var col:number = 0; col < this.colsNum; col++)
                this.grid[0][col] = 0;
    }

    cleanRow(row:number)
    {
        this.grid[row] = [];
        for(var col:number = 0; col < this.colsNum; col++)
                this.grid[row][col] = 0;
    }

    render(gr:PIXI.Graphics, curItem?:Figure)
    {
        gr.clear();
        gr.lineStyle(1, 0xffffff, 1);

        const s = contFieldSize;

        for(var row:number = 0; row < this.rowsNum; row++) 
            for(var col:number = 0; col < this.colsNum; col++)
                if(this.grid[row][col])
                {
                    gr.beginFill(this.grid[row][col], 1);
                    gr.drawRect(col*s, row*s, s, s);
                    gr.endFill();
                }
                
        if (curItem)
            this._renderItem(curItem);
    }

    _renderItem(curItem:Figure)
    {
        const s = contFieldSize;
        gr.beginFill(curItem.color, 1);

        for(var row:number = 0; row < curItem.getHeight(); row++) 
        for(var col:number = 0; col < curItem.getWidth(); col++)
            if(curItem.shape[row][col])
                gr.drawRect(curItem.x*s + col*s, curItem.y*s + row*s, s, s);

        gr.endFill();
    }

    // item is out of holst
    checkOutOfCanvas(curItem:Figure):boolean
    {
        let holstRect:Rectangle = new Rectangle(0, 0, contWidth, contHeight);
        let itemRect:Rectangle = curItem.getRect();
        let outOfHolst:boolean = !(holstRect.containsRect(itemRect));
        
        return outOfHolst;
    }

    // item intersects with others
    checkIntersectOvers(curItem:Figure):boolean
    {
        let pts:Point[] = curItem.getPoints();

        for (let p of pts)
        if (p.x < 0 || p.y < 0)
            continue;
        else if (this.grid[p.y][p.x])
            return true;
        
        return false;
    }

    checkRowsForRemove():number[]
    {
        let r:number[] = [];
        let success:boolean;

        for(var row:number = 0; row < this.rowsNum; row++) 
        {
            success = true;
            for(var col:number = 0; col < this.colsNum; col++)
                if(this.grid[row][col] == 0)
                {
                    success = false;
                    break;
                }

            if (success)
                r.push(row);
        }

        return r;
    }
}

let model = new Model();
let holst = new Canvas(contWidth, contHeight);

var rows2del:number[] = [];
var dt:number = 0;
var steps:number = 0;
var oldSteps:number;
var state:number = 0;
var skipFrame:boolean = false;

app.ticker.add(() => {
    
    dt += PIXI.ticker.shared.elapsedMS;
    oldSteps = steps;
    steps = roundToInt(dt / figureDropDt);

    if (oldSteps != steps || skipFrame)
    {
        skipFrame = false;
        oldSteps = steps;
        //console.log(`State reched: ${state}`);

        switch(state)
        {
            case 0: // newgame
            {
                model.resetNewGame(roundToInt(poolSize));

                state = 1;
            }
            case 1: //spawn
            {
                model.genNextItem();
                //model.curItem.respawn(roundToInt(contWidth/2 - model.curItem.getWidth()/2), 0);
                model.curItem.respawn(0, 0);
                // holst is FULL!
                if (holst.checkIntersectOvers(model.curItem))
                {
                    console.log(`game over`);
                    //move to highest positiion end finish
                    if (holst.checkIntersectOvers(model.curItem)) 
                    {
                        model.curItem.dropByDelta(0, -1);
                        console.log(`move ${model.curItem.x}-${model.curItem.y}`);
                    }
                        
                    state = 10;
                } else // go ahead
                    state = 2;
                
                holst.render(gr, model.curItem);
                
                break;
            }        
    
            case 2: // move & render
            {
                model.curItem.dropByDelta(0, 1);
                holst.render(gr, model.curItem);
                skipFrame = true;
                state = 3;
                break;
            }
    
            case 3: // check stop
            {
                // predict next step
                model.curItem.dropByDelta(0, 1);

                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOvers(model.curItem))
                        state = 4;

                else    state = 2;

                // back to actual pos
                model.curItem.dropByDelta(0, -1);

                break;
            }

            case 4: // check remove rows or back to new spawn
            {
                holst.fillFigure(model.curItem);
                rows2del = holst.checkRowsForRemove();
                if (rows2del.length)
                {
                    model.curScore += scores[rows2del.length];
                    console.log(`SCORE: ${model.curScore}`);

                    state = 5;
                }
                else
                    state = 1;

                break;
            }

            case 5: // remove rows one after one and back to new spawn
            {
                if (rows2del.length == 0)
                {
                    state = 1;
                    break;
                }

                holst.removeRow(rows2del.shift());
                holst.render(gr);

                break;
            }

            case 10: // fin
            {
                
            }
        }
    }

});