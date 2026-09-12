/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE - AI ENGINE (Trí tuệ nhân tạo)
 * ============================================================
 *  AI cờ tướng tích hợp chạy trực tiếp trên Trình duyệt (Client-side).
 *  Sử dụng thuật toán Minimax + Cắt tỉa Alpha-Beta + Bảng điểm vị trí (PST).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.XiangqiAI = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Điểm cơ bản của các quân cờ
  var PIECE_VALUES = {
    'K': 10000, 'k': 10000, // Tướng
    'R': 900,   'r': 900,   // Xe
    'C': 450,   'c': 450,   // Pháo
    'H': 400,   'h': 400,   // Mã
    'E': 200,   'e': 200,   // Tượng
    'A': 200,   'a': 200,   // Sĩ
    'P': 100,   'p': 100    // Tốt
  };

  // Bảng điểm vị trí Tốt (Pawn)
  var PAWN_PST = [
    [0,  3,  6,  9,  12, 9,  6,  3,  0],
    [18, 36, 54, 72, 72, 72, 54, 36, 18],
    [14, 28, 42, 56, 60, 56, 42, 28, 14],
    [10, 20, 30, 40, 42, 40, 30, 20, 10],
    [6,  12, 18, 24, 26, 24, 18, 12, 6],
    [2,  0,  4,  0,  8,  0,  4,  0,  2],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0]
  ];

  // Bảng điểm vị trí Mã (Horse)
  var HORSE_PST = [
    [4,  8,  16, 12, 4,  12, 16, 8,  4],
    [4,  10, 28, 16, 8,  16, 28, 10, 4],
    [12, 16, 32, 24, 12, 24, 32, 16, 12],
    [8,  24, 36, 28, 16, 28, 36, 24, 8],
    [6,  16, 24, 20, 12, 20, 24, 16, 6],
    [4,  12, 16, 14, 10, 14, 16, 12, 4],
    [2,  8,  12, 10, 6,  10, 12, 8,  2],
    [2,  4,  8,  6,  2,  6,  8,  4,  2],
    [0,  2,  4,  4,  -2, 4,  4,  2,  0],
    [0,  -4, 2,  0,  -2, 0,  2,  -4, 0]
  ];

  // Bảng điểm vị trí Xe (Chariot)
  var ROOK_PST = [
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [12, 14, 12, 18, 18, 18, 12, 14, 12],
    [12, 18, 16, 22, 22, 22, 16, 18, 12],
    [12, 14, 12, 18, 18, 18, 12, 14, 12],
    [12, 16, 14, 20, 20, 20, 14, 16, 12],
    [6,  10, 8,  14, 14, 14, 8,  10, 6],
    [4,  8,  6,  10, 12, 10, 6,  8,  4],
    [8,  4,  8,  16, 8,  16, 8,  4,  8],
    [-2, 10, 6,  14, 12, 14, 6,  10, -2]
  ];

  // Bảng điểm vị trí Pháo (Cannon)
  var CANNON_PST = [
    [6,  4,  0,  -10, -12, -10, 0,  4,  6],
    [2,  2,  0,  -4,  -14, -4,  0,  2,  2],
    [4,  4,  8,  0,   -8,  0,   8,  4,  4],
    [0,  2,  4,  4,   -2,  4,   4,  2,  0],
    [0,  2,  4,  4,   -2,  4,   4,  2,  0],
    [-2, 0,  2,  2,   4,   2,   2,  0,  -2],
    [0,  0,  0,  2,   4,   2,   0,  0,  0],
    [-2, 0,  4,  6,   10,  6,   4,  0,  -2],
    [0,  2,  0,  2,   8,   2,   0,  2,  0],
    [0,  0,  0,  6,   8,   6,   0,  0,  0]
  ];

  function XiangqiAI(difficulty) {
    // 1: Dễ (Tập chơi), 2: Trung bình (Phong trào), 3: Khó (Kiện tướng), 4: Master (Chuyên nghiệp)
    this.difficulty = difficulty || 2;
  }

  /**
   * Đánh giá điểm thế trận từ góc nhìn người chơi 'color' ('red' hoặc 'black')
   */
  XiangqiAI.prototype.evaluateBoard = function (game, color) {
    var board = game.getBoard();
    var score = 0;

    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var piece = board[r][c];
        if (!piece) continue;

        var isRed = (piece === piece.toUpperCase());
        var type = piece.toUpperCase();
        var val = PIECE_VALUES[piece] || 0;

        // Điểm vị trí (lật bảng nếu là quân Đen)
        var pstRow = isRed ? r : (9 - r);
        var pstVal = 0;

        if (type === 'P') pstVal = PAWN_PST[pstRow][c];
        else if (type === 'H') pstVal = HORSE_PST[pstRow][c];
        else if (type === 'R') pstVal = ROOK_PST[pstRow][c];
        else if (type === 'C') pstVal = CANNON_PST[pstRow][c];

        var totalPieceVal = val + pstVal;

        if (isRed) {
          score += (color === 'red') ? totalPieceVal : -totalPieceVal;
        } else {
          score += (color === 'black') ? totalPieceVal : -totalPieceVal;
        }
      }
    }
    return score;
  };

  /**
   * Tìm nước đi tốt nhất
   */
  XiangqiAI.prototype.getBestMove = function (game, callback) {
    var self = this;
    var turn = game.getCurrentTurn();
    var moves = [];
    var board = game.getBoard();

    // Thu thập tất cả nước đi hợp lệ
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var piece = board[r][c];
        if (piece && game._getPieceColor(piece) === turn) {
          var validMoves = game.getValidMoves(r, c);
          for (var i = 0; i < validMoves.length; i++) {
            moves.push({
              fromRow: r,
              fromCol: c,
              toRow: validMoves[i][0],
              toCol: validMoves[i][1]
            });
          }
        }
      }
    }

    if (moves.length === 0) return null;

    // Cấp độ 1 (Dễ): Chọn ngẫu nhiên hoặc ưu tiên ăn quân
    if (this.difficulty === 1) {
      // 30% chọn ngẫu nhiên, 70% chọn nước đi ăn quân tốt nhất
      if (Math.random() < 0.3) {
        var randomMove = moves[Math.floor(Math.random() * moves.length)];
        if (callback) callback(randomMove);
        return randomMove;
      }
    }

    // Xác định độ sâu tìm kiếm
    var depth = 2;
    if (this.difficulty === 2) depth = 2;
    else if (this.difficulty === 3) depth = 3;
    else if (this.difficulty >= 4) depth = 4;

    // Sắp xếp nước đi (Move Ordering: ăn quân trước để tối ưu Minimax)
    moves.sort(function (a, b) {
      var targetA = board[a.toRow][a.toCol];
      var targetB = board[b.toRow][b.toCol];
      var valA = targetA ? (PIECE_VALUES[targetA] || 0) : 0;
      var valB = targetB ? (PIECE_VALUES[targetB] || 0) : 0;
      return valB - valA;
    });

    var bestMove = moves[0];
    var bestValue = -Infinity;
    var alpha = -Infinity;
    var beta = Infinity;

    for (var j = 0; j < moves.length; j++) {
      var m = moves[j];
      var result = game.makeMove(m.fromRow, m.fromCol, m.toRow, m.toCol);
      if (!result.success) continue;

      var value = -self._minimax(game, depth - 1, -beta, -alpha, (turn === 'red' ? 'black' : 'red'), turn);
      game.undoMove();

      if (value > bestValue) {
        bestValue = value;
        bestMove = m;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }

    if (callback) callback(bestMove);
    return bestMove;
  };

  /**
   * Đệ quy Minimax với Cắt tỉa Alpha-Beta
   */
  XiangqiAI.prototype._minimax = function (game, depth, alpha, beta, currentTurn, aiColor) {
    if (depth === 0 || game.isCheckmate(currentTurn) || game.isStalemate(currentTurn)) {
      return this.evaluateBoard(game, aiColor);
    }

    var board = game.getBoard();
    var moves = [];

    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var piece = board[r][c];
        if (piece && game._getPieceColor(piece) === currentTurn) {
          var validMoves = game.getValidMoves(r, c);
          for (var i = 0; i < validMoves.length; i++) {
            moves.push({
              fromRow: r,
              fromCol: c,
              toRow: validMoves[i][0],
              toCol: validMoves[i][1]
            });
          }
        }
      }
    }

    if (moves.length === 0) {
      return this.evaluateBoard(game, aiColor);
    }

    var maxValue = -Infinity;

    for (var j = 0; j < moves.length; j++) {
      var m = moves[j];
      var res = game.makeMove(m.fromRow, m.fromCol, m.toRow, m.toCol);
      if (!res.success) continue;

      var nextTurn = (currentTurn === 'red') ? 'black' : 'red';
      var value = -this._minimax(game, depth - 1, -beta, -alpha, nextTurn, aiColor);
      game.undoMove();

      maxValue = Math.max(maxValue, value);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }

    return maxValue;
  };

  return XiangqiAI;
}));
