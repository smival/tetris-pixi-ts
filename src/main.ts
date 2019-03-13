import * as PIXI from 'pixi.js';

const app = new PIXI.Application();

document.body.appendChild(app.view);

// load the texture we need
PIXI.loader.add([{name:'bunny', url:'sprites.png', crossOrigin:'true'}]).load((loader, resources) => {
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
    app.ticker.add(() => {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.01;
    });
});


function writeLn (str:number): void {
    console.log(str) 
}

writeLn(2000);

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

    constructor(newPerfectShape:number[][], color:number)
    {
        this.color = color;
        this.shape = newPerfectShape;
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
            this.nextItems.push( new Figure(EFigureType.getRandomShape(), 123) );
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

let model = new Model();
model.resetNewGame(2);
