/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE - REALTIME CLOUD SYNC (ĐA THIẾT BỊ / SERVERLESS)
 * ============================================================
 *  Đồng bộ danh sách phòng và kỳ thủ online qua Internet giữa các
 *  trình duyệt và thiết bị khác nhau (PC, Mobile, Tablet) trong thời gian thực.
 *  Sử dụng Public WebSocket MQTT Broker (EMQX / HiveMQ) - Không tốn chi phí server.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RealtimeSync = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt'
  ];

  var TOPICS = {
    ROOM_CREATED: 'cotuong24h/v1/rooms/created',
    ROOM_UPDATED: 'cotuong24h/v1/rooms/updated',
    ROOM_CLOSED: 'cotuong24h/v1/rooms/closed',
    PRESENCE: 'cotuong24h/v1/presence',
    SYNC_REQ: 'cotuong24h/v1/sync/request',
    SYNC_RES: 'cotuong24h/v1/sync/response'
  };

  function RealtimeSync() {
    this.client = null;
    this.clientId = 'ct_dev_' + Math.random().toString(16).substr(2, 8);
    this.isConnected = false;
    this.callbacks = {};
    this.heartbeatTimer = null;
    this.onlinePeers = {}; // { peerId: { user, lastSeen } }
    this.brokerIndex = 0;
  }

  RealtimeSync.prototype.on = function (event, callback) {
    this.callbacks[event] = callback;
  };

  RealtimeSync.prototype._emit = function (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  };

  /**
   * Khởi động kết nối Realtime Sync
   */
  RealtimeSync.prototype.init = function (storageInstance) {
    var self = this;
    this.storage = storageInstance;

    if (typeof mqtt === 'undefined') {
      console.warn('Thư viện MQTT chưa nạp. Đang chạy chế độ Local Sync.');
      return;
    }

    this._connectBroker();
  };

  RealtimeSync.prototype._connectBroker = function () {
    var self = this;
    var brokerUrl = BROKERS[this.brokerIndex % BROKERS.length];

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 6000
      });

      this.client.on('connect', function () {
        self.isConnected = true;
        console.log('✅ Realtime Cloud Sync đã kết nối thành công:', brokerUrl);

        // Đăng ký toàn bộ các kênh đồng bộ
        Object.values(TOPICS).forEach(function (topic) {
          self.client.subscribe(topic, { qos: 0 });
        });

        // Yêu cầu đồng bộ danh sách phòng từ các thiết bị khác đang online
        self._publish(TOPICS.SYNC_REQ, { fromId: self.clientId, time: Date.now() });

        self._emit('connected');
      });

      this.client.on('message', function (topic, message) {
        try {
          var data = JSON.parse(message.toString());
          self._handleIncomingMessage(topic, data);
        } catch (e) {
          // Bỏ qua bản tin không đúng định dạng
        }
      });

      this.client.on('error', function () {
        self.isConnected = false;
      });

      this.client.on('close', function () {
        self.isConnected = false;
      });
    } catch (e) {
      console.warn('Lỗi kết nối broker, chuyển sang broker dự phòng:', e);
      this.brokerIndex++;
      setTimeout(function () { self._connectBroker(); }, 3000);
    }
  };

  RealtimeSync.prototype._publish = function (topic, data) {
    if (this.client && this.isConnected) {
      try {
        var payload = Object.assign({}, data, { senderId: this.clientId });
        this.client.publish(topic, JSON.stringify(payload));
      } catch (e) {}
    }
  };

  /**
   * Xử lý bản tin nhận được từ các thiết bị khác qua Cloud
   */
  RealtimeSync.prototype._handleIncomingMessage = function (topic, data) {
    var self = this;
    // Bỏ qua bản tin do chính mình phát đi
    if (data.senderId === this.clientId) return;

    switch (topic) {
      case TOPICS.ROOM_CREATED:
      case TOPICS.ROOM_UPDATED:
        if (data.room && self.storage) {
          self.storage.addOrUpdateRoom(data.room);
          self._emit('rooms_changed');
        }
        break;

      case TOPICS.ROOM_CLOSED:
        if (data.roomCode && self.storage) {
          self.storage.removeRoom(data.roomCode);
          self._emit('rooms_changed');
        }
        break;

      case TOPICS.PRESENCE:
        if (data.user && data.user.id) {
          self.onlinePeers[data.user.id] = {
            user: data.user,
            lastSeen: Date.now()
          };
          self._pruneStalePeers();
          self._emit('presence_changed', self.getOnlineUsers());
        }
        break;

      case TOPICS.SYNC_REQ:
        // Thiết bị khác vừa vào hỏi danh sách phòng -> Gửi các phòng mình đang có
        if (self.storage) {
          var activeRooms = self.storage.getRooms();
          if (activeRooms && activeRooms.length > 0) {
            self._publish(TOPICS.SYNC_RES, { rooms: activeRooms, targetId: data.fromId });
          }
        }
        break;

      case TOPICS.SYNC_RES:
        // Nhận danh sách phòng được chia sẻ từ thiết bị khác
        if (data.rooms && Array.isArray(data.rooms) && self.storage) {
          data.rooms.forEach(function (r) {
            self.storage.addOrUpdateRoom(r);
          });
          self._emit('rooms_changed');
        }
        break;
    }
  };

  RealtimeSync.prototype._pruneStalePeers = function () {
    var now = Date.now();
    var TIMEOUT_MS = 25000; // 25 giây không ping coi như offline
    for (var uid in this.onlinePeers) {
      if (now - this.onlinePeers[uid].lastSeen > TIMEOUT_MS) {
        delete this.onlinePeers[uid];
      }
    }
  };

  /**
   * Lấy danh sách kỳ thủ đang online thực tế từ Cloud
   */
  RealtimeSync.prototype.getOnlineUsers = function (excludeUserId) {
    this._pruneStalePeers();
    var list = [];
    for (var uid in this.onlinePeers) {
      if (!excludeUserId || uid !== excludeUserId) {
        list.push(this.onlinePeers[uid].user);
      }
    }
    return list;
  };

  /**
   * Phát thông báo tạo phòng tới toàn bộ các thiết bị khác
   */
  RealtimeSync.prototype.broadcastRoomCreated = function (room) {
    this._publish(TOPICS.ROOM_CREATED, { room: room });
  };

  /**
   * Phát thông báo cập nhật phòng (có người vào, đổi trạng thái)
   */
  RealtimeSync.prototype.broadcastRoomUpdated = function (room) {
    this._publish(TOPICS.ROOM_UPDATED, { room: room });
  };

  /**
   * Phát thông báo đóng/hủy phòng tới toàn bộ các thiết bị
   */
  RealtimeSync.prototype.broadcastRoomClosed = function (roomCode) {
    this._publish(TOPICS.ROOM_CLOSED, { roomCode: roomCode });
  };

  /**
   * Bắt đầu gửi Heartbeat định kỳ thông báo người chơi đang online
   */
  RealtimeSync.prototype.startHeartbeat = function (getUserCallback) {
    var self = this;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    var sendPing = function () {
      var user = getUserCallback ? getUserCallback() : null;
      if (user && user.id) {
        self._publish(TOPICS.PRESENCE, {
          user: {
            id: user.id,
            displayName: user.displayName || user.username,
            avatar: user.avatar || '🐉',
            elo: user.elo || 1200,
            status: 'online'
          }
        });
      }
    };

    sendPing();
    this.heartbeatTimer = setInterval(sendPing, 8000); // Mỗi 8 giây ping 1 lần
  };

  /**
   * Yêu cầu đồng bộ phòng ngay lập tức từ các thiết bị khác đang online
   */
  RealtimeSync.prototype.requestRoomsSync = function () {
    this._publish(TOPICS.SYNC_REQ, { fromId: this.clientId, time: Date.now() });
  };

  RealtimeSync.prototype.stopHeartbeat = function () {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  };

  return new RealtimeSync();
}));
