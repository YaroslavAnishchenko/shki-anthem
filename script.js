// Запускаем код ТОЛЬКО после полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    
    // Получаем элементы
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

    // Проверка на наличие критичных элементов (чтобы избежать ошибки null)
    if (!audio || !playBtn || !visualizer) {
        console.error("ОШИБКА: Не найдены элементы плеера в HTML!");
        return; 
    }

    let audioCtx, analyser, source, dataArray;
    let isStarted = false;

    // Создаем бары визуализатора
    const bars = [];
    for(let i = 0; i < 32; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizer.appendChild(bar);
        bars.push(bar);
    }

    async function initAudio() {
        if (isStarted) return;
        
        // Кроссбраузерный AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isStarted = true;
        renderFrame();
    }

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (!isStarted || audio.paused) return;
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
            const h = (dataArray[i % 16] / 255) * 100;
            bar.style.height = `${Math.max(10, h)}%`;
        });
    }

    playBtn.addEventListener('click', async () => {
        await initAudio();
        
        // Восстановление контекста аудио, если браузер его заблокировал
        if (audioCtx && audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

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

    audio.addEventListener('timeupdate', () => {
        const p = (audio.currentTime / audio.duration) * 100;
        if(progress) progress.style.width = `${p}%`;
        
        if(currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
        if(durationTimeEl) durationTimeEl.textContent = formatTime(audio.duration || 0);

        lines.forEach((line, idx) => {
            const startTime = parseFloat(line.dataset.time);
            const nextLine = lines[idx+1];
            const endTime = nextLine ? parseFloat(nextLine.dataset.time) : audio.duration;

            if (audio.currentTime >= startTime && audio.currentTime < endTime) {
                if(!line.classList.contains('active')) {
                    line.classList.add('active');
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                line.classList.remove('active');
            }
        });
    });

    function formatTime(s) {
        if (isNaN(s)) return "0:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    if(karaokeBtn) {
        karaokeBtn.addEventListener('click', () => {
            if(player) player.classList.toggle('lyrics-active');
            karaokeBtn.classList.toggle('active');
        });
    }

    if(progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pos * audio.duration;
        });
    }
});