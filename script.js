const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('i');
const coverArt = document.getElementById('cover');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const bgGlow = document.getElementById('bg-glow');

// Элементы новых фич
const lyricsContainer = document.getElementById('lyrics-container');
const karaokeSection = document.getElementById('karaoke-section');
const lyricsBtn = document.getElementById('lyrics-btn');
const shareBtn = document.getElementById('share-btn');
const qrModal = document.getElementById('qr-modal');
const closeQr = document.getElementById('close-qr');

// Канвасы
const canvasVis = document.getElementById('visualizer');
const ctxVis = canvasVis.getContext('2d');
const canvasPart = document.getElementById('particles-canvas');
const ctxPart = canvasPart.getContext('2d');

let audioCtx, analyser, source;
let isPlaying = false;
let isDJMode = false;

// 1. КАРАОКЕ: Текст гимна ШКИ (Настрой параметр "t" - это секунды!)
const lyricsData = [
    { t: 0, text: "🎵 (Вступление) 🎵" },
    { t: 10, text: "Мы молодёжь весёлые активные" },
    { t: 14, text: "Радуемся жизни, мега позитивные" },
    { t: 18, text: "Крутимся, вертимся, прыгаем, скачем" },
    { t: 22, text: "Готовы выполнять любые задачи" },
    { t: 26, text: "Учимся мы в уникальном месте" },
    { t: 30, text: "Трудимся честно, побеждаем вместе" },
    { t: 34, text: "Креатив, эксклюзив, позитив, синергия" },
    { t: 38, text: "С нами сила, за нами Россия" },
    { t: 42, text: "ШКИ наша гордость, наша семья" },
    { t: 46, text: "ШКИ это место где можно творить" },
    { t: 50, text: "ШКИ это он, это ты, это я" },
    { t: 54, text: "Каждый здесь может о себе заявить" },
    { t: 62, text: "Место для творчества и личностного роста" },
    { t: 66, text: "Учиться интересно, нам легко и очень просто" },
    { t: 70, text: "Строим мы в будущее крепкие мосты" },
    { t: 74, text: "Наша энергия не даст нам остыть" },
    { t: 78, text: "Фото и видео, 3D анимация" },
    { t: 82, text: "Работа со звуком, мультипликация" },
    { t: 86, text: "VR и дополненная реальность" },
    { t: 90, text: "В этом вся наша многофункциональность" },
    { t: 94, text: "ШКИ наша гордость, наша семья!" }
];

// Инициализация текста
lyricsData.forEach((line, index) => {
    const p = document.createElement('p');
    p.className = 'lyric-line';
    p.id = `line-${index}`;
    p.innerText = line.text;
    lyricsContainer.appendChild(p);
});

// 2. СИСТЕМА ЧАСТИЦ (Кульминация)
canvasPart.width = window.innerWidth;
canvasPart.height = window.innerHeight;
let particles = [];

window.addEventListener('resize', () => {
    canvasPart.width = window.innerWidth;
    canvasPart.height = window.innerHeight;
});

function createExplosion(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * (isDJMode ? 30 : 15),
            vy: (Math.random() - 0.5) * (isDJMode ? 30 : 15),
            life: 1.0,
            color: isDJMode ? `hsl(${Math.random() * 360}, 100%, 50%)` : '#00cec9',
            size: Math.random() * 4 + 2
        });
    }
}

function drawParticles() {
    ctxPart.clearRect(0, 0, canvasPart.width, canvasPart.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.02; // Скорость угасания
        
        ctxPart.globalAlpha = p.life;
        ctxPart.fillStyle = p.color;
        ctxPart.beginPath();
        ctxPart.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctxPart.fill();

        if (p.life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(drawParticles);
}
drawParticles();

// 3. ВИЗУАЛИЗАТОР И ЦВЕТОМУЗЫКА
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        drawVisualizer();
    }
}

function drawVisualizer() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctxVis.clearRect(0, 0, canvasVis.width, canvasVis.height);

        const barWidth = (canvasVis.width / bufferLength) * 2.5;
        let x = 0;
        let totalAmplitude = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            totalAmplitude += barHeight;
            ctxVis.fillStyle = isDJMode ? `hsl(${(i*5)%360}, 100%, 50%)` : `rgba(108, 92, 231, ${barHeight/100 + 0.2})`;
            ctxVis.fillRect(x, canvasVis.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }

        const avgAmplitude = totalAmplitude / bufferLength;
        bgGlow.style.transform = `translate(-50%, -50%) scale(${1 + avgAmplitude / 150})`;
        bgGlow.style.opacity = 0.5 + avgAmplitude / 100;
        
        // Авто-взрыв на мощных басах в DJ Mode
        if (isDJMode && avgAmplitude > 80 && Math.random() > 0.8) {
            createExplosion(window.innerWidth/2, window.innerHeight/2, 5);
        }
    }
    draw();
}

// 4. ПАСХАЛКА (DJ Mode)
let clickCount = 0;
let lastClick = 0;
coverArt.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClick < 500) { clickCount++; } else { clickCount = 1; }
    lastClick = now;

    if (clickCount === 5) {
        isDJMode = !isDJMode;
        coverArt.classList.toggle('dj-mode');
        createExplosion(window.innerWidth/2, window.innerHeight/3, 150);
        clickCount = 0;
    }
});

// Управление плеером
function togglePlay() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    initAudio();

    if (isPlaying) {
        audio.pause();
        playIcon.classList.replace('fa-pause', 'fa-play');
        coverArt.classList.remove('play');
    } else {
        audio.play().catch(e => console.error(e));
        playIcon.classList.replace('fa-play', 'fa-pause');
        coverArt.classList.add('play');
    }
    isPlaying = !isPlaying;
}

playBtn.addEventListener('click', togglePlay);

// Основной цикл синхронизации времени
let currentLyricIndex = -1;
let hasExploded = false;

audio.addEventListener('timeupdate', () => {
    const t = audio.currentTime;
    
    // Обновление прогресс-бара
    if (!isNaN(audio.duration)) {
        progress.style.width = `${(t / audio.duration) * 100}%`;
        currentTimeEl.innerText = formatTime(t);
    }

    // Синхронизация Караоке
    let activeIndex = lyricsData.findIndex((line, i) => {
        const nextLine = lyricsData[i + 1];
        return t >= line.t && (!nextLine || t < nextLine.t);
    });

    if (activeIndex !== -1 && activeIndex !== currentLyricIndex) {
        // Убираем подсветку со старой строки
        if (currentLyricIndex !== -1) document.getElementById(`line-${currentLyricIndex}`).classList.remove('active');
        
        // Подсвечиваем новую и скроллим
        const activeLine = document.getElementById(`line-${activeIndex}`);
        activeLine.classList.add('active');
        lyricsContainer.scrollTop = activeLine.offsetTop - lyricsContainer.offsetTop - 50;
        
        currentLyricIndex = activeIndex;

        // Взрыв частиц на припевах (строки со словом "ШКИ")
        if (lyricsData[activeIndex].text.includes("ШКИ") && isPlaying) {
            createExplosion(window.innerWidth/2, window.innerHeight/2, 50);
        }
    }
});

// 5. УПРАВЛЕНИЕ ЖЕСТАМИ (Свайпы)
let touchStartX = 0;
document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
document.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) { audio.currentTime += 10; createExplosion(window.innerWidth, window.innerHeight/2, 20); } // Свайп влево (+10 сек)
    if (touchEndX > touchStartX + 50) { audio.currentTime -= 10; createExplosion(0, window.innerHeight/2, 20); } // Свайп вправо (-10 сек)
});

// 6. QR И ШЕРИНГ
let qrGenerated = false;
shareBtn.addEventListener('click', () => {
    // Если браузер поддерживает нативный шеринг (с телефона)
    if (navigator.share) {
        navigator.share({ title: 'Гимн ШКИ', url: window.location.href });
    } else {
        // Иначе показываем QR код (для ПК)
        qrModal.classList.remove('hidden');
        if (!qrGenerated) {
            new QRCode(document.getElementById("qrcode"), { text: window.location.href, width: 200, height: 200 });
            qrGenerated = true;
        }
    }
});
closeQr.addEventListener('click', () => qrModal.classList.add('hidden'));
lyricsBtn.addEventListener('click', () => karaokeSection.classList.toggle('hidden'));

// Перемотка кликом по бару
document.getElementById('progress-container').addEventListener('click', function(e) {
    audio.currentTime = (e.offsetX / this.clientWidth) * audio.duration;
});

function formatTime(s) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

audio.addEventListener('loadedmetadata', () => durationEl.innerText = formatTime(audio.duration));