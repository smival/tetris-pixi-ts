import t = require('./TetrisGame');
import Generator, { PoliminoMeta } from './PoliminoGen';
import Utils from './Utils';

let customConf:any = {};
const processHtml:string = `... loading ...`;
const formHtml:string = 
`<form id="minoForm">
    <p>
    Polimino blocks
    <select id="selectBlocks" required>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4" selected>4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
    </select>
    matrix size
    <select id="selectMatrix" required>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4" selected>4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
    </select>
    </p>

    <p>
    Canvas width
    <select id="selectWidth">
        <option value="10" selected>10</option>
        <option value="15">15</option>
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="30">30</option>
    </select>
    height
    <select id="selectHeight">
        <option value="15" selected>15</option>
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="30">30</option>
        <option value="40">40</option>
    </select>
    </p>

    <input id="btGo" type="submit" value="Play Me!" />

</form>`;

function getDropDownIntValue(id:string):number
{
    var el = document.getElementById(id) as HTMLSelectElement;
    return Number.parseInt(el.value);
}

function state0()
{
    document.body.innerHTML = formHtml;
    document.getElementById('minoForm').onsubmit = state1;
}

function state1(e)
{
    e.preventDefault();

    customConf.contWidth = getDropDownIntValue('selectWidth');
    customConf.contHeight = getDropDownIntValue('selectHeight');
    let blocksCount = getDropDownIntValue('selectBlocks');
    let matrixSize:number = getDropDownIntValue('selectMatrix');

    document.body.onload = alert.bind(this, 'yo');
    document.body.innerHTML = processHtml;

    let items:PoliminoMeta[] = Generator.makePoliminosByBlocksCount(
        blocksCount, 
        matrixSize
    );

    customConf.tetrominos = {};
    customConf.tetrominos.list = [];
    for (let o of items)
        customConf.tetrominos.list.push({name:'', shape:Utils.matrixFromPoints(o.basePts, o.size()), color:o.color})

    state2();
}

function state2()
{
    const app = new t();

    document.body.innerHTML = '';
    app.startGame(customConf);

    // start with default conf
    //app.startGame();
}

state0();