/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE PRO - APPLICATION CONTROLLER (MAIN APP)
 * ============================================================
 *  Điều khiển toàn bộ giao diện, bàn cờ, AI, P2P WebRTC, Ví tiền & Admin Panel.
 *  PHIÊN BẢN SỬA LỖI TOÀN DIỆN - v2.0
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Core Instances
  var storage = new AppStorage();
  var sound = new SoundManager();
  var game = new ChessGame();
  var ai = new XiangqiAI(2);
  var p2p = new P2PNetwork();

  // App State Variables
  var currentUser = storage.getCurrentUser();
  var gameMode = 'ai';
  var myColor = 'red';
  var isFlipped = false;
  var selectedSquare = null;
  var validMoves = [];
  var lastMove = null;
  var betAmount = 0;
  var timeControl = 600;
  var timerRed = 600;
  var timerBlack = 600;
  var timerInterval = null;
  var isGameStarted = false;
  var isRegisterMode = false;
  var aiDifficulty = 2;
  var currentRoomFilter = 'all';

  // DOM Elements
  var dom = {
    viewLobby: document.getElementById('viewLobby'),
    viewGame: document.getElementById('viewGame'),
    viewLeaderboard: document.getElementById('viewLeaderboard'),
    viewAdmin: document.getElementById('viewAdmin'),
    btnGoHome: document.getElementById('btnGoHome'),
    navLobby: document.getElementById('navLobby'),
    navLeaderboard: document.getElementById('navLeaderboard'),
    navDeposit: document.getElementById('navDeposit'),
    navAdmin: document.getElementById('navAdmin'),
    authSection: document.getElementById('authSection'),
    userBadge: document.getElementById('userBadge'),
    lblUserAvatar: document.getElementById('lblUserAvatar'),
    lblUserName: document.getElementById('lblUserName'),
    lblUserBalance: document.getElementById('lblUserBalance'),
    btnOpenLogin: document.getElementById('btnOpenLogin'),
    btnLogout: document.getElementById('btnLogout'),
    navMenuToggle: document.getElementById('navMenuToggle'),
    navMenu: document.querySelector('.nav-menu'),

    // Board & Players
    board: document.getElementById('board'),
    pieceLayer: document.getElementById('pieceLayer'),
    cardPlayerRed: document.getElementById('cardPlayerRed'),
    cardPlayerBlack: document.getElementById('cardPlayerBlack'),
    nameRed: document.getElementById('nameRed'),
    nameBlack: document.getElementById('nameBlack'),
    eloRed: document.getElementById('eloRed'),
    eloBlack: document.getElementById('eloBlack'),
    timerRed: document.getElementById('timerRed'),
    timerBlack: document.getElementById('timerBlack'),
    lblRoomBet: document.getElementById('lblRoomBet'),
    movesLog: document.getElementById('movesLog'),
    chatLog: document.getElementById('chatLog'),
    txtChatInput: document.getElementById('txtChatInput'),
    btnSendChat: document.getElementById('btnSendChat'),

    // Controls
    btnFlipBoard: document.getElementById('btnFlipBoard'),
    btnUndo: document.getElementById('btnUndo'),
    btnOfferDraw: document.getElementById('btnOfferDraw'),
    btnResign: document.getElementById('btnResign'),
    btnBackToLobby: document.getElementById('btnBackToLobby'),

    // Modals
    modalAuth: document.getElementById('modalAuth'),
    formAuth: document.getElementById('formAuth'),
    authTitle: document.getElementById('authTitle'),
    authUsername: document.getElementById('authUsername'),
    authPassword: document.getElementById('authPassword'),
    authDisplayName: document.getElementById('authDisplayName'),
    groupDisplayName: document.getElementById('groupDisplayName'),
    lblAuthToggleText: document.getElementById('lblAuthToggleText'),
    btnToggleAuth: document.getElementById('btnToggleAuth'),
    btnAuthSubmit: document.getElementById('btnAuthSubmit'),

    modalCreateRoom: document.getElementById('modalCreateRoom'),
    selectBetAmount: document.getElementById('selectBetAmount'),
    selectTimeControl: document.getElementById('selectTimeControl'),
    btnConfirmCreateRoom: document.getElementById('btnConfirmCreateRoom'),

    modalDeposit: document.getElementById('modalDeposit'),
    selectDepositPackage: document.getElementById('selectDepositPackage'),
    imgDepositQR: document.getElementById('imgDepositQR'),
    btnConfirmDeposit: document.getElementById('btnConfirmDeposit'),

    modalAdminTopup: document.getElementById('modalAdminTopup'),
    adminTopupUserId: document.getElementById('adminTopupUserId'),
    adminTopupAmount: document.getElementById('adminTopupAmount'),
    adminTopupNote: document.getElementById('adminTopupNote'),
    btnSubmitAdminTopup: document.getElementById('btnSubmitAdminTopup'),

    modalAIDifficulty: document.getElementById('modalAIDifficulty'),

    modalGameOver: document.getElementById('modalGameOver'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    gameOverMessage: document.getElementById('gameOverMessage'),
    gameOverElo: document.getElementById('gameOverElo'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    btnBackLobby: document.getElementById('btnBackLobby'),

    // Admin & Tables
    tblLeaderboard: document.getElementById('tblLeaderboard'),
    tblAdminUsers: document.getElementById('tblAdminUsers'),
    statTotalUsers: document.getElementById('statTotalUsers'),
    statTotalGames: document.getElementById('statTotalGames'),
    statTotalCoins: document.getElementById('statTotalCoins'),
    btnAdminExport: document.getElementById('btnAdminExport'),
    btnAdminImport: document.getElementById('btnAdminImport'),
    fileImportJson: document.getElementById('fileImportJson'),

    // Room Stats & Browser
    statTotalRooms: document.getElementById('statTotalRooms'),
    statWaitingRooms: document.getElementById('statWaitingRooms'),
    statPlayingRooms: document.getElementById('statPlayingRooms'),
    statOnlinePlayers: document.getElementById('statOnlinePlayers'),
    btnRefreshRooms: document.getElementById('btnRefreshRooms'),
    inputSearchRoom: document.getElementById('inputSearchRoom'),
    roomsBrowserGrid: document.getElementById('roomsBrowserGrid'),

    // Room Name Input
    inputRoomName: document.getElementById('inputRoomName'),

    // Join Room Modal
    modalJoinRoom: document.getElementById('modalJoinRoom'),
    inputJoinRoomCode: document.getElementById('inputJoinRoomCode'),
    btnSubmitJoinRoom: document.getElementById('btnSubmitJoinRoom'),

    // Online Community & Friends
    btnRefreshOnlineUsers: document.getElementById('btnRefreshOnlineUsers'),
    countOnlineUsers: document.getElementById('countOnlineUsers'),
    countFriends: document.getElementById('countFriends'),
    communityGrid: document.getElementById('communityGrid'),

    // Room Top Banner
    roomTopBanner: document.getElementById('roomTopBanner'),
    bannerRoomStatus: document.getElementById('bannerRoomStatus'),
    bannerRoomTitle: document.getElementById('bannerRoomTitle'),
    bannerRoomCode: document.getElementById('bannerRoomCode'),
    btnBannerCopyCode: document.getElementById('btnBannerCopyCode'),
    btnBannerCopyLink: document.getElementById('btnBannerCopyLink'),
    bannerRoomBet: document.getElementById('bannerRoomBet')
  };

  /* ============================================================
   * 1. KHỞI TẠO VÀ NAVIGATION
   * ============================================================ */
  function initApp() {
    updateUserUI();
    renderBoard();
    renderRoomStatsAndBrowser();
    renderOnlineUsersAndCommunity();
    bindEvents();
    checkURLRoom();
    initRealtimeCloudSync();
  }

  function initRealtimeCloudSync() {
    if (window.RealtimeSync) {
      window.RealtimeSync.init(storage);

      window.RealtimeSync.on('rooms_changed', function () {
        renderRoomStatsAndBrowser();
      });

      window.RealtimeSync.on('presence_changed', function () {
        renderOnlineUsersAndCommunity();
      });

      window.RealtimeSync.startHeartbeat(function () {
        return storage.getCurrentUser();
      });
    }
  }

  function switchView(viewName) {
    var views = ['Lobby', 'Game', 'Leaderboard', 'Admin'];
    views.forEach(function (v) {
      var el = dom['view' + v];
      if (el) el.classList.remove('active');
    });

    var target = dom['view' + viewName];
    if (target) target.classList.add('active');

    if (viewName === 'Leaderboard') renderLeaderboard();
    if (viewName === 'Admin') renderAdminPanel();

    // Close mobile menu
    if (dom.navMenu) dom.navMenu.classList.remove('open');
  }

  function updateUserUI() {
    currentUser = storage.getCurrentUser();
    if (currentUser) {
      dom.authSection.style.display = 'none';
      dom.userBadge.style.display = 'flex';
      dom.lblUserAvatar.textContent = currentUser.avatar || '🐉';
      dom.lblUserName.textContent = currentUser.displayName;
      dom.lblUserBalance.textContent = currentUser.balance.toLocaleString('vi-VN') + ' Xu';

      if (currentUser.role === 'admin') {
        dom.navAdmin.style.display = 'flex';
      } else {
        dom.navAdmin.style.display = 'none';
      }
    } else {
      dom.authSection.style.display = 'block';
      dom.userBadge.style.display = 'none';
      dom.navAdmin.style.display = 'none';
    }
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast-notification ' + (type || 'info');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  /* ================= THÔNG BÁO MÃ PHÒNG TRONG KHUNG CHAT ================= */
  var _currentHostRoomCode = null;

  function appendSystemRoomNotice(code, roomName, betAmount, timeCtrl) {
    _currentHostRoomCode = code;
    if (!dom.chatLog) return;

    var minutes = Math.floor(timeCtrl / 60);
    var betStr = betAmount > 0 ? (betAmount.toLocaleString('vi-VN') + ' Xu') : 'Tự do (Không cược)';

    var card = document.createElement('div');
    card.className = 'chat-system-card';
    card.id = 'chatSystemNotice_' + code;
    card.innerHTML =
      '<div class="chat-system-title">👑 BÀN ĐẤU CỦA BẠN: ' + (roomName || 'Cờ Tướng') + '</div>' +
      '<div style="color: #94a3b8; font-size: 0.8rem;">💰 Mức cược: <strong>' + betStr + '</strong> | ⏱️ <strong>' + minutes + ' phút</strong></div>' +
      '<div class="chat-room-code-box">' +
        '<div>' +
          '<div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Mã Mời Bạn Bè:</div>' +
          '<div class="chat-room-code-val" id="chatCodeVal_' + code + '">' + code + '</div>' +
        '</div>' +
        '<button class="btn-chat-copy" id="btnCopyChatCode_' + code + '">📋 Sao Chép Mã</button>' +
      '</div>' +
      '<div class="chat-system-desc">⏳ Đang đợi đối thủ vào bàn... Hãy gửi mã phòng trên cho bạn bè hoặc chờ kỳ thủ khác bấm vào bàn!</div>';

    dom.chatLog.appendChild(card);
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;

    // Gắn sự kiện nút copy ngay trong chat
    var btnCopy = document.getElementById('btnCopyChatCode_' + code);
    if (btnCopy) {
      btnCopy.onclick = function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(function () {
            btnCopy.textContent = '✅ Đã Copy!';
            showToast('Đã copy mã phòng: ' + code, 'info');
            setTimeout(function () { btnCopy.textContent = '📋 Sao Chép Mã'; }, 2000);
          }).catch(function () {
            showToast('Mã phòng: ' + code, 'info');
          });
        }
      };
    }

    // Tự động copy vào clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(function () {});
    }
  }

  /* ================= THANH THÔNG TIN MÃ PHÒNG TRÊN BÀN CỜ ================= */
  function showRoomTopBanner(code, roomName, betAmount, isWaiting) {
    if (!dom.roomTopBanner) return;
    dom.roomTopBanner.style.display = 'flex';
    if (dom.bannerRoomCode) dom.bannerRoomCode.textContent = code;
    if (dom.bannerRoomTitle) dom.bannerRoomTitle.textContent = roomName || 'Bàn Đấu Cờ Tướng';
    if (dom.bannerRoomBet) {
      dom.bannerRoomBet.textContent = '💰 Cược: ' + (betAmount > 0 ? betAmount.toLocaleString('vi-VN') + ' Xu' : 'Tự do');
    }
    if (dom.bannerRoomStatus) {
      if (isWaiting) {
        dom.bannerRoomStatus.textContent = '⏳ ĐANG CHỜ ĐỐI THỦ';
        dom.bannerRoomStatus.classList.remove('playing');
      } else {
        dom.bannerRoomStatus.textContent = '⚔️ ĐANG THI ĐẤU';
        dom.bannerRoomStatus.classList.add('playing');
      }
    }
  }

  function hideRoomTopBanner() {
    if (dom.roomTopBanner) dom.roomTopBanner.style.display = 'none';
  }

  /* ================= KỲ THỦ & BẠN BÈ ĐANG ONLINE ================= */
  var currentCommunityTab = 'online';

  function renderOnlineUsersAndCommunity() {
    var onlineUsers = storage.getOnlineUsers(currentUser ? currentUser.id : null);
    // Hợp nhất người chơi online từ Cloud WebSockets giữa các thiết bị
    if (window.RealtimeSync) {
      var cloudUsers = window.RealtimeSync.getOnlineUsers(currentUser ? currentUser.id : null);
      cloudUsers.forEach(function (cu) {
        if (!onlineUsers.some(function (ou) { return ou.id === cu.id; })) {
          onlineUsers.push(cu);
        }
      });
    }
    var friends = storage.getFriends(currentUser ? currentUser.id : null);

    if (dom.countOnlineUsers) dom.countOnlineUsers.textContent = onlineUsers.length;
    if (dom.countFriends) dom.countFriends.textContent = friends.length;

    if (!dom.communityGrid) return;

    var list = currentCommunityTab === 'online' ? onlineUsers : friends;

    if (list.length === 0) {
      var emptyText = currentCommunityTab === 'online'
        ? 'Hiện chưa có kỳ thủ nào khác đang online. Bạn có thể chia sẻ link mời bạn bè cùng vào chơi!'
        : 'Bạn chưa có người bạn nào trong danh sách. Hãy kết bạn với các kỳ thủ trực tuyến nhé!';
      dom.communityGrid.innerHTML = '<div class="empty-community-msg">👥 ' + emptyText + '</div>';
      return;
    }

    var html = '';
    list.forEach(function (u) {
      // Kiểm tra xem kỳ thủ này có đang trong phòng thi đấu không
      var rooms = storage.getRooms();
      var inRoom = rooms.some(function (r) {
        return (r.hostId === u.id || r.guestId === u.id) && r.status === 'playing';
      });

      var statusDot = inRoom ? '<span class="status-dot playing" title="Đang thi đấu"></span> Đang thi đấu'
                             : '<span class="status-dot online" title="Đang rảnh"></span> Đang rảnh';

      html +=
        '<div class="community-user-card">' +
          '<div class="community-user-info">' +
            '<div class="community-user-avatar">' + (u.avatar || '🐉') + '</div>' +
            '<div style="overflow: hidden;">' +
              '<div class="community-user-name">' + (u.displayName || u.username) + '</div>' +
              '<div class="community-user-meta">' +
                '<span>ELO: ' + (u.elo || 1200) + '</span> • ' +
                statusDot +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button class="btn-invite-user" onclick="window.invitePlayerToMatch(\'' + u.id + '\', \'' + (u.displayName || u.username) + '\')">⚔️ Mời Đấu</button>' +
        '</div>';
    });

    dom.communityGrid.innerHTML = html;
  }

  // Global helper mời thi đấu
  window.invitePlayerToMatch = function (targetUserId, targetName) {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập để mời kỳ thủ!', 'error');
      dom.modalAuth.classList.add('active');
      return;
    }

    if (_currentHostRoomCode) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(_currentHostRoomCode).catch(function () {});
      }
      showToast('Đã sao chép mã phòng (' + _currentHostRoomCode + ')! Hãy gửi lời mời cho ' + targetName, 'info');
    } else {
      if (dom.modalCreateRoom) {
        if (dom.inputRoomName) dom.inputRoomName.value = 'Thách đấu với ' + targetName;
        dom.modalCreateRoom.classList.add('active');
        showToast('Hãy tạo phòng để thách đấu với ' + targetName + '!', 'info');
      }
    }
  };

  /* ================= THỐNG KÊ BÀN ĐẤU & BROWSER PHÒNG ================= */
  function renderRoomStatsAndBrowser() {
    // Dọn phòng hết hạn trước khi hiển thị
    storage.cleanupStaleRooms();

    var stats = storage.getRoomStats();
    if (dom.statTotalRooms) dom.statTotalRooms.textContent = stats.totalRooms;
    if (dom.statWaitingRooms) dom.statWaitingRooms.textContent = stats.waitingRooms;
    if (dom.statPlayingRooms) dom.statPlayingRooms.textContent = stats.playingRooms;
    if (dom.statOnlinePlayers) dom.statOnlinePlayers.textContent = stats.onlinePlayers;

    if (!dom.roomsBrowserGrid) return;

    var rooms = storage.getRooms();
    var searchKeyword = dom.inputSearchRoom ? dom.inputSearchRoom.value.trim().toLowerCase() : '';

    var filtered = rooms.filter(function (r) {
      if (currentRoomFilter === 'waiting' && r.status !== 'waiting') return false;
      if (currentRoomFilter === 'playing' && r.status !== 'playing') return false;
      if (searchKeyword) {
        var codeMatch = (r.code || '').toLowerCase().indexOf(searchKeyword) !== -1;
        var hostMatch = (r.hostName || '').toLowerCase().indexOf(searchKeyword) !== -1;
        var nameMatch = (r.name || '').toLowerCase().indexOf(searchKeyword) !== -1;
        if (!codeMatch && !hostMatch && !nameMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      dom.roomsBrowserGrid.innerHTML = '<div class="empty-rooms-msg">🏟️ Hiện chưa có phòng chơi nào.<br>Bấm <strong>"Tạo Phòng Đặt Cược"</strong> để mở bàn đấu mới và chờ đối thủ thật kết nối!</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (room) {
      var isWaiting = room.status === 'waiting';
      var statusBadge = isWaiting ?
        '<span class="room-badge waiting">⏳ Đang chờ</span>' :
        '<span class="room-badge playing">⚔️ Đang đấu</span>';

      var betDisplay = room.betAmount > 0 ?
        '<span class="bet-badge-gold">💰 ' + room.betAmount.toLocaleString('vi-VN') + ' Xu</span>' :
        '<span style="color: #10b981;">🆓 Miễn phí</span>';

      var actionBtn = isWaiting ?
        '<button class="btn-join-room-card btn-ready" onclick="window.joinRoomByCode(\'' + room.code + '\')">⚡ Vào Chơi Ngay</button>' :
        '<button class="btn-join-room-card btn-watch" onclick="window.joinRoomByCode(\'' + room.code + '\')">👁️ Xem Trận Đấu</button>';

      html +=
        '<div class="room-card-item">' +
          '<div class="room-card-header">' +
            '<div>' +
              '<div class="room-title">' + (room.name || ('Phòng ' + room.code)) + '</div>' +
              '<div class="room-code-tag">Mã phòng: <strong>' + room.code + '</strong></div>' +
            '</div>' +
            statusBadge +
          '</div>' +
          '<div class="room-details-meta">' +
            '<div class="room-meta-row">' +
              '<span class="room-meta-label">Chủ phòng:</span>' +
              '<span class="room-meta-val">' + (room.hostAvatar || '👤') + ' ' + (room.hostName || 'Ẩn danh') + ' (' + (room.hostElo || 1200) + ')</span>' +
            '</div>' +
            '<div class="room-meta-row">' +
              '<span class="room-meta-label">Mức cược:</span>' +
              '<span class="room-meta-val">' + betDisplay + '</span>' +
            '</div>' +
            '<div class="room-meta-row">' +
              '<span class="room-meta-label">Thời gian:</span>' +
              '<span class="room-meta-val">⏱️ ' + (room.timeControl ? room.timeControl.replace('_0', ' phút') : '10 phút') + '</span>' +
            '</div>' +
          '</div>' +
          actionBtn +
        '</div>';
    });

    dom.roomsBrowserGrid.innerHTML = html;
  }

  // Global helper for card clicks — chỉ join phòng thật qua P2P
  window.joinRoomByCode = function (roomCode) {
    if (!roomCode) return;

    // Yêu cầu đăng nhập trước khi vào phòng
    if (!currentUser) {
      showToast('Vui lòng đăng nhập trước khi vào phòng!', 'error');
      dom.modalAuth.classList.add('active');
      return;
    }

    // Không cho tự vào phòng của chính mình
    var rooms = storage.getRooms();
    var targetRoom = rooms.find(function (r) { return r.code === roomCode; });
    if (targetRoom && targetRoom.hostId === currentUser.id) {
      showToast('Đây là phòng của bạn! Hãy chờ đối thủ kết nối.', 'error');
      return;
    }

    showToast('Đang kết nối P2P tới phòng ' + roomCode + '...', 'info');

    p2p.joinRoom(roomCode, function (success) {
      if (success) {
        showToast('Kết nối thành công! Đã vào phòng ' + roomCode, 'info');
        // Cập nhật trạng thái phòng chỉ khi kết nối P2P thật sự thành công
        if (targetRoom) {
          targetRoom.status = 'playing';
          targetRoom.guestId = currentUser.id;
          targetRoom.guestName = currentUser.displayName;
          targetRoom.guestElo = currentUser.elo;
          storage.addOrUpdateRoom(targetRoom);
          renderRoomStatsAndBrowser();
        }
        startNewGame('p2p', targetRoom ? targetRoom.betAmount : 0, 'black', false);
        if (targetRoom) {
          dom.nameRed.textContent = targetRoom.hostName || 'Chủ Bàn (Đỏ)';
          dom.eloRed.textContent = 'ELO: ' + (targetRoom.hostElo || 1200);
          dom.avatarRed.textContent = targetRoom.hostAvatar || '🐉';
        }
        showRoomTopBanner(roomCode, targetRoom ? targetRoom.name : 'Bàn Đấu Cờ Tướng', targetRoom ? targetRoom.betAmount : 0, false);
        if (currentUser) {
          p2p.send({
            type: 'PLAYER_INFO',
            user: { displayName: currentUser.displayName, elo: currentUser.elo, avatar: currentUser.avatar }
          });
        }
      } else {
        // Kết nối P2P thất bại → xóa phòng ma khỏi danh sách
        if (targetRoom) {
          storage.removeRoom(roomCode);
          renderRoomStatsAndBrowser();
        }
        showToast('Không thể kết nối đến phòng ' + roomCode + '. Phòng đã đóng hoặc chủ phòng đã offline!', 'error');
      }
    });
  };

  /* ============================================================
   * 2. VẼ BÀN CỜ VÀ XỬ LÝ CHỌN QUÂN CỜ
   * ============================================================ */
  function renderBoard() {
    dom.pieceLayer.innerHTML = '';
    var boardData = game.getBoard();

    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var actualR = isFlipped ? (9 - r) : r;
        var actualC = isFlipped ? (8 - c) : c;

        var square = document.createElement('div');
        square.className = 'square';
        square.dataset.row = actualR;
        square.dataset.col = actualC;

        // Điểm đánh dấu nước đi hợp lệ (FIX: dùng m[0], m[1] thay vì m.row, m.col)
        var isValid = validMoves.some(function (m) {
          return m[0] === actualR && m[1] === actualC;
        });
        if (isValid) {
          var dot = document.createElement('div');
          dot.className = 'valid-dot';
          square.appendChild(dot);
        }

        // Điểm nước đi vừa di chuyển
        if (lastMove && ((lastMove.fromRow === actualR && lastMove.fromCol === actualC) ||
                         (lastMove.toRow === actualR && lastMove.toCol === actualC))) {
          var highlight = document.createElement('div');
          highlight.className = 'last-move-highlight';
          square.appendChild(highlight);
        }

        // Quân cờ
        var piece = boardData[actualR][actualC];
        if (piece) {
          var pieceEl = document.createElement('div');
          var isRed = (piece === piece.toUpperCase());
          pieceEl.className = 'piece ' + (isRed ? 'red' : 'black');

          if (selectedSquare && selectedSquare.row === actualR && selectedSquare.col === actualC) {
            pieceEl.classList.add('selected');
          }

          pieceEl.textContent = getPieceSymbol(piece);
          square.appendChild(pieceEl);
        }

        square.addEventListener('click', onSquareClick);
        dom.pieceLayer.appendChild(square);
      }
    }

    // Cập nhật thẻ thông tin người chơi
    var currentTurn = game.getCurrentTurn();
    if (currentTurn === 'red') {
      dom.cardPlayerRed.classList.add('active-turn');
      dom.cardPlayerBlack.classList.remove('active-turn');
    } else {
      dom.cardPlayerBlack.classList.add('active-turn');
      dom.cardPlayerRed.classList.remove('active-turn');
    }
  }

  function getPieceSymbol(piece) {
    var symbols = {
      'K': '帥', 'k': '將',
      'A': '仕', 'a': '士',
      'E': '相', 'e': '象',
      'H': '傌', 'h': '馬',
      'R': '俥', 'r': '車',
      'C': '砲', 'c': '砲',
      'P': '兵', 'p': '卒'
    };
    return symbols[piece] || piece;
  }

  function onSquareClick(e) {
    if (!isGameStarted) {
      if (gameMode === 'p2p') {
        showToast('Đang chờ đối thủ vào bàn thi đấu! Vui lòng chia sẻ mã phòng.', 'info');
      }
      return;
    }

    var square = e.currentTarget;
    var r = parseInt(square.dataset.row, 10);
    var c = parseInt(square.dataset.col, 10);
    var boardData = game.getBoard();
    var piece = boardData[r][c];
    var currentTurn = game.getCurrentTurn();

    // Kiểm tra lượt đi (P2P online chỉ cho phép đi quân của mình)
    if (gameMode === 'p2p' && currentTurn !== myColor) {
      return;
    }

    // Pass-and-play: cả 2 bên đều được đi
    // AI mode: chỉ cho đi quân của myColor

    if (gameMode === 'ai' && currentTurn !== myColor) {
      return;
    }

    // Nếu đã chọn 1 quân cờ và click vào ô hợp lệ -> Thực hiện nước đi
    if (selectedSquare) {
      // FIX: dùng m[0], m[1] thay vì m.row, m.col
      var isMoveValid = validMoves.some(function (m) { return m[0] === r && m[1] === c; });
      if (isMoveValid) {
        executeMove(selectedSquare.row, selectedSquare.col, r, c);
        selectedSquare = null;
        validMoves = [];
        return;
      }
    }

    // Chọn quân cờ cùng màu với lượt đi
    if (piece && game._getPieceColor(piece) === currentTurn) {
      selectedSquare = { row: r, col: c };
      validMoves = game.getValidMoves(r, c);
      sound.playSelect();
      renderBoard();
    } else {
      selectedSquare = null;
      validMoves = [];
      renderBoard();
    }
  }

  /* ============================================================
   * 3. THỰC THI NƯỚC ĐI & GAME LOOP
   * ============================================================ */
  function executeMove(fromRow, fromCol, toRow, toCol) {
    var boardBefore = game.getBoard();
    var capturedPiece = boardBefore[toRow][toCol];

    var result = game.makeMove(fromRow, fromCol, toRow, toCol);
    if (!result.success) return;

    lastMove = { fromRow: fromRow, fromCol: fromCol, toRow: toRow, toCol: toCol };

    // Phát âm thanh
    if (result.check) sound.playCheck();
    else if (capturedPiece) sound.playCapture();
    else sound.playMove();

    // Biên bản nước đi
    appendMoveLog(fromRow, fromCol, toRow, toCol, capturedPiece);

    // Pass-and-play: tự lật bàn cờ sau mỗi nước đi
    if (gameMode === 'passplay') {
      isFlipped = (game.getCurrentTurn() === 'black');
    }

    renderBoard();

    // Gửi nước đi nếu chơi P2P
    if (gameMode === 'p2p') {
      p2p.sendMove({ fromRow: fromRow, fromCol: fromCol, toRow: toRow, toCol: toCol });
    }

    // Kiểm tra kết thúc ván đấu
    if (result.checkmate || result.stalemate) {
      var winner = game.getCurrentTurn() === 'red' ? 'black' : 'red';
      endGame(winner, result.checkmate ? 'Chiếu bí! Tướng đã bị bắt.' : 'Hết nước đi (Bí cờ).');
      return;
    }

    // Nếu chơi với AI và đến lượt AI
    if (gameMode === 'ai' && game.getCurrentTurn() !== myColor) {
      setTimeout(function () {
        ai.getBestMove(game, function (bestMove) {
          if (bestMove) {
            executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
          }
        });
      }, 400);
    }
  }

  function startNewGame(mode, bet, color, isWaiting) {
    gameMode = mode;
    betAmount = bet || 0;
    myColor = color || 'red';
    game = new ChessGame();
    selectedSquare = null;
    validMoves = [];
    lastMove = null;
    isFlipped = (myColor === 'black');
    dom.movesLog.innerHTML = '';
    dom.chatLog.innerHTML = '';
    dom.lblRoomBet.textContent = 'Cược: ' + (betAmount > 0 ? betAmount.toLocaleString('vi-VN') + ' Xu' : 'Tự do');

    timerRed = timeControl;
    timerBlack = timeControl;
    updateTimerDisplay();

    if (mode === 'p2p' && isWaiting) {
      // TRẠNG THÁI CHỜ ĐỐI THỦ THẬT: TUYỆT ĐỐI KHÔNG CÓ ĐỐI THỦ ẢO
      isGameStarted = false;
      stopTimer();

      // Thẻ Chủ Bàn (Đỏ)
      dom.nameRed.textContent = currentUser ? currentUser.displayName : 'Chủ Bàn (Đỏ)';
      dom.eloRed.textContent = 'ELO: ' + (currentUser ? currentUser.elo : 1200);
      dom.avatarRed.textContent = (currentUser && currentUser.avatar) ? currentUser.avatar : '🐉';
      dom.timerRed.textContent = Math.floor(timeControl / 60) + ':00';

      // Thẻ Đối Thủ: HIỂN THỊ CHỜ ĐỐI THỦ KẾT NỐI - KHÔNG TẠO ĐỐI THỦ ẢO
      dom.nameBlack.textContent = '⏳ Đang chờ đối thủ vào bàn...';
      dom.eloBlack.textContent = 'Chưa có người chơi';
      dom.avatarBlack.textContent = '⏳';
      dom.timerBlack.textContent = '--:--';
    } else {
      isGameStarted = true;
      startTimer();

      // Thiết lập thông tin kỳ thủ
      if (mode === 'ai') {
        var diffNames = { 1: 'Tập chơi', 2: 'Trung bình', 3: 'Khá', 4: 'Kiện tướng' };
        dom.nameRed.textContent = currentUser ? currentUser.displayName : 'Bạn (Đỏ)';
        dom.nameBlack.textContent = 'Máy AI - ' + (diffNames[aiDifficulty] || 'Trung bình');
        dom.eloRed.textContent = 'ELO: ' + (currentUser ? currentUser.elo : 1200);
        dom.eloBlack.textContent = 'ELO: ' + (1200 + aiDifficulty * 200);
        dom.avatarRed.textContent = (currentUser && currentUser.avatar) ? currentUser.avatar : '🐉';
        dom.avatarBlack.textContent = '🤖';
      } else if (mode === 'passplay') {
        dom.nameRed.textContent = 'Người chơi 1 (Đỏ)';
        dom.nameBlack.textContent = 'Người chơi 2 (Đen)';
        dom.eloRed.textContent = '';
        dom.eloBlack.textContent = '';
        dom.avatarRed.textContent = '🐉';
        dom.avatarBlack.textContent = '🐯';
      } else if (mode === 'p2p') {
        if (myColor === 'red') {
          dom.nameRed.textContent = currentUser ? currentUser.displayName : 'Bạn (Đỏ)';
          dom.eloRed.textContent = 'ELO: ' + (currentUser ? currentUser.elo : 1200);
          dom.avatarRed.textContent = (currentUser && currentUser.avatar) ? currentUser.avatar : '🐉';
          dom.nameBlack.textContent = 'Đối thủ (Đen)';
          dom.eloBlack.textContent = 'Đang nhận thông tin...';
          dom.avatarBlack.textContent = '👤';
        } else {
          dom.nameBlack.textContent = currentUser ? currentUser.displayName : 'Bạn (Đen)';
          dom.eloBlack.textContent = 'ELO: ' + (currentUser ? currentUser.elo : 1200);
          dom.avatarBlack.textContent = (currentUser && currentUser.avatar) ? currentUser.avatar : '🐯';
          dom.nameRed.textContent = 'Chủ Bàn (Đỏ)';
          dom.eloRed.textContent = 'Đang nhận thông tin...';
          dom.avatarRed.textContent = '👤';
        }
      }
    }

    switchView('Game');
    renderBoard();
  }

  function endGame(winnerColor, reason) {
    stopTimer();
    isGameStarted = false;
    var isWin = (winnerColor === myColor);
    var isDraw = (winnerColor === 'draw');

    if (isDraw) sound.playMove();
    else if (isWin) sound.playWin();
    else sound.playLose();

    // Ghi nhận kết quả & cược
    var eloChange = '';
    if (currentUser && gameMode !== 'passplay') {
      var opponentDummy = { id: 'ai_bot', displayName: 'Máy AI', elo: 1200 + aiDifficulty * 200 };
      var redUser = (myColor === 'red') ? currentUser : opponentDummy;
      var blackUser = (myColor === 'black') ? currentUser : opponentDummy;
      var result = storage.recordGameResult(redUser, blackUser, winnerColor, betAmount, game.getMoveHistory());
      if (result) {
        var myDelta = (myColor === 'red') ? result.deltaRed : result.deltaBlack;
        eloChange = (myDelta >= 0 ? '+' : '') + myDelta + ' ELO';
      }
      updateUserUI();
    }

    // Hiển thị modal kết quả thay vì alert()
    var titleText = isDraw ? '🤝 Hòa Cờ!' : (isWin ? '🏆 Bạn Chiến Thắng!' : '😞 Bạn Đã Thua!');
    var msgText = reason || '';

    if (dom.modalGameOver && dom.gameOverTitle && dom.gameOverMessage) {
      dom.gameOverTitle.textContent = titleText;
      dom.gameOverMessage.textContent = msgText;
      if (dom.gameOverElo) dom.gameOverElo.textContent = eloChange;
      dom.modalGameOver.classList.add('active');
    } else {
      alert(titleText + '\n' + msgText + (eloChange ? '\n' + eloChange : ''));
    }

    // Gửi kết quả qua P2P
    if (gameMode === 'p2p') {
      p2p.sendData({ type: 'game_over', winner: winnerColor, reason: reason });
    }
  }

  /* ============================================================
   * 4. ĐỒNG HỒ & BIÊN BẢN
   * ============================================================ */
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(function () {
      if (!isGameStarted) return;
      var turn = game.getCurrentTurn();
      if (turn === 'red') {
        timerRed--;
        if (timerRed <= 0) {
          timerRed = 0;
          endGame('black', 'Hết thời gian thi đấu!');
        }
      } else {
        timerBlack--;
        if (timerBlack <= 0) {
          timerBlack = 0;
          endGame('red', 'Hết thời gian thi đấu!');
        }
      }
      updateTimerDisplay();
      // Phát âm báo khi còn ít thời gian
      if (timerRed <= 30 || timerBlack <= 30) {
        sound.playTick();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    dom.timerRed.textContent = formatTime(timerRed);
    dom.timerBlack.textContent = formatTime(timerBlack);
    // Highlight khi sắp hết giờ
    dom.timerRed.style.color = (timerRed <= 30) ? 'var(--accent-red)' : 'var(--accent-gold)';
    dom.timerBlack.style.color = (timerBlack <= 30) ? 'var(--accent-red)' : 'var(--accent-gold)';
  }

  function formatTime(sec) {
    if (sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function appendMoveLog(fR, fC, tR, tC, cap) {
    var history = game.getMoveHistory();
    var moveNum = history.length;
    var rowEl = document.createElement('div');
    rowEl.className = 'move-row';
    var numSpan = document.createElement('span');
    numSpan.textContent = moveNum + '.';
    var moveSpan = document.createElement('span');
    moveSpan.textContent = '[' + fR + ',' + fC + '] → [' + tR + ',' + tC + ']';
    var capSpan = document.createElement('span');
    capSpan.style.color = 'var(--accent-gold)';
    capSpan.textContent = cap ? 'Ăn ' + getPieceSymbol(cap) : '';
    rowEl.appendChild(numSpan);
    rowEl.appendChild(moveSpan);
    rowEl.appendChild(capSpan);
    dom.movesLog.appendChild(rowEl);
    dom.movesLog.scrollTop = dom.movesLog.scrollHeight;
  }

  /* ============================================================
   * 5. LEADERBOARD & ADMIN PANEL
   * ============================================================ */
  function renderLeaderboard() {
    var users = storage.getUsers();
    users.sort(function (a, b) { return b.elo - a.elo; });

    dom.tblLeaderboard.innerHTML = '';
    users.forEach(function (u, index) {
      var medal = (index === 0) ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : (index + 1)));
      var tr = document.createElement('tr');
      var cells = [
        medal,
        u.avatar + ' ' + u.displayName,
        u.elo,
        u.wins + 'W / ' + u.losses + 'L / ' + u.draws + 'D',
        u.balance.toLocaleString('vi-VN') + ' Xu'
      ];
      cells.forEach(function (txt, i) {
        var td = document.createElement('td');
        if (i === 0) { td.innerHTML = '<b>' + txt + '</b>'; }
        else if (i === 2) { td.innerHTML = '<b style="color:var(--accent-gold);">' + txt + '</b>'; }
        else { td.textContent = txt; }
        tr.appendChild(td);
      });
      dom.tblLeaderboard.appendChild(tr);
    });
  }

  function renderAdminPanel() {
    var stats = storage.getAdminStats();
    dom.statTotalUsers.textContent = stats.totalUsers;
    dom.statTotalGames.textContent = stats.totalGames;
    dom.statTotalCoins.textContent = stats.totalCoinsInSystem.toLocaleString('vi-VN') + ' Xu';

    var users = storage.getUsers();
    dom.tblAdminUsers.innerHTML = '';
    users.forEach(function (u) {
      var tr = document.createElement('tr');
      // Username
      var td1 = document.createElement('td');
      td1.textContent = u.username;
      tr.appendChild(td1);
      // Display name
      var td2 = document.createElement('td');
      td2.textContent = u.avatar + ' ' + u.displayName;
      tr.appendChild(td2);
      // ELO
      var td3 = document.createElement('td');
      td3.textContent = u.elo;
      tr.appendChild(td3);
      // Balance
      var td4 = document.createElement('td');
      td4.innerHTML = '<b style="color:var(--accent-gold);">' + u.balance.toLocaleString('vi-VN') + '</b>';
      tr.appendChild(td4);
      // Status
      var td5 = document.createElement('td');
      td5.innerHTML = u.isBanned ? '<span style="color:var(--accent-red);">Đã Khóa</span>' : '<span style="color:var(--accent-green);">Hoạt Động</span>';
      tr.appendChild(td5);
      // Actions
      var td6 = document.createElement('td');
      var btnTopup = document.createElement('button');
      btnTopup.className = 'nav-btn';
      btnTopup.textContent = '💵 Nạp Xu';
      btnTopup.onclick = function () {
        dom.adminTopupUserId.value = u.id;
        dom.modalAdminTopup.classList.add('active');
      };
      var btnBan = document.createElement('button');
      btnBan.className = 'nav-btn';
      btnBan.style.color = 'var(--accent-red)';
      btnBan.textContent = u.isBanned ? 'Mở Khóa' : 'Khóa';
      btnBan.onclick = function () {
        storage.toggleBanUser(u.id);
        renderAdminPanel();
        showToast(u.isBanned ? 'Đã mở khóa tài khoản ' + u.displayName : 'Đã khóa tài khoản ' + u.displayName, 'info');
      };
      td6.appendChild(btnTopup);
      td6.appendChild(document.createTextNode(' '));
      td6.appendChild(btnBan);
      tr.appendChild(td6);

      dom.tblAdminUsers.appendChild(tr);
    });
  }

  /* ============================================================
   * 6. SỰ KIỆN NÚT VÀ ĐIỀU HƯỚNG
   * ============================================================ */
  function bindEvents() {
    // Navigation
    dom.btnGoHome.onclick = function () { switchView('Lobby'); };
    dom.navLobby.onclick = function () { switchView('Lobby'); };
    dom.navLeaderboard.onclick = function () { switchView('Leaderboard'); };
    dom.navAdmin.onclick = function () { switchView('Admin'); };

    // Mobile hamburger menu
    if (dom.navMenuToggle) {
      dom.navMenuToggle.onclick = function () {
        if (dom.navMenu) dom.navMenu.classList.toggle('open');
      };
    }

    // === AI MODE: Mở modal chọn cấp độ ===
    var openAISelector = function () {
      if (dom.modalAIDifficulty) {
        dom.modalAIDifficulty.classList.add('active');
      } else {
        // Fallback nếu chưa có modal
        startNewGame('ai', 0, 'red');
      }
    };
    var cardVsAI = document.getElementById('cardVsAI');
    var btnQuickAI = document.getElementById('btnQuickAI');
    if (cardVsAI) cardVsAI.onclick = openAISelector;
    if (btnQuickAI) btnQuickAI.onclick = openAISelector;

    // AI Difficulty buttons
    document.querySelectorAll('.btn-ai-level').forEach(function (btn) {
      btn.addEventListener('click', function () {
        aiDifficulty = parseInt(btn.dataset.level, 10) || 2;
        ai = new XiangqiAI(aiDifficulty);
        if (dom.modalAIDifficulty) dom.modalAIDifficulty.classList.remove('active');
        startNewGame('ai', 0, 'red');
      });
    });

    // Pass-and-Play
    var cardPassPlay = document.getElementById('cardPassPlay');
    if (cardPassPlay) cardPassPlay.onclick = function () { startNewGame('passplay', 0, 'red'); };

    // P2P Online: Mở Modal Nhập Mã Phòng
    var cardP2P = document.getElementById('cardP2P');
    if (cardP2P) cardP2P.onclick = function () {
      if (!currentUser) {
        showToast('Vui lòng đăng nhập để chơi Online!', 'error');
        dom.modalAuth.classList.add('active');
        return;
      }
      openJoinModal();
    };

    // Bet Room Card
    var cardBetRoom = document.getElementById('cardBetRoom');
    if (cardBetRoom) cardBetRoom.onclick = function () {
      if (!currentUser) {
        showToast('Vui lòng đăng nhập để tạo phòng đặt cược!', 'error');
        dom.modalAuth.classList.add('active');
        return;
      }
      dom.modalCreateRoom.classList.add('active');
    };

    // Create Room
    var btnCreateRoom = document.getElementById('btnCreateRoom');
    if (btnCreateRoom) btnCreateRoom.onclick = function () {
      if (!currentUser) {
        showToast('Vui lòng đăng nhập!', 'error');
        dom.modalAuth.classList.add('active');
        return;
      }
      dom.modalCreateRoom.classList.add('active');
    };

    dom.btnConfirmCreateRoom.onclick = function () {
      var bet = parseInt(dom.selectBetAmount.value, 10);
      timeControl = parseInt(dom.selectTimeControl.value, 10);
      var roomName = dom.inputRoomName ? dom.inputRoomName.value.trim() : '';

      // Kiểm tra số dư trước khi tạo phòng có cược
      if (bet > 0 && currentUser && currentUser.balance < bet) {
        showToast('Số dư Xu không đủ để đặt cược ' + bet.toLocaleString('vi-VN') + ' Xu!', 'error');
        return;
      }

      // Bắt buộc nhập tên phòng
      if (!roomName) {
        showToast('Vui lòng nhập tên phòng!', 'error');
        if (dom.inputRoomName) dom.inputRoomName.focus();
        return;
      }

      p2p.createRoom(null, function (code) {
        dom.modalCreateRoom.classList.remove('active');

        // Lưu phòng vào Storage
        var newRoom = {
          code: code,
          name: roomName,
          hostId: currentUser ? currentUser.id : 'u_guest',
          hostName: currentUser ? currentUser.displayName : 'Kỳ thủ Ẩn danh',
          hostElo: currentUser ? currentUser.elo : 1200,
          hostAvatar: currentUser ? (currentUser.avatar || '🐉') : '🐉',
          betAmount: bet,
          timeControl: timeControl + '_0',
          status: 'waiting',
          guestId: null,
          guestName: null,
          guestElo: null,
          createdAt: new Date().toISOString()
        };
        storage.addOrUpdateRoom(newRoom);
        renderRoomStatsAndBrowser();

        // Vào thẳng bàn cờ và hiển thị mã phòng ngay trong khung chat của phòng chờ
        switchView('Game');
        startNewGame('p2p', bet, 'red', true); // isWaiting = true: Chờ đối thủ thật, KHÔNG tạo đối thủ ảo
        dom.lblRoomBet.textContent = 'Cược: ' + (bet > 0 ? bet.toLocaleString('vi-VN') + ' Xu' : 'Tự do') + ' | Mã: ' + code;
        appendSystemRoomNotice(code, roomName, bet, timeControl);
        showRoomTopBanner(code, roomName, bet, true);

        // Phát sóng phòng mới tới tất cả các thiết bị khác qua Realtime Cloud Sync
        if (window.RealtimeSync) {
          window.RealtimeSync.broadcastRoomCreated(newRoom);
        }

        showToast('Đã tạo bàn cờ! Mã phòng: ' + code, 'info');

        // Reset form
        if (dom.inputRoomName) dom.inputRoomName.value = '';
      });
    };

    // Sự kiện nút Copy Mã và Copy Link trên Room Top Banner
    if (dom.btnBannerCopyCode) {
      dom.btnBannerCopyCode.onclick = function () {
        var code = (dom.bannerRoomCode ? dom.bannerRoomCode.textContent : _currentHostRoomCode) || '';
        if (code && navigator.clipboard) {
          navigator.clipboard.writeText(code).then(function () {
            dom.btnBannerCopyCode.textContent = '✅ Đã Copy!';
            showToast('Đã sao chép mã phòng: ' + code, 'info');
            setTimeout(function () { dom.btnBannerCopyCode.textContent = '📋 Sao Chép Mã'; }, 2000);
          }).catch(function () {
            showToast('Mã phòng: ' + code, 'info');
          });
        }
      };
    }

    if (dom.btnBannerCopyLink) {
      dom.btnBannerCopyLink.onclick = function () {
        var code = (dom.bannerRoomCode ? dom.bannerRoomCode.textContent : _currentHostRoomCode) || '';
        if (code) {
          var url = window.location.origin + window.location.pathname + '#room=' + code;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () {
              dom.btnBannerCopyLink.textContent = '✅ Đã Copy Link!';
              showToast('Đã sao chép link mời bạn bè vào thẳng bàn cờ!', 'info');
              setTimeout(function () { dom.btnBannerCopyLink.textContent = '🔗 Copy Link Mời'; }, 2000);
            }).catch(function () {
              prompt('Link mời vào phòng của bạn:', url);
            });
          } else {
            prompt('Link mời vào phòng của bạn:', url);
          }
        }
      };
    }

    // Refresh Room List Button — dọn phòng hết hạn + cập nhật
    if (dom.btnRefreshRooms) {
      dom.btnRefreshRooms.onclick = function () {
        storage.cleanupStaleRooms();
        renderRoomStatsAndBrowser();
        showToast('Đã dọn phòng hết hạn & cập nhật danh sách!', 'info');
      };
    }

    // Room Search Box
    if (dom.inputSearchRoom) {
      dom.inputSearchRoom.oninput = function () {
        renderRoomStatsAndBrowser();
      };
    }

    // Filter Tabs (Tất cả, Đang chờ, Đang thi đấu)
    document.querySelectorAll('.filter-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentRoomFilter = tab.dataset.filter || 'all';
        renderRoomStatsAndBrowser();
      });
    });

    // Community Tabs (Kỳ thủ online / Bạn bè)
    document.querySelectorAll('.community-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.community-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentCommunityTab = tab.dataset.tab || 'online';
        renderOnlineUsersAndCommunity();
      });
    });

    if (dom.btnRefreshOnlineUsers) {
      dom.btnRefreshOnlineUsers.onclick = function () {
        renderOnlineUsersAndCommunity();
        showToast('Đã làm mới danh sách kỳ thủ & bạn bè online!', 'info');
      };
    }

    // Lắng nghe sự kiện đồng bộ storage giữa các tab trình duyệt (Realtime Sync)
    window.addEventListener('storage', function (e) {
      if (e.key === 'cotuong_rooms' || e.key === 'cotuong_users' || e.key === 'cotuong_friends') {
        renderRoomStatsAndBrowser();
        renderOnlineUsersAndCommunity();
      }
    });

    // Tự động dọn phòng hết hạn mỗi 60 giây
    setInterval(function () {
      storage.cleanupStaleRooms();
      renderRoomStatsAndBrowser();
      renderOnlineUsersAndCommunity();
    }, 60000);

    // Modal Nhập Mã Phòng & Nút Vào Phòng
    var openJoinModal = function () {
      if (dom.modalJoinRoom) {
        dom.modalJoinRoom.classList.add('active');
        if (dom.inputJoinRoomCode) {
          dom.inputJoinRoomCode.value = '';
          dom.inputJoinRoomCode.focus();
        }
      }
    };

    var btnJoinRoom = document.getElementById('btnJoinRoom');
    if (btnJoinRoom) btnJoinRoom.onclick = openJoinModal;

    // Nút "⚡ Vào Phòng Ngay" trong Modal
    if (dom.btnSubmitJoinRoom) {
      dom.btnSubmitJoinRoom.onclick = function () {
        var code = dom.inputJoinRoomCode ? dom.inputJoinRoomCode.value.trim() : '';
        if (!code) {
          showToast('Vui lòng nhập mã phòng thi đấu!', 'error');
          if (dom.inputJoinRoomCode) dom.inputJoinRoomCode.focus();
          return;
        }
        if (dom.modalJoinRoom) dom.modalJoinRoom.classList.remove('active');
        window.joinRoomByCode(code);
      };
    }

    if (dom.inputJoinRoomCode) {
      dom.inputJoinRoomCode.onkeypress = function (e) {
        if (e.key === 'Enter') {
          if (dom.btnSubmitJoinRoom) dom.btnSubmitJoinRoom.click();
        }
      };
    }

    // Chat (XSS-safe)
    dom.btnSendChat.onclick = sendChatMsg;
    dom.txtChatInput.onkeypress = function (e) { if (e.key === 'Enter') sendChatMsg(); };

    // Game Controls
    dom.btnFlipBoard.onclick = function () { isFlipped = !isFlipped; renderBoard(); };

    dom.btnUndo.onclick = function () {
      if (gameMode === 'ai' && isGameStarted) {
        game.undoMove(); // Undo AI move
        game.undoMove(); // Undo player move
        lastMove = null;
        selectedSquare = null;
        validMoves = [];
        renderBoard();
        showToast('Đã hoãn nước đi!', 'info');
      }
    };

    // Offer Draw
    if (dom.btnOfferDraw) {
      dom.btnOfferDraw.onclick = function () {
        if (!isGameStarted) return;
        if (gameMode === 'p2p') {
          p2p.sendData({ type: 'offer_draw' });
          showToast('Đã gửi yêu cầu xin hòa cho đối thủ', 'info');
        } else if (gameMode === 'ai') {
          // AI chấp nhận hòa khi thế trận cân bằng
          var eval_score = ai.evaluateBoard(game, myColor);
          if (Math.abs(eval_score) < 300) {
            endGame('draw', 'Hai bên đồng ý hòa cờ.');
          } else {
            showToast('Máy từ chối hòa! Thế trận chưa cân bằng.', 'error');
          }
        } else if (gameMode === 'passplay') {
          endGame('draw', 'Hai bên đồng ý hòa cờ.');
        }
      };
    }

    // Resign
    if (dom.btnResign) {
      dom.btnResign.onclick = function () {
        if (!isGameStarted) return;
        if (confirm('Bạn có chắc chắn muốn đầu hàng?')) {
          var winner = (myColor === 'red') ? 'black' : 'red';
          if (gameMode === 'p2p') {
            p2p.sendData({ type: 'opponent_resign' });
          }
          endGame(winner, 'Đầu hàng.');
        }
      };
    }

    // Back to Lobby (if button exists)
    if (dom.btnBackToLobby) {
      dom.btnBackToLobby.onclick = function () {
        if (isGameStarted) {
          if (!confirm('Rời bàn cờ? Trận đấu sẽ bị hủy.')) return;
          stopTimer();
          isGameStarted = false;
        }
        // Xóa phòng nếu đang chờ đối thủ mà chủ phòng rời về sảnh
        if (_currentHostRoomCode) {
          if (window.RealtimeSync) {
            window.RealtimeSync.broadcastRoomClosed(_currentHostRoomCode);
          }
          storage.removeRoom(_currentHostRoomCode);
          _currentHostRoomCode = null;
          renderRoomStatsAndBrowser();
        }
        hideRoomTopBanner();
        switchView('Lobby');
      };
    }

    // Game Over Modal buttons
    if (dom.btnPlayAgain) {
      dom.btnPlayAgain.onclick = function () {
        if (dom.modalGameOver) dom.modalGameOver.classList.remove('active');
        startNewGame(gameMode, betAmount, myColor);
      };
    }
    if (dom.btnBackLobby) {
      dom.btnBackLobby.onclick = function () {
        if (dom.modalGameOver) dom.modalGameOver.classList.remove('active');
        switchView('Lobby');
      };
    }

    // Deposit & Auth Modals
    dom.navDeposit.onclick = function () {
      if (!currentUser) {
        showToast('Vui lòng đăng nhập trước!', 'error');
        dom.modalAuth.classList.add('active');
        return;
      }
      dom.modalDeposit.classList.add('active');
    };

    dom.btnConfirmDeposit.onclick = function () {
      if (!currentUser) {
        showToast('Vui lòng đăng nhập trước khi nạp Xu!', 'error');
        dom.modalAuth.classList.add('active');
        return;
      }
      var pkg = parseInt(dom.selectDepositPackage.value, 10);
      var coinMap = { 20000: 200000, 50000: 550000, 100000: 1200000, 500000: 5500000 };
      var addCoins = coinMap[pkg] || 200000;

      storage.addTransaction(currentUser.id, 'deposit', addCoins, 'Nạp Xu qua quét mã QR Chuyển khoản');
      updateUserUI();
      dom.modalDeposit.classList.remove('active');
      showToast('Nạp thành công ' + addCoins.toLocaleString('vi-VN') + ' Xu!', 'info');
    };

    // Auth: Open Login Modal
    dom.btnOpenLogin.onclick = function () {
      isRegisterMode = false;
      updateAuthModal();
      dom.modalAuth.classList.add('active');
    };

    // Auth: Toggle Login/Register
    if (dom.btnToggleAuth) {
      dom.btnToggleAuth.onclick = function (e) {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        updateAuthModal();
      };
    }

    // Auth: Logout
    dom.btnLogout.onclick = function () {
      storage.logout();
      updateUserUI();
      showToast('Đã đăng xuất!', 'info');
    };

    // Modal Close Buttons
    document.querySelectorAll('.close-btn').forEach(function (btn) {
      btn.onclick = function () {
        document.querySelectorAll('.modal-overlay').forEach(function (m) { m.classList.remove('active'); });
      };
    });

    // Click outside modal to close
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Form Auth Submit
    dom.formAuth.onsubmit = function (e) {
      e.preventDefault();
      var u = dom.authUsername.value.trim();
      var p = dom.authPassword.value.trim();

      if (!u || !p) {
        showToast('Vui lòng nhập tên đăng nhập và mật khẩu!', 'error');
        return;
      }

      var res;
      if (isRegisterMode) {
        var displayName = dom.authDisplayName.value.trim() || u;
        res = storage.register({ username: u, password: p, displayName: displayName });
        if (res.success) {
          showToast('Đăng ký thành công! Chào mừng ' + res.user.displayName + '! Bạn được tặng 100,000 Xu!', 'info');
        }
      } else {
        res = storage.login(u, p);
        if (res.success) {
          showToast('Chào mừng ' + res.user.displayName + ' quay lại!', 'info');
        }
      }

      if (res.success) {
        updateUserUI();
        dom.modalAuth.classList.remove('active');
        dom.formAuth.reset();
      } else {
        showToast(res.message, 'error');
      }
    };

    // Admin Submit Topup
    dom.btnSubmitAdminTopup.onclick = function () {
      var uid = dom.adminTopupUserId.value;
      var amt = parseInt(dom.adminTopupAmount.value, 10);
      var note = dom.adminTopupNote.value;

      if (!uid || !amt || isNaN(amt)) {
        showToast('Vui lòng nhập số tiền hợp lệ!', 'error');
        return;
      }

      if (amt > 0) {
        storage.adminTopup(uid, amt, currentUser ? currentUser.id : null, note);
      } else {
        // Trừ xu (số âm)
        storage.addTransaction(uid, 'withdraw', Math.abs(amt), 'Admin trừ Xu: ' + (note || 'Thao tác từ Admin Panel'), currentUser ? currentUser.id : null);
      }

      dom.modalAdminTopup.classList.remove('active');
      dom.adminTopupAmount.value = '';
      dom.adminTopupNote.value = '';
      renderAdminPanel();
      updateUserUI();
      showToast('Cập nhật số dư xu thành công!', 'info');
    };

    // Admin Export/Import
    if (dom.btnAdminExport) {
      dom.btnAdminExport.onclick = function () {
        var jsonData = storage.exportData();
        var blob = new Blob([jsonData], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'cotuong_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Đã xuất file backup dữ liệu!', 'info');
      };
    }

    if (dom.btnAdminImport && dom.fileImportJson) {
      dom.btnAdminImport.onclick = function () {
        dom.fileImportJson.click();
      };

      dom.fileImportJson.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (evt) {
          var result = storage.importData(evt.target.result);
          if (result.success) {
            showToast('Khôi phục dữ liệu thành công!', 'info');
            renderAdminPanel();
            updateUserUI();
          } else {
            showToast(result.message, 'error');
          }
        };
        reader.readAsText(file);
        dom.fileImportJson.value = '';
      };
    }

    // === P2P Event Listeners ===
    p2p.on('player_joined', function () {
      // Đối thủ thật kết nối vào phòng của Host: Khởi động ván đấu thật
      startNewGame('p2p', betAmount, 'red', false);

      if (window.RealtimeSync && _currentHostRoomCode) {
        var rooms = storage.getRooms();
        var rm = rooms.find(function (r) { return r.code === _currentHostRoomCode; });
        if (rm) {
          rm.status = 'playing';
          storage.addOrUpdateRoom(rm);
          window.RealtimeSync.broadcastRoomUpdated(rm);
        }
      }
      showRoomTopBanner(_currentHostRoomCode, (dom.bannerRoomTitle ? dom.bannerRoomTitle.textContent : 'Bàn Đấu Cờ Tướng'), betAmount, false);

      // Gửi thông tin ván cược và người chơi cho khách
      p2p.send({
        type: 'GAME_INIT',
        bet: betAmount,
        timeControl: timeControl
      });

      if (currentUser) {
        p2p.send({
          type: 'PLAYER_INFO',
          user: { displayName: currentUser.displayName, elo: currentUser.elo, avatar: currentUser.avatar }
        });
      }

      appendChatMsg('Hệ thống', '⚔️ Đối thủ đã vào bàn thi đấu! Trận đấu bắt đầu.', false);
      showToast('Đối thủ đã tham gia phòng! Trận đấu bắt đầu.', 'info');
    });

    p2p.on('opponent_info', function (user) {
      if (!user) return;
      if (myColor === 'red') {
        if (dom.nameBlack) dom.nameBlack.textContent = user.displayName || 'Đối thủ (Đen)';
        if (dom.eloBlack) dom.eloBlack.textContent = 'ELO: ' + (user.elo || 1200);
        if (dom.avatarBlack && user.avatar) dom.avatarBlack.textContent = user.avatar;
      } else {
        if (dom.nameRed) dom.nameRed.textContent = user.displayName || 'Chủ phòng (Đỏ)';
        if (dom.eloRed) dom.eloRed.textContent = 'ELO: ' + (user.elo || 1200);
        if (dom.avatarRed && user.avatar) dom.avatarRed.textContent = user.avatar;
      }
    });

    p2p.on('opponent_move', function (move) {
      executeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
    });

    p2p.on('chat_message', function (msg) {
      appendChatMsg(msg.sender, msg.text, false);
    });

    p2p.on('offer_draw', function () {
      if (confirm('Đối thủ xin hòa cờ. Bạn có đồng ý không?')) {
        p2p.sendData({ type: 'accept_draw' });
        endGame('draw', 'Hai bên đồng ý hòa cờ.');
      } else {
        p2p.sendData({ type: 'reject_draw' });
        showToast('Bạn đã từ chối hòa', 'info');
      }
    });

    p2p.on('accept_draw', function () {
      endGame('draw', 'Đối thủ đồng ý hòa cờ.');
    });

    p2p.on('reject_draw', function () {
      showToast('Đối thủ từ chối hòa!', 'error');
    });

    p2p.on('opponent_resign', function () {
      endGame(myColor, 'Đối thủ đã đầu hàng!');
    });

    p2p.on('disconnected', function () {
      if (isGameStarted && gameMode === 'p2p') {
        showToast('Đối thủ đã mất kết nối!', 'error');
        endGame(myColor, 'Đối thủ mất kết nối.');
      }
    });

    p2p.on('game_init', function (data) {
      if (data.bet) betAmount = data.bet;
      if (data.timeControl) {
        timeControl = data.timeControl;
        timerRed = timeControl;
        timerBlack = timeControl;
        updateTimerDisplay();
      }
      dom.lblRoomBet.textContent = 'Cược: ' + betAmount.toLocaleString('vi-VN') + ' Xu';
    });
  }

  function updateAuthModal() {
    if (isRegisterMode) {
      dom.authTitle.textContent = 'Đăng Ký Thành Viên Mới';
      dom.groupDisplayName.style.display = 'block';
      dom.lblAuthToggleText.textContent = 'Đã có tài khoản?';
      dom.btnToggleAuth.textContent = 'Đăng nhập ngay';
      if (dom.btnAuthSubmit) dom.btnAuthSubmit.textContent = 'Đăng Ký (Tặng 100k Xu)';
    } else {
      dom.authTitle.textContent = 'Đăng Nhập Thành Viên';
      dom.groupDisplayName.style.display = 'none';
      dom.lblAuthToggleText.textContent = 'Chưa có tài khoản?';
      dom.btnToggleAuth.textContent = 'Đăng ký ngay (Tặng 100k Xu)';
      if (dom.btnAuthSubmit) dom.btnAuthSubmit.textContent = 'Xác Nhận';
    }
  }

  function sendChatMsg() {
    var txt = dom.txtChatInput.value.trim();
    if (!txt) return;

    var name = currentUser ? currentUser.displayName : 'Tôi';
    appendChatMsg(name, txt, true);
    dom.txtChatInput.value = '';

    if (gameMode === 'p2p') {
      p2p.sendChat(name, txt);
    }
  }

  // XSS-safe chat rendering
  function appendChatMsg(sender, text, isMe) {
    var msgEl = document.createElement('div');
    msgEl.className = 'chat-msg ' + (isMe ? 'me' : '');
    var bold = document.createElement('b');
    bold.textContent = sender + ': ';
    msgEl.appendChild(bold);
    msgEl.appendChild(document.createTextNode(text));
    dom.chatLog.appendChild(msgEl);
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
  }

  function checkURLRoom() {
    var hash = window.location.hash;
    if (hash && hash.startsWith('#room=')) {
      var roomCode = hash.replace('#room=', '');
      if (roomCode) {
        p2p.joinRoom(roomCode, function (success) {
          if (success) {
            startNewGame('p2p', 0, 'black');
          }
        });
      }
    }
  }

  // Chạy ứng dụng
  initApp();
});
