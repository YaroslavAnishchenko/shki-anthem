const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('i');
const coverArt = document.getElementById('cover');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const bgGlow = document.getElementById('bg-glow');

let audioCtx;
let analyser;
let source;
let isPlaying = false;

// Инициализация аудио-контекста (нужна для работы визуализатора)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 128; // Количество полосок (чем больше, тем детальнее)
        drawVisualizer();
    }
}

function drawVisualizer() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Очистка холста
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        let totalAmplitude = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            totalAmplitude += barHeight;

            // Цвет полосок визуализатора
            ctx.fillStyle = `rgba(108, 92, 231, ${barHeight / 100 + 0.2})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        // ЦВЕТОМУЗЫКА: Пульсация фона в зависимости от громкости
        const avgAmplitude = totalAmplitude / bufferLength;
        const scale = 1 + avgAmplitude / 150;
        bgGlow.style.transform = `translate(-50%, -50%) scale(${scale})`;
        bgGlow.style.opacity = 0.5 + avgAmplitude / 100;
    }

    draw();
}

function togglePlay() {
    // Включаем аудио-контекст при первом клике
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    initAudio();

    if (isPlaying) {
        audio.pause();
        playIcon.classList.replace('fa-pause', 'fa-play');
        coverArt.classList.remove('play');
    } else {
        audio.play().catch(e => console.error("Ошибка воспроизведения:", e));
        playIcon.classList.replace('fa-play', 'fa-pause');
        coverArt.classList.add('play');
    }
    isPlaying = !isPlaying;
}

// Функции времени и прогресса (из предыдущего кода)
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    progress.style.width = `${(currentTime / duration) * 100}%`;
    currentTimeEl.innerText = formatTime(currentTime);
    durationEl.innerText = formatTime(duration);
});

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
});

playBtn.addEventListener('click', togglePlay);

audio.addEventListener('loadedmetadata', () => {
    durationEl.innerText = formatTime(audio.duration);
});