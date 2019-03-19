import * as PIXI from 'pixi.js';
import * as pixiSound from 'pixi-sound';
var conf = require('./conf.json');

const app = new PIXI.Application(conf.contWidth*conf.contFieldSize + 150, conf.contHeight*conf.contFieldSize + 50, {backgroundColor : 0x1099bb});
const canva = new PIXI.Graphics();
const preview = new PIXI.Graphics();

preview.x = conf.contWidth*conf.contFieldSize + 30;

const scoreText = new PIXI.Text('Score: 0pt',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
scoreText.x = 10;
scoreText.y = conf.contHeight*conf.contFieldSize + 20;

const linesText = new PIXI.Text('Lines: 0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
linesText.x = 200;
linesText.y = conf.contHeight*conf.contFieldSize + 20;

document.body.appendChild(app.view);
app.stage.addChild(canva);
app.stage.addChild(preview);
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

enum EGameState
{
    Begin,
    Spawn,
    CheckCollision,
    MoveDown,
    CheckRows,
    RemoveRows,
    End
}

enum EDirection
{
    MoveLeft,
    MoveRight,
    MoveNone
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
            this.poolItems.push( new Figure(this._getRandomShape(), getRandomColor()) );
    }

    _getRandomShape():number[][]
    {
        var keys = Object.keys(conf.tetrominos)
        return conf.tetrominos[keys[ keys.length * Math.random() << 0]];
    }

    drawPreviews()
    {
        // move to drawer
        const dy:number = conf.contFieldSize;
        const s = conf.contFieldSize;
        let nextItemY:number = dy;

        preview.clear();

        for (let f of this.poolItems)
        {
            preview.lineStyle(1, 0xffffff, 1);
            preview.beginFill(f.color, 1);

            for(var row:number = 0; row < f.getHeight(); row++) 
                for(var col:number = 0; col < f.getWidth(); col++)
                    if(f.shape[row][col])
                        preview.drawRect(f.x*s + col*s, nextItemY+f.y*s + row*s, s, s);

            nextItemY += dy+dy*f.getHeight();
            preview.endFill();
        }
    }
	
    genNextItem() 
    {
        this.curItem = this.poolItems.shift();
        this.drawPreviews();
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
        gr.drawRect(0, 0, conf.contWidth*conf.contFieldSize, conf.contHeight*conf.contFieldSize);

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
            this._drawItem(curItem);
    }

    _drawItem(curItem:Figure)
    {
        const s = conf.contFieldSize;
        canva.beginFill(curItem.color, 1);

        for(var row:number = 0; row < curItem.getHeight(); row++) 
            for(var col:number = 0; col < curItem.getWidth(); col++)
                if(curItem.shape[row][col])
                    canva.drawRect(curItem.x*s + col*s, curItem.y*s + row*s, s, s);

        canva.endFill();
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
        if (validLRStates.indexOf(state) != -1)
        {
            if (state2 == EDirection.MoveNone)
                    skipFrame2 = true;
            else    curSpeed2 = conf.figureDropDt * conf.figureHMult;

            state2 = EDirection.MoveLeft;
        }
    }
    // right
    else if (event.keyCode == 39) {
        if (validLRStates.indexOf(state) != -1)
        {
            if (state2 == EDirection.MoveNone)
                    skipFrame2 = true;
            else    curSpeed2 = conf.figureDropDt * conf.figureHMult;
            
            state2 = EDirection.MoveRight;
        }
    }
    // down
    else if (event.keyCode == 40) {
        curSpeed1 = conf.figureDropDt * conf.figureVMult;
        softMode = true;
    }
    // up
    else if (event.keyCode == 38) {
        // hard drop
        if (state == EGameState.MoveDown || state == EGameState.CheckCollision)
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
            holst.draw(canva, model.curItem);
            state = EGameState.CheckRows;
            skipFrame1 = true;
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
                holst.draw(canva, model.curItem);
                r.sRotate.data.play();
            }
    }
}

function defaultLoopProps(event?:KeyboardEvent)
{
    state2 = EDirection.MoveNone;
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
const validLRStates:EGameState[] = [
    EGameState.CheckCollision,
    EGameState.MoveDown
];

var state:EGameState = EGameState.Begin;
var dt1:number = 0;
var steps1:number = 0;
var fSteps1:number;
var skipFrame1:boolean = false;
var curSpeed1:number;
var softMode:boolean = false;
var softModeN:number = 0;

var state2:number;
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
            case EDirection.MoveLeft:
            {
                // check out of area
                model.curItem.dropByDelta(-1, 0);
                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOthers(model.curItem))
                    {
                        model.curItem.dropByDelta(1, 0);
                    }

                holst.draw(canva, model.curItem);
                r.sMove.data.play();
                
                break;
            }
            case EDirection.MoveRight:
            {
                // check out of area
                model.curItem.dropByDelta(1, 0);
                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOthers(model.curItem))
                    {
                        model.curItem.dropByDelta(-1, 0);
                    }

                holst.draw(canva, model.curItem);
                r.sMove.data.play();
                
                break;
            }

            case EDirection.MoveNone:
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
        console.log(`State reched: ${state}`);

        switch(state)
        {
            case EGameState.Begin: // newgame
            {
                model.resetNewGame(roundToInt(conf.poolSize));

                state = EGameState.Spawn;
            }
            case EGameState.Spawn: //spawn
            {
                softModeN = 0;
                model.genNextItem();
                model.curItem.respawn(roundToInt(conf.contWidth/2 - model.curItem.getWidth()/2), 0);
                // holst is FULL!
                if (holst.checkIntersectOthers(model.curItem))
                {
                    //move to highest positiion end finish
                    while (holst.checkIntersectOthers(model.curItem)) 
                        model.curItem.dropByDelta(0, -1);
                    
                    state = EGameState.End;
                    skipFrame1 = true;
                } else // go ahead
                    state = EGameState.CheckCollision;   
                
                holst.draw(canva, model.curItem);
                
                break;
            }        
    
            case EGameState.CheckCollision: // check stop
            {
                // predict next step
                model.curItem.dropByDelta(0, 1);
                if (holst.checkOutOfCanvas(model.curItem) 
                    || holst.checkIntersectOthers(model.curItem))
                    {
                        if (softMode)
                            model.addScoreForSoftDrop(softModeN);

                        state = EGameState.CheckRows;
                        r.sSoft.data.play();
                    }
                        

                else    state = EGameState.MoveDown;

                // back to actual pos
                model.curItem.dropByDelta(0, -1);
                skipFrame1 = true;

                break;
            }

            case EGameState.MoveDown: // move & render
            {
                if (softMode)
                {
                    softModeN++;
                    r.sMoveH.data.play();
                }
                
                model.curItem.dropByDelta(0, 1);
                holst.draw(canva, model.curItem);
                state = EGameState.CheckCollision;

                break;
            }            

            case EGameState.CheckRows: // check remove rows or back to new spawn
            {
                holst.fillFigure(model.curItem);
                rows2del = holst.checkRowsForRemove();
                if (rows2del.length)
                    state = EGameState.RemoveRows;
                else
                {
                    state = EGameState.Spawn;
                    skipFrame1 = true;
                }
                    

                break;
            }

            case EGameState.RemoveRows: // remove rows and back to new spawn
            {
                model.scoreForLines(rows2del.length);
                while (rows2del.length)
                    holst.removeRow(rows2del.shift());

                holst.draw(canva);
                r.sLine.data.play();

                state = EGameState.Spawn;

                break;
            }

            case EGameState.End: // fin
            {
                app.ticker.destroy();
                r.sOver.data.play();
                alert(`Game Over! Score: ${model.curScore}`);
                
            }
        }
    }

});