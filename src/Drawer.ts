import * as PIXI from 'pixi.js';
import Figure from './Tetromino';

export default class Drawer
{
    constructor(public w:number, public h:number, public s:number) {}

    drawPreviews(to:PIXI.Graphics, items:Figure[])
    {
        const dy:number = this.s;
        const s = this.s;
        let nextItemY:number = dy;

        to.clear();

        // todo move to drawItem
        for (let f of items)
        {
            to.lineStyle(1, 0xffffff, 1);
            to.beginFill(f.color, 1);

            for(var row:number = 0; row < f.size; row++) 
                for(var col:number = 0; col < f.size; col++)
                    if(f.shape[row][col])
                    to.drawRect(f.x*s + col*s, nextItemY+f.y*s + row*s, s, s);

            nextItemY += dy+s*f.size;
            to.endFill();
        }
    }

    drawGrid(to:PIXI.Graphics, grid:number[][])
    {
        to.clear();
        to.lineStyle(1, 0xffffff, 1);
        to.drawRect(0, 0, this.w*this.s, this.h*this.s);

        const s = this.s;

        for(var row:number = 0; row < this.h; row++) 
            for(var col:number = 0; col < this.w; col++)
                if(grid[row][col])
                {
                    to.beginFill(grid[row][col], 1);
                    to.drawRect(col*s, row*s, s, s);
                    to.endFill();
                }
    }

    drawItem(to:PIXI.Graphics, curItem:Figure)
    {
        const s = this.s;
        to.beginFill(curItem.color, 1);

        for(var row:number = 0; row < curItem.size; row++) 
            for(var col:number = 0; col < curItem.size; col++)
                if(curItem.shape[row][col])
                to.drawRect(curItem.x*s + col*s, curItem.y*s + row*s, s, s);

        to.endFill();
    }
}