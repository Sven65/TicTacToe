/*

	Copyright Mackan90096 [thormax5@gmail.com]

	Licensed under the Apache License, Version 2.0 (the "License"); 
	you may not use this file except in compliance with the License. 
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software 
	distributed under the License is distributed on an "AS IS" BASIS, 
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
	See the License for the specific language governing permissions and 
	limitations under the License.

*/

// Fish tacos.

var socket = io(); // Get a connection to the server
var stats = document.getElementById("status"); // Assign the DOM element with id 'status' to a variable
var name = ""; // The users name
var turn = 0; // The rooms player turn
var player = 0; // The users player number in the room
var canPlay = false; // If the game is ready to play
var single = false; // If the game is against an AI

var taken = 0; // How many fields have been played on

var arr = new Array(3); // Array for checking wins with three fields
for(i=0;i<3;i++){ // Loop through the array above
	arr[i]= new Array(3); // Add an array with three fields
}

function checkWin(){ // Function for checking wins

    $(".row").each(function(i, val){ // Loop through all DOM elements with the class 'row'
        $(this).find('div').each(function(j, val2){ // Find every div element and loop through them
            arr[i][j] = parseInt($(this).attr("data-points")); // Add their 'data-points' attribute to the win checking array
        });
    });

    for(i=0;i<3;i++){
        var rowSum = 0;
        for(var j=0;j<3;j++){
            rowSum += arr[i][j];
        }

        if(rowSum === 3){
            socket.emit("win", 1);
        }else if(rowSum === -3){
            socket.emit("win", 0);
        }
    }

    for(i=0;i<3;i++){
        var colSum = 0;
        for(j=0;j<3;j++){
            colSum += arr[j][i];
        }

        if(colSum === 3){
            socket.emit("win", 1);
        }else if(colSum === -3){
            socket.emit("win", 0);
        }
    }

    if(arr[0][0]+arr[1][1]+arr[2][2] === 3){
        socket.emit("win", 1);
    }else if(arr[0][0]+arr[1][1]+arr[2][2] === -3){
       socket.emit("win", 0);
    }

    if(arr[2][0]+arr[1][1]+arr[0][2] === 3){
        socket.emit("win", 1);
    }else if(arr[2][0]+arr[1][1]+arr[0][2] === -3){
        socket.emit("win", 0);
    }
}

function rst(){
	$("#container").css("display", "block"); // Unhide the DOM element with the ID 'container'
	$("#game").css("display", "none"); // Hide the DOM element with the ID 'game'
	name = ""; // Set the users name to be empty
	turn = 0; // Set the turn to 0
	player = 0; // Set the player number to 0
	canPlay = false; // Set the game state to not be playable
	taken = 0; // Set the taken fields to 0
	$(".field").empty(); // Remove every child element from all DOM elements with the class 'field'
	$(".field").removeClass("circle").removeClass("cross"); // Remove the classes 'circle' and 'cross' from every DOM element with the class 'field'
	$(".field").attr("data-points", 0); // Set the 'data-points' attribute of every DOM element with the class 'field' to 0
	$("#stats").text(""); // Set the text of the DOM element with the ID 'stats' to nothing
	updateTimer = setInterval(function(){ // Start a timer to every 5 seconds
		socket.emit("update"); // Send a 'update' event to the server
	}, 5000);
}


$(".new").on("click", function(e){ // User has clicked a DOM element with the class 'new'
	socket.emit('new'); // Send the server a 'new' event
	return false; // Return false to not do anything after.
});

$("#join").on("click", function(e){ // User has clicked a DOM element with the ID 'join'
	var v = document.getElementById("gid").value; // Get the value of the DOM element with ID 'gid' and assign it to a variable
	if(v.length == 6){ // If the value is 6 characters long
		socket.emit("join", v); // Send the server a 'join' event with the data being the value
	}else{ // If the value isn't 6 characters long
		stats.innerHTML = "Game ID is too short!"; // Set the text of the DOM element assigned to 'stats'
	}
});

$("#gid").on("keydown", function(e){ // The user has pressed a keyboard key on the DOM element with the ID 'gid'
	var gid = document.getElementById("gid"); // Assign the DOM element with the ID 'gid' to a variable
	var re = /^[a-z0-9]+$/i; // Regex to match a to z and 0-9. Case insensitive
	if(!e.ctrlKey){ // If the user didn't use a CTRL+Key combination
		e.preventDefault(); // Prevent the default behaviour
	}

	if(e.keyCode == 8){ // If the key pressed is backspace
		gid.value = gid.value.substring(0, gid.value.length-1); // Set the value of the DOM element to the previous value with the last character removed
	}else{ // If the key pressed isn't backspace
		if(e.ctrlKey){ // If CTRL is also pressed
			var ch = ""; // Set the character to nothing
		}else{ // If CTRL isn't pressed
			var ch = String.fromCharCode(e.keyCode); // Set the character to the key pressed
		}

		if(re.test(ch) && gid.value.length < 6){ // If the character is valid (containing only letters from a to z and the numbers 0 to 9) and the value of the DOM element with the ID 'gid' is less than 6 characters long
			gid.value += ch; // Add the character to the DOM element's value
		}
	}
});

$(".field").on("click", function(e){ // The user has clicked a DOM element with the class 'field'
	if(canPlay && turn == player){ // If the game can be played and it's the users turn
		if(!$(this).hasClass("cross") && !$(this).hasClass("circle")){ // If the clicked element doesn't contain the classes 'cross' and 'circle'
			socket.emit("play", player, this.id.replace("row-", "")); // Send the server a 'play' event with the data of the users player number and the field they cicked
		}
	}
});

$("#back").on("click", function(){ // The user has clicked a DOM element with the ID 'back'
	//location.reload(); // Reload the page
	socket.emit("quit"); // Send a 'quit' event to the server
	rst(); // Reset the game
});

$("#priv").on("click", function(){ // The user has clicked a DOM element with the ID 'priv'
	if(document.getElementById("priv").checked){ // If the DOM element with the ID 'priv' is checked
		socket.emit("priv"); // Send the server a 'priv' event
	}else{ // If the DOM element isn't checked
		socket.emit("unpriv"); // Send the server a 'unpriv event'
	}
});

$("#games").on("click", "button", function(e){ // The user has clicked a DOM button element that's a child of the DOM element with the ID 'games'
    socket.emit("join", $(this).attr("data-code")); // Send the server a 'join' event with the data of the buttons 'data-code' attribute
});

socket.on("newCode", function(code){ // The server has sent a 'newCode' event with the data 'code'
	$("#container").css("display", "none"); // Hide the DOM element with the ID 'container'
	$("#game").css("display", "block"); // Unhide the DOM element with the ID 'game'
	$("#room").text("Room: "+code); // Set the text of the DOM element with the ID 'room' to the data 'code'
	$("#stats").text("Waiting for another player"); // Set the text of the DOM element with the ID 'stats'
	clearInterval(updateTimer); // Stop the lobby update timer
});

socket.on("username", function(nam){ // The server has sent a 'username' event with the data 'nam'
	name = nam; // Set the name variable to the data the server sent
	$("#name").text("Name: "+name+" "); // Set the text of the DOM element with the ID 'name' to the new name
});

socket.on("joined", function(code){ // The server has sent a 'joined' event with the data 'code'
	$("#container").css("display", "none"); // Hide the DOM element with the ID 'container'
	$("#game").css("display", "block"); // Unhide the DOM element with the ID 'game'
	$("#room").text("Room: "+code); // Set the text of the DOM element with the ID 'room' to the data 'code'
	clearInterval(updateTimer); // Stop the lobby update timer
});

socket.on("turn", function(pl){ // The server has sent a 'turn' event with the data 'pl'
	turn = pl; // Set the turn to the data the server sent
	if(player == turn){ // If the users player number is the same as the turn
		$("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats'
	}else{ // If the users player number isn't the same as the turn
		$("#stats").text("Opponents turn"); // Set the text of the DOM element with the ID 'stats'
	}
});

socket.on("player", function(i){ // The server has sent a 'player' event with the data 'i'
	player = i; // Set the users player number to the data sent from the server
});

socket.on("err", function(err){ // The server has sent a 'err' event with the data 'err'
	stats.innerHTML = err; // Set the text of the DOM element assigned to 'stats' to the data sent from the server
});

socket.on("playable", function(state){ // The server has sent a 'playable' event with the data 'state'
	canPlay = state; // Change the canPlay state to the state sent by the server
	if(player == turn){ // If the users player number is the turn number
		$("#stats").text(" Your turn"); // Set the text of the DOM element with the ID 'stats'
	}else{ // If the users player number isn't the turn number
		$("#stats").text(" Opponents turn"); // Set the text of the DOM element with the ID 'stats'
	}
});

socket.on("play", function(field, player){ // The server has sent a 'play' event with the data 'field' and 'player'
	var cl = ""; // Variable for the class to add to the field
	var e = 0; // Variable for the value to set the fields 'data-points' attribute to
	if(player == 0){ // If the player is 0
		cl = "cross"; // Set the class to add to 'cross'
		e = -1; // Set the 'data-points' to -1
	}else{ // If the player isn't 0
		cl = "circle"; // Set the class to add to 'circle'
		e = 1; // Set the 'data-points' to 1
	}

	$("#row-"+field).addClass(cl); // Add the class of 'cl' to the DOM element with the ID of 'row-' and the 'field' data sent from the server
	$("#row-"+field).append("<span class='icon-"+cl+"'></span>"); // Add either a cross or circle to the DOM element with the ID of 'row-' and the 'field' data sent from the server
	$("#row-"+field).attr("data-points", e); // Set the 'data-points' attribute of the DOM element with the ID of 'row-' and the 'field' data sent from the server

	if(canPlay){ // If the game is playable
		if(taken <= 8){ // If the taken fields are less than or equal to 8
			taken++; // Increase the taken fields by one
		}

		if(taken == 9){ // If the taken fields are equal to 9
			socket.emit("tie"); // Send a 'tie' event to the server
		}
	}

	checkWin(); // Check for wins

});

socket.on("win", function(pl){ // The server has sent a 'win' event with the data 'pl'
	canPlay = false; // Set the game state to not be playable
	if(player == pl){ // If the users player number is the same as the 'pl' data sent from the server
		$("#stats").text("You won!"); // Set the text of the DOM element with the ID 'stats'
	}else{ // If the users player number isn't the same as the 'pl' data sent from the server
		$("#stats").text("You lost."); // Set the text of the DOM element with the ID 'stats'
	}
});

socket.on("tie", function(){ // The server has sent a 'tie' event
	canPlay = false; // Set the game state to not be playable
	$("#stats").text("Tied."); // Set the text of the DOM element with the ID 'stats'
});

socket.on("lobby", function(data){ // The server has sent a 'lobby' event with the data 'data'
	$("#games").empty(); // Remove all child elements from the DOM element with the ID 'games'
	for(i=0;i<data.length;i++){ // Loop through the data sent from the server
		socket.emit("info", data[i]); // Send a 'info' event to the server with the data at position 'i' in the data sent from the server
	}
});

socket.on("info", function(id, clients){ // The server has sent a 'info' event with the data 'id' and 'clients'
	$("#games").append('<div class="game"><span class="code">'+id+'</span><span class="players">'+clients+'/2</span><span class="btn"><button type="button" class="join" data-code="'+id+'">Join!</button></span></div>'); // Add DOM elements to the DOM element with the ID 'games'
});

socket.on("gend", function(re){ // The server has sent a 'gend' event with the data 're'
	rst(); // Reset the game
	$("#status").text(re); // Set the text of the DOM element with the ID 'status' to the data sent by the server
});


$(document).on("ready", function(){ // When the page has loaded
	socket.emit("update"); // Send a 'update' event to the server
});

var updateTimer = setInterval(function(){ // Start a timer to every 5 seconds
	socket.emit("update"); // Send a 'update' event to the server
}, 5000);


// The AI

$("#single").on("click", function(){ // The user has clicked the DOM element with the ID 'single'
	single = true; // Set the game to singleplayer
	canPlay = true; // Set the game state to be playable
	$("#container").css("display", "none"); // Hide the DOM element with the ID 'container'
	$("#game").css("display", "block"); // Unhide the DOM element with the ID 'game'
	$("#privHold").css("display", "none"); // Hide the DOM element with the ID 'privHold'
	$("#restart").css("display", ""); // Unhide the DOM element with the ID 'restart'
	$("#stats").text("Playing against the AI. Your turn"); // Set the text of the DOM element with the ID 'stats'
});

$("#game").on("click", ".field", function(e){ // The user has clicked a child element with the class 'field' of the DOM element with the ID 'game'
	if(single && canPlay){ // If the game is in singleplayer and is playable
		if(turn == 0){ // If the turn is 0
			if(!$(this).hasClass("cross") && !$(this).hasClass("circle")){ // If the clicked element doesn't contain the classes 'cross' and 'circle'
				$(this).attr("data-points", "x"); // Set the'data-points' attribute of the clicked element to 'x'
				$(this).addClass("cross"); // Add the 'cross' class to the clicked element
        		$(this).append("<span class='icon-cross'></span>"); // Add a cross to the clicked element
				boardCheck(); // Check the board
				checkWinAI(); // Check for wins
				turn == 1; 
				$("#stats").text("AI's turn"); // Set the text of the DOM element with the ID 'stats' to the turn
				compMove(); // Let the AI make a move
				boardCheck(); // Check the board
				checkWinAI(); // Check for wins
			}
		}
	}
});

$("#restart").on("click", function(e){ // The user has clicked the DOM element with the ID 'restart'
	$(".field").attr("data-points", 0); // Set the 'data-points' attribute to every DOM element with the class 'field' to 0
	$(".field").removeClass("circle").removeClass("cross"); // Remove the 'circle' and 'cross' classes from all DOM elements with the class 'field'
	$(".field").empty(); // Remove child elements from every DOM element with the class 'field'
	$("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
	turn = 0; // Set the turn to 0
	aiWin = false; // Reset the aiWin
	playerWin = false; // Reset the playerWin
});

var a1, a2, a3, b1, b2, b3, c1, c2, c3; // Variables for keeping track of the fields

var playerWin = false; // If the user has won
var aiWin = false; // If the AI has won


function compMove(){
    if(a1 == "" && ((a3 == "x" && a2 == "x") || (c3 == "x" && b2 == "x") || (c1 == "x" && b1 == "x"))){
        $('#row-1-1').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
        $('#row-1-1').addClass("circle"); // Add the 'circle' class to the DOM element
        $("#row-1-1").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
        turn = 0;
        $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
    }else{
        if(a2 == "" && ((a1 == "x" && a3 == "x") || (c2 == "x" && b2 == "x"))){
            $('#row-1-2').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
            $('#row-1-2').addClass("circle"); // Add the 'circle' class to the DOM element
        	$("#row-1-2").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
            turn = 0;
            $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
        }else{
            if(a3 == "" && ((a1 == "x" && a2 == "x") || (c1 == "x" && b2 == "x") || (c3 == "x" && b3 == "x"))){
                $('#row-1-3').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                $('#row-1-3').addClass("circle"); // Add the 'circle' class to the DOM element
        		$("#row-1-3").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                turn = 0;
                $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
            }else{
                if(c3 == "" && ((c1 == "x" && c2 == "x") || (a1 == "x" && b2 == "x") || (a3 == "x" && b3 == "x"))){
                    $('#row-3-3').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                    $('#row-3-3').addClass("circle"); // Add the 'circle' class to the DOM element
       				$("#row-3-3").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                    turn = 0;
                    $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                }else{
                    if(c1 == "" && ((c3 == "x" && c2 == "x") || (a3 == "x" && b2 == "x") || (a1 == "x" && b1 == "x"))){
                        $('#row-3-1').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                        $('#row-3-1').addClass("circle"); // Add the 'circle' class to the DOM element
       					$("#row-3-1").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                        turn = 0;
                        $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                    }else{
                        if(c2 == "" && ((c3 == "x" && c1 == "x") || (a2 == "x" && b2 == "x"))){
                            $('#row-3-2').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                            $('#row-3-2').addClass("circle"); // Add the 'circle' class to the DOM element
        					$("#row-3-2").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                            turn = 0;
                            $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                        }else{
                            if(b1 == "" && ((b3 == "x" && b2 == "x") || (a1 == "x" && c1 == "x"))){
                                $('#row-2-1').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                $('#row-2-1').addClass("circle"); // Add the 'circle' class to the DOM element
        						$("#row-2-1").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                turn = 0;
                                $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                            }else{
                                if(b3 == "" && ((a3 == "x" && c3 == "x") || (b2 == "x" && b1 == "x"))){
                                    $('#row-2-3').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                    $('#row-2-3').addClass("circle"); // Add the 'circle' class to the DOM element
        							$("#row-2-3").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                    turn = 0;
                                    $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                }else{
                                    if(b2 == "" && ((a3 == "x" && c1 == "x") || (c3 == "x" && a1 == "x") || (b3 == "x" && b1 == "x") || (c2 == "x" && a2 == "x"))){
                                        $('#row-2-2').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                        $('#row-2-2').addClass("circle"); // Add the 'circle' class to the DOM element
        								$("#row-2-2").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                        turn = 0;
                                        $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                    }else{
                                        if(b2 == ""){
                                            $('#row-2-2').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                            $('#row-2-2').addClass("circle"); // Add the 'circle' class to the DOM element
        									$("#row-2-2").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                            turn = 0;
                                            $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                        }else{
                                            if(a1 == ""){
                                                $('#row-1-1').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                                $('#row-1-1').addClass("circle"); // Add the 'circle' class to the DOM element
        										$("#row-1-1").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                                turn = 0;
                                                $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                            }else{
                                                if(c3 == ""){
                                                    $('#row-3-3').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                                    $('#row-3-3').addClass("circle"); // Add the 'circle' class to the DOM element
        											$("#row-3-3").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                                    turn = 0;
                                                    $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                                }else{
                                                    if(c2 == ""){
                                                        $('#row-3-2').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                                        $('#row-3-2').addClass("circle"); // Add the 'circle' class to the DOM element
        												$("#row-3-2").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                                        turn = 0;
                                                        $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                                    }else{
                                                        if(b1 == ""){
                                                            $('#row-2-1').attr("data-points", "o"); // Set the DOM elements 'data-points' attribute to 'o'
                                                        	$('#row-2-1').addClass("circle"); // Add the 'circle' class to the DOM element
        													$("#row-2-1").append("<span class='icon-circle'></span>"); // Add the circle as a child element to the DOM element
                                                            turn = 0;
                                                            $("#stats").text("Your turn"); // Set the text of the DOM element with the ID 'stats' to the turn
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function winAlert(){
    if(playerWin){ // If the player has won
        $("#stats").text("You won!"); // Set the text of the DOM element with the ID 'stats'
    }else{ // If the player hasn't won
        if(aiWin){ // If the AI has won
            $("#stats").text("You lost."); // Set the text of the DOM element with the ID 'stats'
        }
    }
}

function checkWinAI(){ // Check for wins
    if((a1 == a2 && a1 == a3 && (a1 == "x")) || (b1 == b2 && b1 == b3 && (b1 == "x")) || (c1 == c2 && c1 == c3 && (c1 == "x")) || (a1 == b1 && a1 == c1 && (a1 == "x")) || (a2 == b2 && a2 == c2 && (a2 == "x")) || (a3 == b3 && a3 == c3 && (a3 == "x")) || (a1 == b2 && a1 == c3 && (a1 == "x")) || (a3 == b2 && a3 == c1 && (a3 == "x"))){
        playerWin = true; // The player has won, set the playerWin to true
        winAlert(); // Alert the player they won
    }else{
        if((a1 == a2 && a1 == a3 && (a1 == "o")) || (b1 == b2 && b1 == b3 && (b1 == "o")) || (c1 == c2 && c1 == c3 && (c1 == "o")) || (a1 == b1 && a1 == c1 && (a1 == "o")) || (a2 == b2 && a2 == c2 && (a2 == "o")) || (a3 == b3 && a3 == c3 && (a3 == "o")) || (a1 == b2 && a1 == c3 && (a1 == "o")) || (a3 == b2 && a3 == c1 && (a3 == "o"))){
            aiWin = true; // The AI has won, set the aiWin to true
            winAlert(); // Alert the player they lost
        }else{
            if(((a1 == "x") || (a1 == "o")) && ((b1 == "x") || (b1 == "o")) && ((c1 == "x") || (c1 == "o")) && ((a2 == "x") || (a2 == "o")) && ((b2 == "x") || (b2 == "o")) && ((c2 == "x") || (c2 == "o")) && ((a3 == "x") || (a3 == "o")) && ((b3 == "x") || (b3 == "o")) && ((c3 == "x") || (c3 == "o"))){
                $("#stats").text("Tied"); // Player and AI tied, set the text of the DOM element with the ID 'stats' to 'Tied' to alert the player
            }
        }
    }
};

function boardCheck(){
	a1 = $('#row-1-1').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-1-1' and assign it to a variable
	a2 = $('#row-1-2').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-1-2' and assign it to a variable
	a3 = $('#row-1-3').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-1-3' and assign it to a variable

	b1 = $('#row-2-1').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-2-1' and assign it to a variable
	b2 = $('#row-2-2').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-2-2' and assign it to a variable
	b3 = $('#row-2-3').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-2-3' and assign it to a variable

	c1 = $('#row-3-1').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-3-1' and assign it to a variable
	c2 = $('#row-3-2').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-3-2' and assign it to a variable
	c3 = $('#row-3-3').attr("data-points").replace("0", ""); // Get the 'data-points' attribute of the DOM element with ID 'row-3-3' and assign it to a variable
}