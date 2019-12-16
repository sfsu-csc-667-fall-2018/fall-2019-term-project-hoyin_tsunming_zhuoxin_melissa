// https://github.com/oskosk/express-socket.io-session/blob/master/example/index.js

exports = module.exports = function(io) {
  var usernames = {};
  var users = [];
  var rooms = [];
  var messages = [];

  //chessboard attributes
  var players;
  var joined = true;
  var games = {};

  io.sockets.on("connection", function(socket) {
    socket.username =
      socket.handshake.session.userInfo.firstName +
      " " +
      socket.handshake.session.userInfo.lastName;
    if (users[socket.handshake.session.userInfo.id] === undefined) {
      users[socket.handshake.session.userInfo.id] = {
        username: socket.username,
        userid: socket.handshake.session.userInfo.id
      };
      io.sockets.emit("loadUsers", users, socket.handshake.session.userInfo.id);
    } else {
      socket.emit("loadUsers", users, socket.handshake.session.userInfo.id);
    }

    if (messages.length > 0) {
      socket.emit("loadMessages", messages);
    }

    socket.on("new_mesage", function(data) {
      var ts = new Date();
      var full_msg =
        data.message + "-" + socket.username + "-" + ts.toLocaleTimeString();
      messages.push(full_msg);
      if (messages.length > 10) {
        messages.shift();
      }
      io.sockets.emit("broadcast", {
        message: data.message,
        username: socket.username
      });
    });

    //chessboard functionality
    var color;
    var playerId = Math.floor(Math.random() * 100 + 1);
    console.log(playerId + " connected");

    socket.on("joined", function(roomId) {
      if (!games.hasOwnProperty(roomId)) {
        games[roomId] = {
          moves: [],
          chatMessages: [],
          players: 0,
          pid: [0, 0]
        };
      }

      socket.roomId = roomId;
      socket.playerId = playerId;
      if (games[roomId].players < 2) {
        //first two players will be participents.
        games[roomId].players++;
        var Idx = games[socket.roomId].pid.indexOf(0); // assign empty index of array to player
        games[roomId].pid[Idx] = playerId;
      } else {
        console.log("room full");
        socket.emit("audience", true); // the players joined after 2nd will be audience/guests.
        socket.audience = true;
        // return;
      }

      players = games[roomId].players;

      if (Idx == 1) color = "black";
      // idx:0 (player one) will be while and idx:1 (player two and guests) will be black;
      //2nd player will be black
      else color = "white";

      var preViousMoves = [];
      if (games[roomId].moves.length > 0) {
        preViousMoves = games[roomId].moves;
      }

      playerType = Idx + 1; //to display player number on the front page.
      if (socket.audience) {
        playerType = "Guest";
      }

      socket.join(roomId);

      socket.emit("player", {
        playerId,
        players,
        playerType,
        color,
        roomId,
        preViousMoves,
        chatMessages: games[roomId].chatMessages
      });
      // players--;
    });

    socket.on("move", function(msg) {
      games[socket.roomId].moves.push(msg.move);
      socket.broadcast.emit("move", msg);
    });

    // user chat msg
    socket.on("user_chat_msg", function(msgObj) {
      games[socket.roomId].chatMessages.push(msgObj);
      io.in(socket.roomId).emit("user_chat_msg_received", msgObj);
    });

    socket.on("play", function(msg) {
      // socket.broadcast.emit("play", msg);
      socket.to(socket.roomId).emit("play", msg);
    });

    socket.on("disconnect", function() {
      if (games.hasOwnProperty(socket.roomId)) {
        if (!socket.audience) {
          var Idx = games[socket.roomId].pid.indexOf(socket.playerId); // unset player array index on disconnect.
          games[socket.roomId].pid[Idx] = 0;

          games[socket.roomId].players--;
          socket.broadcast.emit("user_left", true);

          if (games[socket.roomId].players == 0) {
            console.log("room deleted");
            delete games[socket.roomId];
          }
        }
      }

      delete users[socket.handshake.session.userInfo.id];
      io.sockets.emit("deleteChatUser", socket.handshake.session.userInfo.id);
      console.log(playerId + " disconnected");
    });
  });
};
