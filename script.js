var easystarjs = require('easystarjs');
const Graph = require('node-dijkstra');

//Making sure the document is ready first :)
$( document ).ready(function() {
    //adding listener
    document.getElementById("Generate").addEventListener("click", GenerateGrid);
    document.getElementById("Pathfinding").addEventListener("click", GeneratePath);
    document.getElementById("Clearing").addEventListener("click", ClearPath);
});

// variables to track
var xSize, ySize, gridArray, origin, target, path;

// some stuff to use as references :B
const enEmpty = 0, enWall = 1, enOrigin = 2, enTarget = 3, enPath = 4,
emptyCol="white", wallCol="grey", originCol="blue", targetCol="red", hlCol = "green";

// measurments
var timeTaken, costTaken, lenghtTaken;

function GenerateGrid(){

    // Deleting old rows.
    var rowCollection = document.getElementsByClassName('row');
    
    console.log(rowCollection);
    console.log(rowCollection.length);

    if(rowCollection && rowCollection.length) {
        var toBeRemoved = [];
        for (let index = 0; index < rowCollection.length; index++) {
            toBeRemoved.push(rowCollection[index]);
        }

        console.log(toBeRemoved);
        
        for (let index = 0; index < toBeRemoved.length; index++) {
            console.log("removed element: " + toBeRemoved[index]);
            toBeRemoved[index].remove();
        }
    
    }
    
    // Instantiating new rows.
    xSize = Math.abs(document.getElementById('x').value)
    ySize = Math.abs(document.getElementById('y').value)

    gridArray = [];
    for (let y = 0; y < ySize; y++) {
        
        //create new row.
        var newRowElement = document.createElement('div');
        newRowElement.setAttribute('class', 'row'); 
        newRowElement.style.height = (70/ySize) + "vmin";
        document.getElementById('gridHolder').appendChild(newRowElement);

        gridArray.push([]);



        for (let x = 0; x < xSize; x++) {
            //create new tile.
            var newElement = document.createElement('div');
            newElement.setAttribute('class', 'tile'); 
            newElement.id = (y + ',' + x);
            newElement.style.height = (70/ySize) + "vmin";
            newElement.style.height -= 2+"px";
            newElement.style.backgroundColor = emptyCol;
            newElement.style.width = (70/xSize) + "vmin";
            newElement.style.width -= 2+"px";
            newElement.style.margin = "0px";
            newElement.onclick = function(){
                TileOnClick(this);
            }
            newRowElement.appendChild(newElement);
            
            if (y == 0 && x == 0) {
                newElement.style.backgroundColor = originCol;
                origin = new Tile(x, y, newElement, enOrigin)
                gridArray[y].push(origin);
                
            }
            else if (y == ySize - 1 && x == xSize - 1){
                newElement.style.backgroundColor = targetCol;
                target = new Tile(x, y, newElement, enTarget)
                gridArray[y].push(target);
            }
            else {
                gridArray[y].push(new Tile(x, y, newElement, enEmpty));
            }
        }
    }
    console.log(gridArray);


}
function TileOnClick (selElement) {
    var select = document.getElementById("placementSelection").value;
    //console.log(selColor);

    var id = selElement.id.split(',');
    var tile = gridArray[id[0]][id[1]];
    //console.log(tile);

    if (select == "empty") {
        selElement.style.backgroundColor = emptyCol;
        tile.type = enEmpty;
    } 
    else if (select == "wall") {
        selElement.style.backgroundColor = wallCol;
        tile.type = enWall;
    }
    else if (select == "target") {
        ClearType(enTarget);
        selElement.style.backgroundColor = targetCol;
        tile.type = enTarget;
        target = tile;
    }
    else if (select == "origin") {
        ClearType(enOrigin);
        selElement.style.backgroundColor = originCol;
        tile.type = enOrigin;
        origin = tile;
    }
}
function GeneratePath(){
    ClearType(enPath);

    
    
    if (document.getElementById("diagonalSel").value == 'true') {
        var diagonalSel = true;
    }
    else {
        var diagonalSel = false;
    }
    var select = document.getElementById("algorithmSelection").value;
    path = [];
    var pOrigin      = [origin.y,origin.x];//[0,0];
    var pTarget      = [target.y,target.x];//[2,2];


    //console.log(pOrigin);
    //console.log(pTarget);


    if (select == 'astar') { // a*
        var startTime   = performance.now();
        var endTime     = 0;
        var graph       =  ConvertToAStarGraph(gridArray);
        var easystar    = new easystarjs.js();

        easystar.setGrid(graph);
        easystar.setAcceptableTiles([1]);
        if (diagonalSel) {
            easystar.enableDiagonals();
        }
        easystar.enableSync();
    
        
        easystar.findPath(pOrigin[1], pOrigin[0], pTarget[1], pTarget[0], function( aStarPath ) {
            if (aStarPath != null) {
                path = aStarPath;
                //console.log("A* Path was not found.");
            } 
            endTime = performance.now();
            timeTaken = endTime - startTime;
            //console.log(startTime);
            //console.log(endTime);
            console.log(timeTaken);
        });
        easystar.calculate();
    }
    else { // dijkstra
        var originKey = (((pOrigin[0]) * gridArray[pOrigin[0]].length) + pOrigin[1]);
        var targetKey = (((pTarget[0]) * gridArray[pTarget[0]].length) + pTarget[1]);

        var startTime   = performance.now();
        var graph = ConvertToDijkstraGraph(gridArray, diagonalSel);
        var diPath = graph.path(originKey, targetKey);

        //console.log("oKey: " + originKey + " | tKey: " + targetKey);
        //console.log("Dijkstra path: ");
        //console.log(diPath);
        

        //make it into a readable format
        for (let i = 0; i < diPath.length; i++) {
            var x = diPath[i], y = 0;
            
                while (x >= xSize) {
                    x = x - xSize
                    y++;
                }
            path.push({'x': x, 'y': y});
        }
        endTime = performance.now();
        timeTaken = endTime - startTime;
        console.log(timeTaken );
    }

    GetCombinedTileCost();
    printMeasuredData();

    console.log(path);
    console.log(costTaken);
    PathHighlinghting();
}
function PathHighlinghting(){
    
    if (path == null) {
        return;
    }

    for (let i = 1; i < path.length -1; i++) {
        var cords = Object.values(path[i]);
        var x = cords[0];
        var y = cords[1];

        gridArray[y][x].element.style.backgroundColor = hlCol;
        gridArray[y][x].type = enPath;
        //console.log(cords);
    }
    //console.log("pathhighlight")
    //console.log(path[0]);

}
function ClearPath(){
    ClearType(enPath);
}
function ClearType( enType) {
    for (let y = 0; y < gridArray.length; y++) {
        for (let x = 0; x < gridArray[y].length; x++) {
            if (gridArray[y][x].type == enType) {
                gridArray[y][x].element.style.backgroundColor = emptyCol;
                gridArray[y][x].type = enEmpty;
            }
        }
    }
}
function ConvertToAStarGraph(jaggedArray){
    var graph = [];

    for (let row = 0; row < jaggedArray.length; row++) {
        var newRow = [];

        for (let tile = 0; tile < jaggedArray[row].length; tile++) {
            if (jaggedArray[row][tile].type == enEmpty) {
                
            }
            if (jaggedArray[row][tile].type == enWall) {
                //  if wall
                newRow.push(0);
            }
            else {
                // if empty / target / origin
                newRow.push(1);
            }
            
        }
        graph.push(newRow);
    }
    //console.log(graph);
    return graph;
}
function ConvertToDijkstraGraph(jaggedArray , canDiagonal, diagonalCost = 1.4, normalCost = 1.0){
    const graph = new Graph();

    nMax = (jaggedArray.length) * (jaggedArray[0].length) - 1;
    n = 0;
    for (let y = 0; y < jaggedArray.length; y++) {
       
        for (let x = 0; x < jaggedArray[y].length; x++) {
            var connections = new Map();
            
            var rowLenght = jaggedArray[y].length
            , iTopLeft    = n - rowLenght - 1
            , iTopMid     = n - rowLenght + 0
            , iTopRight   = n - rowLenght + 1
            , iRight      = n + 1
            , iLeft       = n - 1
            , iBotLeft    = n + rowLenght - 1
            , iBotMid     = n + rowLenght + 0
            , iBotRight   = n + rowLenght + 1; 


            if (iTopLeft >= 0 && x != 0 && jaggedArray[y][x].type != enWall && canDiagonal) { // top left
                
                connections.set(iTopLeft, diagonalCost);
            }
            if (iTopMid >= 0 && jaggedArray[y][x].type != enWall) { // top middle
                connections.set(iTopMid, normalCost);
            }
            if (iTopRight >= 0 && x != rowLenght - 1 && jaggedArray[y][x].type != enWall && canDiagonal) { // top right
                connections.set(iTopRight, diagonalCost);
            }
            if (x != 0 && jaggedArray[y][x].type != enWall) { // left
                connections.set(iLeft, normalCost);
            }
            if (x != rowLenght - 1 && jaggedArray[y][x].type != enWall) { // right
                connections.set(iRight, normalCost);
            }
            if (iBotLeft <= nMax && x != 0 && jaggedArray[y][x].type != enWall && canDiagonal) { // bot left
                connections.set(iBotLeft, diagonalCost);
            }
            if (iBotMid <= nMax &&  jaggedArray[y][x].type != enWall) { // bot middle
                connections.set(iBotMid, normalCost);
            }
            if (iBotRight <= nMax && x != rowLenght - 1 && jaggedArray[y][x].type != enWall && canDiagonal) { // bot right
                connections.set(iBotRight, diagonalCost);
            }
            
            graph.addNode(n, connections)
            n++;
        }
    }

    //console.log("nMax: " + nMax);
    //console.log(graph);
    return graph;
}
function GetCombinedTileCost(){
    if (path == null){
        return;
    }
    
    var cost = 0;
    var diagonals = 0;
    var normals = 0;

    for (let i = 1; i < path.length; i++ ) {
        var lastCords = Object.values(path[i-1]);
        var curCords = Object.values(path[i]);
        
        if (path[i-1].x - 1 == path[i].x || path[i-1].x + 1 == path[i].x) { // left or right
            if (path[i-1].y == path[i].y) { // if they have the same y then it cant have moved up or down
                cost += 10;
                normals +=1;
            }
            else { // if y arent equal then it moved diagonal.
                cost += 14;
                diagonals +=1;
            }
        }
        else { // moved up or down.
            cost += 10;
            normals +=1;
        }
    }
    costTaken = cost;
    lenghtTaken = "Normal steps taken: " + normals + " steps<br>Diagonal steps taken: " + diagonals;
}
function printMeasuredData(){

    document.getElementById("result1").innerHTML = "Time Taken: " + (Math.round((timeTaken + Number.EPSILON) * 1000) / 1000) + "ms";
    document.getElementById("result2").innerHTML = "Cost Taken: " + costTaken; 
    document.getElementById("result3").innerHTML = lenghtTaken;
}

/*function findOfType(target = enTarget){
    var returnArray = [];
    for (let y = 0; y < gridArray.length; y++) {
        for (let x = 0; x < gridArray[y].length; x++) {
            if (gridArray[y][x].type == target && !multiple) {
                
            }
        }
    }
}*/

class Tile {
    constructor( x, y, element, type){
        this.y = y;
        this.x = x;
        this.element = element;
        this.type = type
    }
}