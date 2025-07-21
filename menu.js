var aiBlock, ff14Block

$(document).ready(function() {
    
    document.getElementById("AiNavigation").addEventListener("click", ShowAI);
    document.getElementById("WonderousTales").addEventListener("click", ShowFF14);

    aiBlock = document.getElementById("holder")
    ff14Block = document.getElementById("ff14Holder")

    ShowFF14();
});

function HideAll(){
    aiBlock.style.display = "none";
    ff14Block.style.display = "none";
}

function Show(block){
    block.style.display = "flex";
}

function ShowFF14(){
    HideAll();
    Show(ff14Block);
}

function ShowAI(){
    HideAll();
    Show(aiBlock);
}