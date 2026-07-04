/* -------------------------------------------------------------
   CodePen JS Tab にコピー＆ペーストしてください
------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const introOverlay = document.getElementById('intro-overlay');
  const mainContent = document.getElementById('main-content');
  const paragraphs = document.querySelectorAll('.paragraph');
  
  const jumpscareOverlay = document.getElementById('jumpscare-overlay');
  const showSpoilerBtn = document.getElementById('show-spoiler-btn');
  
  const spoilerOverlay = document.getElementById('spoiler-overlay');
  const restartBtn = document.getElementById('restart-btn');

  // 音声要素
  const screamSound = document.getElementById('scream-sound');
  const ambientSound = document.getElementById('ambient-sound');

  // 状態管理
  let audioUnlocked = false;
  let triggered = false;
  let shakeTimeoutId = null;

  // 1. スタート（警告承認）ボタンクリック時
  startBtn.addEventListener('click', () => {
    // イントロ画面フェードアウト
    introOverlay.style.transition = 'opacity 1s ease';
    introOverlay.style.opacity = '0';
    
    // メインコンテンツ表示
    mainContent.style.opacity = '1';

    // 音声の再生準備（ブラウザの自動再生制限の解除）
    ambientSound.volume = 0.4;
    ambientSound.play().catch(e => console.log("Ambient autoplay blocked:", e));
    
    screamSound.play().then(() => {
      screamSound.pause();
      screamSound.currentTime = 0;
    }).catch(e => console.log("Scream pre-play blocked:", e));

    audioUnlocked = true;

    setTimeout(() => {
      introOverlay.style.display = 'none';
    }, 1000);
  });

  // 2. スクロールによるパラグラフ（テキスト）の段階的表示
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -15% 0px', // 画面の下部15%に入る直前でトリガー
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  paragraphs.forEach(p => {
    observer.observe(p);
  });

  // 3. ページの最下部への到達判定（ジャンプスケアトリガー）
  window.addEventListener('scroll', () => {
    if (!audioUnlocked || triggered) return;

    // 現在のスクロール位置 + ウィンドウの高さ 
    const scrollPosition = window.scrollY + window.innerHeight;
    // ページの総高
    const documentHeight = document.documentElement.scrollHeight;

    // 💡【調整】最下部判定を少し「甘く」しました。
    // 端末の画面サイズによってスクロールが数ピクセル届かないことがあるため、
    // 残り 200px の範囲に入った時点で確実にトリガーするように設定しています。
    if (documentHeight - scrollPosition < 200) {
      triggerJumpscare();
    }
  });

  // 4. ジャンプスケア発動処理
  function triggerJumpscare() {
    triggered = true;

    // 環境音を止めて悲鳴を爆音で流す
    ambientSound.pause();
    screamSound.volume = 1.0;
    screamSound.play().catch(e => {
      console.log("Audio failed, fallback to beep.");
      playEmergencyBeep();
    });

    // 画面全体を揺らす（bodyにCSSクラス付与）
    document.body.classList.add('shake-screen');

    // ジャンプスケア画面（赤いオーバーレイ）を表示
    jumpscareOverlay.style.display = 'flex';

    // 3秒後に自動的に画面の揺れを止める
    shakeTimeoutId = setTimeout(() => {
      document.body.classList.remove('shake-screen');
    }, 3000);
  }

  // 5. 「ネタばらしを見る」ボタンクリック時の処理
  showSpoilerBtn.addEventListener('click', () => {
    // 悲鳴音などのすべての怖い音を即座に停止
    screamSound.pause();
    screamSound.currentTime = 0;
    ambientSound.pause();

    // 進行中の画面揺らし用タイマーがあればクリアする
    if (shakeTimeoutId) {
      clearTimeout(shakeTimeoutId);
      shakeTimeoutId = null;
    }

    // 画面の揺れクラス（shake-screen）をbodyから完全に、即座に削除
    document.body.classList.remove('shake-screen');

    // ジャンプスケア画面を非表示にして、ネタばらし（解説）画面を表示
    jumpscareOverlay.style.display = 'none';
    spoilerOverlay.style.display = 'flex';
  });

  // 6. 「トップに戻る」ボタンクリック時の処理
  restartBtn.addEventListener('click', () => {
    // ページをリロードして最初から安全に遊べるようにリセット
    location.reload();
  });

  // 緊急用ビープ音
  function playEmergencyBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = [100, 150, 155, 300];
      frequencies.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 3);
      });
    } catch (e) {
      console.log("Web Audio not supported");
    }
  }
});