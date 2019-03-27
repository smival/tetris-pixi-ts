import * as PIXI from 'pixi.js';
import * as snd from 'pixi-sound';

import {EGameState, EDirection, roundToInt} from './Types';
import Canvas from './Canvas';
import TetrominoPool from './TetrominosPool';
import Tetromino from './Tetromino'
import Drawer from './Drawer';

const conf = require('./conf.json');

class Game
{
    background:PIXI.Sprite;
    app:PIXI.Application;
    mainLayer:PIXI.Graphics;
    previewLayer:PIXI.Graphics;
    containerName:string;

    levelText:PIXI.Text;
    scoreText:PIXI.Text;
    linesText:PIXI.Text;

    factory:TetrominoPool;
    holst:Canvas;
    drawer:Drawer;
    curConf:any;

    rows2del:number[] = [];
    validLRStates:EGameState[] = [
        EGameState.CheckCollision,
        EGameState.MoveDown
    ];

    vState:EGameState;
    vDt:number = 0;
    vSteps:number = 0;
    vFSteps:number;
    vSkipFrame:boolean = false;
    vCurSpeed:number;
    softMode:boolean = false;
    softModeLen:number = 0;

    hState:number;
    hDt:number = 0;
    hSteps:number = 0;
    hFSteps:number;
    hSkipFrame:boolean = false;
    hCurSpeed:number;

    r = PIXI.loader.resources;

    private readyToStart:boolean = false;
    private requestToStart:boolean = false;

    curItem:Tetromino;
    curLines:number;
    curScore:number;
    curLevel:number;

    constructor(containerSelector?:string)
    {
        this.containerName = containerSelector;
        // load assets
        PIXI.loader.add([
            {name:'bg', url:'bg.jpg'},
            {name:'music', url:'music.ogg'},
            {name:'sRotate', url:'SFX_PieceRotateLR.ogg'},
            {name:'sRotateFail', url:'SFX_PieceRotateFail.ogg'},
            {name:'sMoveH', url:'SFX_PieceSoftDrop.ogg'},
            {name:'sHard', url:'hard.mp3'},
            {name:'sSoft', url:'soft.mp3'},
            {name:'sMove', url:'SFX_PieceMoveLR.ogg'},
            {name:'sOver', url:'gameOver.ogg'},
            {name:'sLine', url:'line.ogg'}
                ])
        .load((loader, resources) => 
        {
            this.readyToStart = true;
            this.startGameInternal();
        });
    }

    iniLayout()
    {
        this.factory = new TetrominoPool(this.curConf.tetrominos);
        this.holst = new Canvas(this.curConf.contWidth, this.curConf.contHeight);
        this.drawer = new Drawer(this.curConf.contWidth, this.curConf.contHeight, this.curConf.contFieldSize);

        this.app = new PIXI.Application(this.curConf.contWidth*this.curConf.contFieldSize + 150, this.curConf.contHeight*this.curConf.contFieldSize + 50, {backgroundColor : 0x1099bb});
        this.mainLayer = new PIXI.Graphics();
        this.previewLayer = new PIXI.Graphics();
        
        this.previewLayer.x = this.curConf.contWidth*this.curConf.contFieldSize + 30;
        
        this.levelText = new PIXI.Text('Level: 0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
        this.levelText.x = 10;
        this.levelText.y = this.curConf.contHeight*this.curConf.contFieldSize + 20;

        this.linesText = new PIXI.Text('Lines: 0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
        this.linesText.x = 120;
        this.linesText.y = this.curConf.contHeight*this.curConf.contFieldSize + 20;

        this.scoreText = new PIXI.Text('Score: 0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
        this.scoreText.x = 230;
        this.scoreText.y = this.curConf.contHeight*this.curConf.contFieldSize + 20;
    
        
        let defaultContainer:boolean = true;
        if (this.containerName)
        {
            let element = document.querySelector(this.containerName);
            if (element) 
            {
                element.appendChild(this.app.view);
                defaultContainer = false;
            }
        }
            
        if (defaultContainer)
            document.body.appendChild(this.app.view);

        this.background = new PIXI.Sprite(PIXI.loader.resources.bg.texture);

        this.app.stage.addChild(this.background);
        this.app.stage.addChild(this.mainLayer);
        this.app.stage.addChild(this.previewLayer);
        this.app.stage.addChild(this.levelText);
        this.app.stage.addChild(this.scoreText);
        this.app.stage.addChild(this.linesText);
    }

    startGame(extConf?:any)
    {
        this.requestToStart = true;
        this.curConf = {...conf, ...extConf};

        this.vState = EGameState.Begin;
        this.curItem = null;
        this.curScore = 0;
        this.curLines = 0;
        this.curLevel = 0;
        this.hState = EDirection.MoveNone;
        this.softMode = false;
        this.softModeLen = 0;
        this.vCurSpeed = this.curConf.figureDropDt;
        this.hCurSpeed = this.curConf.figureDropDt;

        this.startGameInternal();
    }

    stopGame(dispose?:boolean)
    {
        this.removeListeners();
        this.stopMusic();

        this.requestToStart = false; 
        if (dispose)
        {
            this.readyToStart = false;
            if (this.app) this.app.destroy(true, true);
        }
    }

    pauseGame()
    {
        this.removeListeners();
        this.stopMusic();
    }

    resumeGame()
    {
        this.addListeners();
        this.playMusic();
    }

    private startGameInternal()
    {
        if (this.readyToStart && this.requestToStart)
        {
            this.iniLayout();
            this.addListeners();
        }
            
    } 

    private addListeners()
    {
        document.addEventListener('keydown', this.keyDown.bind(this) );
        document.addEventListener('keyup', this.keyUp.bind(this)) ;
        this.app.ticker.add(this.vertical.bind(this));
        this.app.ticker.add(this.horizontal.bind(this));

        this.keyUp();
        this.playMusic();
    }

    private removeListeners()
    {
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('keyup', this.keyUp);
        this.app.ticker.remove(this.vertical);
        this.app.ticker.remove(this.horizontal);

        this.keyUp();
    }

    private playMusic()
    {
        this.r.music.data.volume = .1;
        this.r.music.data.loop = true;
        this.r.music.data.singleInstance = true;
        this.r.music.data.play();
    }

    private stopMusic()
    {
        this.r.music.data.stop();
    }

    private drawHolst()
    {
        this.mainLayer.clear();
        this.drawer.drawGrid(this.mainLayer, this.holst.grid);
    }

    private drawAll()
    {
        this.mainLayer.clear();
        this.drawer.drawGrid(this.mainLayer, this.holst.grid);
        this.drawer.drawItem(this.mainLayer, this.curItem);
    }

    private addScoreForHardDrop(linesCount:number)
    {
        this.addScore(this.curConf.scoreHard * linesCount);
    }

    private addScoreForSoftDrop(linesCount:number)
    {
        this.addScore(this.curConf.scoreSoft * 10 * linesCount);
    }

    private addScoreForLines(linesCount:number)
    {
        this.curLines += linesCount;
        this.linesText.text = `Lines: ${this.curLines}`;

        this.addScore(this.curConf.scores[linesCount]);
    }

    private addScore(total:number)
    {
        this.curScore += total;
        this.scoreText.text = `Score: ${this.curScore}`;

        let newLevel:number = roundToInt(this.curScore / 1000);
        if (newLevel > this.curLevel)
            this.levelUp(newLevel);
    }

    private levelUp(level:number)
    {
        this.curLevel = level;
        this.levelText.text = `Level: ${this.curLevel}`;
        
    }

    private resetVSpeed()
    {
        this.vCurSpeed = this.curConf.figureDropDt;
        let n = this.curLevel;
        while(n--)
            this.vCurSpeed *= 0.9;

    }

    private keyDown(event:KeyboardEvent) 
    {
        // left
        if (event.keyCode == 37) {
            if (this.validLRStates.indexOf(this.vState) != -1)
            {
                if (this.hState == EDirection.MoveNone)
                        this.hSkipFrame = true;
                else    this.hCurSpeed = this.curConf.figureDropDt * this.curConf.figureHMult;

                this.hState = EDirection.MoveLeft;
            }
        }
        // right
        else if (event.keyCode == 39) {
            if (this.validLRStates.indexOf(this.vState) != -1)
            {
                if (this.hState == EDirection.MoveNone)
                        this.hSkipFrame = true;
                else    this.hCurSpeed = this.curConf.figureDropDt * this.curConf.figureHMult;
                
                this.hState = EDirection.MoveRight;
            }
        }
        // down
        else if (event.keyCode == 40) {
            this.resetVSpeed();
            this.vCurSpeed *= this.curConf.figureVMult;
            this.softMode = true;
        }
        // up
        else if (event.keyCode == 38) {
            // hard drop
            if (this.vState == EGameState.MoveDown || this.vState == EGameState.CheckCollision)
            {
                let n:number = 0;
                while(1)
                {
                    n++;
                    this.curItem.dropByDelta(0, 1);
                    if (this.holst.checkOutOfCanvas(this.curItem) 
                        || this.holst.checkIntersectOthers(this.curItem))
                            break;
                }
                this.addScoreForHardDrop(n);
                this.curItem.dropByDelta(0, -1);
                this.drawAll();
                this.vState = EGameState.CheckRows;
                this.vSkipFrame = true;
                this.r.sHard.data.play();
            }
            
        }
        // space
        else if (event.keyCode == 32) {
            // rotation
            this.curItem.rotate();
            if (this.holst.checkOutOfCanvas(this.curItem) 
                || this.holst.checkIntersectOthers(this.curItem))
                {
                    this.curItem.rotateRestore();
                    this.r.sRotateFail.data.play();
                } else 
                {
                    this.drawAll();
                    this.r.sRotate.data.play();
                }
        }
    }

    private keyUp(event?:KeyboardEvent)
    {
        this.hState = EDirection.MoveNone;
        this.softMode = false;
        this.softModeLen = 0;
        this.hCurSpeed = this.curConf.figureDropDt;
        this.resetVSpeed();
    }

    // horizontal_flow
    private horizontal ()
    {
        this.hDt += PIXI.ticker.shared.elapsedMS;
        this.hFSteps = this.hSteps;
        this.hSteps = roundToInt(this.hDt / this.hCurSpeed);

        if (this.hFSteps != this.hSteps || this.hSkipFrame)
        {
            this.hSkipFrame = false;
            this.hFSteps = this.hSteps;
            switch(this.hState)
            {
                case EDirection.MoveLeft:
                {
                    // check out of area
                    this.curItem.dropByDelta(-1, 0);
                    if (this.holst.checkOutOfCanvas(this.curItem) 
                        || this.holst.checkIntersectOthers(this.curItem))
                        {
                            this.curItem.dropByDelta(1, 0);
                        }

                    this.drawAll();
                    this.r.sMove.data.play();
                    
                    break;
                }
                case EDirection.MoveRight:
                {
                    // check out of area
                    this.curItem.dropByDelta(1, 0);
                    if (this.holst.checkOutOfCanvas(this.curItem) 
                        || this.holst.checkIntersectOthers(this.curItem))
                        {
                            this.curItem.dropByDelta(-1, 0);
                        }

                    this.drawAll();
                    this.r.sMove.data.play();
                    
                    break;
                }

                case EDirection.MoveNone:
                {

                    break;
                }
            }
        }
    }

    // vertical_flow
    private vertical () 
    {
        this.vDt += PIXI.ticker.shared.elapsedMS;
        this.vFSteps = this.vSteps;
        this.vSteps = roundToInt(this.vDt / this.vCurSpeed);

        if (this.vFSteps != this.vSteps || this.vSkipFrame)
        {
            this.vSkipFrame = false;
            this.vFSteps = this.vSteps;
            console.log(`State reched: ${this.vState}`);

            switch(this.vState)
            {
                case EGameState.Begin: // newgame
                {
                    this.factory.resetNewGame(this.curConf.poolSize);

                    this.vState = EGameState.Spawn;
                }
                case EGameState.Spawn: //spawn
                {
                    this.softModeLen = 0;
                    this.factory.next();
                    this.curItem = this.factory.current;
                    this.drawer.drawPreviews(this.previewLayer, this.factory.others);
                    // drawPreviews();
                    this.curItem.respawn(roundToInt(this.curConf.contWidth/2 - this.curItem.size/2), 0);
                    // holst is FULL!
                    if (this.holst.checkIntersectOthers(this.curItem))
                    {
                        //move to highest positiion end finish
                        while (this.holst.checkIntersectOthers(this.curItem)) 
                        this.curItem.dropByDelta(0, -1);
                        
                        this.vState = EGameState.End;
                        this.vSkipFrame = true;
                    } else // go ahead
                    this.vState = EGameState.CheckCollision;   
                    
                    this.drawAll();
                    
                    break;
                }        
        
                case EGameState.CheckCollision: // check stop
                {
                    // predict next step
                    this.curItem.dropByDelta(0, 1);
                    if (this.holst.checkOutOfCanvas(this.curItem) 
                        || this.holst.checkIntersectOthers(this.curItem))
                        {
                            //if (this.softMode)
                                //this.addScoreForSoftDrop(this.softModeN);

                            this.vState = EGameState.CheckRows;
                            this.r.sSoft.data.play();
                        }
                            

                    else    this.vState = EGameState.MoveDown;

                    // back to actual pos
                    this.curItem.dropByDelta(0, -1);
                    this.vSkipFrame = true;

                    break;
                }

                case EGameState.MoveDown: // move & render
                {
                    if (this.softMode)
                    {
                        //this.softModeN++;
                        this.addScoreForSoftDrop(1);
                        this.r.sMoveH.data.play();
                    }
                    
                    this.curItem.dropByDelta(0, 1);
                    this.drawAll();
                    this.vState = EGameState.CheckCollision;

                    break;
                }            

                case EGameState.CheckRows: // check remove rows or back to new spawn
                {
                    this.holst.fillFigure(this.curItem);
                    this.rows2del = this.holst.checkRowsForRemove();
                    if (this.rows2del.length)
                        this.vState = EGameState.RemoveRows;
                    else
                    {
                        this.vState = EGameState.Spawn;
                        this.vSkipFrame = true;
                    }
                        

                    break;
                }

                case EGameState.RemoveRows: // remove rows and back to new spawn
                {
                    this.addScoreForLines(this.rows2del.length);
                    while (this.rows2del.length)
                        this.holst.removeRow(this.rows2del.shift());

                    this.drawHolst();
                    this.r.sLine.data.play();

                    this.vState = EGameState.Spawn;

                    break;
                }

                case EGameState.End: // fin
                {
                    this.r.sOver.data.play();

                    alert(`Game Over! Score: ${this.curScore}`);

                    this.stopGame();
                    
                }
            }
        }
    }
}

export = Game;