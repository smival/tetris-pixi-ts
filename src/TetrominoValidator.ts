import {Point} from './Types';
import {ITetroEntityConf} from './Types';
import Utils from './Utils';

export default class TetrominoValidator
{
    static validateTetroConf(d:ITetroEntityConf, minBlocks:number = -1):any
    {
        // check squareMatrix
        // get size for new matrix
        let maxRow:number = 0;
        let maxCol:number = 0;
        let blocks:Point[] = [];

        for(var row:number = 0; d.shape[row] != undefined; row++) 
            for(var col:number = 0; d.shape[row][col] != undefined; col++)
                if (d.shape[row][col])
                {
                    blocks.push( new Point(col, row) );
                    if (row > maxRow) maxRow = row;
                    if (col > maxCol) maxCol = col;
                }
        
        let grid = Utils.getMatrixEmpty( Math.max(maxRow, maxCol) + 1 );

        // fill matrix
        while (blocks.length)
        {
            var p:Point = blocks.shift();
            grid[p.y][p.x] = 1;
        }

        d.shape = grid;

        // check blocks
        const size:number = d.shape.length;
        let blocksCount:number = 0;
        
        if (minBlocks != -1)
            for(var row:number = 0; row < size; row++) 
                for(var col:number = 0; col< size; col++)
                    if (d.shape[row][col])
                        blocksCount++;

        if (blocksCount < minBlocks)
            throw new Error(`A shape has no enough blocks, need ${minBlocks}, passed ${blocksCount}`);

        return d;
    }
}