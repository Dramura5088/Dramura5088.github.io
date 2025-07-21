$(document).ready(function(){
    GenerateGrid();
});

var xSize = 4, ySize = 4, gridArray, electedTilesAmount = 0, maxSelectedTiles = 9;

const enEmpty = 0, enFull = 1;
emptyCol="white", fullCol="red";

class Tile {
    constructor( x, y, element, type){
        this.y = y;
        this.x = x;
        this.element = element;
        this.type = type
    }
}

function GenerateGrid(){

    // Deleting old rows.
    var rowCollection = document.getElementsByClassName('rowFF');
    
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
    //xSize = Math.abs(document.getElementById('x').value)
    //ySize = Math.abs(document.getElementById('y').value)
    //Set them static upstairs instead.

    selectedTilesAmount = 0
    gridArray = [];
    for (let y = 0; y < ySize; y++) {
        
        //create new row.
        var newRowElement = document.createElement('div');
        newRowElement.setAttribute('class', 'rowFF'); 
        newRowElement.style.height = (70/ySize) + "vmin";
        document.getElementById('gridHolderFF').appendChild(newRowElement);

        gridArray.push([]);



        for (let x = 0; x < xSize; x++) {
            //create new tile.
            var newElement = document.createElement('div');
            newElement.setAttribute('class', 'tileFF'); 
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
            
            gridArray[y].push(new Tile(x, y, newElement, enEmpty));
        }
    }
    console.log(gridArray);


}
function TileOnClick(selElement){
    var select = document.getElementById("placementSelection").value;

    var id = selElement.id.split(',');
    var tile = gridArray[id[0]][id[1]];

    if(selectedTilesAmount < 9 && selElement.style.backgroundColor != fullCol){
        selElement.style.backgroundColor = fullCol
        selectedTilesAmount +=1;
        tile.type= enFull;
    }
    else if (selElement.style.backgroundColor == fullCol)
    {
        selectedTilesAmount -=1;
        selElement.style.backgroundColor = emptyCol;
        tile.type= enEmpty;
    }

    CanGetThreeInARow();
}

function GetSelectedTiles(){
    var selectedArray = []

    for(let y = 0; y < ySize; y++){
        for(let x = 0; y < xSize; x++){
            if(gridArray[y][x].element.backgroundColor == enFull){
                selectedArray.push(gridArray[y][x]);
            }
        }
    }
}

function CanGetThreeInARow(){
    console.log("Three In A Row Check");
    //For every solution variant
    for(let i = 0; i < hardCodedThreeInARow.length; i++){
        var notSolution = 0; //Bool to track and break out of the check if it isnt the solution
        for(let y = 0; y < ySize; y++){
            //Break out of Y
            if(notSolution == 1){
                break;
            }
            for(let x = 0; x < xSize; x++){
                //If theres a full tile in a spot where its supposed to be empty break out because its wrong.
                if (hardCodedThreeInARow[i][y][x] == 0 && gridArray[y][x].type == enFull){
                    document.getElementById("resultsHolderFF").innerHTML = "Results: Cannot get 3 in a row.";
                    notSolution = 1;
                    console.log("i="+i+" y"+y+"x"+x+" t"+gridArray[y][x].type);
                    break; //Break out of X
                }
            }
        }
        if (notSolution == 0){ //If we didnt need to break out then we found a valid solution
            document.getElementById("resultsHolderFF").innerHTML = "Results: CAN get 3 in a row!";
            return;
        }
    }

    
}




var hardCodedThreeInARow=[
    [ // https://cdn.discordapp.com/attachments/899021899932266616/1396894059066560622/image.png?ex=687fbe78&is=687e6cf8&hm=c4a78ab98b7768a40b76ed73fdd8aa80c3ce50f844481a290c4cfdb25e80dfbe&
        [1,0,0,0],
        [1,1,0,0],
        [1,0,1,0],
        [1,1,1,1]
    ],
    [
        [1,1,1,1],
        [1,0,1,0],
        [1,1,0,0],
        [1,0,0,0]
    ],
    [
        [1,1,1,1],
        [0,1,0,1],
        [0,0,1,1],
        [0,0,0,1]
    ],
    [
        [0,0,0,1],
        [0,0,1,1],
        [0,1,0,1],
        [1,1,1,1]
    ],
    [               //NEW SET
        [1,1,1,1],
        [0,1,1,0],
        [0,0,1,0],
        [0,0,1,1]
    ],
    [
        [0,0,0,1],
        [0,0,1,1],
        [1,1,1,1],
        [1,0,0,1]
    ],
    [
        [1,1,0,0],
        [0,1,0,0],
        [0,1,1,0],
        [1,1,1,1]
    ],
    [
        [1,0,0,1],
        [1,1,1,1],
        [1,1,0,0],
        [1,0,0,0]
    ],
    [               //NEW SET
        [1,1,1,1],
        [0,1,1,0],
        [0,1,0,0],
        [1,1,0,0]
    ],
    [
        [1,0,0,1],
        [1,1,1,1],
        [0,0,1,1],
        [0,0,0,1]
    ],
    [
        [0,0,1,1],
        [0,0,1,0],
        [0,1,1,0],
        [1,1,1,1]
    ],
    [
        [1,0,0,0],
        [1,1,0,0],
        [1,1,1,1],
        [1,0,0,1]
    ],
    [               //NEW SET
        [1,1,1,1],
        [0,0,1,0],
        [0,1,1,0],
        [1,0,1,0]
    ],
    [
        [1,0,0,1],
        [0,1,0,1],
        [1,1,1,1],
        [0,0,0,1]
    ],
    [
        [0,1,0,1],
        [0,1,1,0],
        [0,1,0,0],
        [1,1,1,1]
    ],
    [
        [1,0,0,0],
        [1,1,1,1],
        [1,0,1,0],
        [1,0,0,1]
    ],
    [               //NEW SET
        [1,1,1,1],
        [0,1,0,0],
        [0,1,1,0],
        [0,1,0,1]
    ],
    [
        [0,0,0,1],
        [1,1,1,1],
        [0,1,0,1],
        [1,0,0,1]
    ],
    [
        [1,0,1,0],
        [0,1,1,0],
        [0,0,1,0],
        [1,1,1,1]
    ],
    [
        [1,0,0,1],
        [1,0,1,0],
        [1,1,1,1],
        [1,0,0,0]
    ],
    [               //NEW SET
        [0,1,0,1],
        [1,1,1,1],
        [0,1,0,0],
        [1,1,0,0]
    ],
    [     
        [1,0,1,0],
        [1,1,1,1],
        [0,0,1,0],
        [0,0,1,1]
    ],
    [     
        [0,0,1,1],
        [0,0,1,0],
        [1,1,1,1],
        [1,0,1,0]
    ],
    [     
        [1,1,0,0],
        [0,1,0,0],
        [1,1,1,1],
        [0,1,0,1]
    ],
]


