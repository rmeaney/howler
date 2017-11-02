  //weird alternate document ready
			  $(document).ready(function($) {
				  // we're getting io.connect from the socket.io.js file we linked. It is also connected to port 3000 as we specified in the app.js
				  var socket = io.connect();
				  //we're going to chache all our variables
					  //adding username variables
				  var $nickForm = $('#setNick');
				  var $nickError = $('#nickError');
				  var $nickBox = $('#nickName');
				  var $users = $('#users');
				  var $messageForm = $('#send-message');
				  var $messageBox = $('#message');
				  var $chat = $('#chat');
				  var $messageError = $('#messageError');
			  
				  //lets attach an event handler to the nickname form, whenever a user sumbits it.
				  $nickForm.submit(function(e){
					  e.preventDefault();
					  if($nickBox.val().length === 0){
					  	$nickError.html('Please enter a username.').addClass("animated wobble");
					  }else{
					  socket.emit('new user', $nickBox.val(), function(data){
						  //so if the date is true, hide the nickname form and show the content wrap
						  if(data){
							  $('#nickWrap').hide();
							  $('#descriptorwrap').hide();
							  $('#contentWrap').show();
							  //but if we send false back (the chosen nickname is already in the array)
						  }else{
							  $nickError.html('That username is already taken! Try again.').addClass("animated wobble");
						  }
			  
					  });
					  $nickBox.val('');
					}
				  });
				  //display users logged in
				  socket.on('usernames', function(data){
					  //so were going to first blank out the html in the users div
					  var html= '';
					  // then we are going to cycle through the data and add each entry into the users div
					  for(i = 0; i < data.length; i++){
						  html += data[i] + '<br/>';
					  }
					  $users.html(html);
				  })
				  //Bind an event handler to the messageForm.
				  //Every time its submitted we want to send the message to the server
				  $messageForm.submit(function(e){
					  //prevent the page from refreshing, just send to the server.
					  e.preventDefault();
					  //#0000 message validation look for messageError and 
					  if($messageBox.val().length === 0){
					  	
					  	$($messageError).html('Please enter text first.').addClass("animated wobble");;
					  }else{
					  //emit will send the message over it takes 2 parameters
					  //the first parameter can be named anything. it is naming the event we will send to the server.
					  //the second is the data we will be sending to the server. We are sending whatever the user types into the message box.
					  socket.emit('send message', $messageBox.val(), function(data){
						  $chat.append('<span class = "error">' + data + "</span><br/>");
					  });
					  //then we will clear the message box.
					  $messageBox.val('');
					  $($messageError).html('');
					  // from here we have sent our message to the server, but our server has to respond
						}
				  });
			  
				  //Version 4: We have to recieve the 'load old messages' function here from the backend.
			  
				  socket.on('load old msgs', function(docs){
					  //Version 4: After limiting and sorting, we want it to display the most recent on the bottom, like a regular chat. So, well grab a have to redo this for loop so that it grabs the max and decreases instead.
					  //for(var i = 0; i < docs.length; i++){
					  for(var i = docs.length - 1; i >= 0; i--){
						  displayMsg(docs[i]);
					  }
				  });
			  
				  //next we have to recieve the message on the client side / front end. so we're going to create an event that reads socket.on('new message',) that got emitted in the send message function on the backend's ('send message').
			  
				  //here we're creating a function that will update the nicknames list
			  
				  socket.on('new message', function(data){
					  //Version 4 change we're displaying this info again in the load old messages function, so we'll get rid of it and place it in a function and just call the function
					  //$chat.append('<span class = "msg"><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
					  displayMsg(data);
				  });
			  
				  //Version 4 we're displaying the same chat information multiple times so here we'll create a displayMsg function
				  function displayMsg(data){
					  $chat.append('<span class = "msg badge badge-pill badge-secondary animated rotateInUpLeft"><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
				  };
			  
				  //lets get the whisper function from the backend, and display it here on the client side.
				  socket.on('whisper', function(data){
					  $chat.append('<span class = "whisper badge badge-pill badge-warning animated flash"><b>' + data.nick + '</b>' + ': ' + data.msg + '<span><br /><br/>');
				  });
				 
				  //Auto Scroll Down		  
				  window.setInterval(function() {
					var elem = document.getElementById('chat');
					elem.scrollTop = elem.scrollHeight;
					}, 50);

			  });