
/*
 * - CONNECT FOUR GAME -
 * 
 * JAVASCRIPT + PIXI.JS
 * MiniMax algorithm
 *
 * Enzo TESTA
 * May 2017
 *
 */


// ------------------------------------------
// GLOBAL variables
var NB_LIG   = 6,
    NB_ROW   = 7,

    NOBODY   = 0,
    PLAYER   = 1,
    COMPUTER = 2,

    DEPTH = 5,

    PLAYERSCORE   = 0,
    COMPUTERSCORE = 0;
// Maybe you should start reading the model first (part II.)
// ------------------------------------------




// ------------------------------------------
// ------------------------------------------
/* I. VIEW PART - PIXI.JS */ 
// ------------------------------------------
// ------------------------------------------

//Aliases for PIXI
var Container          = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader             = PIXI.loader,
    TextureCache       = PIXI.utils.TextureCache,
    Texture            = PIXI.Texture,
    Sprite             = PIXI.Sprite;

// PIXI elements
var stage         = new Container(),
	gridContainer = new Container(),
	canvas 		  = document.getElementById('gamefield'),
    renderer      = autoDetectRenderer(100,100,{view: canvas}),
    atlasName     = "img/tokens.json",	 // atlas used
    tokenSize     = {width: 0, height: 0}, // default size before load
    tokenScale 	  = 0.8;

// Renderer properties
renderer.autoResize      = true;
renderer.backgroundColor = 0xffffff;
renderer.view.style.border = "1px solid black";

// MODEL GRID 
var FIELD = createGrid();
// VIEW GRID
var FIELDVIEW = new Array(NB_ROW).fill().map(()=>[]);

// Dropline at the top
var dropline = new Array();
// Load the game
loader.add(atlasName).load(setup);

// LoopGame variable to update display
var toUpdate = false;
// To stop clever players from cheating by double clicking (play twice)
var canPlay = true;

// Setup graphic part
function setup () {
  
  // Alias for atlas import
  var id = loader.resources[atlasName].textures;

  // Create textures
  var emptyTexture    = id["empty.png"],
  	  yellowTexture   = id["yellow.png"],
  	  redTexture      = id["red.png"],
  	  dropTexture     = id["drop.png"],
  	  disabledTexture = id["disabled.png"];

  // Get token size (to change tokens skins easilly)
  tokenSize.height = emptyTexture.height;
  tokenSize.width  = emptyTexture.width;



/* CREATE THE MAIN GRID VIEW */
for (var i = 0; i < NB_LIG; i++) {
    for (var j = 0; j < NB_ROW; j++) {

    	// Create overlapping sprites for each tiles.
        var emptySprite  = new Sprite(emptyTexture),
        	redSprite    = new Sprite(redTexture),
        	yellowSprite = new Sprite(yellowTexture);

        // Set tiles scale
        emptySprite.scale.set(tokenScale,tokenScale);
        redSprite.scale.set(tokenScale,tokenScale);
        yellowSprite.scale.set(tokenScale,tokenScale);

        // Set tiles positions
        emptySprite.position.set(j * tokenSize.width * tokenScale, (NB_LIG - i) * tokenSize.height * tokenScale);
        redSprite.position.set(j * tokenSize.width * tokenScale, (NB_LIG - i) * tokenSize.height * tokenScale);
        yellowSprite.position.set(j * tokenSize.width * tokenScale, (NB_LIG - i) * tokenSize.height * tokenScale);

        // Configure emptySprite for interactions with player
        emptySprite.interactive = true;
        emptySprite.row = j;

        // OnClick function
        emptySprite.click = function() {

        	// If it is player turn && player can play in the clicked row
        	if(canPlay && canDropToken(FIELD, this.row)){
        		
        		// Then it is player turn ! 
        		FIELD = dropToken(FIELD, this.row, PLAYER);
        		canPlay = false;
        		WINNER = hasWinner(FIELD); // If no winner, WINNER = NOBODY

        		if(WINNER === NOBODY){
        			// Then it is computer turn ! 
        			FIELD = dropToken(FIELD, computerMove(), COMPUTER);
        			canPlay = true;
        			WINNER = hasWinner(FIELD);
        		}
        		
        		if(!canDropToken(FIELD, this.row, PLAYER)){
        			// If the last token has been placed in the row, 
        			// then change dropline from "drop" to "disabled".
        			dropline[this.row].disabled.alpha = 1;
        			dropline[this.row].drop.alpha = 0;
        		}
        	}

        }

        // MouseOver function to set the Dropline properly
        emptySprite.mouseover = function() {
            if(canDropToken(FIELD, this.row)){
            	dropline[this.row].drop.alpha = 1;
            }else{
            	dropline[this.row].disabled.alpha = 1;	
            }
        }

        // MouseOut function to set the Dropline properly
        emptySprite.mouseout = function() {
            dropline[this.row].drop.alpha = 0;
            dropline[this.row].disabled.alpha = 0;
        }

        // Hide every yellow and red Sprites at the beggining of the game
        redSprite.alpha = 0;
        yellowSprite.alpha = 0;

        // Add all sprites to the gridContainer
        gridContainer.addChild(emptySprite);
        gridContainer.addChild(redSprite);
        gridContainer.addChild(yellowSprite);

        // Add sprite to FIELDVIEW grid for control
        FIELDVIEW[j].push({empty: emptySprite, yellow: yellowSprite, red: redSprite, taken: NOBODY});
    }
}


/* CREATE DROPLINE AT THE TOP */ 
 for (var i = 0; i<NB_ROW;i++){
 	
 	// Create sprites
 	var disabledSprite = new Sprite(disabledTexture),
 		dropSprite = new Sprite(dropTexture);

 	//Set sprite size
 	disabledSprite.scale.set(tokenScale,tokenScale);
 	dropSprite.scale.set(tokenScale,tokenScale);

 	// Set sprite position 
 	disabledSprite.position.set(i*tokenSize.width*tokenScale, 0);
 	dropSprite.position.set(i*tokenSize.width*tokenScale,0);
 	
 	// Set sprite invisible
 	disabledSprite.alpha = 0;
 	dropSprite.alpha = 0;

 	// Add sprites to the global variable dropline
 	dropline.push({drop: dropSprite, disabled: disabledSprite});

 	// Add sprite to the game container. 
 	gridContainer.addChild(disabledSprite);
 	gridContainer.addChild(dropSprite);

 }

/* SET STAGE ON THE DOM */
  stage.addChild(gridContainer);
  renderer.resize(tokenSize.width*NB_ROW*tokenScale, tokenSize.height*(NB_LIG+1)*tokenScale);
  refreshScore();
  renderer.render(stage);
  requestAnimationFrame(gameLoop)

}


// Tick function
function gameLoop() {

	// If model has changed:
    if (toUpdate) {

    	// Update renderer : set concerned red or yellow sprite visible
        for (var i = 0; i < NB_LIG; i++) {
            for (var j = 0; j < NB_ROW; j++) {
                switch (FIELD[j][i]) {
                    case PLAYER:
                        FIELDVIEW[j][i].yellow.alpha = 1;
                        break
                    case COMPUTER:
                        FIELDVIEW[j][i].red.alpha = 1;
                        break
                    case NOBODY:
                        break;
                    default:
                        console.log('error somewhere')
                }
            }
        }

        toUpdate = false;

        // If game is over
        if(isOver(FIELD)){
        	switch (hasWinner(FIELD)) {
        		case NOBODY:
        			console.log("draw");
        			document.getElementById("winner").innerHTML = "Draw! It's a shame!";
        			break;
        		case PLAYER:
        			PLAYERSCORE += 1;
        			canPlay = true;
        			document.getElementById("winner").innerHTML = "You are a CHAMPION!";
        			console.log("you win");
        			break;
        		case COMPUTER:
        			COMPUTERSCORE += 1;
        			console.log("computer win");
        			document.getElementById("winner").innerHTML = "Computer beat you, poor human!";
        			break;
        		default:
        			console.log("error somewhere");
        	}

        	// Display the score 
        	refreshScore();

        	// Disable click on the field
        	FIELDVIEW.map( (row) => { row.map( (elt) => {elt.empty.interactive = false }   )}    );
        	dropline.map( (row) => { row.disabled.alpha = 0;row.drop.alpha = 0;  } )
        }
    }

    // Loop calls
    requestAnimationFrame(gameLoop);
    renderer.render(stage);
}


// RESET the game wiew and model
function resetGame () {
	FIELD = createGrid();
	for(var i = 0; i < NB_ROW; i++){
		for(var j = 0; j < NB_LIG; j++){
			FIELDVIEW[i][j].red.alpha = 0;
			FIELDVIEW[i][j].yellow.alpha = 0;

			FIELDVIEW[i][j].empty.interactive = true;
		}
	}
	document.getElementById("winner").innerHTML = "";
}

// Update the game score on screen
function refreshScore() {
	document.getElementById("score").innerHTML = PLAYERSCORE + " - " + COMPUTERSCORE ;
}


// Return the row the computer plays in.
// The computation time depends on the DEPTH parameter.
// DEPTH = 5 is already a strong AI ! 
// See bestComputerMove in model part for details ;-)
function computerMove(){
    return bestComputerMove(FIELD, DEPTH);
}


// ----------------------------------------------------------
// ----------------------------------------------------------
/* II. MODEL PART : MiniMax algorithm */
// ------------------------------------------
// ------------------------------------------


// A grid is an 2D-Array grid[row][lig]. Each tile is equal to NOBODY (0), PLAYER (1), or COMPUTER (2) depending on where the players have played.


// Create an empty grid[row][lig]
function createGrid() {
    var grid = new Array();
    for (var i = 0; i < NB_ROW; i++) {
        grid[i] = new Array();
        for (var j = 0; j < NB_LIG; j++) {
            grid[i].push(NOBODY);
        }
    }
    return grid;
}

// return a new grid with the copy of the given grid
function copyGrid(grid){
    var newGrid = createGrid();
    for(var i = 0; i<NB_ROW;i++){
        for(var j = 0; j < NB_LIG ; j++){
            newGrid[i][j] = grid[i][j];
        }
    }
    return newGrid;
}

// return player's opponent (PLAYER vs COMPUTER)
function opponent(player){
    return (player === PLAYER ? COMPUTER : PLAYER);
}


// Return true if someone can play in the row
function canDropToken (grid, row) {
    return (grid[row][NB_LIG-1] === NOBODY);
}

// Change the given "grid" so that "player" plays in the "row"
function dropToken (grid, row, player) {
    var lig = 0;
    while ((lig < NB_LIG) && (grid[row][lig] !== NOBODY)) {
        lig++;
    }
    grid[row][lig] = player
    toUpdate = true;
    return grid;

}

// Return true if the grid is full
function isFull (grid) {
    for(var i = 0; i < NB_ROW; i++){
        if(canDropToken(grid, i)){
            return false;
        }
    }
    return true;
}

// Given a grid, return NOBODY is there is no winner, otherwise return the winner (PLAYER or COMPUTER).
// This function tries every possible winning layout on the given grid
// A "winner" is someone who has line up 4 tiles
function hasWinner (grid) {
    var winner = NOBODY;
    var row = 0;
    var lig;

    while ((winner === NOBODY) && (row < NB_ROW)) {
        
        lig = 0;
        while ((winner === NOBODY) && (lig < NB_LIG)) {
            
            if((row < NB_ROW - 3) && (winnerHorizontal(grid, row, lig) !== NOBODY)){
                winner = winnerHorizontal(grid, row, lig);
            }

            if((winner === NOBODY) && (lig < NB_LIG - 3) && (winnerVertical(grid, row, lig) !== NOBODY)){
                winner = winnerVertical(grid, row, lig);
            }

            if((winner === NOBODY) && (row < NB_ROW - 3) && (lig < NB_LIG - 3) && (winnerSlash(grid, row, lig) !== NOBODY)){
                winner = winnerSlash(grid, row, lig);
            }

            if((winner === NOBODY) && (row < NB_ROW - 3) && (lig > 2) && (winnerBackslash(grid, row, lig) !== NOBODY)){
                winner = winnerBackslash(grid, row, lig);
            }
            lig++;
        }
        row++;
    }
    return winner;
}

// Check if there is a winner horizontally starting from the tile : grid[row][lig]
function winnerHorizontal(grid, row, lig) {
    if ((grid[row][lig] === grid[row + 1][lig]) && (grid[row][lig] === grid[row + 2][lig]) && (grid[row][lig] === grid[row + 3][lig])) {
        return grid[row][lig];
    } else {
        return NOBODY;
    }
}

// Check if there is a winner vertically starting from the tile : grid[row][lig]
function winnerVertical(grid, row, lig) {
    if ((grid[row][lig] === grid[row][lig + 1]) && (grid[row][lig] === grid[row][lig + 2]) && (grid[row][lig] === grid[row][lig + 3])) {
        return grid[row][lig];
    } else {
        return NOBODY;
    }
}

// Check if there is a winner diagonaly (first diagonal) starting from the tile : grid[row][lig]
function winnerSlash(grid, row, lig) {
    if ((grid[row][lig] === grid[row + 1][lig + 1]) && (grid[row][lig] === grid[row + 2][lig + 2]) && (grid[row][lig] === grid[row + 3][lig + 3])) {
        return grid[row][lig];
    } else {
        return NOBODY;
    }
}

// Check if there is a winner diagonaly (second diagonal) starting from the tile : grid[row][lig]
function winnerBackslash(grid, row, lig) {
    if ((grid[row][lig] === grid[row + 1][lig - 1]) && (grid[row][lig] === grid[row + 2][lig - 2]) && (grid[row][lig] === grid[row + 3][lig - 3])) {
        return grid[row][lig];
    } else {
        return NOBODY;
    }
}


// Return true if the grid is full or someone won the game on the grid
function isOver(grid) {
    return ( isFull(grid) || (hasWinner(grid) !== NOBODY) );
}


// Compute the "weight" of a given grid for the computer to win.
// See bestComputerMove() function to understand why we need that function
// The more possible winning configuration, the higher the score. 
function estimateGrid (grid) {
    var computerScore = 0,
        playerScore   = 0;

    for(var row = 0; row < NB_ROW; row++){
        for(var lig = 0; lig < NB_LIG; lig++){

            if(row < (NB_ROW-3)) {
                computerScore += estimateHorizontal(grid, COMPUTER, row,lig);
                playerScore   += estimateHorizontal(grid, PLAYER, row, lig);
            }

            if(lig < (NB_LIG-3)) {
                computerScore += estimateVertical(grid, COMPUTER, row,lig);
                playerScore   += estimateVertical(grid, PLAYER, row, lig);
            }

            if((row < (NB_ROW-3)) && (lig < (NB_LIG-3))) {
                computerScore += estimateSlash(grid, COMPUTER, row,lig);
                playerScore   += estimateSlash(grid, PLAYER, row, lig);
            }

            if((row < (NB_ROW-3)) && (lig > 2)) {
                computerScore += estimateBackslash(grid, COMPUTER, row,lig);
                playerScore   += estimateBackslash(grid, PLAYER, row, lig);
            }

        }
    }
    return (computerScore - playerScore)
}


// Check for available options for the player to win by ligning up 4 tiles.
// Return a weight corresponding to this option
// The more tiles are taken by the player, the higher the weight is
// The power function is here to increase the gap between the "few tiles taken" and "lots of tiles taken" options.
function estimateHorizontal (grid, player, row, lig) {
    var oppo = opponent(player);
    if(    (grid[row][lig] !== oppo)
        && (grid[row+1][lig] !== oppo)
        && (grid[row+2][lig] !== oppo)
        && (grid[row+3][lig] !== oppo)
        ) {

        return Math.pow(2, (grid[row][lig] + grid[row+1][lig] + grid[row+2][lig] + grid[row+3][lig] / player));

    } else {
        return 0;
    }
}

function estimateVertical (grid, player, row, lig) {
    var oppo = opponent(player);
    if(    (grid[row][lig] !== oppo)
        && (grid[row][lig+1] !== oppo)
        && (grid[row][lig+2] !== oppo)
        && (grid[row][lig+3] !== oppo)
        ) {

        return Math.pow(2, (grid[row][lig] + grid[row][lig+1] + grid[row][lig+2] + grid[row][lig+3] / player));

    } else {
        return 0;
    }
}

function estimateSlash (grid, player, row, lig) {
    var oppo = opponent(player);
    if(    (grid[row][lig] !== oppo)
        && (grid[row+1][lig+1] !== oppo)
        && (grid[row+2][lig+2] !== oppo)
        && (grid[row+3][lig+3] !== oppo)
        ) {

        return Math.pow(2, (grid[row][lig] + grid[row+1][lig+1] + grid[row+2][lig+2] + grid[row+3][lig+3] / player));

    } else {
        return 0;
    }
}



function estimateBackslash (grid, player, row, lig) {
    var oppo = opponent(player);
    if(    (grid[row][lig] !== oppo)
        && (grid[row+1][lig-1] !== oppo)
        && (grid[row+2][lig-2] !== oppo)
        && (grid[row+3][lig-3] !== oppo)
        ) {

        return Math.pow(2, (grid[row][lig] + grid[row+1][lig-1] + grid[row+2][lig-2] + grid[row+3][lig-3] / player));

    } else {
        return 0;
    }
}


// Recursive function to know wheither the currentPlayer can win or lose with "depth" move(s) max. 
function tag(grid, currentPlayer, depth) {
    if (isOver(grid)) {
    // If game is over, return the winner
        return hasWinner(grid);
    } else {
        if (depth === 0) {
        	// Recursion stop: nobody has won with the given depth.
            return NOBODY;
        } else {
            var draw = false;
            var sonTag;
            var sonGrid = createGrid();

            // We try every possible move, in the different rows.
            // Let's see if we can find a move that garantee currentPlayer victory 
            for (var row = 0; row < NB_ROW; row++) {

            	// We copy the original grid
                sonGrid = copyGrid(grid);
                if (canDropToken(sonGrid, row)) {
                	// If the row is not full, we can try this move and see what happens with (depth -1) other moves.
                    sonGrid = dropToken(sonGrid, row, currentPlayer);
                    sonTag = tag(sonGrid, opponent(currentPlayer), (depth - 1));

                    // Playing in the row garantee victory !
                    if (sonTag === currentPlayer) {
                        return currentPlayer;
                    }

                    // Playing in the row leads to draw (at least there is a possible "draw option")
                    if (sonTag === NOBODY) {
                        draw = true;
                    }
                }
            }

            if (draw) {
                return NOBODY;
            } else  {
            	// Every row leads the opponent to victory. CurrentPlayer is sure to lose.
                return opponent(currentPlayer);
            }
        }
    }
  }  


// Return the best row to play in for the computer. 
// Based on miniMax algorithm
function bestComputerMove (grid, depth) {
    var sonTag;
    var weightMove;

    var bestMove = NB_ROW;
    var weightBestMove = -9999999;

    var lessWorstMove = NB_ROW;
    var weightLessWorstMove = -9999999;

    var sonGrid = createGrid();

    for(var row = 0; row <NB_ROW; row++){
        
        sonGrid = copyGrid(grid);
        if(canDropToken(sonGrid, row)){

        	// Let's try this row
            sonGrid = dropToken(sonGrid, row, COMPUTER);
            sonTag  = tag(sonGrid, PLAYER, depth);

            // Are we sure to win in this row ? 
            if(sonTag === COMPUTER) {
                return row;
            }

            // Otherwise, lets compute the weight of this move
            weightMove = estimateGrid(sonGrid);

            // If nobody is sure to win, we keep the move with the higher weight
            if(sonTag === NOBODY){
                if(weightMove > weightBestMove){
                    weightBestMove = weightMove;
                    bestMove = row;
                } 
            }

            // If human player is sure to win within "depth" move
            else {
                    if(weightMove > weightLessWorstMove) {
                        weightLessWorstMove = weightMove;
                        lessWorstMove = row;
                    }
                }

            }

        }

    // Return the best or less worth move.
    if(bestMove < NB_ROW){
        return bestMove;
    } else {
        return lessWorstMove;
    }
}
