var express =require('express'),
	http = require('http'),
	 app = express(),
	 server = http.createServer(app),
	 io = require('socket.io').listen(server);

	//Version 4 lets grab mongoose
var mongoose = require('mongoose');
	mongoose.Promise;
	
	app.use(express.static('public'));
	

	mongoose.connect('mongodb://heroku_2v9p06pm:hf0d2icmbp7avl2chfu8vo0fjl@ds241895.mlab.com:41895/heroku_2v9p06pm');
   // mongoose.connect('mongodb://localhost/chatmongoose');
	var db = mongoose.connection;
	//For version 3 we will be adding Private Chat functionality, so nicknames will be replaced with users.
	users ={};

	db.on('error', function(err) {
		console.log('Mongoose Error: ', err);
	  });
	  
	  db.once('open', function() {
		console.log('Mongoose connection successful.');
	  });

//Version 4 lets create our schema
	var chatSchema = mongoose.Schema({
		nick: String,
		msg: String,
		//let make sure one of the attributes grabs the time we created
		created: {type: Date, default: Date.now}
	});
	//Version 4: We'll create a model
		//the first parameter will create a collection with the name of "Message",
			// the second will attach the schema we created above
			// So Our model is called "Chat", just confused the hell out of myself, it should be obvious but keep that in mind when you scroll down to see the results.
	var Chat = mongoose.model('Message', chatSchema);
//this causes the page to render index.html
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
})

//we're going to recieve the message from the $messageBox we sent from the index.html
	//we're creating a connection event (when a client first connects to a socketio app)
		//the function takes the socket that the user is using. So when the user enters the app, its socket info is passed into this function to establish a connection. Kinda like a document ready function.
	io.sockets.on('connection', function(socket){
	//so on the front end we emitted a data from the messagebox to the server and we gave it the name 'send message'. we're going to use the same name to receive it server side.
		//socket.on will receive messages from the front end.
			//this first piece will send the nickname from the nickname text box in the frontend to the back end.
	//Version 4 we want to retrieve the messages as soon as the user connects with their username, rather then when the page is loaded
	var query = Chat.find({});
	//lets sort to get the last 8 messages
	query.sort('-created').limit(8).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old msgs', docs);
	});
	socket.on('new user', function(data, callback){
			//we need to check if the user nick name already exists / in the nickname array
				//were going to check if its = -1 because 0 and greater would mean that its in the array
					//so if its not -1 then it means its already in the array, so we spit back false in the callback
			//Version 3 change We will no longer be checking for nicknames in nicknames[]. We will be looking in an object called users using nickname as the key.
			if(data in users){
				callback(false);
			} else {
				callback(true);
				socket.nickname = data;
				//Version 3 Change not using the nicknames[] anymore, so we'll be updating the users{socket.nickname} object
				//nicknames.push(socket.nickname);
					// #001 rick I cant tell if its supposed to be users{socket.nickname} or users[socket.nickname] I think we're pushing arrays into the object, but if this doesnt work, definitly come back here. search for the #. 
				users[socket.nickname] = socket;
				//originally we had 'io.sockets.emit('usernames', nicknames);' here, 
				//however, since we need to constantly update the users list, we will tell the new user function to execute the updateNickNames Function, to keep the list up to date.
				updateNickNames();
			}
		});
	//here we create the function that will be used to update the username array, and later use it to update the users div in the front end.
	function updateNickNames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback){
		//
		//we received the message, so we want to send it to the other users
		//io.sockets.emit will send the message to all users including yourself
		//Version 3 change checking for Whisper functionality (if user enters '/w')
			//trim the white space from the message
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			//Now that we successfully use the '/w ' to make the message a whisper we dont need it, so let's get rid of it.
			msg = msg.substr(3); 
			//So how this whisper works is, user types '/w ' and then the user name they want, and then a space before they start typing the message, so lets grab that space between the targeted username, and the message
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				//Were going to check if the targeted user name is in the users object
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname });
					console.log('whisper');
				}else{
					callback('Error, enter a valid user');
				}
			}else{
				callback('Error! Please enter a message for your whisper');
			}
		}else{
			//version 4: Lets save the message to MongoDb
			var newMsg = new Chat({msg: msg, nick: socket.nickname});
			newMsg.save(function(err){
				if(err) throw err;
				io.sockets.emit('new message', {msg: msg, nick: socket.nickname });
			});
			
		//alternatively: socket.broadcast.emit('new message, data'); will send it to every user except yourself. (its the broadcast bit that does that.)
		}
	});

	//Which works great however now we need to create a disconnect feature
				socket.on('disconnect', function(data){
					//check if nick name is set, if they dont we'll just return
					if(!socket.nickname) return;
					//if they did have a nickname set, lets splice it from the array
					delete users[socket.nickname];
					//nicknames.splice(nicknames.indexOf(socket.nickname), 1);
					//then we will reupdate the user list displayed in the users div. Above you'll find a function we create called UpdateNicknames, and then well execute it in the new user function above.
					updateNickNames();
				});
});

server.listen(process.env.PORT || 3000, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });