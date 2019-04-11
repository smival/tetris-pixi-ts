import {Point, roundToInt} from './Types';

export default class Utils
{
    static getMatrixSizeByPoints(points:Point[]):number
    {
        let maxRow:number = 0;
        let maxCol:number = 0;

        for (let p of points)
        {
            if (p.y > maxRow) maxRow = p.y;
            if (p.x > maxCol) maxCol = p.x;
        }

        return Math.max(maxRow, maxCol) + 1 ;
    }

    static getMatrixSize(matrix:number[][]):number
    {
        let maxRow:number = 0;
        let maxCol:number = 0;

        for(var row:number = 0; matrix[row] != undefined; row++) 
            for(var col:number = 0; matrix[row][col] != undefined; col++)
                if (matrix[row][col])
                {
                    if (row > maxRow) maxRow = row;
                    if (col > maxCol) maxCol = col;
                }
        
        return Math.max(maxRow, maxCol) + 1 ;
    }

    static getMatrixEmpty(size:number):number[][]
    {
        size = roundToInt(size);
        return new Array(size).fill(0).map(() => new Array(size).fill(0));
    }

    static getMatrixFromPoints(points:Point[], size:number):number[][]
    {
        let m:number[][] = this.getMatrixEmpty(size);
        for (let p of points)
            m[p.y][p.x] = 1;

        return m;
    }

    static getPointsFromMatrix(matrix:number[][], deltaPos?:Point):Point[]
    {
        var r:Point[] = [];
        const size:number = matrix.length;
        if (!deltaPos) deltaPos = new Point(0, 0);

        for(var row:number = 0; row < size; row++) 
            for(var col:number = 0; col< size; col++)
                if (matrix[row][col])
                    r.push(new Point(deltaPos.x + col, deltaPos.y + row));

        return r;
    }

    static changePointsToAbs(pts:Point[])
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
}