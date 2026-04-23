// Data Soal (10 Soal Pengetahuan Umum & Logika)
const questionsData = [
  { p: "Perhatikan pernyataan berikut: “Seseorang sering menggunakan kata ‘gitu loh’ dalam berbicara.”Pernyataan tersebut termasuk dalam ragam bahasa …", o: ["A. Dialek", "B. Idiolek", "C. Sosiolek", "D. Kronolek"], j: 1 },
  { p: "Kalimat berikut: “Segarkan harimu dengan minuman ini!” Termasuk ke dalam ragam bahasa …", o: ["A. Ilmiah", "B. Hukum", "C. Jurnalistik", "D. Iklan"], j: 3 },
  { p: "Perbedaan mendasar antara ragam bahasa formal dan semiformal adalah …", o: ["A. Formal menggunakan bahasa daerah, semiformal tidak", "B. Formal lebih fleksibel dibanding semiformal", "C. Formal bersifat lebih kaku dan mengikuti kaidah, sedangkan semiformal lebih fleksibel tetapi tetap sopan", "D. Semiformal hanya digunakan dalam tulisan"], j: 2 },
  { p: "Ragam bahasa yang muncul karena pengaruh kelompok sosial, seperti penggunaan bahasa gaul dalam pergaulan, disebut …", o: ["A. Idiolek", "B. Dialek", "C. Sosiolek", "D. Kronolek"], j: 2 },
  { p: "Perhatikan kalimat berikut: “Banjir melanda beberapa wilayah akibat curah hujan yang tinggi.” Kalimat tersebut termasuk ragam bahasa …", o: ["A. Ilmiah", "B. Jurnalistik", "C. Sastra", "D. Iklan"], j: 1 },
];

// Data Nama (25 Nama Custom)
const namesData = [
  "Maria", "Viona", "Marsya", "Egika", "Wildan", "Ame", "Desca", "Mia", 
  "Dara", "Valentino", "Purwani", "Eca", "Rosi", "Winda", "Keshya", "Dea", 
  "Duta", "Muti", "Risma", "Rama", "Abdi", "Harsa", "Cok Bagus", "Nia", "Irham"
];

// Elements
const ballsContainer = document.getElementById('balls-container');
const btnDraw = document.getElementById('btn-draw');
const clawRail = document.querySelector('.claw-rail');
const clawBase = document.getElementById('claw');
const prizeSlot = document.getElementById('prize-slot');
const machineGlass = document.querySelector('.machine-glass');

const readyModal = document.getElementById('ready-modal');
const readyTumbalNameEl = document.getElementById('ready-tumbal-name');
const btnReady = document.getElementById('btn-ready');

const questionModal = document.getElementById('question-modal');
const tumbalNameEl = document.getElementById('tumbal-name');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');

const timerContainer = document.querySelector('.timer-container');
const timerTextEl = document.getElementById('timer-text');

const alertModal = document.getElementById('alert-modal');
const alertTitleEl = document.getElementById('alert-title');
const alertMessageEl = document.getElementById('alert-message');
const btnContinue = document.getElementById('btn-continue');

// State
let availableNames = [...namesData];
let availableQuestions = [...questionsData];
let isAnimating = false;
let currentPickedName = '';
let countdown;
let timeLeft = 20;
let isAnswered = false;

// ---- Audio Synthesizer (Web Audio API) untuk SoundFX ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol=0.5) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; 
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Create White Noise buffer for Clapping/Punching
function createNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
const noiseBuffer = createNoiseBuffer();

function playNoise(duration, vol) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  const gainStatus = audioCtx.createGain();
  
  // simple bandpass filter for noise (makes it sound less harsh)
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  
  gainStatus.gain.setValueAtTime(vol, audioCtx.currentTime);
  gainStatus.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  noiseSrc.connect(filter);
  filter.connect(gainStatus);
  gainStatus.connect(audioCtx.destination);
  noiseSrc.start();
}

const sfx = {
  click: () => playTone(800, 'square', 0.1, 0.2),
  moving: () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  },
  grab: () => playTone(600, 'triangle', 0.3, 0.5),
  correct: () => {
    // Suara Terompet Tada
    const tada = new Audio('https://www.myinstants.com/media/sounds/tada.mp3');
    tada.volume = 0.6;
    tada.play().catch(e => console.log('Audio blocked', e));
  },
  wrong: () => {
    // Suara Bel Salah bawaan
    playTone(150, 'sawtooth', 0.6, 0.5);
    setTimeout(() => playTone(120, 'sawtooth', 0.8, 0.5), 200);
  },
  tick: () => playTone(1000, 'sine', 0.1, 0.1),
  tickUrgent: () => playTone(1400, 'square', 0.1, 0.3),
  
  // Suara Tepuk Tangan Nyata
  applause: () => {
    const clap = new Audio('https://www.myinstants.com/media/sounds/applause-7.mp3');
    clap.volume = 0.8;
    clap.play().catch(e => console.log('Audio blocked', e));
  },
  // Suara Buk Buk Pukulan Nyata yang terus-menerus
  punch: () => {
    let delay = 0;
    for(let i=0; i<35; i++) { // Jumlah pukulan ditambah jadi 35 bertubi-tubi
        setTimeout(() => {
            const punchSnd = new Audio('https://www.myinstants.com/media/sounds/punch.mp3');
            punchSnd.volume = 1.0;
            punchSnd.play().catch(e => console.log('Audio', e));
        }, delay);
        delay += 100 + Math.random() * 50; // Jeda tipis dan saling tumpruk biar rusuh
    }
  }
};

// Inisialisasi Bola
function initBalls() {
  ballsContainer.innerHTML = '';
  const containerWidth = machineGlass.clientWidth;
  
  availableNames.forEach((name, index) => {
    const ball = document.createElement('div');
    ball.className = `ball ball-${(index % 5) + 1}`;
    // Jika nama kepanjangan, teksnya akan membungkus otomatis. Font size mungkin bisa diatur via CSS bila terlalu besar.
    ball.innerText = name;
    ball.dataset.name = name;
    
    const randLeft = Math.random() * 85; 
    const randBottom = Math.random() * 15; 
    
    ball.style.left = `${randLeft}%`;
    ball.style.bottom = `${randBottom}%`;
    ball.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    ballsContainer.appendChild(ball);
  });
}

window.addEventListener('resize', () => {
    if(!isAnimating && availableNames.length === namesData.length) initBalls();
});

// Claw Animation & Game Logic
btnDraw.addEventListener('click', () => {
  if (isAnimating) return;
  if (availableNames.length === 0 || availableQuestions.length === 0) {
    alert("Semua nama/pertanyaan sudah habis! Mulai Ulang / Refresh halaman.");
    return;
  }
  
  sfx.click();
  isAnimating = true;
  btnDraw.disabled = true;
  btnDraw.textContent = "MENCAPIT...";
  prizeSlot.innerHTML = '';

  const balls = document.querySelectorAll('.ball');
  if (balls.length === 0) return;
  
  const targetBall = balls[Math.floor(Math.random() * balls.length)];
  const glassRect = machineGlass.getBoundingClientRect();
  const ballRect = targetBall.getBoundingClientRect();
  
  const targetX = ballRect.left - glassRect.left + (ballRect.width / 2);
  
  clawRail.style.left = `${targetX}px`;
  
  setTimeout(() => {
    sfx.moving();
    const dropHeight = ballRect.top - glassRect.top;
    clawRail.style.height = `${dropHeight + 20}px`;
    
    setTimeout(() => {
      sfx.grab();
      clawBase.classList.add('claw-grab');
      targetBall.style.transition = 'none';
      
      setTimeout(() => {
        targetBall.style.bottom = '-30px';
        targetBall.style.left = '50%';
        targetBall.style.transform = 'translateX(-50%)';
        clawBase.appendChild(targetBall);
        
        sfx.moving();
        clawRail.style.height = '20px';
        
        setTimeout(() => {
          clawRail.style.left = '100px';
          
          setTimeout(() => {
            sfx.grab();
            clawBase.classList.remove('claw-grab');
            clawRail.style.height = `${glassRect.height * 0.6}px`;
            
            setTimeout(() => {
              targetBall.style.bottom = '-300px';
              
              setTimeout(() => {
                prizeSlot.appendChild(targetBall);
                targetBall.style.position = 'relative';
                targetBall.style.left = '0';
                targetBall.style.bottom = '0';
                targetBall.style.transform = 'none';
                
                clawRail.style.height = '20px';
                clawRail.style.left = '50%';
                
                // Set the current name globally here
                currentPickedName = targetBall.dataset.name;
                availableNames = availableNames.filter(n => n !== currentPickedName);
                
                setTimeout(() => {
                  targetBall.remove();
                  showReadyModal(currentPickedName);
                }, 800);

              }, 400);

            }, 300);
          }, 1000);
        }, 1200);
      }, 500);
    }, 1200);
  }, 1000);
});

function showReadyModal(tumbalName) {
  readyTumbalNameEl.textContent = tumbalName;
  readyModal.classList.remove('hidden');
}

btnReady.addEventListener('click', () => {
  sfx.click();
  readyModal.classList.add('hidden');
  showQuestion(currentPickedName);
  startTimer();
});

function showQuestion(tumbalName) {
  const randIndex = Math.floor(Math.random() * availableQuestions.length);
  const qData = availableQuestions[randIndex];
  
  availableQuestions.splice(randIndex, 1);
  
  tumbalNameEl.textContent = tumbalName;
  questionTextEl.textContent = qData.p;
  
  optionsContainer.innerHTML = '';
  qData.o.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn-option';
    btn.textContent = opt;
    btn.onmouseenter = () => playTone(1200, 'sine', 0.05, 0.05);
    btn.onclick = () => checkAnswer(idx, qData.j, btn);
    optionsContainer.appendChild(btn);
  });
  
  questionModal.classList.remove('hidden');
}

function startTimer() {
  timeLeft = 20;
  isAnswered = false;
  timerTextEl.textContent = timeLeft;
  timerContainer.classList.remove('timer-low');
  
  countdown = setInterval(() => {
    if(isAnswered) {
      clearInterval(countdown);
      return;
    }
    
    timeLeft--;
    timerTextEl.textContent = timeLeft;
    
    timerContainer.classList.add('timer-tick');
    setTimeout(() => timerContainer.classList.remove('timer-tick'), 150);
    
    if (timeLeft <= 5 && timeLeft > 0) {
      timerContainer.classList.add('timer-low');
      sfx.tickUrgent();
    } else if (timeLeft > 0) {
      sfx.tick();
    }

    if(timeLeft <= 0) {
      clearInterval(countdown);
      sfx.wrong();
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  const buttons = optionsContainer.querySelectorAll('.btn-option');
  buttons.forEach(b => b.disabled = true);
  
  setTimeout(() => showAlert(false, true), 1000);
}

function checkAnswer(selectedIndex, correctIndex, btnElement) {
  isAnswered = true; 
  clearInterval(countdown);
  
  const buttons = optionsContainer.querySelectorAll('.btn-option');
  buttons.forEach(b => b.disabled = true);
  
  if (selectedIndex === correctIndex) {
    btnElement.classList.add('correct');
    setTimeout(() => showAlert(true, false), 1500);
  } else {
    btnElement.classList.add('wrong');
    buttons[correctIndex].classList.add('correct');
    setTimeout(() => showAlert(false, false), 2000);
  }
}

// Merender Modal Animasi Mahkota / Dipukulin
function showAlert(isCorrect, isTimeout) {
  questionModal.classList.add('hidden');
  alertModal.classList.remove('hidden');
  
  let animationHTML = '';
  
  if (isCorrect) {
    alertTitleEl.textContent = "BENAR!";
    alertTitleEl.className = "success-text";
    alertMessageEl.textContent = "Luar biasa! Tumbal ini cerdas!";
    
    // Suara Terompet Tada & Tepuk Tangan 
    sfx.correct();
    sfx.applause();
    let confettiHTML = '';
    const colors = ['#ffea00', '#00ffff', '#d633ff', '#39ff14', '#ff003c'];
    for(let i=0; i<80; i++) {
      const left = Math.random() * 100;
      const animDur = 1 + Math.random() * 2;
      const animDel = Math.random() * 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      confettiHTML += `<div style="position:absolute; left:${left}%; top:-150px; width:15px; height:10px; background:${color}; z-index:1; opacity:0; box-shadow:0 0 5px ${color}; animation: fallDownAnim ${animDur}s ${animDel}s forwards linear;"></div>`;
    }
    
    // Visual Crown Drop & Trumpets & Confetti
    animationHTML = `
      <div class="anim-container" style="overflow:visible;">
        ${confettiHTML}
        <!-- Terompet dari Kiri -->
        <div class="trumpet trumpet-left">🎺</div>
        <div class="crown-anim">
          <div class="crown">👑</div>
          <span class="the-name">${currentPickedName}</span>
        </div>
        <!-- Terompet dari Kanan -->
        <div class="trumpet trumpet-right">🎺</div>
      </div>
    `;
    
  } else {
    alertTitleEl.textContent = isTimeout ? "WAKTU HABIS!" : "SALAH!";
    alertTitleEl.className = "error-text";
    alertMessageEl.textContent = isTimeout ? "Lelet banget! Waktunya hukuman!" : "Hahaha! Jawaban salah, rasakan ini!";
    
    // Suara Buzzer & Buk Buk Pukulan
    sfx.wrong();
    sfx.punch();
    
    // Visual Dipukulin (Kiri Kanan Sarung Tinju)
    animationHTML = `
      <div class="anim-container">
        <div class="beat-anim">
          <div class="glove glove-left">🥊</div>
          <div class="beat-text">${currentPickedName}</div>
          <div class="glove glove-right">🥊</div>
        </div>
      </div>
    `;
  }
  
  // Inject animasinya di awal alert-message
  alertMessageEl.insertAdjacentHTML('afterbegin', animationHTML);
}

btnContinue.addEventListener('click', () => {
  sfx.click();
  alertModal.classList.add('hidden');
  
  // Reset alert message to original 
  // Biar gak nambah ganda animasi di ronde berikutnya
  const animContainer = document.querySelector('.anim-container');
  if(animContainer) animContainer.remove();
  
  btnDraw.textContent = "CARI MANGSA";
  if(availableQuestions.length > 0 && availableNames.length > 0) {
    btnDraw.disabled = false;
  } else {
    btnDraw.textContent = "GAME OVER";
  }
  
  isAnimating = false;
});

// Start Inisialisasi awal
setTimeout(initBalls, 100);
