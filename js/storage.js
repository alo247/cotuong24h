/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE - QUẢN LÝ DỮ LIỆU CỤC BỘ & VÍ TIỀN (STORAGE & WALLET)
 * ============================================================
 *  Quản lý thành viên, ELO, Ví tiền (Xu), Giao dịch, Bạn bè & Admin
 *  Chạy trực tiếp trên Trình duyệt / Vercel (Không cần server).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppStorage = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEYS = {
    USERS: 'cotuong_users',
    CURRENT_USER: 'cotuong_current_user',
    GAMES: 'cotuong_games',
    TRANSACTIONS: 'cotuong_transactions',
    FRIENDS: 'cotuong_friends',
    SETTINGS: 'cotuong_settings',
    ROOMS: 'cotuong_rooms'
  };

  // Khởi tạo dữ liệu mẫu ban đầu nếu chưa có
  function initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      var defaultUsers = [
        {
          id: 'u_admin',
          username: 'admin',
          password: '123', // Mật khẩu mẫu
          displayName: 'Quản Trị Viên (Admin)',
          avatar: '👑',
          elo: 2000,
          balance: 10000000,
          wins: 50,
          losses: 5,
          draws: 2,
          role: 'admin',
          status: 'online',
          isBanned: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'u_kythu1',
          username: 'kythu_pro',
          password: '123',
          displayName: 'Kỳ Thủ Đại Sư',
          avatar: '🦁',
          elo: 1850,
          balance: 500000,
          wins: 120,
          losses: 35,
          draws: 15,
          role: 'user',
          status: 'online',
          isBanned: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'u_nguyenvana',
          username: 'nguyenvana',
          password: '123',
          displayName: 'Nguyễn Văn A',
          avatar: '🐉',
          elo: 1420,
          balance: 100000,
          wins: 25,
          losses: 18,
          draws: 5,
          role: 'user',
          status: 'online',
          isBanned: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'u_tranthib',
          username: 'tranthib',
          password: '123',
          displayName: 'Trần Thị B',
          avatar: '🐯',
          elo: 1280,
          balance: 50000,
          wins: 10,
          losses: 12,
          draws: 2,
          role: 'user',
          status: 'offline',
          isBanned: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      var defaultTx = [
        {
          id: 'tx_init_1',
          userId: 'u_admin',
          type: 'deposit',
          amount: 10000000,
          balanceAfter: 10000000,
          description: 'Hệ thống nạp ban đầu cho Admin',
          date: new Date().toISOString()
        },
        {
          id: 'tx_init_2',
          userId: 'u_kythu1',
          type: 'deposit',
          amount: 500000,
          balanceAfter: 500000,
          description: 'Nạp xu thưởng tân thủ',
          date: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(defaultTx));
    }

    if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
      var defaultFriends = [
        { userId: 'u_kythu1', friendId: 'u_nguyenvana', status: 'accepted' }
      ];
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(defaultFriends));
    }

    if (!localStorage.getItem(STORAGE_KEYS.GAMES)) {
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify([]));
    }

    // Phòng chơi: khởi tạo mảng rỗng — KHÔNG tạo phòng ảo/đối thủ ảo
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([]));
    }

    // Dọn dẹp phòng ảo cũ (nếu có từ phiên bản trước)
    _purgeGhostRooms();
  }

  initDefaultData();

  /**
   * Dọn phòng ảo: xóa phòng giả từ phiên bản cũ (code cứng 888888, 666666, 123456)
   * và xóa tất cả phòng không có kết nối P2P thật (quá 30 phút không hoạt động).
   */
  function _purgeGhostRooms() {
    try {
      var rooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS)) || [];
      var ghostCodes = ['888888', '666666', '123456'];
      var now = Date.now();
      var MAX_AGE_MS = 30 * 60 * 1000; // 30 phút hết hạn

      var cleaned = rooms.filter(function (r) {
        // Xóa phòng ảo code cứng từ phiên bản cũ
        if (ghostCodes.indexOf(r.code) !== -1) return false;
        // Xóa phòng quá hạn (tạo hơn 30 phút mà vẫn "waiting" → không có ai kết nối thật)
        var age = now - new Date(r.createdAt).getTime();
        if (r.status === 'waiting' && age > MAX_AGE_MS) return false;
        return true;
      });

      if (cleaned.length !== rooms.length) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(cleaned));
      }
    } catch (e) { /* bỏ qua lỗi */ }
  }

  function AppStorage() {}

  /* ================= Auth & User Management ================= */

  AppStorage.prototype.getUsers = function () {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  };

  AppStorage.prototype.saveUsers = function (users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  };

  AppStorage.prototype.getCurrentUser = function () {
    try {
      var user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
      if (!user) return null;
      // Refresh current user data from storage
      var users = this.getUsers();
      var found = users.find(function (u) { return u.id === user.id; });
      return found || user;
    } catch (e) {
      return null;
    }
  };

  AppStorage.prototype.setCurrentUser = function (user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  };

  AppStorage.prototype.login = function (username, password) {
    var users = this.getUsers();
    var user = users.find(function (u) {
      return (u.username.toLowerCase() === username.toLowerCase() || u.email === username) && u.password === password;
    });

    if (!user) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    if (user.isBanned) {
      return { success: false, message: 'Tài khoản của bạn đã bị khóa bởi Admin!' };
    }

    user.status = 'online';
    user.lastLogin = new Date().toISOString();
    this.saveUsers(users);
    this.setCurrentUser(user);

    return { success: true, user: user };
  };

  AppStorage.prototype.register = function (data) {
    var users = this.getUsers();
    var existing = users.find(function (u) {
      return u.username.toLowerCase() === data.username.toLowerCase();
    });

    if (existing) {
      return { success: false, message: 'Tên tài khoản này đã được sử dụng!' };
    }

    var newUser = {
      id: 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      username: data.username,
      password: data.password,
      displayName: data.displayName || data.username,
      avatar: data.avatar || '🐉',
      elo: 1200,
      balance: 100000, // Tặng 100k Xu miễn phí khi đăng ký tân thủ
      wins: 0,
      losses: 0,
      draws: 0,
      role: 'user',
      status: 'online',
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    // Ghi nhận thưởng tân thủ
    this.addTransaction(newUser.id, 'deposit', 100000, 'Thưởng 100,000 Xu chào mừng tân thủ');

    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  AppStorage.prototype.logout = function () {
    var current = this.getCurrentUser();
    if (current) {
      var users = this.getUsers();
      var user = users.find(function (u) { return u.id === current.id; });
      if (user) {
        user.status = 'offline';
        this.saveUsers(users);
      }
    }
    this.setCurrentUser(null);
  };

  /* ================= Wallet & Transactions ================= */

  AppStorage.prototype.getTransactions = function (userId) {
    try {
      var txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
      if (userId) {
        return txs.filter(function (t) { return t.userId === userId; });
      }
      return txs;
    } catch (e) {
      return [];
    }
  };

  AppStorage.prototype.addTransaction = function (userId, type, amount, description, adminId) {
    var users = this.getUsers();
    var user = users.find(function (u) { return u.id === userId; });
    if (!user) return { success: false, message: 'Người dùng không tồn tại' };

    if (type === 'deposit' || type === 'bet_win' || type === 'bet_refund') {
      user.balance += amount;
    } else if (type === 'withdraw' || type === 'bet_lose' || type === 'bet_pay') {
      if (user.balance < amount) {
        return { success: false, message: 'Số dư Xu không đủ!' };
      }
      user.balance -= amount;
    }

    var tx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: userId,
      type: type,
      amount: amount,
      balanceAfter: user.balance,
      description: description,
      adminId: adminId || null,
      date: new Date().toISOString()
    };

    var txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    txs.unshift(tx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

    this.saveUsers(users);

    // Cập nhật current user nếu trùng
    var current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(user);
    }

    return { success: true, balance: user.balance, tx: tx };
  };

  /* ================= ELO & Match Result ================= */

  AppStorage.prototype.recordGameResult = function (redUser, blackUser, winnerColor, betAmount, movesHistory) {
    var users = this.getUsers();
    var red = users.find(function (u) { return u.id === redUser.id; });
    var black = users.find(function (u) { return u.id === blackUser.id; });

    // Tính toán ELO
    var K = 32;
    var expRed = 1 / (1 + Math.pow(10, ((black ? black.elo : 1200) - (red ? red.elo : 1200)) / 400));
    var expBlack = 1 - expRed;

    var scoreRed = (winnerColor === 'red') ? 1 : (winnerColor === 'draw' ? 0.5 : 0);
    var scoreBlack = (winnerColor === 'black') ? 1 : (winnerColor === 'draw' ? 0.5 : 0);

    var deltaRed = Math.round(K * (scoreRed - expRed));
    var deltaBlack = Math.round(K * (scoreBlack - expBlack));

    if (red) {
      red.elo = Math.max(800, red.elo + deltaRed);
      if (winnerColor === 'red') red.wins++;
      else if (winnerColor === 'black') red.losses++;
      else red.draws++;
    }

    if (black) {
      black.elo = Math.max(800, black.elo + deltaBlack);
      if (winnerColor === 'black') black.wins++;
      else if (winnerColor === 'red') black.losses++;
      else black.draws++;
    }

    // Xử lý Cược & Phí Sàn (Thu phí 5% từ số tiền thắng)
    var feePercent = 0.05; // 5% phí sân thi đấu
    if (betAmount > 0) {
      if (winnerColor === 'red' && red && black) {
        var winAmount = Math.round(betAmount * (1 - feePercent));
        this.addTransaction(red.id, 'bet_win', winAmount, 'Thắng cược trận đấu cờ (đã trừ 5% phí sàn)');
        this.addTransaction(black.id, 'bet_lose', betAmount, 'Thua cược trận đấu cờ');
      } else if (winnerColor === 'black' && red && black) {
        var winAmount2 = Math.round(betAmount * (1 - feePercent));
        this.addTransaction(black.id, 'bet_win', winAmount2, 'Thắng cược trận đấu cờ (đã trừ 5% phí sàn)');
        this.addTransaction(red.id, 'bet_lose', betAmount, 'Thua cược trận đấu cờ');
      }
    }

    // Lưu thông tin trận đấu
    var gameRecord = {
      id: 'g_' + Date.now(),
      redPlayer: red ? red.displayName : 'Người chơi Đỏ',
      blackPlayer: black ? black.displayName : 'Người chơi Đen',
      redId: red ? red.id : null,
      blackId: black ? black.id : null,
      winner: winnerColor,
      betAmount: betAmount,
      deltaRed: deltaRed,
      deltaBlack: deltaBlack,
      movesCount: movesHistory ? movesHistory.length : 0,
      date: new Date().toISOString()
    };

    var games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES)) || [];
    games.unshift(gameRecord);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));

    this.saveUsers(users);

    return { deltaRed: deltaRed, deltaBlack: deltaBlack, game: gameRecord };
  };

  /* ================= Admin Functions ================= */

  AppStorage.prototype.getAdminStats = function () {
    var users = this.getUsers();
    var games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES)) || [];
    var txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];

    var totalCoins = users.reduce(function (sum, u) { return sum + u.balance; }, 0);
    var totalDeposits = txs.filter(function (t) { return t.type === 'deposit'; })
                           .reduce(function (sum, t) { return sum + t.amount; }, 0);

    return {
      totalUsers: users.length,
      totalGames: games.length,
      totalCoinsInSystem: totalCoins,
      totalDeposits: totalDeposits,
      activeUsers: users.filter(function (u) { return u.status === 'online'; }).length
    };
  };

  AppStorage.prototype.toggleBanUser = function (userId, adminId) {
    var users = this.getUsers();
    var user = users.find(function (u) { return u.id === userId; });
    if (!user) return { success: false, message: 'Không tìm thấy người dùng' };

    user.isBanned = !user.isBanned;
    this.saveUsers(users);

    return { success: true, isBanned: user.isBanned, message: user.isBanned ? 'Đã khóa tài khoản!' : 'Đã mở khóa tài khoản!' };
  };

  AppStorage.prototype.adminTopup = function (userId, amount, adminId, note) {
    return this.addTransaction(userId, 'deposit', amount, 'Admin nạp tiền: ' + (note || 'Thao tác từ Admin Panel'), adminId);
  };

  /* ================= Backup & Restore ================= */

  AppStorage.prototype.exportData = function () {
    var data = {
      users: this.getUsers(),
      games: JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES)) || [],
      transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [],
      friends: JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS)) || [],
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  AppStorage.prototype.importData = function (jsonString) {
    try {
      var data = JSON.parse(jsonString);
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.games) localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(data.games));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.friends) localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(data.friends));
      return { success: true, message: 'Khôi phục dữ liệu thành công!' };
    } catch (e) {
      return { success: false, message: 'Dữ liệu không hợp lệ!' };
    }
  };

  /* ================= Live Room & Match Discovery ================= */

  AppStorage.prototype.getRooms = function () {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS)) || [];
    } catch (e) {
      return [];
    }
  };

  AppStorage.prototype.saveRooms = function (rooms) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  };

  AppStorage.prototype.addOrUpdateRoom = function (roomData) {
    var rooms = this.getRooms();
    var idx = rooms.findIndex(function (r) { return r.code === roomData.code; });

    // Bảo vệ: không cho phép tự gán đối thủ ảo khi tạo phòng mới
    if (idx === -1 && roomData.status === 'waiting') {
      roomData.guestId = null;
      roomData.guestName = null;
      roomData.guestElo = null;
    }

    if (idx !== -1) {
      rooms[idx] = Object.assign({}, rooms[idx], roomData);
    } else {
      rooms.unshift(roomData);
    }
    this.saveRooms(rooms);
    return rooms;
  };

  AppStorage.prototype.removeRoom = function (roomCode) {
    var rooms = this.getRooms();
    var filtered = rooms.filter(function (r) { return r.code !== roomCode; });
    this.saveRooms(filtered);
    return filtered;
  };

  AppStorage.prototype.getRoomStats = function () {
    var rooms = this.getRooms();
    var totalRooms = rooms.length;
    var waitingRooms = rooms.filter(function (r) { return r.status === 'waiting'; }).length;
    var playingRooms = rooms.filter(function (r) { return r.status === 'playing'; }).length;
    var totalOnlinePlayers = rooms.reduce(function (count, r) {
      var playersInRoom = (r.hostId ? 1 : 0) + (r.guestId ? 1 : 0);
      return count + playersInRoom;
    }, 0);

    return {
      totalRooms: totalRooms,
      waitingRooms: waitingRooms,
      playingRooms: playingRooms,
      onlinePlayers: totalOnlinePlayers
    };
  };

  /**
   * Dọn phòng hết hạn: gọi định kỳ để xóa phòng "waiting" quá 30 phút
   * và phòng "playing" quá 2 giờ (phòng ma không ai đóng).
   */
  AppStorage.prototype.cleanupStaleRooms = function () {
    var rooms = this.getRooms();
    var now = Date.now();
    var WAIT_MAX = 30 * 60 * 1000;   // 30 phút cho phòng chờ
    var PLAY_MAX = 2 * 60 * 60 * 1000; // 2 giờ cho phòng đang đấu

    var cleaned = rooms.filter(function (r) {
      var age = now - new Date(r.createdAt).getTime();
      if (r.status === 'waiting' && age > WAIT_MAX) return false;
      if (r.status === 'playing' && age > PLAY_MAX) return false;
      return true;
    });

    if (cleaned.length !== rooms.length) {
      this.saveRooms(cleaned);
    }
    return cleaned;
  };

  return AppStorage;
}));
