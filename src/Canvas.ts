import Polimino from './Polimino';
import {Point} from './Types';

export default class Canvas
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

    fillFigure(figure:Polimino)
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

    // item is out of holst
    checkOutOfCanvas(curItem:Polimino):boolean
    {
        let pts:Point[] = curItem.getPoints();
        let outOfHolst:boolean;
        for (let p of pts)
        {
            outOfHolst = (p.x < 0 || p.y < 0 || p.x > this.colsNum-1 || p.y > this.rowsNum-1);
            if (outOfHolst) return true;
        }

        return false;
    }

    // item intersects with others
    checkIntersectOthers(curItem:Polimino):boolean
    {
        let pts:Point[] = curItem.getPoints();
        for (let p of pts)
            if (p.x < 0 || p.y < 0 || 
                p.x > this.colsNum-1 || p.y > this.rowsNum-1) 
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