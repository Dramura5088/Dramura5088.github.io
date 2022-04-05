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
        newRowElement.style.height = (40/ySize) + "vmax";
        document.getElementById('gridHolder').appendChild(newRowElement);

        gridArray.push([]);



        for (let x = 0; x < xSize; x++) {
            //create new tile.
            var newElement = document.createElement('div');
            newElement.setAttribute('class', 'tile'); 
            newElement.id = ('y' + y + 'x' + x);
            newElement.style.height = (40/ySize) + "vmax";
            newElement.style.backgroundColor = 'white';
            newElement.style.width = (40/xSize) + "vmax";
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

function TileOnClick (selElement) {
    var curColor = selElement.style.backgroundColor;



    //sel order empty -> wall -> target -> origin -> empty 

    if (curColor == originCol) {
        selElement.style.backgroundColor = emptyCol;
    } 
    else if (curColor == emptyCol) {
        selElement.style.backgroundColor = wallCol;
    }
    else if (curColor == wallCol) {
        selElement.style.backgroundColor = targetCol;
    }
    else if (curColor == targetCol) {
        selElement.style.backgroundColor = originCol;
    }
}

class Tile {
    constructor( x, y, element, type){
        this.x = x;
        this.y = y;
        this.element = element;
        this.type = type
    }
}