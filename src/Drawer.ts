import * as PIXI from 'pixi.js';
import Polimino from './Polimino';

export default class Drawer
{
    constructor(public w:number, public h:number, public s:number) {}

    drawPreviews(to:PIXI.Graphics, items:Polimino[])
    {
        const dy:number = this.s;
        const s = this.s;
        let nextItemY:number = 1;

        to.clear();

        for (let f of items)
        {
            f.y = nextItemY;
            this.drawItem(to, f);
            nextItemY += dy+s;
        }
    }

    drawGrid(to:PIXI.Graphics, grid:number[][])
    {
        const s = this.s;

        to.lineStyle(1, 0xffffff, 1);
        to.drawRect(0, 0, this.w*this.s, this.h*this.s);

        for(var row:number = 0; row < this.h; row++) 
            for(var col:number = 0; col < this.w; col++)
                if(grid[row][col])
                {
                    to.lineStyle(1, 0, 1);
                    to.beginFill(grid[row][col], 1);
                    to.drawRect(col*s, row*s, s, s);
                    to.endFill();
                }
    }

    drawItem(to:PIXI.Graphics, curItem:Polimino)
    {
        const s = this.s;

        to.lineStyle(1, 0xffffff, 1);
        to.beginFill(curItem.color, 1);

        for(var row:number = 0; row < curItem.size; row++) 
            for(var col:number = 0; col < curItem.size; col++)
                if(curItem.shape[row][col])
                    to.drawRect(curItem.x*s + col*s, curItem.y*s + row*s, s, s);

        to.endFill();
    }
}