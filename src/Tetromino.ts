import {Point} from './Types';

export default class Tetromino
{
    lastShape:number[][];
    x:number = 0;
    y:number = 0;
    size:number;

    constructor(public id:number, public name:string, public shape:number[][], public color:number)
    {
        this.size = shape.length;
    }

    respawn(x:number, y:number)
    {
        console.log(`fig ${this.id}-${this.name} new spawn: ${x}-${y}`);
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