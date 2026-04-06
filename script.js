document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioSource');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const progress = document.getElementById('progress');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const durationTimeEl = document.getElementById('duration-time');
    const karaokeBtn = document.getElementById('karaokeBtn');
    const player = document.getElementById('player');
    const visualizer = document.getElementById('visualizer');
    const lines = document.querySelectorAll('.lyric-line');
    const lyricsScroll = document.getElementById('lyricsScroll');

    let audioCtx, analyser, source, dataArray;
    let isStarted = false;

    // Создаем бары для визуализатора
    const bars = [];
    for(let i = 0; i < 32; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizer.appendChild(bar);
        bars.push(bar);
    }

    // Инициализация Web Audio API (должна происходить по клику пользователя)
    async function initAudio() {
        if (isStarted) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isStarted = true;
        renderFrame();
    }

    // Анимация визуализатора
    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (!isStarted || audio.paused) return;
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
            const h = (dataArray[i % 16] / 255) * 100;
            bar.style.height = `${Math.max(10, h)}%`;
        });
    }

    // Управление воспроизведением
    playBtn.addEventListener('click', async () => {
        await initAudio();
        if (audio.paused) {
            audio.play();
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            audio.pause();
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    });

    // Обновление прогресс-бара, таймеров и караоке
    audio.addEventListener('timeupdate', () => {
        const p = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${p}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationTimeEl.textContent = formatTime(audio.duration || 0);

        lines.forEach((line, idx) => {
            const startTime = parseFloat(line.dataset.time);
            const nextLine = lines[idx+1];
            const endTime = nextLine ? parseFloat(nextLine.dataset.time) : audio.duration;

            if (audio.currentTime >= startTime && audio.currentTime < endTime) {
                if(!line.classList.contains('active')) {
                    line.classList.add('active');
                    // Плавная прокрутка к активной строке
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                line.classList.remove('active');
            }
        });
    });

    // Форматирование времени (ММ:СС)
    function formatTime(s) {
        if (isNaN(s)) return "0:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    // Тоггл режима караоке
    karaokeBtn.addEventListener('click', () => {
        player.classList.toggle('lyrics-active');
        karaokeBtn.classList.toggle('active');
    });

    // Перемотка трека по клику на прогресс-бар
    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * audio.duration;
    });
});