/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE - P2P REALTIME NETWORK (PeerJS / WebRTC)
 * ============================================================
 *  Cho phép 2 người chơi đấu trực tuyến trên Internet hoàn toàn
 *  serverless thông qua WebRTC PeerJS. Không tốn chi phí duy trì server!
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.P2PNetwork = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function P2PNetwork(options) {
    options = options || {};
    this.peer = null;
    this.conn = null;
    this.myPeerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.callbacks = {};
  }

  /**
   * Đăng ký sự kiện
   */
  P2PNetwork.prototype.on = function (event, callback) {
    this.callbacks[event] = callback;
  };

  /**
   * Phát sự kiện nội bộ
   */
  P2PNetwork.prototype._emit = function (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  };

  /**
   * Tạo phòng đấu mới (Host)
   */
  P2PNetwork.prototype.createRoom = function (customCode, callback) {
    var self = this;
    this.isHost = true;
    this.roomCode = customCode || ('' + Math.floor(100000 + Math.random() * 900000));
    var peerId = 'cotuong_' + this.roomCode;

    // Kiểm tra thư viện PeerJS
    if (typeof Peer === 'undefined') {
      this._emit('error', 'Thư viện PeerJS chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng!');
      return;
    }

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', function (id) {
        self.myPeerId = id;
        self._emit('room_created', { roomCode: self.roomCode, peerId: id });
        if (callback) callback(self.roomCode);
      });

      this.peer.on('connection', function (connection) {
        self.conn = connection;
        self._setupConnection();
        self._emit('player_joined', { isHost: false });
      });

      this.peer.on('error', function (err) {
        self._emit('error', 'Lỗi P2P: ' + (err.message || err.type));
      });
    } catch (e) {
      this._emit('error', 'Không thể khởi tạo P2P Connection');
    }
  };

  /**
   * Tham gia phòng đã tạo (Guest)
   */
  P2PNetwork.prototype.joinRoom = function (roomCode, callback) {
    var self = this;
    this.isHost = false;
    this.roomCode = roomCode;
    var hostPeerId = 'cotuong_' + roomCode;

    if (typeof Peer === 'undefined') {
      this._emit('error', 'Thư viện PeerJS chưa sẵn sàng!');
      return;
    }

    try {
      this.peer = new Peer(null, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', function (id) {
        self.myPeerId = id;
        self.conn = self.peer.connect(hostPeerId, { reliable: true });
        self._setupConnection();

        if (callback) callback(true);
      });

      this.peer.on('error', function (err) {
        self._emit('error', 'Không thể kết nối đến phòng này. Mã phòng không đúng hoặc đã đóng!');
        if (callback) callback(false);
      });
    } catch (e) {
      this._emit('error', 'Kết nối thất bại');
      if (callback) callback(false);
    }
  };

  /**
   * Cấu hình lắng nghe dữ liệu WebRTC
   */
  P2PNetwork.prototype._setupConnection = function () {
    var self = this;
    if (!this.conn) return;

    this.conn.on('open', function () {
      self._emit('connected', { isHost: self.isHost });
    });

    this.conn.on('data', function (data) {
      if (!data || !data.type) return;

      switch (data.type) {
        case 'MOVE':
          self._emit('opponent_move', data.move);
          break;
        case 'CHAT':
          self._emit('chat_message', data);
          break;
        case 'GAME_INIT':
          self._emit('game_init', data);
          break;
        case 'OFFER_DRAW':
          self._emit('offer_draw', data);
          break;
        case 'ACCEPT_DRAW':
          self._emit('accept_draw', data);
          break;
        case 'RESIGN':
          self._emit('opponent_resign', data);
          break;
        case 'REMATCH_OFFER':
          self._emit('rematch_offer', data);
          break;
        case 'REMATCH_ACCEPT':
          self._emit('rematch_accept', data);
          break;
        case 'PLAYER_INFO':
          self._emit('opponent_info', data.user);
          break;
        default:
          self._emit('custom_message', data);
          break;
      }
    });

    this.conn.on('close', function () {
      self._emit('disconnected', 'Đối thủ đã rời khỏi phòng!');
    });

    this.conn.on('error', function (err) {
      self._emit('error', 'Lỗi đường truyền P2P!');
    });
  };

  /**
   * Gửi dữ liệu qua P2P
   */
  P2PNetwork.prototype.send = function (data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  };

  P2PNetwork.prototype.sendData = P2PNetwork.prototype.send;

  /**
   * Gửi nước cờ cho đối thủ
   */
  P2PNetwork.prototype.sendMove = function (move) {
    this.send({ type: 'MOVE', move: move });
  };

  /**
   * Gửi tin nhắn Chat
   */
  P2PNetwork.prototype.sendChat = function (senderName, text) {
    this.send({
      type: 'CHAT',
      sender: senderName,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  /**
   * Gửi thông tin người chơi
   */
  P2PNetwork.prototype.sendPlayerInfo = function (user) {
    this.send({ type: 'PLAYER_INFO', user: user });
  };

  /**
   * Khởi tạo bàn cờ (Host gửi cấu hình cho Guest)
   */
  P2PNetwork.prototype.sendGameInit = function (timeControl, betAmount, hostColor) {
    this.send({
      type: 'GAME_INIT',
      timeControl: timeControl,
      betAmount: betAmount,
      guestColor: hostColor === 'red' ? 'black' : 'red'
    });
  };

  /**
   * Đóng kết nối P2P
   */
  P2PNetwork.prototype.disconnect = function () {
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.conn = null;
    this.peer = null;
    this.roomCode = null;
  };

  return P2PNetwork;
}));
