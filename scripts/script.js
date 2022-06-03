//const { astar } = require(["scripts/astar.js"]);
//import * as astar from 'scripts/astar.js'

var xSize, ySize;
var gridArray;

const enEmpty = 0, enWall = 1, enOrigin = 2, enTarget = 3; 
const emptyCol="white", wallCol="grey", originCol="blue", targetCol="red";



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
            newElement.style.backgroundColor = 'white';
            newElement.style.width = (70/xSize) + "vmin";
            newElement.style.margin = "0px";
            newElement.onclick = function(){
                TileOnClick(this);
            }
            newRowElement.appendChild(newElement);
            
            gridArray[y].push(new Tile(x, y, newElement, enEmpty));
        }
    }
    //console.log(gridArray);


}

function TileOnClick (selElement) {
    var selColor = document.getElementById("placementSelection").value;
    //console.log(selColor);

    var id = selElement.id.split(',');
    var tile = gridArray[id[0]][id[1]];
    //console.log(tile);

    if (selColor == "empty") {
        selElement.style.backgroundColor = emptyCol;
        tile.type = enEmpty;
    } 
    else if (selColor == "wall") {
        selElement.style.backgroundColor = wallCol;
        tile.type = enWall;
    }
    else if (selColor == "target") {
        selElement.style.backgroundColor = targetCol;
        tile.type = enTarget;
    }
    else if (selColor == "origin") {
        selElement.style.backgroundColor = originCol;
        tile.type = enOrigin;
    }
}

function GeneratePath(){
    

    Astar(gridArray, false);
}

function Astar(jaggedArray, boolDiagonal = false){
    

    console.log(astar.search(convertToGraph(gridArray), boolDiagonal, [0,0],[4,0]));
}

function convertToGraph(jaggedArray){
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
    console.log(graph);
    return graph;
}

function findOriginAndTarget(jaggedArray){

}

class Tile {
    constructor( x, y, element, type){
        this.y = y;
        this.x = x;
        this.element = element;
        this.type = type
    }
}
