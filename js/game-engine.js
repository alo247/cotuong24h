/**
 * ============================================================
 *  CỜ TƯỚNG (Xiangqi / Chinese Chess) - Game Engine
 * ============================================================
 *
 *  Bàn cờ: 10 hàng (0-9) x 9 cột (0-8)
 *    - Hàng 0 = phía Đen (trên), Hàng 9 = phía Đỏ (dưới)
 *    - Sông nằm giữa hàng 4 và hàng 5
 *
 *  Ký hiệu quân cờ (chữ hoa = Đỏ, chữ thường = Đen):
 *    K/k  Tướng   (General / King)
 *    A/a  Sĩ      (Advisor)
 *    E/e  Tượng   (Elephant / Bishop)
 *    H/h  Mã      (Horse / Knight)
 *    R/r  Xe      (Rook / Chariot)
 *    C/c  Pháo    (Cannon)
 *    P/p  Tốt     (Pawn / Soldier)
 *
 *  Module hỗ trợ cả Node.js (CommonJS) và trình duyệt (UMD).
 * ============================================================
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node.js / CommonJS
    module.exports = factory();
  } else {
    // Trình duyệt (biến toàn cục)
    root.ChessGame = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ========== Hằng số ========== */

  var ROWS = 10;  // Số hàng
  var COLS = 9;   // Số cột

  /** Vị trí khởi đầu dạng FEN */
  var INITIAL_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r';

  /* ========== Constructor ========== */

  /**
   * Khởi tạo ván cờ mới với thế trận ban đầu.
   */
  function ChessGame() {
    /** @type {Array<Array<string|null>>} Bàn cờ 10x9 */
    this._board = null;
    /** @type {string} Lượt đi hiện tại: 'red' hoặc 'black' */
    this._turn = 'red';
    /** @type {Array<Object>} Lịch sử các nước đi (dùng để hoàn tác) */
    this._moveHistory = [];
    /** @type {boolean} Ván cờ đã kết thúc chưa */
    this._gameOver = false;

    // Thiết lập bàn cờ ban đầu từ FEN
    this.fromFEN(INITIAL_FEN);
  }

  /* ==========================================================
   *  PHƯƠNG THỨC NỘI BỘ (Private helpers)
   * ========================================================== */

  /**
   * Kiểm tra tọa độ có nằm trong bàn cờ không.
   * @param {number} row - Hàng (0-9)
   * @param {number} col - Cột (0-8)
   * @returns {boolean}
   */
  ChessGame.prototype._isOnBoard = function (row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  };

  /**
   * Lấy màu quân cờ.
   * @param {string|null} piece
   * @returns {string|null} 'red', 'black', hoặc null
   */
  ChessGame.prototype._getPieceColor = function (piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'red' : 'black';
  };

  /**
   * Lấy loại quân cờ (luôn trả về chữ hoa).
   * @param {string|null} piece
   * @returns {string|null}
   */
  ChessGame.prototype._getPieceType = function (piece) {
    if (!piece) return null;
    return piece.toUpperCase();
  };

  /**
   * Kiểm tra tọa độ có nằm trong cửu cung (palace) không.
   *   Cung Đỏ:  hàng 7-9, cột 3-5
   *   Cung Đen:  hàng 0-2, cột 3-5
   */
  ChessGame.prototype._isInPalace = function (row, col, color) {
    if (col < 3 || col > 5) return false;
    if (color === 'red') return row >= 7 && row <= 9;
    return row >= 0 && row <= 2;
  };

  /**
   * Kiểm tra quân đã qua sông chưa.
   *   Quân Đỏ qua sông khi hàng <= 4
   *   Quân Đen qua sông khi hàng >= 5
   */
  ChessGame.prototype._hasCrossedRiver = function (row, color) {
    if (color === 'red') return row <= 4;
    return row >= 5;
  };

  /**
   * Tìm vị trí Tướng (King) của một bên.
   * Chỉ tìm trong phạm vi cung để tối ưu.
   * @param {string} color - 'red' hoặc 'black'
   * @returns {number[]|null} [row, col] hoặc null
   */
  ChessGame.prototype._findKing = function (color) {
    var kingChar = (color === 'red') ? 'K' : 'k';
    var rStart = (color === 'red') ? 7 : 0;
    var rEnd   = (color === 'red') ? 9 : 2;
    for (var r = rStart; r <= rEnd; r++) {
      for (var c = 3; c <= 5; c++) {
        if (this._board[r][c] === kingChar) return [r, c];
      }
    }
    return null;
  };

  /**
   * Kiểm tra vi phạm luật "Tướng đối mặt" (Flying General).
   * Hai Tướng không được đứng cùng cột mà không có quân chắn ở giữa.
   * @returns {boolean} true nếu vi phạm
   */
  ChessGame.prototype._hasFlyingGeneralViolation = function () {
    var redKing   = this._findKing('red');
    var blackKing = this._findKing('black');
    if (!redKing || !blackKing) return false;

    // Khác cột => không vi phạm
    if (redKing[1] !== blackKing[1]) return false;

    // Cùng cột: kiểm tra có quân nào ở giữa không
    var col = redKing[1];
    for (var r = blackKing[0] + 1; r < redKing[0]; r++) {
      if (this._board[r][col]) return false; // Có quân chắn => không vi phạm
    }
    return true; // Không có quân chắn => vi phạm!
  };

  /* ==========================================================
   *  SINH NƯỚC ĐI THÔ (raw moves) CHO TỪNG LOẠI QUÂN
   *  Chưa kiểm tra chiếu Tướng / Flying General sau nước đi.
   * ========================================================== */

  /**
   * Nước đi của TƯỚNG (General / King).
   * Di chuyển 1 ô theo chiều ngang hoặc dọc, giới hạn trong cung.
   */
  ChessGame.prototype._getKingRawMoves = function (row, col, color) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = row + dirs[i][0];
      var nc = col + dirs[i][1];
      if (!this._isOnBoard(nr, nc)) continue;
      if (!this._isInPalace(nr, nc, color)) continue;
      var target = this._board[nr][nc];
      if (target && this._getPieceColor(target) === color) continue; // Không ăn quân mình
      moves.push([nr, nc]);
    }
    return moves;
  };

  /**
   * Nước đi của SĨ (Advisor).
   * Di chuyển 1 ô theo đường chéo, giới hạn trong cung.
   */
  ChessGame.prototype._getAdvisorRawMoves = function (row, col, color) {
    var moves = [];
    var dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = row + dirs[i][0];
      var nc = col + dirs[i][1];
      if (!this._isOnBoard(nr, nc)) continue;
      if (!this._isInPalace(nr, nc, color)) continue;
      var target = this._board[nr][nc];
      if (target && this._getPieceColor(target) === color) continue;
      moves.push([nr, nc]);
    }
    return moves;
  };

  /**
   * Nước đi của TƯỢNG (Elephant).
   * Di chuyển 2 ô theo đường chéo (hình chữ "田").
   * Không được qua sông. Bị cản nếu có quân ở "mắt tượng".
   *
   *   Mắt tượng = ô chéo trung gian giữa vị trí gốc và đích.
   */
  ChessGame.prototype._getElephantRawMoves = function (row, col, color) {
    var moves = [];
    // [delta_row, delta_col, eye_row_offset, eye_col_offset]
    var steps = [
      [-2, -2, -1, -1],
      [-2,  2, -1,  1],
      [ 2, -2,  1, -1],
      [ 2,  2,  1,  1]
    ];
    for (var i = 0; i < steps.length; i++) {
      var nr   = row + steps[i][0];
      var nc   = col + steps[i][1];
      var eyeR = row + steps[i][2];
      var eyeC = col + steps[i][3];

      if (!this._isOnBoard(nr, nc)) continue;

      // Tượng không được qua sông
      if (color === 'red'   && nr < 5) continue;
      if (color === 'black' && nr > 4) continue;

      // Kiểm tra mắt tượng (bị cản)
      if (this._board[eyeR][eyeC]) continue;

      var target = this._board[nr][nc];
      if (target && this._getPieceColor(target) === color) continue;
      moves.push([nr, nc]);
    }
    return moves;
  };

  /**
   * Nước đi của MÃ (Horse / Knight).
   * Di chuyển hình chữ L: 1 bước thẳng + 1 bước chéo.
   * Bị cản nếu có quân ở bước thẳng đầu tiên ("chân mã").
   *
   *   Ví dụ: đi lên 2 trái 1 => chân mã ở (row-1, col).
   */
  ChessGame.prototype._getHorseRawMoves = function (row, col, color) {
    var moves = [];
    // [delta_row, delta_col, block_row_offset, block_col_offset]
    var steps = [
      [-2, -1, -1,  0],   // Lên 2, trái 1  (chân mã: lên 1)
      [-2,  1, -1,  0],   // Lên 2, phải 1  (chân mã: lên 1)
      [ 2, -1,  1,  0],   // Xuống 2, trái 1 (chân mã: xuống 1)
      [ 2,  1,  1,  0],   // Xuống 2, phải 1 (chân mã: xuống 1)
      [-1, -2,  0, -1],   // Trái 2, lên 1   (chân mã: trái 1)
      [-1,  2,  0,  1],   // Phải 2, lên 1   (chân mã: phải 1)
      [ 1, -2,  0, -1],   // Trái 2, xuống 1 (chân mã: trái 1)
      [ 1,  2,  0,  1]    // Phải 2, xuống 1 (chân mã: phải 1)
    ];
    for (var i = 0; i < steps.length; i++) {
      var nr     = row + steps[i][0];
      var nc     = col + steps[i][1];
      var blockR = row + steps[i][2];
      var blockC = col + steps[i][3];

      if (!this._isOnBoard(nr, nc)) continue;

      // Kiểm tra chân mã (bị cản)
      if (this._board[blockR][blockC]) continue;

      var target = this._board[nr][nc];
      if (target && this._getPieceColor(target) === color) continue;
      moves.push([nr, nc]);
    }
    return moves;
  };

  /**
   * Nước đi của XE (Rook / Chariot).
   * Di chuyển bất kỳ số ô theo hàng hoặc cột.
   * Không được nhảy qua quân khác.
   */
  ChessGame.prototype._getRookRawMoves = function (row, col, color) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (var i = 0; i < dirs.length; i++) {
      var dr = dirs[i][0];
      var dc = dirs[i][1];
      var nr = row + dr;
      var nc = col + dc;

      while (this._isOnBoard(nr, nc)) {
        var target = this._board[nr][nc];
        if (target) {
          // Gặp quân: ăn nếu là quân đối phương, rồi dừng
          if (this._getPieceColor(target) !== color) {
            moves.push([nr, nc]);
          }
          break;
        }
        moves.push([nr, nc]); // Ô trống
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  };

  /**
   * Nước đi của PHÁO (Cannon).
   * Di chuyển giống Xe khi KHÔNG ăn quân (trượt theo hàng/cột).
   * Khi ĂN quân, phải nhảy qua đúng 1 quân trung gian ("bệ phóng" / "ngòi").
   */
  ChessGame.prototype._getCannonRawMoves = function (row, col, color) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (var i = 0; i < dirs.length; i++) {
      var dr = dirs[i][0];
      var dc = dirs[i][1];
      var nr = row + dr;
      var nc = col + dc;
      var foundScreen = false; // Đã tìm thấy bệ phóng chưa

      while (this._isOnBoard(nr, nc)) {
        var target = this._board[nr][nc];

        if (!foundScreen) {
          // Chưa có bệ phóng
          if (target) {
            foundScreen = true; // Quân này trở thành bệ phóng
          } else {
            moves.push([nr, nc]); // Di chuyển bình thường (không ăn)
          }
        } else {
          // Đã có bệ phóng => tìm quân để ăn
          if (target) {
            if (this._getPieceColor(target) !== color) {
              moves.push([nr, nc]); // Ăn quân đối phương sau bệ phóng
            }
            break; // Dừng lại (dù ăn được hay không)
          }
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  };

  /**
   * Nước đi của TỐT (Pawn / Soldier).
   * Trước khi qua sông: chỉ đi thẳng 1 ô về phía đối phương.
   * Sau khi qua sông: đi thẳng hoặc ngang 1 ô (không được lùi).
   *
   *   Đỏ đi lên (hàng giảm), Đen đi xuống (hàng tăng).
   */
  ChessGame.prototype._getPawnRawMoves = function (row, col, color) {
    var moves = [];
    var forward = (color === 'red') ? -1 : 1; // Hướng tiến
    var crossed = this._hasCrossedRiver(row, color);

    // Đi thẳng 1 ô
    var nr = row + forward;
    if (this._isOnBoard(nr, col)) {
      var target = this._board[nr][col];
      if (!target || this._getPieceColor(target) !== color) {
        moves.push([nr, col]);
      }
    }

    // Đi ngang 1 ô (chỉ sau khi qua sông)
    if (crossed) {
      var sides = [-1, 1];
      for (var i = 0; i < sides.length; i++) {
        var nc = col + sides[i];
        if (this._isOnBoard(row, nc)) {
          var sideTarget = this._board[row][nc];
          if (!sideTarget || this._getPieceColor(sideTarget) !== color) {
            moves.push([row, nc]);
          }
        }
      }
    }

    return moves;
  };

  /**
   * Lấy tất cả nước đi thô (raw) cho quân tại (row, col).
   * "Thô" = chưa loại bỏ các nước đi khiến Tướng mình bị chiếu.
   */
  ChessGame.prototype._getRawMoves = function (row, col) {
    var piece = this._board[row][col];
    if (!piece) return [];

    var color = this._getPieceColor(piece);
    var type  = this._getPieceType(piece);

    switch (type) {
      case 'K': return this._getKingRawMoves(row, col, color);
      case 'A': return this._getAdvisorRawMoves(row, col, color);
      case 'E': return this._getElephantRawMoves(row, col, color);
      case 'H': return this._getHorseRawMoves(row, col, color);
      case 'R': return this._getRookRawMoves(row, col, color);
      case 'C': return this._getCannonRawMoves(row, col, color);
      case 'P': return this._getPawnRawMoves(row, col, color);
      default:  return [];
    }
  };

  /**
   * Kiểm tra Tướng của một bên có đang bị đe dọa không.
   * Bao gồm cả luật Tướng đối mặt (Flying General).
   *
   * Phương thức này được gọi bên trong getValidMoves khi thử nước đi
   * trên bàn cờ tạm thời, nên nó phải đọc trực tiếp từ this._board.
   *
   * @param {string} color - 'red' hoặc 'black'
   * @returns {boolean} true nếu Tướng đang bị chiếu / đe dọa
   */
  ChessGame.prototype._isKingInDanger = function (color) {
    var kingPos = this._findKing(color);
    if (!kingPos) return true; // Tướng không tìm thấy (trường hợp bất thường)

    // 1) Kiểm tra luật Tướng đối mặt
    if (this._hasFlyingGeneralViolation()) return true;

    // 2) Kiểm tra có quân đối phương nào tấn công được Tướng không
    var opponentColor = (color === 'red') ? 'black' : 'red';
    var kr = kingPos[0];
    var kc = kingPos[1];

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var p = this._board[r][c];
        if (!p || this._getPieceColor(p) !== opponentColor) continue;

        var rawMoves = this._getRawMoves(r, c);
        for (var j = 0; j < rawMoves.length; j++) {
          if (rawMoves[j][0] === kr && rawMoves[j][1] === kc) {
            return true;
          }
        }
      }
    }

    return false;
  };

  /**
   * Kiểm tra bên color còn nước đi hợp lệ nào không.
   * @param {string} color
   * @returns {boolean}
   */
  ChessGame.prototype._hasAnyValidMove = function (color) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var piece = this._board[r][c];
        if (!piece || this._getPieceColor(piece) !== color) continue;
        if (this._getValidMovesForPiece(r, c).length > 0) return true;
      }
    }
    return false;
  };

  /**
   * Lấy nước đi hợp lệ cho quân tại (row, col) - phiên bản nội bộ.
   * Không kiểm tra lượt đi.
   */
  ChessGame.prototype._getValidMovesForPiece = function (row, col) {
    var piece = this._board[row][col];
    if (!piece) return [];

    var color    = this._getPieceColor(piece);
    var rawMoves = this._getRawMoves(row, col);
    var valid    = [];

    for (var i = 0; i < rawMoves.length; i++) {
      var nr = rawMoves[i][0];
      var nc = rawMoves[i][1];

      // Thử nước đi trên bàn cờ thật (tạm thời)
      var captured = this._board[nr][nc];
      this._board[nr][nc]       = piece;
      this._board[row][col]     = null;

      // Kiểm tra Tướng mình có an toàn sau nước đi này không
      var endangered = this._isKingInDanger(color);

      // Hoàn tác
      this._board[row][col] = piece;
      this._board[nr][nc]   = captured;

      if (!endangered) {
        valid.push([nr, nc]);
      }
    }

    return valid;
  };

  /* ==========================================================
   *  PHƯƠNG THỨC CÔNG KHAI (Public API)
   * ========================================================== */

  /**
   * Trả về bản sao bàn cờ hiện tại (mảng 2 chiều 10x9).
   * Mỗi ô là ký tự quân cờ hoặc null nếu trống.
   * @returns {Array<Array<string|null>>}
   */
  ChessGame.prototype.getBoard = function () {
    var copy = [];
    for (var r = 0; r < ROWS; r++) {
      copy.push(this._board[r].slice());
    }
    return copy;
  };

  /**
   * Lấy quân cờ tại vị trí (row, col).
   * @param {number} row
   * @param {number} col
   * @returns {string|null}
   */
  ChessGame.prototype.getPiece = function (row, col) {
    if (!this._isOnBoard(row, col)) return null;
    return this._board[row][col];
  };

  /**
   * Lấy tất cả nước đi hợp lệ cho quân tại (row, col).
   * Đã loại bỏ nước đi khiến Tướng mình bị chiếu hoặc vi phạm
   * luật Tướng đối mặt.
   *
   * @param {number} row
   * @param {number} col
   * @returns {Array<number[]>} Danh sách [row, col] đích hợp lệ
   */
  ChessGame.prototype.getValidMoves = function (row, col) {
    return this._getValidMovesForPiece(row, col);
  };

  /**
   * Thực hiện một nước đi.
   *
   * @param {number} fromRow - Hàng xuất phát
   * @param {number} fromCol - Cột xuất phát
   * @param {number} toRow   - Hàng đích
   * @param {number} toCol   - Cột đích
   * @returns {Object} Kết quả:
   *   {boolean} success   - Nước đi có hợp lệ và được thực hiện không
   *   {string|null} captured - Quân bị ăn (hoặc null)
   *   {boolean} check     - Đối phương đang bị chiếu
   *   {boolean} checkmate - Đối phương bị chiếu hết (thua)
   *   {boolean} stalemate - Đối phương hết nước (hòa / thua tùy luật)
   */
  ChessGame.prototype.makeMove = function (fromRow, fromCol, toRow, toCol) {
    var result = {
      success: false,
      captured: null,
      check: false,
      checkmate: false,
      stalemate: false
    };

    // Ván đã kết thúc
    if (this._gameOver) return result;

    // Kiểm tra có quân ở ô xuất phát không
    var piece = this._board[fromRow][fromCol];
    if (!piece) return result;

    // Kiểm tra lượt đi
    var color = this._getPieceColor(piece);
    if (color !== this._turn) return result;

    // Kiểm tra nước đi có hợp lệ không
    var validMoves = this.getValidMoves(fromRow, fromCol);
    var isValid = false;
    for (var i = 0; i < validMoves.length; i++) {
      if (validMoves[i][0] === toRow && validMoves[i][1] === toCol) {
        isValid = true;
        break;
      }
    }
    if (!isValid) return result;

    // Lưu vào lịch sử để có thể hoàn tác
    var captured = this._board[toRow][toCol];
    this._moveHistory.push({
      fromRow: fromRow,
      fromCol: fromCol,
      toRow: toRow,
      toCol: toCol,
      piece: piece,
      captured: captured,
      turn: this._turn
    });

    // Thực hiện nước đi
    this._board[toRow][toCol]     = piece;
    this._board[fromRow][fromCol] = null;

    // Chuyển lượt
    var opponentColor = (this._turn === 'red') ? 'black' : 'red';
    this._turn = opponentColor;

    // Đánh giá trạng thái sau nước đi
    result.success  = true;
    result.captured = captured;

    var inCheck = this.isCheck(opponentColor);
    result.check = inCheck;

    if (inCheck) {
      // Đang bị chiếu => kiểm tra chiếu hết
      result.checkmate = !this._hasAnyValidMove(opponentColor);
      result.stalemate = false;
    } else {
      // Không bị chiếu => kiểm tra hết nước
      result.checkmate = false;
      result.stalemate = !this._hasAnyValidMove(opponentColor);
    }

    if (result.checkmate || result.stalemate) {
      this._gameOver = true;
    }

    return result;
  };

  /**
   * Hoàn tác nước đi cuối cùng.
   * @returns {boolean} true nếu hoàn tác thành công, false nếu không có nước để hoàn tác
   */
  ChessGame.prototype.undoMove = function () {
    if (this._moveHistory.length === 0) return false;

    var last = this._moveHistory.pop();
    this._board[last.fromRow][last.fromCol] = last.piece;
    this._board[last.toRow][last.toCol]     = last.captured;
    this._turn     = last.turn;
    this._gameOver = false;

    return true;
  };

  /**
   * Kiểm tra bên color có đang bị chiếu Tướng không.
   * @param {string} color - 'red' hoặc 'black'
   * @returns {boolean}
   */
  ChessGame.prototype.isCheck = function (color) {
    return this._isKingInDanger(color);
  };

  /**
   * Kiểm tra bên color có bị chiếu hết không.
   * Chiếu hết = đang bị chiếu VÀ không còn nước đi hợp lệ.
   * @param {string} color - 'red' hoặc 'black'
   * @returns {boolean}
   */
  ChessGame.prototype.isCheckmate = function (color) {
    if (!this.isCheck(color)) return false;
    return !this._hasAnyValidMove(color);
  };

  /**
   * Kiểm tra bên color có bị hết nước (stalemate) không.
   * Hết nước = KHÔNG bị chiếu nhưng không còn nước đi hợp lệ.
   * @param {string} color - 'red' hoặc 'black'
   * @returns {boolean}
   */
  ChessGame.prototype.isStalemate = function (color) {
    if (this.isCheck(color)) return false;
    return !this._hasAnyValidMove(color);
  };

  /**
   * Lấy lượt đi hiện tại.
   * @returns {string} 'red' hoặc 'black'
   */
  ChessGame.prototype.getCurrentTurn = function () {
    return this._turn;
  };

  /**
   * Lấy lịch sử các nước đi (bản sao).
   * @returns {Array<Object>}
   */
  ChessGame.prototype.getMoveHistory = function () {
    var history = [];
    for (var i = 0; i < this._moveHistory.length; i++) {
      var m = this._moveHistory[i];
      history.push({
        fromRow:  m.fromRow,
        fromCol:  m.fromCol,
        toRow:    m.toRow,
        toCol:    m.toCol,
        piece:    m.piece,
        captured: m.captured,
        turn:     m.turn
      });
    }
    return history;
  };

  /**
   * Lấy toàn bộ trạng thái ván cờ (dùng để lưu trữ / serialize).
   * @returns {Object}
   */
  ChessGame.prototype.getGameState = function () {
    return {
      fen:         this.toFEN(),
      moveHistory: this.getMoveHistory(),
      gameOver:    this._gameOver
    };
  };

  /**
   * Nạp trạng thái ván cờ đã lưu.
   * @param {Object} state - Đối tượng từ getGameState()
   */
  ChessGame.prototype.loadGameState = function (state) {
    this.fromFEN(state.fen);
    this._gameOver = state.gameOver || false;
    this._moveHistory = [];
    if (state.moveHistory) {
      for (var i = 0; i < state.moveHistory.length; i++) {
        var m = state.moveHistory[i];
        this._moveHistory.push({
          fromRow:  m.fromRow,
          fromCol:  m.fromCol,
          toRow:    m.toRow,
          toCol:    m.toCol,
          piece:    m.piece,
          captured: m.captured,
          turn:     m.turn
        });
      }
    }
  };

  /**
   * Chuyển đổi trạng thái bàn cờ sang dạng FEN.
   *
   * Định dạng: hàng0/hàng1/.../hàng9 lượt
   *   - Các ô trống liền nhau gộp thành một số
   *   - Lượt: 'r' = Đỏ, 'b' = Đen
   *
   * Ví dụ ban đầu:
   *   rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r
   *
   * @returns {string}
   */
  ChessGame.prototype.toFEN = function () {
    var rowStrings = [];

    for (var r = 0; r < ROWS; r++) {
      var rowStr = '';
      var emptyCount = 0;

      for (var c = 0; c < COLS; c++) {
        var piece = this._board[r][c];
        if (piece) {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += piece;
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        rowStr += emptyCount;
      }
      rowStrings.push(rowStr);
    }

    var turnChar = (this._turn === 'red') ? 'r' : 'b';
    return rowStrings.join('/') + ' ' + turnChar;
  };

  /**
   * Nạp bàn cờ từ chuỗi FEN.
   * Reset lịch sử nước đi.
   *
   * @param {string} fen
   */
  ChessGame.prototype.fromFEN = function (fen) {
    var parts   = fen.trim().split(/\s+/);
    var boardPart = parts[0];
    var turnPart  = (parts.length > 1) ? parts[1] : 'r';

    // Phân tích bàn cờ
    this._board = [];
    var rowStrings = boardPart.split('/');

    for (var r = 0; r < ROWS; r++) {
      var row = [];
      if (r < rowStrings.length) {
        var rowStr = rowStrings[r];
        for (var i = 0; i < rowStr.length; i++) {
          var ch = rowStr[i];
          if (ch >= '1' && ch <= '9') {
            var count = parseInt(ch, 10);
            for (var j = 0; j < count; j++) {
              row.push(null);
            }
          } else {
            row.push(ch);
          }
        }
      }
      // Đảm bảo đủ 9 cột
      while (row.length < COLS) {
        row.push(null);
      }
      this._board.push(row);
    }

    // Thiết lập lượt đi
    this._turn = (turnPart === 'b') ? 'black' : 'red';

    // Reset trạng thái
    this._moveHistory = [];
    this._gameOver    = false;
  };

  /* ========== Trả về class ========== */
  return ChessGame;

}));
