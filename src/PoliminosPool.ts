import Polimino from './Polimino';
import {ITetroConf, ITetroEntityConf} from './Types';
const Color = require('color');

export default class TetrominoPool
{
    private lastId:number = 0;
    private poolSize:number;
    private poolItems:Array<Polimino>;
    private itemsRaw:ITetroConf;

    current:Polimino;
    others:Polimino[];
    
    constructor(itemsRaw:ITetroConf)  
    {
        this.itemsRaw = itemsRaw;
    }

    resetNewGame(poolSize:number)
    {
        this.poolSize = poolSize;
        this.poolItems = [];
        this.fillPool();
    }

    next()
    {
        this.current = this.poolItems.shift();
        this.others = this.poolItems.concat();
        this.fillPool();
    }

    private fillPool()
    {
        while(this.poolItems.length < this.poolSize)
        {
            let item:ITetroEntityConf = this.getRandomTetromino();
            let itemColor:number;
            if (item.color)
                itemColor = Color(item.color).rgbNumber();
            else
                itemColor = this.getRandomColor();

            this.poolItems.push( new Polimino(this.lastId++, item.name, item.shape, itemColor) );
        }
            
    }

    // todo use external ColorProvider & TetrominoProvider
    private getRandomColor():number
    {
        return Math.random() * 0xffffff;
    }

    private getRandomTetromino():ITetroEntityConf
    {
        var keys = Object.keys(this.itemsRaw.list);
        return this.itemsRaw.list[keys[ keys.length * Math.random() << 0]];
    }
}