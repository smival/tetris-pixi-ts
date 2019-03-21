import Figure from './Tetromino';

export default class TetrominoFactory
{
    private lastId:number = 0;
    private poolSize:number;
    private poolItems:Array<Figure>;
    private itemsRaw:any[];

    current:Figure;
    others:Figure[];
    
    constructor(itemsRaw:any[])  
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
            this.poolItems.push( new Figure(this.lastId++, this.getRandomShape(), this.getRandomColor()) );
    }

    private getRandomColor():number
    {
        return Math.random() * 0xffffff;
    }

    private getRandomShape():number[][]
    {
        var keys = Object.keys(this.itemsRaw);
        return this.itemsRaw[keys[ keys.length * Math.random() << 0]];
    }
}