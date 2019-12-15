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
        games[roomId] = { players: 0, pid: [0, 0] };
      }

      socket.roomId = roomId;
      if (games[roomId].players < 2) {
        games[roomId].players++;
        games[roomId].pid[games[roomId].players - 1] = playerId;
      } else {
        console.log("room full");
        socket.emit("audience", true);
        // return;
      }

      console.log(games[roomId]);
      players = games[roomId].players;

      if (players % 2 == 0) color = "black";
      //2nd player will be black
      else color = "white";

      socket.emit("player", { playerId, players, color, roomId });
      // players--;
    });

    socket.on("move", function(msg) {
      socket.broadcast.emit("move", msg);
    });

    socket.on("play", function(msg) {
      socket.broadcast.emit("play", msg);
      console.log("ready " + msg);
    });

    socket.on("disconnect", function() {
      // if (
      //   games[socket.roomId].pid[0] == playerId ||
      //   games[socket.roomId].pid[1] == playerId
      // ) {
      //   games[socket.roomId].players--;
      //   socket.broadcast.emit("user_left", true);
      //   console.log(games[socket.roomId]);
      // }
      if (games.hasOwnProperty(socket.roomId)) {
        games[socket.roomId].players--;
        socket.broadcast.emit("user_left", true);
        console.log(games[socket.roomId]);

        if (games[socket.roomId].players == 0) {
          console.log("room deleted");
          delete games[socket.roomId];
        }
      }

      delete users[socket.handshake.session.userInfo.id];
      io.sockets.emit("deleteChatUser", socket.handshake.session.userInfo.id);
      console.log(playerId + " disconnected");
    });
  });
};
