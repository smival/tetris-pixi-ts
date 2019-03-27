
export type Int = number & { __int__: void };

export const roundToInt = (num: number): Int => Math.round(num) as Int;

export const toInt = (value: string): Int => {
  return Number.parseInt(value) as Int;
};

export const checkIsInt = (num: number): num is Int =>  num % 1 === 0;

export const assertAsInt = (num: number): Int => {
  try {
    if (checkIsInt(num)) {
      return num;
    }
  } catch (err) {
    throw new Error(`Invalid Int value (error): ${num}`);
  }

  throw new Error(`Invalid Int value: ${num}`);
};

export interface ITetrisConf {
  contWidth: number;
  contHeight: number;
  contFieldSize: number;
  poolSize: number;
  figureDropDt: number;
  figureVMult: number;
  figureHMult: number;
  scores?: (number)[] | null;
  scoreSoft: number;
  scoreHard: number;
  tetrominos: ITetroConf;
}
export interface ITetroConf {
  minBlocksNeed: number;
  list?: (ITetroEntityConf)[] | null;
}
export interface ITetroEntityConf {
  name?: string | null;
  shape?: ((number)[] | null)[] | null;
  color?: string | null;
}

export class Point
{
    x:number;
    y:number;
}

export enum EGameState
{
    Begin,
    Spawn,
    CheckCollision,
    MoveDown,
    CheckRows,
    RemoveRows,
    End
}

export enum EDirection
{
    MoveLeft,
    MoveRight,
    MoveNone
}