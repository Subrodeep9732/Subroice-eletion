/**
 * Aether: Liquid Glass Portal Controller Logic
 * Coordinates custom cursor, navigation, sandbox bindings,
 * Web Audio synth visualizer, Kanban board mechanics, and weather physics.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initCustomCursor();
    initNavigation();
    initLiquidSandbox();
    initMusicStation();
    initTaskFlow();
    initWeatherHub();
    
    // Apply initial 3D card tilt to existing cards
    window.initGlassTilt('.glass-panel', { maxTilt: 8, scale: 1.01 });
    window.initGlassTilt('.glass-card', { maxTilt: 12, scale: 1.03 });
});

/* ==========================================================================
   CUSTOM LIQUID CURSOR
   ========================================================================== */
function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const glow = document.getElementById('custom-cursor-glow');
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let glowX = 0, glowY = 0;
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth lerp follow animation
    function animateCursor() {
        // Lerp custom cursor bubble (slightly fast)
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        // Lerp backdrop glow light (slower, ambient trail)
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        
        glow.style.left = `${glowX}px`;
        glow.style.top = `${glowY}px`;

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Toggle cursor size states on interactive elements
    const interactives = 'a, button, select, input, .glass-card, .track-item, .task-item-card, option';
    document.body.addEventListener('mouseenter', (e) => {
        if (e.target.matches && e.target.matches(interactives)) {
            document.body.classList.add('hover-active');
        }
    }, true);

    document.body.addEventListener('mouseleave', (e) => {
        if (e.target.matches && e.target.matches(interactives)) {
            document.body.classList.remove('hover-active');
        }
    }, true);
}

/* ==========================================================================
   NAVIGATION / ROUTING SYSTEM
   ========================================================================== */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.dataset.tab;

            // Remove active classes
            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to current selection
            item.classList.add('active');
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Sync hash router
            const route = item.querySelector('a').getAttribute('href');
            window.history.pushState(null, null, route);
        });
    });

    // Handle initial hash routing
    const currentHash = window.location.hash;
    if (currentHash) {
        const matchingLink = document.querySelector(`.nav-item a[href="${currentHash}"]`);
        if (matchingLink) {
            matchingLink.click();
        }
    }
}

/* ==========================================================================
   LIQUID GLASS SANDBOX
   ========================================================================== */
function initLiquidSandbox() {
    // Spawn Background Canvas Simulation
    const sim = new LiquidSimulation('bg-canvas');
    sim.start();

    // Sandbox DOM controls
    const themeBtns = document.querySelectorAll('.theme-btn');
    const sliderCount = document.getElementById('slider-count');
    const sliderSpeed = document.getElementById('slider-speed');
    const sliderOpacity = document.getElementById('slider-opacity');
    const sliderBlur = document.getElementById('slider-blur');

    const labelCount = document.getElementById('label-count');
    const labelSpeed = document.getElementById('label-speed');
    const labelOpacity = document.getElementById('label-opacity');
    const labelBlur = document.getElementById('label-blur');

    const codeOutput = document.getElementById('code-output-css');
    const copyBtn = document.getElementById('btn-copy-css');

    // Theme selector
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const theme = btn.dataset.theme;
            sim.updateSettings({ theme });
            updateCSSOutput();
        });
    });

    // Sliders
    sliderCount.addEventListener('input', (e) => {
        const val = e.target.value;
        labelCount.textContent = val;
        sim.updateSettings({ count: val });
        updateCSSOutput();
    });

    sliderSpeed.addEventListener('input', (e) => {
        const val = e.target.value;
        labelSpeed.textContent = `${val}x`;
        sim.updateSettings({ speed: val });
    });

    sliderOpacity.addEventListener('input', (e) => {
        const val = e.target.value;
        labelOpacity.textContent = `${Math.round(val * 100)}%`;
        sim.updateSettings({ opacity: val });
        updateCSSOutput();
    });

    sliderBlur.addEventListener('input', (e) => {
        const val = e.target.value;
        labelBlur.textContent = `${val}px`;
        sim.updateSettings({ blur: val });
        updateCSSOutput();
    });

    function updateCSSOutput() {
        const opacity = parseFloat(sliderOpacity.value);
        const blur = parseInt(sliderBlur.value);
        
        // Dynamic CSS Template
        const cssString = `.glass-panel {
  background: rgba(255, 255, 255, ${opacity.toFixed(3)});
  backdrop-filter: blur(${blur}px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, ${(opacity * 1.8).toFixed(3)});
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}`;
        codeOutput.textContent = cssString;
    }

    // Copy CSS Button logic
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeOutput.textContent).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            copyBtn.style.borderColor = 'var(--accent-green)';
            copyBtn.style.color = 'var(--accent-green)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 1800);
        });
    });

    // Populate initial CSS Output
    updateCSSOutput();
}

/* ==========================================================================
   MUSIC STATION (SYNTH ENGINE + VISUALIZER)
   ========================================================================== */
function initMusicStation() {
    const playBtn = document.getElementById('btn-audio-play');
    const prevBtn = document.getElementById('btn-audio-prev');
    const nextBtn = document.getElementById('btn-audio-next');
    const progressSlider = document.getElementById('audio-progress');
    const timeCurrentLabel = document.getElementById('time-current');
    const timeTotalLabel = document.getElementById('time-total');
    const vinylDisc = document.getElementById('audio-vinyl-disc');
    const audioGlow = document.getElementById('audio-glow-ring');
    const songTitleLabel = document.getElementById('song-title-label');
    const songArtistLabel = document.getElementById('song-artist-label');
    const trackContainer = document.getElementById('playlist-track-container');
    const visualizerCanvas = document.getElementById('visualizer-canvas');
    const visualizerTip = document.getElementById('visualizer-tip');
    
    const vCtx = visualizerCanvas.getContext('2d');
    
    // Resize visualizer canvas
    function resizeVisCanvas() {
        const rect = visualizerCanvas.parentElement.getBoundingClientRect();
        visualizerCanvas.width = rect.width;
        visualizerCanvas.height = rect.height;
    }
    resizeVisCanvas();
    window.addEventListener('resize', resizeVisCanvas);

    // Synth Music Playlist Metadata
    const playlist = [
        { title: 'Neon Pulse Waves', artist: 'Hyperion Synth', bpm: 110, duration: 90, scale: 'major' },
        { title: 'Aetherial Dreamscape', artist: 'Cosmo Ambient', bpm: 85, duration: 120, scale: 'minor' },
        { title: 'Atmosphere Core V', artist: 'Sub-Gravity System', bpm: 125, duration: 75, scale: 'phrygian' }
    ];
    let activeTrackIndex = 0;
    
    // Playback state variables
    let isPlaying = false;
    let audioCtx = null;
    let analyserNode = null;
    let timeElapsed = 0;
    let playInterval = null;
    
    // Procedural Synth variables
    let synthIntervalId = null;
    let mainGain = null;
    let currentNoteIndex = 0;

    // Render playlist tracks
    function renderPlaylist() {
        trackContainer.innerHTML = '';
        playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.classList.add('track-item');
            if (index === activeTrackIndex) item.classList.add('active');
            
            const mins = Math.floor(track.duration / 60);
            const secs = String(track.duration % 60).padStart(2, '0');
            
            item.innerHTML = `
                <div class="track-meta">
                    <span class="track-name">${track.title}</span>
                    <span class="track-artist">${track.artist}</span>
                </div>
                <span class="track-duration">${mins}:${secs}</span>
            `;
            
            item.addEventListener('click', () => {
                selectTrack(index);
            });
            trackContainer.appendChild(item);
        });
    }

    function selectTrack(index) {
        if (isPlaying) {
            stopPlayback();
        }
        activeTrackIndex = index;
        renderPlaylist();
        
        const track = playlist[activeTrackIndex];
        songTitleLabel.textContent = track.title;
        songArtistLabel.textContent = track.artist;
        
        progressSlider.value = 0;
        timeCurrentLabel.textContent = '0:00';
        
        const mins = Math.floor(track.duration / 60);
        const secs = String(track.duration % 60).padStart(2, '0');
        timeTotalLabel.textContent = `${mins}:${secs}`;
        timeElapsed = 0;

        if (isPlaying) {
            startPlayback();
        }
    }

    // Web Audio Synthesizer Loop: plays organic ambient loops
    function startSynthMelody() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 128;
            
            mainGain = audioCtx.createGain();
            mainGain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Low volume ambient
            mainGain.connect(analyserNode);
            analyserNode.connect(audioCtx.destination);
            
            // Start the Canvas drawing loops
            requestAnimationFrame(drawVisualizer);
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const track = playlist[activeTrackIndex];
        const notes = getNotesForScale(track.scale);
        const tempo = 60000 / (track.bpm * 2); // 8th note speed

        synthIntervalId = setInterval(() => {
            playSynthTone(notes[currentNoteIndex % notes.length]);
            currentNoteIndex++;
        }, tempo);
    }

    function stopSynthMelody() {
        if (synthIntervalId) {
            clearInterval(synthIntervalId);
            synthIntervalId = null;
        }
    }

    function getNotesForScale(scale) {
        // Return midi frequency sets
        if (scale === 'minor') {
            return [130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 261.63]; // C3 minor scale
        } else if (scale === 'phrygian') {
            return [110.00, 116.54, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00]; // A2 phrygian scale
        } else {
            return [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63]; // C3 major scale
        }
    }

    function playSynthTone(freq) {
        if (!audioCtx || !mainGain) return;
        
        const now = audioCtx.currentTime;
        
        // Oscillator 1: Lead sawtooth
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, now);
        
        // Low pass filter to make it warmer/glassy
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05); // attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4); // release
        
        osc1.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(mainGain);
        
        osc1.start(now);
        osc1.stop(now + 0.45);

        // Sub Oscillator 2: Ambient pad (low octave triangle)
        if (currentNoteIndex % 4 === 0) {
            const osc2 = audioCtx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq / 2, now);
            
            const gain2 = audioCtx.createGain();
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.12, now + 0.2); // long attack
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // long decay
            
            osc2.connect(gain2);
            gain2.connect(mainGain);
            
            osc2.start(now);
            osc2.stop(now + 1.3);
        }
    }

    // Playback control
    function startPlayback() {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisc.classList.add('playing');
        visualizerTip.style.opacity = '0';
        
        startSynthMelody();

        const track = playlist[activeTrackIndex];
        
        // Start timeline slider ticks
        playInterval = setInterval(() => {
            timeElapsed++;
            if (timeElapsed >= track.duration) {
                // Auto track-loop
                nextTrack();
            } else {
                const percent = (timeElapsed / track.duration) * 100;
                progressSlider.value = percent;
                
                const mins = Math.floor(timeElapsed / 60);
                const secs = String(timeElapsed % 60).padStart(2, '0');
                timeCurrentLabel.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }

    function stopPlayback() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinylDisc.classList.remove('playing');
        
        stopSynthMelody();
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
        audioGlow.style.transform = 'scale(1.0)';
    }

    function nextTrack() {
        let nextIndex = activeTrackIndex + 1;
        if (nextIndex >= playlist.length) nextIndex = 0;
        selectTrack(nextIndex);
    }

    function prevTrack() {
        let prevIndex = activeTrackIndex - 1;
        if (prevIndex < 0) prevIndex = playlist.length - 1;
        selectTrack(prevIndex);
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);

    progressSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        const track = playlist[activeTrackIndex];
        timeElapsed = Math.round((val / 100) * track.duration);
        
        const mins = Math.floor(timeElapsed / 60);
        const secs = String(timeElapsed % 60).padStart(2, '0');
        timeCurrentLabel.textContent = `${mins}:${secs}`;
    });

    // Frequency Visualizer Render Loop
    function drawVisualizer() {
        if (!isPlaying || !analyserNode) return;
        
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const width = visualizerCanvas.width;
        const height = visualizerCanvas.height;

        vCtx.clearRect(0, 0, width, height);

        // Draw nice fluid waves mirroring frequency values
        vCtx.beginPath();
        vCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        vCtx.lineWidth = 3;
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2.5 + height / 5;
            
            if (i === 0) {
                vCtx.moveTo(x, y);
            } else {
                vCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        
        vCtx.lineTo(width, height / 2);
        vCtx.stroke();

        // Secondary neon pink glow overlay
        vCtx.beginPath();
        vCtx.strokeStyle = 'rgba(224, 38, 253, 0.3)';
        vCtx.lineWidth = 2;
        x = 0;
        for (let i = bufferLength - 1; i >= 0; i--) {
            const v = dataArray[i] / 128.0;
            const y = height - ((v * height) / 2.5 + height / 5);
            if (i === bufferLength - 1) {
                vCtx.moveTo(x, y);
            } else {
                vCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        vCtx.lineTo(width, height / 2);
        vCtx.stroke();

        // Pulsate vinyl glow ring with music volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength;
        const scaleVal = 1.0 + (avgVolume / 255) * 0.18;
        audioGlow.style.transform = `scale(${scaleVal})`;
        
        requestAnimationFrame(drawVisualizer);
    }

    // Initialize track shelf
    renderPlaylist();
    selectTrack(0);
}

/* ==========================================================================
   TASK FLOW (KANBAN + POMODORO TIMER)
   ========================================================================= */
function initTaskFlow() {
    const addTaskBtn = document.getElementById('btn-add-task');
    const taskModal = document.getElementById('task-modal');
    const cancelModalBtn = document.getElementById('btn-modal-cancel');
    const confirmModalBtn = document.getElementById('btn-modal-confirm');
    
    const taskDescInput = document.getElementById('modal-task-desc');
    const taskCategorySelect = document.getElementById('modal-task-category');
    const taskPrioritySelect = document.getElementById('modal-task-priority');

    const colTodo = document.getElementById('col-todo');
    const colProgress = document.getElementById('col-progress');
    const colDone = document.getElementById('col-done');

    const labelPercentage = document.getElementById('label-percentage');
    const progressCircle = document.getElementById('radial-progress-circle');

    // Preset mock tasks
    let tasks = [
        { id: 'task-1', desc: 'Optimize backdrop glass blur shaders for low-end mobile devices', category: 'dev', priority: 'high', status: 'todo' },
        { id: 'task-2', desc: 'Curate new fluid neon ambient palettes (Sunset Gold + Orchid Violet)', category: 'design', priority: 'medium', status: 'progress' },
        { id: 'task-3', desc: 'Map Web Audio synthesizer nodes to responsive circular wave graphs', category: 'dev', priority: 'low', status: 'done' },
        { id: 'task-4', desc: 'Synthesize particle friction coefficients for atmospheric storm overlays', category: 'ideas', priority: 'medium', status: 'todo' }
    ];

    // Drag & Drop event bindings
    [colTodo, colProgress, colDone].forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        col.addEventListener('dragleave', () => {
            col.style.background = '';
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.style.background = '';
            
            const taskId = e.dataTransfer.getData('text/plain');
            const targetStatus = col.dataset.status;
            
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = targetStatus;
                renderTasks();
            }
        });
    });

    function renderTasks() {
        // Clear columns
        colTodo.innerHTML = '';
        colProgress.innerHTML = '';
        colDone.innerHTML = '';

        let todoCount = 0;
        let progressCount = 0;
        let doneCount = 0;

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.classList.add('task-item-card');
            card.setAttribute('draggable', 'true');
            card.id = task.id;
            
            // Drag start
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.id);
                setTimeout(() => {
                    card.style.opacity = '0.4';
                }, 0);
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '';
            });

            // Priority dot class
            const priorityDotClass = `priority-${task.priority}`;
            
            card.innerHTML = `
                <div class="task-header">
                    <span class="task-cat cat-${task.category}">${task.category}</span>
                    <button class="task-delete-btn" data-id="${task.id}"><i class="fa-regular fa-trash-can"></i></button>
                </div>
                <div class="task-body">
                    <p>${task.desc}</p>
                </div>
                <div class="task-footer">
                    <span class="task-priority">
                        <span class="priority-dot ${priorityDotClass}"></span>
                        <span>${task.priority}</span>
                    </span>
                    <span style="font-family: monospace;">#${task.id.split('-')[1]}</span>
                </div>
            `;

            // Delete action
            card.querySelector('.task-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                tasks = tasks.filter(t => t.id !== task.id);
                renderTasks();
            });

            // Append to correct column
            if (task.status === 'todo') {
                colTodo.appendChild(card);
                todoCount++;
            } else if (task.status === 'progress') {
                colProgress.appendChild(card);
                progressCount++;
            } else {
                colDone.appendChild(card);
                doneCount++;
            }
        });

        // Update tags
        document.getElementById('count-todo').textContent = todoCount;
        document.getElementById('count-progress').textContent = progressCount;
        document.getElementById('count-done').textContent = doneCount;

        // Initialize 3D hover tilt on newly added elements
        window.initGlassTilt('.task-item-card', { maxTilt: 15, scale: 1.04 });

        // Update accomplishments chart
        updateProgressChart(tasks.length, doneCount);
    }

    function updateProgressChart(total, done) {
        if (total === 0) {
            labelPercentage.textContent = '0%';
            progressCircle.style.strokeDashoffset = '283';
            return;
        }
        const pct = Math.round((done / total) * 100);
        labelPercentage.textContent = `${pct}%`;

        // Radial circumference is 283
        const offset = 283 - (283 * pct) / 100;
        progressCircle.style.strokeDashoffset = offset;
    }

    // Modal control
    addTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('active');
    });

    cancelModalBtn.addEventListener('click', () => {
        taskModal.classList.remove('active');
        taskDescInput.value = '';
    });

    confirmModalBtn.addEventListener('click', () => {
        const desc = taskDescInput.value.trim();
        if (desc === '') {
            taskDescInput.focus();
            return;
        }
        
        const newId = `task-${Date.now()}`;
        const newCard = {
            id: newId,
            desc: desc,
            category: taskCategorySelect.value,
            priority: taskPrioritySelect.value,
            status: 'todo'
        };

        tasks.push(newCard);
        renderTasks();
        
        taskModal.classList.remove('active');
        taskDescInput.value = '';
    });

    // POMODORO TIMER WORKER
    const timerLabel = document.getElementById('pomodoro-timer-label');
    const timerToggleBtn = document.getElementById('btn-timer-toggle');
    const timerResetBtn = document.getElementById('btn-timer-reset');

    let timerInterval = null;
    let secondsLeft = 25 * 60;
    let isTimerRunning = false;

    function updateTimerDisplay() {
        const mins = Math.floor(secondsLeft / 60);
        const secs = String(secondsLeft % 60).padStart(2, '0');
        timerLabel.textContent = `${mins}:${secs}`;
    }

    timerToggleBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            // Pause
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            timerToggleBtn.textContent = 'Start';
            timerToggleBtn.style.color = '';
            timerToggleBtn.style.borderColor = '';
        } else {
            // Start
            isTimerRunning = true;
            timerToggleBtn.textContent = 'Pause';
            timerToggleBtn.style.color = 'var(--accent-magenta)';
            timerToggleBtn.style.borderColor = 'var(--accent-magenta)';
            
            timerInterval = setInterval(() => {
                secondsLeft--;
                updateTimerDisplay();

                if (secondsLeft <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    isTimerRunning = false;
                    timerToggleBtn.textContent = 'Start';
                    alert('Pomodoro focus cycle completed!');
                    secondsLeft = 25 * 60;
                    updateTimerDisplay();
                }
            }, 1000);
        }
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        secondsLeft = 25 * 60;
        updateTimerDisplay();
        timerToggleBtn.textContent = 'Start';
        timerToggleBtn.style.color = '';
        timerToggleBtn.style.borderColor = '';
    });

    // Populate initial tasks
    renderTasks();
}

/* ==========================================================================
   WEATHER FORECAST HUB (LOCATION PHYSICS EFFECTS)
   ========================================================================== */
function initWeatherHub() {
    const locSelect = document.getElementById('weather-location-select');
    const heroTemp = document.getElementById('weather-hero-temp');
    const heroCity = document.getElementById('weather-hero-city');
    const heroDesc = document.getElementById('weather-hero-desc');
    const canvasLayer = document.getElementById('weather-canvas-layer');
    const shelfContainer = document.getElementById('weather-days-shelf');

    // Values
    const valWind = document.getElementById('weather-val-wind');
    const valHumidity = document.getElementById('weather-val-humidity');
    const valUV = document.getElementById('weather-val-uv');
    const valPressure = document.getElementById('weather-val-pressure');

    const wCtx = canvasLayer.getContext('2d');
    let particleInterval = null;
    let particles = [];
    let weatherType = 'rain'; // rain, snow, heat

    // Location Presets
    const weatherPresets = {
        'neo-tokyo': {
            city: 'Neo-Tokyo Dome',
            temp: 24,
            desc: 'Acid Rain Storm',
            wind: '14.8 km/h',
            humidity: '88%',
            uv: 'Shield Delta',
            pressure: '1.02 Bar',
            weather: 'rain',
            forecast: [
                { day: 'MON', temp: 24, icon: 'fa-cloud-showers-heavy' },
                { day: 'TUE', temp: 22, icon: 'fa-cloud-rain' },
                { day: 'WED', temp: 26, icon: 'fa-cloud-sun' },
                { day: 'THU', temp: 28, icon: 'fa-sun' },
                { day: 'FRI', temp: 25, icon: 'fa-cloud' }
            ]
        },
        'elysium': {
            city: 'Elysium Station',
            temp: -8,
            desc: 'Crystal Frost Sparkle',
            wind: '3.4 km/h',
            humidity: '21%',
            uv: 'Baryon Leak',
            pressure: '0.45 Bar',
            weather: 'snow',
            forecast: [
                { day: 'MON', temp: -8, icon: 'fa-snowflake' },
                { day: 'TUE', temp: -12, icon: 'fa-snowflake' },
                { day: 'WED', temp: -5, icon: 'fa-cloud-meatball' },
                { day: 'THU', temp: 0, icon: 'fa-smog' },
                { day: 'FRI', temp: -4, icon: 'fa-snowflake' }
            ]
        },
        'atlantic': {
            city: 'Atlantic Abyss V',
            temp: 39,
            desc: 'Volcanic Heat Shimmer',
            wind: '68.2 km/h',
            humidity: '98%',
            uv: 'Infrared High',
            pressure: '18.40 Bar',
            weather: 'heat',
            forecast: [
                { day: 'MON', temp: 39, icon: 'fa-fire' },
                { day: 'TUE', temp: 41, icon: 'fa-fire-flame-curved' },
                { day: 'WED', temp: 38, icon: 'fa-temperature-arrow-up' },
                { day: 'THU', temp: 36, icon: 'fa-smog' },
                { day: 'FRI', temp: 42, icon: 'fa-fire' }
            ]
        }
    };

    function resizeWeatherCanvas() {
        const rect = canvasLayer.parentElement.getBoundingClientRect();
        canvasLayer.width = rect.width;
        canvasLayer.height = rect.height;
    }
    
    // Switch Location Handler
    function selectLocation(locKey) {
        const preset = weatherPresets[locKey];
        if (!preset) return;

        // Apply metadata updates
        heroTemp.textContent = preset.temp;
        heroCity.textContent = preset.city;
        heroDesc.textContent = preset.desc;

        valWind.textContent = preset.wind;
        valHumidity.textContent = preset.humidity;
        valUV.textContent = preset.uv;
        valPressure.textContent = preset.pressure;

        weatherType = preset.weather;

        // Visual icon adjustments
        const sunNode = document.getElementById('weather-sun-node');
        const cloudNode = document.getElementById('weather-cloud-node');

        if (weatherType === 'snow') {
            sunNode.style.background = 'radial-gradient(circle, #e2e8f0 0%, #cbd5e1 100%)';
            sunNode.style.boxShadow = '0 0 20px rgba(255,255,255,0.4)';
            cloudNode.style.background = 'rgba(255, 255, 255, 0.3)';
        } else if (weatherType === 'heat') {
            sunNode.style.background = 'radial-gradient(circle, #ff3300 0%, #ff8c00 100%)';
            sunNode.style.boxShadow = '0 0 50px #ff3700';
            cloudNode.style.background = 'rgba(0, 0, 0, 0.2)';
        } else { // rain
            sunNode.style.background = '';
            sunNode.style.boxShadow = '';
            cloudNode.style.background = '';
        }

        // Render forecast timeline days
        shelfContainer.innerHTML = '';
        preset.forecast.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('forecast-day-card', 'glass-card');
            card.innerHTML = `
                <span class="forecast-day-name">${item.day}</span>
                <span class="forecast-icon"><i class="fa-solid ${item.icon}"></i></span>
                <span class="forecast-temp">${item.temp}°C</span>
            `;
            shelfContainer.appendChild(card);
        });

        // Reactivate 3D Card tilt on newly generated forecasts
        window.initGlassTilt('.forecast-day-card', { maxTilt: 12, scale: 1.05 });

        // Physics reset
        particles = [];
    }

    // Weather Particle Physics Engine
    function startWeatherSimulation() {
        resizeWeatherCanvas();
        window.addEventListener('resize', resizeWeatherCanvas);

        function tick() {
            wCtx.clearRect(0, 0, canvasLayer.width, canvasLayer.height);
            
            // Generate new particles
            if (particles.length < 80) {
                if (weatherType === 'rain') {
                    particles.push({
                        x: Math.random() * canvasLayer.width,
                        y: -10,
                        len: 12 + Math.random() * 20,
                        speed: 8 + Math.random() * 12,
                        weight: 1.5
                    });
                } else if (weatherType === 'snow') {
                    particles.push({
                        x: Math.random() * canvasLayer.width,
                        y: -10,
                        radius: 2 + Math.random() * 4,
                        speed: 1 + Math.random() * 2,
                        swing: Math.random() * 0.03,
                        swingOffset: Math.random() * 100
                    });
                }
            }

            // Update & Draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                if (weatherType === 'rain') {
                    wCtx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
                    wCtx.lineWidth = 1.5;
                    wCtx.beginPath();
                    wCtx.moveTo(p.x, p.y);
                    wCtx.lineTo(p.x + p.weight, p.y + p.len);
                    wCtx.stroke();

                    // Physics movement
                    p.y += p.speed;
                    p.x += p.weight; // slant drift

                    // Recycle
                    if (p.y > canvasLayer.height) {
                        particles.splice(i, 1);
                        i--;
                    }
                } else if (weatherType === 'snow') {
                    // Snow sparkle circles
                    wCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    wCtx.beginPath();
                    wCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    wCtx.fill();

                    // Movement (wobbles sideways)
                    p.y += p.speed;
                    p.x += Math.sin(p.y * p.swing + p.swingOffset) * 0.5;

                    // Recycle
                    if (p.y > canvasLayer.height) {
                        particles.splice(i, 1);
                        i--;
                    }
                }
            }

            // Apply custom CSS blur classes for shimmers
            const simLayer = document.getElementById('weather-sim-layer');
            simLayer.className = 'weather-sim-overlay';
            if (weatherType === 'heat') {
                simLayer.classList.add('weather-sim-heat');
                
                // Draw heat haze wave ripples using soft canvas lines
                wCtx.fillStyle = 'rgba(255, 50, 0, 0.015)';
                for (let i = 0; i < 3; i++) {
                    wCtx.beginPath();
                    wCtx.arc(
                        canvasLayer.width / 2 + Math.sin(Date.now() * 0.002 + i) * 60,
                        canvasLayer.height / 2 + Math.cos(Date.now() * 0.001 + i) * 30,
                        100 + i * 40,
                        0,
                        Math.PI * 2
                    );
                    wCtx.fill();
                }
            } else if (weatherType === 'snow') {
                simLayer.classList.add('weather-sim-snow');
            } else {
                simLayer.classList.add('weather-sim-rain');
            }

            requestAnimationFrame(tick);
        }

        tick();
    }

    // Select actions
    locSelect.addEventListener('change', (e) => {
        selectLocation(e.target.value);
    });

    // Start preset & loops
    selectLocation('neo-tokyo');
    startWeatherSimulation();
}
