import {Point, roundToInt} from './Types';
import Utils from './Utils';

export class PoliminoMeta
{
    size():number { return this.basePts == null ? 0 : this.basePts.length; };
    constructor (public basePts:Point[], public color:number, public turns?:string) {}
}


export default class PoliminoGen
{    
    static totalTestsCount:number = 0;
    static fTime:number;
    
    static n:number;
    static whiteList:PoliminoMeta[];
    static newList:PoliminoMeta[];
    static prevList:PoliminoMeta[];
    static perimeterPts:Point[];
    static blocksCount:number;

    static makePoliminosByBlocksCount(blocksCount:number, matrixSize?:number):PoliminoMeta[]
    {
        this.fTime = new Date().getTime();
        this.whiteList = [ new PoliminoMeta([new Point(0, 0)], this.getNextColor()) ]; // single monomino
        this.newList = this.whiteList.concat();
        this.prevList = [];
        this.n = roundToInt(blocksCount)-1;

        while (this.n--)
        {
            this.prevList = this.newList.concat();
            this.newList = [];

            console.log(`start ${this.whiteList[this.whiteList.length-1].basePts.length+1} blocks making ...`);
            
            // try to add new single block to each side of each Polimino from (n-1) generation
            for (let t of this.prevList)
            {
                let newBasePts:Point[];
                let newTurns:string;
                let newMino:PoliminoMeta;
                let isExists:boolean;
                let reflection:PoliminoMeta;
                this.perimeterPts = this.getPerimeterPoints(t.basePts);

                // candidate points for new Item
                for (let newPt of this.perimeterPts)
                {
                    newBasePts = t.basePts.concat(newPt);
                    newTurns = this.getTurnsString(this.getAllPoints(newBasePts));
                    isExists = this.shapeExists(newTurns);
                    
                    if (!isExists)
                    {
                        reflection = this.getReflectionFromExists(newTurns);
                        newMino = new PoliminoMeta(Utils.pointsToAbs(newBasePts), reflection ? reflection.color : this.getNextColor(), newTurns);
                        this.newList.push(newMino);
                    }
                    
                    console.log(`${!isExists ? 'NEW!' : '\t'} figure ${newBasePts} turns: ${newTurns} l:${newTurns.length}`);
                }
            }

            let testsCount:number = this.prevList.length * this.perimeterPts.length;
            this.blocksCount = this.newList[0].basePts.length;
            this.totalTestsCount += testsCount;

            console.log(`result for ${this.blocksCount} blocks, new shapes added: ${this.newList.length} after ${testsCount} tests\n\n`);
            this.whiteList = this.whiteList.concat(this.newList);
        }

        console.log(`total tests: ${this.totalTestsCount}`);
        console.log(`total minos: ${this.whiteList.length}`);
        console.log(`total times: ${ new Date().getTime() - this.fTime}ms`);

        return this.newList;
    }

    // todo minimize
    static getPtIndex(list:Point[], pt:Point):number
    {
        for (let i:number = 0; i < list.length; i++)
            if (list[i].x == pt.x && list[i].y == pt.y)
                return i;

        return -1;
    }

    // todo minimize
    static getPerimeterPoints(basePts:Point[]):Point[]
    {
        let pts:Point[] = [];
        let neighborList:Point[];
        let neighbor:Point;
        for (let p of basePts)
        {
            neighborList = p.getSideNeiпbors();
            while(neighborList.length)
            {
                neighbor = neighborList.shift();
                if (this.getPtIndex(pts, neighbor) == -1)
                    pts.push(neighbor);
            }
        }
        
        // del equals
        for (let i:number=0; i < basePts.length; i++)
        {
            let index:number = this.getPtIndex(pts, basePts[i]);
            if (index != -1)
                pts.splice(index, 1);
        }

        return pts;     
    }

    // todo minimize
    static getAllPoints(basePts:Point[]):Point[]
    {
        let pts:Point[] = [];
        let neighborList:Point[];
        let neighbor:Point;
        for (let p of basePts)
        {
            neighborList = p.getSideNeiпbors().concat(p.getCornerNeiпbors());
            while(neighborList.length)
            {
                neighbor = neighborList.shift();
                if (this.getPtIndex(pts, neighbor) == -1)
                    pts.push(neighbor);
            }
        }
        
        // del equals
        for (let i:number=0; i < basePts.length; i++)
        {
            let index:number = this.getPtIndex(pts, basePts[i]);
            if (index != -1)
                pts.splice(index, 1);
        }

        //console.log(`total neighbor pts: ${pts.length}`);
        
        return pts;     
    }

    static getTurnsString(pts:Point[]):string
    {
        let dir:string;     // iteration direction
        let d:string;       // abs direction
        let res:Point[] = [];
        let p:Point;
        let fp:Point;       // first & finish point
        let p1:Point;
        let s:string = '';

        const f = (x,y):Point =>
        {
            for (let p of pts)
            if (p.x == x && p.y == y)
                return p;

            return null;
        }

        const getNextPtRightHand = (fList:Function[]) => 
        {
            const dirs = ['R','T','L', 'B'];
            let p:Point = null;
            while(p == null)
                p = fList.shift().call(this);            

            d = dirs[dirs.length - fList.length - 1];
            return p;
        }

        const getSearchingRules = (dir:string) => 
        {
            switch (dir)
            {
                case 'r':
                    return [f.bind(this, p.x, p.y+1),
                            f.bind(this, p.x+1, p.y),
                            f.bind(this, p.x, p.y-1),
                            f.bind(this, p.x-1, p.y)]
                break;

                case 'l':
                    return [f.bind(this, p.x, p.y-1),
                            f.bind(this, p.x-1, p.y),
                            f.bind(this, p.x, p.y+1),
                            f.bind(this, p.x+1, p.y)]
                break;

                case 't':
                    return [f.bind(this, p.x+1, p.y),
                            f.bind(this, p.x, p.y-1),
                            f.bind(this, p.x-1, p.y),
                            f.bind(this, p.x, p.y+1)]
                break;

                case 'b':
                    return [f.bind(this, p.x-1, p.y),
                            f.bind(this, p.x, p.y+1),
                            f.bind(this, p.x+1, p.y),
                            f.bind(this, p.x, p.y-1)]
                break;
            }
        }

        const takeDir = (p0:Point, p1:Point):string =>
        {
            if (p0.x == p1.x)
            {
                if (p0.y > p1.y)        return 't';
                else if (p0.y < p1.y)   return 'b';
            } else if (p0.y == p1.y)
            {
                if (p0.x > p1.x)        return  'l';
                else if (p0.x < p1.x)   return  'r';
            }
        }

        // Take top left pts
        pts.sort((a,b)=>a.y - b.y);
        let firstRowY:number = pts[0].y;
        while(pts[0].y == firstRowY)
            res.push(pts.shift());

        res.sort((a,b)=>a.x - b.x);
        // First segment
        while (res.length)
            pts.unshift(res.pop());

        res.push(pts[0]);
        res.push(pts[1]);
        p = fp = res[1];
        dir = 'r';

        // loop right hand
        while (1)
        {
            p1 = getNextPtRightHand(getSearchingRules(dir));
            //console.log(`NEXT ${p1}`);

            s += d;

            if (p1 == fp)
                break;
            
            dir = takeDir(p, p1);
            p = p1;
            res.push(p1);
        }

        return s;
    }

    static turnsEqual(s0:string, s1:string):boolean
    {
        if (s0.length != s1.length)
            return false;

        if (s0 === s1)
            return true;

        let s:string =  s0 + s0;   
        return (s.indexOf(s1) != -1);
    }

    static shapeExists(turns:string):boolean
    {
        for (let base of this.newList)
            if (base.turns && this.turnsEqual(base.turns, turns))
                return true;

        return false;
    }

    static getReflectionFromExists(turns:string):PoliminoMeta
    {
        for (let base of this.newList)
            if (base.turns && this.turnsEqual(base.turns, turns.split('').reverse().join('') ) )
                return base;

        return null;
    }

    static getNextColor():number
    {
        /*
        let r = this.colors[this.dc];

        this.dc++;
        if (this.dc > this.colors.length-1)
            this.dc=0;
        */
        return Math.random() * 0xFFFFFF;
    }

}