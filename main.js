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

// Spaghetti.


var app = require('express')(); // Require express for web functionality.
var http = require('http').Server(app); // Open a http server to listen for connections, put connections to the app.
var io = require('socket.io')(http); // Require socket.io for connections between clients and the server.
var mnGen = require("mngen"); // Random word genererator for names.

var used = []; // Array for rooms bases that are being used. 
var rooms = []; // Array for room IDs that are being used.
var usernames = {}; // Object containing usernames.
var privRooms = []; // Array for keeping track of private rooms to not show in the lobby.

function base(str, fromBase, toBase){ // Base conversion
    var num = parseInt(str, fromBase); // Parse the string into fromBase
    return num.toString(toBase); // Return the string as new base
}

function rand(min, max){ // Inclusive Random Number Generation
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCode(){ // Function for generating room IDs
	var r = rand(100000000, 999999999); // Get a random number between 100,000,000 and 999,999,999. 100,000,000 is the lowest number that can generate a code with 6 characters.
	if(used.indexOf(r) == -1){ // If the number isn't already used
		used.push(r); // Add it to the used numbers
		return (r).toString(36).toLowerCase(); // Return the code by converting the random number to Base36 and lowercasing it.
	}else{ // If it's already used
		getCode(); // Try again
	}
}

function getName(){ // Username generation
	var list = mnGen.list(3); // Get an array of 3 random words
	var ret = ""; // Name to return
	for(i=0;i<list.length;i++){ // Loop through the random words
		ret += list[i].charAt(0).toUpperCase()+list[i].slice(1); // Add the word at 'i' with the first letter uppercase to the string we return
	}
	return ret; // Return the name
}

// Express routing
// In the comments the base URL will be 'localhost:8765'


app.get('/', function(req, res){ // User has landed on the frontpage 'localhost:8765'
	res.sendFile(__dirname+'/web/index.html'); // Send the index file
});

app.get('/js/:file', function(req, res){ // Request for ':file' in the js folder, 'localhost:8765/js/:file'
	res.sendFile(__dirname+"/web/js/"+req.params.file); // Send the requested file
});

app.get('/css/:file', function(req, res){ // Request for ':file' in the css folder, 'localhost:8765/css/:file'
	res.sendFile(__dirname+"/web/css/"+req.params.file); // Send the requested file
});

app.get('/fonts/:file', function(req, res){ // Request for ':file' in the fonts folder, 'localhost:8765/fonts/:file'
	res.sendFile(__dirname+"/web/fonts/"+req.params.file); // Send the requested file
});

io.on('connection', function(socket){ // Someone connected to the server

	console.log('['+new Date().toUTCString()+'] A user connected.'); // Output info that a connection happened.

	socket.on("new", function(){ // The user has sent a 'new' event to the server
		var code = getCode(); // Get a room code
		var name = getName(); // Get a username
		rooms.push(code); // Add the code to the list of rooms
		socket.room = code; // Assign the users room as 'code'
		socket.player = 0; // Set the users player number for the room as 0
		socket.username = name; // Set the users name to the one generated earlier
		usernames[name] = name; // Add the name to the list of usernames

		io.sockets.connected[socket.id].join(code); // Make the user join the room
		io.sockets.connected[socket.id].emit("newCode", code); // Send the user a 'newCode' event with the room's code
		io.sockets.connected[socket.id].emit("username", socket.username); // Send the user a 'username' evemt with their username
		io.sockets.connected[socket.id].emit("player", socket.player); // Send the user a 'player' event with the player id for the room
		console.log("["+new Date().toUTCString()+"] New game with room code "+code); // Output info that a new game has started with the room code generated earlier
	});

	socket.on("join", function(code){ // The user has sent a 'join' event to the server with the data 'code'
		code = code.toLowerCase(); // Make the code lowercase for better compatibility with connections.
		if(rooms.indexOf(code) > -1){ // If the code is a room

			var room = io.sockets.adapter.rooms[code]; // Assign the room the code represents to a variable
			if(room.length < 2){ // If the room has less than 2 clients

				socket.room = code; // Assign the users room as 'code'
				var name = getName(); // Generate a name
				socket.username = name; // Set the users name to the one generated earlier
				usernames[name] = name; // Add the name to the list of usernames
				socket.player = 1; // Set the users player number for the room as 1

				io.sockets.connected[socket.id].join(code); // Make the user join the room

				io.sockets.connected[socket.id].emit("username", socket.username); // Send the user a 'username' evemt with their username
				io.sockets.connected[socket.id].emit("player", socket.player); // Send the user a 'player' event with the player id for the room
				io.sockets.connected[socket.id].emit("joined", code.toLowerCase()); // Send the user a 'joined' event with the room code
				io.sockets["in"](socket.room).emit("playable", true); // Send a 'playable' event with the data 'true' to all clients in the room
				console.log("["+new Date().toUTCString()+"] User joined room "+code); // Output info that a user has connected to room with the room code

			}else{ // If the room has 2 or more clients
				io.sockets.connected[socket.id].emit("err", "Room's Full"); // Send the user a 'err' event with the data "Room's full"
			}
		}else{ // If the code isn't a room
			io.sockets.connected[socket.id].emit("err", "No such room."); // Send the user a 'err' event with the data "No such room."
		}
	});

	socket.on("play", function(player, field){ // The user has sent a 'play' event with their player number for their current room and the field they played on
		var pl = 0; // Variable to keep track of the player turn
		if(player == 0){ // If the user is player 0
			pl = 1; // Set next turn to player 1
		}else{ // If the user isn't player 0
			pl = 0; // Set next turn to player 0
		}

		io.sockets["in"](socket.room).emit("play", field, player); // Send a 'play' event to the users room with the data of the played field and the players number
		io.sockets["in"](socket.room).emit("turn", pl); // Send a 'turn' event to the room with the data of the next turn
	});

	socket.on("win", function(player){ // The user has sent a 'win' event with their player number
		io.sockets["in"](socket.room).emit("win", player); // Send a 'win' event to the users room with their player number
		console.log("["+new Date().toUTCString()+"] Player "+player+" won in room "+socket.room); // Output info that a player has won the game
	});

	socket.on("quit", function(){ // The user has sent a 'quit' event to the server
		if(socket.room != undefined){ // If the user was connected to a room
			var index = rooms.indexOf(socket.room); // Get the index of the room in the room ID array
			var usedIndex = used.indexOf(base(socket.room, 36, 10)); // Get the index of the room in the used base numbers by converting the room ID from Base36 to Base10

	    	if(index > -1){ // If the room exists in the room ID array
	    		rooms.splice(index, 1); // Remove it
			}

			if(usedIndex > -1){ // If the room exists in the room base array
				used.splice(usedIndex, 1); // Remove it
			}

	        delete usernames[socket.username]; // Remove the users name from the username object
	        socket.leave(socket.room); // Make the user leave the room
	        io.sockets["in"](socket.room).emit("gend", "Other user has left"); // Send a 'gend' event to the users room with the data 'Other user has left'
	    	console.log("["+new Date().toUTCString()+"] User quit from room "+socket.room); // Output info that a user has quit from a room
	    }
	});

	socket.on('disconnect', function(){ // The user has disconnected from the server
		if(socket.room != undefined){ // If the user was connected to a room
			var index = rooms.indexOf(socket.room); // Get the index of the room in the room ID array
			var usedIndex = used.indexOf(base(socket.room, 36, 10)); // Get the index of the room in the used base numbers by converting the room ID from Base36 to Base10

	    	if(index > -1){ // If the room exists in the room ID array
	    		rooms.splice(index, 1); // Remove it
			}

			if(usedIndex > -1){ // If the room exists in the room base array
				used.splice(usedIndex, 1); // Remove it
			}

	        delete usernames[socket.username]; // Remove the users name from the username object
	        socket.leave(socket.room); // Make the user leave the room
	        io.sockets["in"](socket.room).emit("gend", "Other user has left"); // Send a 'gend' event to the users room with the data 'Other user has left'
	    }
	    console.log("["+new Date().toUTCString()+"] A user disconnected"); // Output info that a user disconnected from the server
    });

    socket.on("tie", function(){ // The user has sent a 'tie' event
    	io.sockets["in"](socket.room).emit("tie"); // Send a 'tie' event to the users room
    	console.log("["+new Date().toUTCString()+"] Room "+socket.room+" tied."); // Output info that the game in a room tied
    });

    socket.on("update", function(){ // The user has sent a 'update' event
    	var rm = []; // Array to return
    	for(i=0;i<rooms.length;i++){ // Loop through the array of used room IDs
    		if(privRooms.indexOf(rooms[i]) == -1){ // If the room isn't in the array of rooms to not display
    			rm.push(rooms[i]); // Add the room to the return array
    		}
    	}
    	io.sockets.connected[socket.id].emit("lobby", rm); // Send the user a 'lobby' event with the data of the rooms
    });

    socket.on("priv", function(){ // The user has sent a 'priv' event
    	privRooms.push(socket.room); // Add the users room to the array of rooms to not be displayed
    });

    socket.on("unpriv", function(){ // The user has sent a 'unpriv' event
    	var index = privRooms.indexOf(socket.room); // Get the index of the users room in the array of rooms to not be displayed
    	if(index > -1){ // If the room is in the array
    		privRooms.splice(index, 1); // Remove it
		}
    });

    socket.on("info", function(id){ // The user has sent a 'info' event with the data 'id'
		var rms = io.sockets.adapter.rooms[id]; // Get the room info
		io.sockets.connected[socket.id].emit("info", id, rms.length); // Send the user a 'info' event with the data of the id and the amount of clients connected to the room
    });
});

http.listen(8765, function(){ // Listen on port 8765
	console.log('listening on *:8765'); // Output that the server is listening
});