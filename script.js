function GenerateGrid(){
    //alert("it works"); It works.

}

class Tile {
    constructor( x, y){
        this.x = x;
        this.y = y;
    }
}

$( "#GenerateGridForm" ).click(function() { alert("no");
    console.log( $( "#form" ).serializeArray() );
    event.preventDefault();
    
  });