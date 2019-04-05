import Tetromino from "./Tetromino";
import {Point, roundToInt} from './Types';
import * as PIXI from 'pixi.js';
import * as snd from 'pixi-sound';

let app = new PIXI.Application(1800, 8000, {backgroundColor : 0xDDDDDD});
let mainLayer = new PIXI.Graphics();
let dx:number = 0;
let dy:number = 0;
document.body.appendChild(app.view);
app.stage.addChild(mainLayer);

class PoliminoBase
{
    basePts:Point[];
    turns?:string;
}

// todo minimize
function getPtIndex(list:Point[], pt:Point):number
{
    for (let i:number = 0; i < list.length; i++)
        if (list[i].x == pt.x && list[i].y == pt.y)
            return i;

    return -1;
}

// todo minimize
function getPerimeterPoints(basePts:Point[]):Point[]
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
            if (getPtIndex(pts, neighbor) == -1)
                pts.push(neighbor);
        }
    }
    
    // del equals
    for (let i:number=0; i < basePts.length; i++)
    {
        let index:number = getPtIndex(pts, basePts[i]);
        if (index != -1)
            pts.splice(index, 1);
    }

    return pts;     
}

// todo minimize
function getAllPoints(basePts:Point[]):Point[]
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
            if (getPtIndex(pts, neighbor) == -1)
                pts.push(neighbor);
        }
    }
    
    // del equals
    for (let i:number=0; i < basePts.length; i++)
    {
        let index:number = getPtIndex(pts, basePts[i]);
        if (index != -1)
            pts.splice(index, 1);
    }

    //console.log(`total neighbor pts: ${pts.length}`);
    
    return pts;     
}

function getTurnsString(pts:Point[]):string
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
        const dirs = ['→','↑','←', '↓'];
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

function turnsEqual(s0:string, s1:string):boolean
{
    if (s0.length != s1.length)
        return false;

    if (s0 === s1)
        return true;

    let s:string =  s0 + s0;   
    return (s.indexOf(s1) != -1);
}

function shapeExists(turns:string):boolean
{
    for (let base of newList)
        if (base.turns && turnsEqual(base.turns, turns))
            return true;

    return false;
}

function shapeHasReflection(turns:string):PoliminoBase
{
    for (let base of newList)
        if (base.turns && turnsEqual(base.turns, turns.split('').reverse().join('') ) )
            return base;

    return null;
}

function absPoints(pts:Point[])
{
    let r = pts.map(obj => { return obj.clone() } );

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;

    for (let p of r)
    {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
    }

    for (let p of r)
    {
        p.x -= minX;
        p.y -= minY;
    }

    return r;
}

let maxSize:number = 3;     // TODO matrix size restriction
let n:number = 10;   
let totalTestsCount:number = 0;
let fTime:number = new Date().getTime();

let whiteList:PoliminoBase[];
let newList:PoliminoBase[];
let prevList:PoliminoBase[];
let perimeterPts:Point[];
let blocksCount:number;

whiteList = [ {basePts: [new Point(0, 0)] } ]; // single monomino
newList = whiteList.concat();
prevList = [];

draw(whiteList[0].basePts);
dx = 20;
dy = 0;

n--;
while (n--)
{
    prevList = newList.concat();
    newList = [];

    //console.log(`start ${whiteList[whiteList.length-1].basePts.length+1} blocks making ...`);
    

    for (let t of prevList)
    {
        let newBasePts:Point[];
        let newTurns:string;
        let isExists:boolean;
        let hasReflection:PoliminoBase;
        perimeterPts = getPerimeterPoints(t.basePts);

        // candidate points for new Item
        for (let newPt of perimeterPts)
        {
            newBasePts = t.basePts.concat(newPt);
            newTurns = getTurnsString(getAllPoints(newBasePts));
            isExists = shapeExists(newTurns);
            hasReflection = shapeHasReflection(newTurns);
            if (!isExists)
            {
                newList.push( {basePts: absPoints(newBasePts), turns: newTurns} );
                draw(absPoints(newBasePts));

                if (hasReflection)
                {
                    // todo
                    //console.warn(`replica`);
                }
            }
            

            //console.log(`${!isExists ? 'NEW!' : '\t'} figure ${absPoints(newBasePts)} turns: ${newTurns} l:${newTurns.length}`);
        }
    }

    let testsCount:number = prevList.length * perimeterPts.length;
    blocksCount = newList[0].basePts.length;
    totalTestsCount += testsCount;
    dx += blocksCount*10;
    dy = 0;

    console.log(`result for ${blocksCount} blocks, new shapes added: ${newList.length} after ${testsCount} tests\n\n`);
    whiteList = whiteList.concat(newList);
}

console.log(`total tests: ${totalTestsCount}`);
console.log(`total minos: ${whiteList.length}`);
console.log(`total times: ${ new Date().getTime() - fTime}ms`);


function draw(pts:Point[])
{
    const s = 10;
    let maxY:number = 0;
    let y:number;

    for (let p of pts)
    {
        mainLayer.beginFill(0x8d0000);
        mainLayer.drawRect(dx+p.x*s, dy + p.y*s, s, s);
        mainLayer.endFill();

        y = p.y*s+2*s;
        if (y>maxY) maxY = y;
        
    }

    dy += maxY;
    
    if (dy >= app.view.height)
    {
        dx += blocksCount*10;
        dy = 0;
    }
        
}