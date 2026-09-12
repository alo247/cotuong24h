/**
 * ============================================================
 *  CỜ TƯỚNG ONLINE - SOUND & AUDIO MANAGER (Web Audio API)
 * ============================================================
 *  Tạo âm thanh chân thực bằng Web Audio API không cần tải file MP3 bên ngoài.
 *  Chạy mượt mà 100% trên Mobile & Desktop, không bao giờ bị lỗi 404!
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SoundManager = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function SoundManager() {
    this.audioCtx = null;
    this.enabled = true;
  }

  SoundManager.prototype._getAudioContext = function () {
    if (!this.audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  };

  /**
   * Phát tiếng chọn quân cờ
   */
  SoundManager.prototype.playSelect = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  /**
   * Phát tiếng đặt quân cờ xuống bàn (Tiếng Cộp gỗ)
   */
  SoundManager.prototype.playMove = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  };

  /**
   * Phát tiếng ăn quân cờ (Tiếng va chạm giòn giã)
   */
  SoundManager.prototype.playCapture = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var gain = ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(500, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

    osc2.frequency.setValueAtTime(250, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.12);
  };

  /**
   * Phát tiếng Chiếu tướng! (Âm thanh báo động)
   */
  SoundManager.prototype.playCheck = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.1);
    osc.frequency.setValueAtTime(1200, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  };

  /**
   * Phát tiếng Chiến thắng!
   */
  SoundManager.prototype.playWin = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    var now = ctx.currentTime;

    notes.forEach(function (freq, index) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.3, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.25);
    });
  };

  /**
   * Phát tiếng Thua cuộc!
   */
  SoundManager.prototype.playLose = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var notes = [400, 350, 300, 250];
    var now = ctx.currentTime;

    notes.forEach(function (freq, index) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);

      gain.gain.setValueAtTime(0.2, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.3);
    });
  };

  /**
   * Tiếng gõ tích tắc đồng hồ
   */
  SoundManager.prototype.playTick = function () {
    if (!this.enabled) return;
    var ctx = this._getAudioContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  };

  return SoundManager;
}));
