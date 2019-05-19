const _ = require("underscore");
const WebSocket = require("ws");

const PLAYERS_TO_START = 2;

const GAME_STATE_NOT_STARTED = "not_started";
const GAME_STATE_PENDING_START = "started";
const GAME_STATE_PLAY = "play";
const GAME_STATE_FINISH = "finish";

const GAME_BEFORE_TIMEOUT = 1 * 60 * 1000;
const GAME_TIMELINE_SIZE = 60 * 60 * 1000;
const GAME_BUFFER_TIMEOUTS = 10 * 60 * 1000;

const GAME_RADIUS_M = 1000;

class Server {
  constructor(port) {
    this.sockets = [];
    this.socketIdx = 0;
    this.games = [];
    this.gameIdx = 0;
    this.tokens = [];
    this.gameTimers = [];

    this.wss = new WebSocket.Server({
      port: port | 3000,
      verifyClient: (info, cb) => {
        const params = info.req.url.slice(2);
        const pairs = params.split("=");
        if (pairs.length < 2) {
          return cb(false, 401, "Unauthorized");
        }
        const token = pairs[1];
        if (!token) {
          cb(false, 401, "Unauthorized");
        } else {
          if (this.tokens.indexOf(token) !== -1) {
            cb(false, 401, "Already connected");
          } else {
            info.req.user = token;
            this.tokens.push(token);
            cb(true);
          }
        }
      }
    });

    this.wss.on("connection", ws => {
      const id = this.socketIdx;
      const socket = { id, ws, user: ws.upgradeReq.user };
      this.sockets.push(socket);
      this.socketIdx++;
      const myGame = this._getMyGame(socket);
      if(myGame) {
        socket.ws.send(JSON.stringify({
          type: "set_my_game",
          message: myGame
        }));
      }
      socket.ws.send(JSON.stringify({
        type: "set_games",
        message: this.games
      }));
      ws.on("message", message => {
        this.onMessage(socket, message);
      });
      ws.on("close", () => {
          const idx = _.findIndex(this.sockets, { id });
        if (idx !== -1) {
          this.sockets.splice(idx, 1);
          const tid = this.tokens.indexOf(id);
          if (tid !== -1) {
            this.tokens.splice(tid, 1); // remove token
          }
        }
      });
    });

    this._gameLoopInterval = setInterval(() => {
      this._calcTimers();
      this._sendTimers();
    }, 1000);
  }

  _fixGames() {
    for(let i = 0; i < this.players.length; i++) {
      const socket = this.players[i];
      socket.ws.send(JSON.stringify({
        type: "set_games",
        message: this.games
      }));
    }
  }

  _getSocketByToken(token) {
    return _.findWhere(this.sockets, { user: token });
  }

  // get game for socket
  // NOTE: get firts my game
  _getMyGame(socket) {
    for (let i = 0; i < this.games.length; i++) {
      const game = this.games[i];
      const index = game.players.indexOf(socket.user);
      if (index !== -1) {
        return game;
      }
    }
  }

  // add user to game
  _joinUserToGame(game, socket) {
    this.games.players.push(socket.user);
  }

  onMessage(socket, playload) {
    try {
      const data = JSON.parse(playload);
      switch (data.type) {
        case "chat": {
          this.onChat(socket, data.message);
          break;
        }
        case "create": {
          this.onCreate(socket, data.message);
          break;
        }
        case "join": {
          this.onJoin(socket, data.message);
          break;
        }
        case "action": {
          this.onAction(socket, data.message);
          break;
        }
        case "geo": {
          this.onGeo(socket, data.message);
          break;
        }
        default: {
          console.warn(
            `unexpected message type: ${data.type}, data: ${data.message}`
          );
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  onChat(socket, message) {
    this._sendChat(socket, message);
  }
  

  onAction(socket, action) {
    const myGame = this._getMyGame(socket);
    if (!myGame) {
      return this._sendError(socket, "You is not connected in specified game");
    }

    if (!myGame.state !== GAME_STATE_PLAY) {
      return this._sendError(socket, "Specified game is not started");
    }

    try {
      this._processAction(socket, myGame, action);
      this._sendTimers();
    } catch (error) {
      this._sendError(socket, `Unexpected error`);
    }
  }

  _sendError(socket, message) {
    socket.ws.send(JSON.stringify({
      type: "error",
      message,
    }));    
  }

  _calcTimers() {
    this.gameTimers.forEach(t => {});
  }

  _sendTimers() {
    this.gameTimers.forEach(t => {
      t.game.players.forEach(p => {
        const socket = this._getSocketByToken(p.id);
        socket.ws.send({
          type: "sync_timer",
          message: t
        });
      });
    });
  }

  _processAction(socket, game, action) {
    const role = this._findMyRole(myGame, socket);
    if (!role) {
      throw "You role is not existing";
    }

    // проверяем началный таймаут
    if (Date.now() - game.started_at < GAME_BEFORE_TIMEOUT) {
      throw "Before timeout";
    }

/*
------------------------------
|   SET       |    BRAKE     |
------------------------------
|      1      |      1       |
------------------------------
|             |              |
|             |     10       |
|             |--------------|
|             |              |
|      60     |              |
|             |              |
|             |      60      |
|             |              |
|-------------|              |
|             |              |
|     10      |              |
------------------------------
*/

    // если роль set разрешаем установку таймеров
    if (role === "set") {
      // проверяем буферный таймаут чтобы понять что не находимся в последней стадии игры
      if (
        Date.now() - game.started_at >=
        GAME_BEFORE_TIMEOUT + GAME_TIMELINE_SIZE
      ) {
        throw "Game timeout";
      }

      // проверям на пересечение (TODO)
      // если пересекается то добавляем к таймеру
      // если не пересекатся то создаем новый

      if (this.gameTimers.length <= 0) {
        this.gameTimers.push({
          owner: socket.id,
          role: "set",
          created_at: Date.now(),
          set: 1,
          brake: 0,
          game
        });
      } else {
        this.gameTimers[0].set++;
      }
    } else {
      // если роль brake проверям буферный таймаут иначе даем выполнить снос
      if (
        Date.now() - game.started_at <
        GAME_BEFORE_TIMEOUT + GAME_BUFFER_TIMEOUTS
      ) {
        throw "You not allowed this action";
      }

      // проверяем на попадание (TODO)
      // если попадает в таймер установленный коммандой set, то добавлем ему
      if (this.gameTimers.length <= 0) {
        this.gameTimers[0].brake++;
      }
    }
  }

  _isGameReadyToStart(game) {
    return game.players.length >= PLAYERS_TO_START;
  }

  _findMyRole(game, socket) {
    if (game.set.indexOf(socket.id) !== -1) {
      return "set";
    }
    if (game.brake.indexOf(socket.id) !== -1) {
      return "brake";
    }
  }

  onCreate(socket, data) {
    const myGame = this._getMyGame(socket);
    if (myGame) {
      return this._sendError(socket, "You already connected to existing game");
    }

    const game = {
      id: this.gameIdx,
      players: [socket.user],
      set: [],
      brake: [],
      created_at: Date.now(),
      started_at: 0,
      state: GAME_STATE_NOT_STARTED,
      radius: GAME_RADIUS_M,
      data,
      owner: socket.user,
    };
    
    this.games.push(game);
    this.gameIdx++;

    // send all
    this._broadcast(null, {
      type: "add_game",
      message: game
    });
    
    // send self
    socket.ws.send(JSON.stringify({
      type: "set_my_game",
      message: game
    }));

    this._fixGames();
  }

  onJoin(socket, data) {
    const myGame = this._getMyGame(socket);

    if (myGame) {
      return this._sendError(socket, "You already connected to existing game");
    }

    const game = _.findWhere(this.games, { id: data });
    if (!game) {
      return this._sendError(socket, "Specified game not existing");
    }

    const state2Join = [GAME_STATE_NOT_STARTED];
    if (state2Join.indexOf(game.state) === -1) {
      return this._sendError(socket, "You not allowed to connected on running game");
    }   

    game.players.push(socket.user);

    socket.ws.send(JSON.stringify({
      type: "set_my_game",
      message: game
    }));

    if (this._isGameReadyToStart(game)) {
      game.state = GAME_STATE_PENDING_START; // setup timer to before game timeout
      game.players = _.shuffle(game.players);
      game.set = game.players.slice(0, PLAYERS_TO_START / 2);
      game.brake = game.players.slice(PLAYERS_TO_START / 2);
      game.started_at = Date.now();
      for (let i = 0; i < game.players.length; i++) {
        const socket = this._getSocketByToken(game.players[i]);
        console.log('socket', socket.user)
        if (socket) {
          socket.ws.send(JSON.stringify({
            type: "set_my_game",
            message: game
          }));
        }
      }
    }

    this._fixGames();
  }

  onGeo(socket, data) {
    // TODO: Искать свою игру и отправлять только своей команде
    this._sendTeam(socket, data.point);
  }

  _broadcast(sender, packet) {
    const data = JSON.stringify(packet);
    for (let i = 0; i < this.sockets.length; i++) {
      const socket = this.sockets[i];
      if (sender) {
        if (socket.id !== sender.id) {
          socket.ws.send(data);
        }
      } else {
        socket.ws.send(data);
      }
    }
  }

  _sendChat(socket, message) {
    this._broadcast(socket, {
      type: "chat",
      message: {
        token: message.token,
        message: message.message,
        dt: Date.now()
      }
    });
  }

  _sendTeam(socket, point) {
    this._broadcast(socket, {
      type: "team",
      message: {
        token: socket.user,
        point,
        dt: Date.now()
      }
    });
  }
}

const server = new Server(3000);
