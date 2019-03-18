import * as PIXI from 'pixi.js';
import * as pixiSound from 'pixi-sound';
var conf = require('./conf.json');

const app = new PIXI.Application(conf.contWidth*conf.contFieldSize, conf.contHeight*conf.contFieldSize + 50, {backgroundColor : 0x1099bb});
const gr = new PIXI.Graphics();

const scoreText = new PIXI.Text('Score: 0pt',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
scoreText.x = 10;
scoreText.y = conf.contHeight*conf.contFieldSize + 20;

const linesText = new PIXI.Text('Lines: 0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
linesText.x = 200;
linesText.y = conf.contHeight*conf.contFieldSize + 20;

document.body.appendChild(app.view);
app.stage.addChild(gr);
app.stage.addChild(scoreText);
app.stage.addChild(linesText);

// describe types
export type Int = number & { __int__: void };

export const roundToInt = (num: number): Int => Math.round(num) as Int;

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

class Point
{
    x:number;
    y:number;
}

// load assets
PIXI.loader.add([
        {name:'music', url:'music.mp3'},
        {name:'sRotate', url:'SFX_PieceRotateLR.ogg'},
        {name:'sRotateFail', url:'SFX_PieceRotateFail.ogg'},
        {name:'sMoveH', url:'SFX_PieceSoftDrop.ogg'},
        {name:'sHard', url:'hard.mp3'},
        {name:'sSoft', url:'soft.mp3'},
        {name:'sMove', url:'SFX_PieceMoveLR.ogg'},
        {name:'sOver', url:'gameOver.ogg'},
        {name:'sLine', url:'line.ogg'}
        // todo: tick, 2-4 line
            ])
    .load((loader, resources) => 
    {
        resources.music.data.volume = .1;
        resources.music.data.loop = true;
        resources.music.data.singleInstance = true;
        resources.music.data.play();
    });

class EFigureType 
{
    static I = [[0,0,0,0], 
                [1,1,1,1], 
                [0,0,0,0], 
                [0,0,0,0]]; 
    static J = [[1,0,0], 
                [1,1,1], 
                [0,0,0]]; 
    static L = [[0,0,1], 
                [1,1,1], 
                [0,0,0]];    
    static S = [[0,1,1], 
                [1,1,0], 
                [0,0,0]];  
    static T = [[0,1,0], 
                [1,1,1], 
                [0,0,0]]; 
    static Z = [[1,1,0], 
                [0,1,1], 
                [0,0,0]];
    static O = [[1,1], 
                [1,1]];

    static all = [EFigureType.I, EFigureType.J, EFigureType.L, EFigureType.O, EFigureType.S, EFigureType.T, EFigureType.Z];

    static getRandomShape():number[][]
    {
        return EFigureType.all[Math.floor(Math.random() * EFigureType.all.length)];
    }
}

class Figure
{
    static lastId:number = 0;
    id:number;
    color:number;
    shape:number[][];
    lastShape:number[][];
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

    getPoints():Point[]
    {
        var r:Point[] = [];
        const size:number = this.shape.length;

        for(var row:number = 0; row < size; row++) 
            for(var col:number = 0; col< size; col++)
                if (this.shape[row][col])
                    r.push({x:this.x + col, y:this.y + row});

        return r;
    }

    rotate()
    {
        const size:number = this.shape.length;
        var newShape:number[][] = new Array(size).fill(0).map(() => new Array(size).fill(0));

        for(var row:number = 0; row < size; row++) 
            for(var col:number = 0; col< size; col++)
                newShape[row][col] = this.shape[col][(size-1) - row];

        this.lastShape = this.shape;
        this.shape = newShape;
    }

    rotateRestore()
    {
        this.shape = this.lastShape;
    }
}


class Model
{
    _poolSize:Int;
	poolItems:Array<Figure>;
	completedItems:Array<Figure>;
    curItem:Figure;
    curScore:number;
    curLines:number;
    
    constructor()  {}

    resetNewGame(poolSize:Int)
    {
        this.curScore = 0;
        this.curLines = 0;
        this.clean();
        this._poolSize = poolSize;
        this.fillPool();
    }

    fillPool()
    {
        while(this.poolItems.length < conf.poolSize)
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

    addScoreForHardDrop(linesCount:number)
    {
        this._addScore(conf.scoreHard * linesCount);
    }

    addScoreForSoftDrop(linesCount:number)
    {
        this._addScore(conf.scoreSoft * linesCount);
    }

    scoreForLines(linesCount:number)
    {
        model.curLines += linesCount;
        linesText.text = `Lines: ${this.curLines}`;

        this._addScore(conf.scores[linesCount]);
    }

    _addScore(total:number)
    {
        this.curScore += total;
        scoreText.text = `Score: ${model.curScore}`;
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

    draw(gr:PIXI.Graphics, curItem?:Figure)
    {
        gr.clear();
        gr.lineStyle(1, 0xffffff, 1);

        const s = conf.contFieldSize;

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
        const s = conf.contFieldSize;
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
        let pts:Point[] = curItem.getPoints();
        let outOfHolst:boolean;
        for (let p of pts)
        {
            outOfHolst = (p.x < 0 || p.y < 0 || p.x > conf.contWidth-1 || p.y > conf.contHeight-1);
            if (outOfHolst) return true;
        }

        return false;
    }

    // item intersects with others
    checkIntersectOthers(curItem:Figure):boolean
    {
        let pts:Point[] = curItem.getPoints();
        for (let p of pts)
            if (p.x < 0 || p.y < 0 || 
                p.x > conf.contWidth-1 || p.y > conf.contHeight-1) 
                    continue;
        else if (this.grid[p.y][p.x])
        {
            return true;
        }
        
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

function keyDown(event:KeyboardEvent)
{
    // left
    if (event.keyCode == 37) {
        if (state2 == 0)
                skipFrame2 = true;
        else    curSpeed2 = conf.figureDropDt * conf.figureHMult;

        state2 = -1;
    }
    // right
    else if (event.keyCode == 39) {
        if (state2 == 0)
                skipFrame2 = true;
        else    curSpeed2 = conf.figureDropDt * conf.figureHMult;
        
        state2 = 1;
    }
    // down
    else if (event.keyCode == 40) {
        curSpeed1 = conf.figureDropDt * conf.figureVMult;
        softMode = true;
    }
    // up
    else if (event.keyCode == 38) {
        // hard drop
        if (state == 2 || state == 3)
        {
            let n:number = 0;
            while(1)
            {
                n++;
                model.curItem.dropByDelta(0, 1);
                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOthers(model.curItem))
                        break;
            }
            model.addScoreForHardDrop(n);
            model.curItem.dropByDelta(0, -1);
            holst.draw(gr, model.curItem);
            state = 4;
            r.sHard.data.play();
        }
        
    }
    // space
    else if (event.keyCode == 32) {
        // rotation
        model.curItem.rotate();
        if (holst.checkOutOfCanvas(model.curItem) 
            || holst.checkIntersectOthers(model.curItem))
            {
                model.curItem.rotateRestore();
                r.sRotateFail.data.play();
            } else 
            {
                holst.draw(gr, model.curItem);
                r.sRotate.data.play();
            }
    }
}

function defaultLoopProps(event?:KeyboardEvent)
{
    state2 = 0;
    softMode = false;
    softModeN = 0;
    curSpeed1 = conf.figureDropDt;
    curSpeed2 = conf.figureDropDt;
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', defaultLoopProps);


let model = new Model();
let holst = new Canvas(conf.contWidth, conf.contHeight);

var rows2del:number[] = [];

var state:number = 0;
var dt1:number = 0;
var steps1:number = 0;
var fSteps1:number;
var skipFrame1:boolean = false;
var curSpeed1:number;
var softMode:boolean = false;
var softModeN:number = 0;

var state2:number = 0;
var dt2:number = 0;
var steps2:number = 0;
var fSteps2:number;
var skipFrame2:boolean = false;
var curSpeed2:number;

var r = PIXI.loader.resources;

defaultLoopProps();


// horizontal_flow
app.ticker.add( () => 
{
    dt2 += PIXI.ticker.shared.elapsedMS;
    fSteps2 = steps2;
    steps2 = roundToInt(dt2 / curSpeed2);

    if (fSteps2 != steps2 || skipFrame2)
    {
        skipFrame2 = false;
        fSteps2 = steps2;
        switch(state2)
        {
            case -1:
            {
                if (state > 1 && state <= 4)
                {
                    // check out of area
                    model.curItem.dropByDelta(-1, 0);
                    if (holst.checkOutOfCanvas(model.curItem) 
                        || holst.checkIntersectOthers(model.curItem))
                        {
                            model.curItem.dropByDelta(1, 0);
                        }

                    holst.draw(gr, model.curItem);
                    r.sMove.data.play();
                }
                break;
            }
            case 1:
            {
                if (state > 1 && state <= 4)
                {
                    // check out of area
                    model.curItem.dropByDelta(1, 0);
                    if (holst.checkOutOfCanvas(model.curItem) 
                        || holst.checkIntersectOthers(model.curItem))
                        {
                            model.curItem.dropByDelta(-1, 0);
                        }

                    holst.draw(gr, model.curItem);
                    r.sMove.data.play();
                }
                break;
            }

            case 0: 
            {

                break;
            }
        }
    }
});

// vertical_flow
app.ticker.add( () => 
{
    dt1 += PIXI.ticker.shared.elapsedMS;
    fSteps1 = steps1;
    steps1 = roundToInt(dt1 / curSpeed1);

    if (fSteps1 != steps1 || skipFrame1)
    {
        skipFrame1 = false;
        fSteps1 = steps1;
        //console.log(`State reched: ${state}`);

        switch(state)
        {
            case 0: // newgame
            {
                model.resetNewGame(roundToInt(conf.poolSize));

                state = 1;
            }
            case 1: //spawn
            {
                softModeN = 0;
                model.genNextItem();
                //model.curItem.respawn(roundToInt(contWidth/2 - model.curItem.getWidth()/2), 0);
                model.curItem.respawn(0, 0);
                // holst is FULL!
                if (holst.checkIntersectOthers(model.curItem))
                {
                    //move to highest positiion end finish
                    if (holst.checkIntersectOthers(model.curItem)) 
                    {
                        model.curItem.dropByDelta(0, -1);
                        console.log(`move ${model.curItem.x}-${model.curItem.y}`);
                    }
                        
                    state = 10;
                } else // go ahead
                    state = 2;
                
                holst.draw(gr, model.curItem);
                
                break;
            }        
    
            case 2: // move & render
            {
                if (softMode)
                {
                    softModeN++;
                    r.sMoveH.data.play();
                }
                
                model.curItem.dropByDelta(0, 1);
                holst.draw(gr, model.curItem);
                skipFrame1 = true;
                state = 3;

                break;
            }
    
            case 3: // check stop
            {
                // predict next step
                model.curItem.dropByDelta(0, 1);
                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOthers(model.curItem))
                    {
                        if (softMode)
                            model.addScoreForSoftDrop(softModeN);

                        state = 4;
                        r.sSoft.data.play();
                    }
                        

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
                    state = 5;
                else
                    state = 1;

                break;
            }

            case 5: // remove rows one after one and back to new spawn
            {
                model.scoreForLines(rows2del.length);
                while (rows2del.length)
                    holst.removeRow(rows2del.shift());

                holst.draw(gr);
                r.sLine.data.play();

                state = 1;

                break;
            }

            case 10: // fin
            {
                app.ticker.destroy();
                r.sOver.data.play();
                alert(`Game Over! Score: ${model.curScore}`);
                
            }
        }
    }

});