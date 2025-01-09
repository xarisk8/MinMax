// Suppress source map warnings for Chart.js, used ai for this part of the code
const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0]?.includes?.('chart.umd.js.map')) return;
    originalWarn.apply(console, args);
};

// Grabbing the elements from the html
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const todoCount = document.getElementById("todoCount");
const addButton = document.getElementById("addButton");
const deleteButton = document.getElementById("deleteAllButton");

// Add timer functionality at the top of the file

// Add toast style definition at the top level, also used ai for this part of the code.
const pomodoroToastStyles = document.createElement('style');
pomodoroToastStyles.textContent = ``;
document.head.appendChild(pomodoroToastStyles);

// Add enhanced UI styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = ``;
document.head.appendChild(enhancedStyles);

// Add CSS for toasts
const style = document.createElement('style');
style.textContent = ``;
document.head.appendChild(style);

// got some ideas about how classes work in js from the internet
class PomodoroTimer {
  constructor() {
    this.minutesDisplay = document.getElementById('timerMinutes');
    this.secondsDisplay = document.getElementById('timerSeconds');
    this.startBtn = document.getElementById('startTimer');
    this.pauseBtn = document.getElementById('pauseTimer');
    this.resetBtn = document.getElementById('resetTimer');
    this.modeBtns = document.querySelectorAll('.mode-btn');
    
    this.presetBtns = document.querySelectorAll('.preset-btn');
    this.focusTime = 50 * 60; // 50 minutes in seconds
    this.breakTime = 10 * 60; // 10 minutes in seconds
    this.currentTime = this.focusTime;
    this.isRunning = false;
    this.timer = null;
    
    // Used AI assistance for SVG circle calculations and progress ring implementation
    this.circle = document.querySelector('.progress-ring__circle');
    this.radius = this.circle.r.baseVal.value;
    this.circumference = 2 * Math.PI * this.radius;
    
    // Set initial state of circle starting from top
    this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.style.strokeDashoffset = this.circumference; // Start empty
    
    this.presets = {
      classic: { focus: 50 * 60, break: 10 * 60 },
      short: { focus: 25 * 60, break: 5 * 60 }
    };
    
    this.switchBtns = document.querySelectorAll('.switch-btn');
    
    this.currentPreset = 'classic';
    this.currentPhase = 'focus';
    this.focusTime = this.presets.classic.focus;
    this.breakTime = this.presets.classic.break;
    this.originalFocusTime = this.focusTime;
    this.originalBreakTime = this.breakTime;
    
    // Add sessions tracking
    this.sessionsToday = 0;
    this.lastSessionDate = null;
    this.loadSessionsCount();
    
    // Check for day change every minute
    setInterval(() => this.checkDayChange(), 60000);
    
    // Initialize audio system
    this.audioContext = null;
    this.audioBuffers = {};
    this.initializeAudioOnInteraction();
    
    // Add state persistence
    this.loadState();
    window.addEventListener('beforeunload', () => this.saveState());
    
    // Initialize UI and event listeners
    this.initializeEventListeners();
    this.loadFocusStats();
    this.updateDisplay();
    this.setupKeyboardShortcuts();
    
    // Add error tracking
    this.errors = [];
    
    // Add precision timing constants
    this.DRIFT_THRESHOLD = 50; // ms
    this.UPDATE_INTERVAL = 1000 / 60; // ~60fps for smooth progress ring
    this.lastProgressUpdate = 0;
    
    // Initialize state
    this.initializeState();
    
    // Add performance optimizations
    this.rafId = null;
    this.updateDisplayThrottled = this.throttle(this.updateDisplay.bind(this), 16); // ~60fps
    
    // Add error recovery
    this.errorCount = 0;
    this.MAX_ERRORS = 3;
    this.RECOVERY_TIMEOUT = 5000;
    
    // Initialize error handlers
    this.initializeErrorHandlers();
    
    this.initializeDOMElements();
  }

  initializeDOMElements() {
    this.minutesDisplay = document.getElementById('timerMinutes');
    this.secondsDisplay = document.getElementById('timerSeconds');
    this.startBtn = document.getElementById('startTimer');
    this.pauseBtn = document.getElementById('pauseTimer');
    this.resetBtn = document.getElementById('resetTimer');
    this.modeBtns = document.querySelectorAll('.mode-btn');
    this.presetBtns = document.querySelectorAll('.preset-btn');
    this.switchBtns = document.querySelectorAll('.switch-btn');
    
    // Initialize progress ring
    this.circle = document.querySelector('.progress-ring__circle');
    this.radius = this.circle.r.baseVal.value;
    this.circumference = 2 * Math.PI * this.radius;
    this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.style.strokeDashoffset = this.circumference;
    
    // Set initial phase class
    const timerText = document.querySelector('.timer-text');
    timerText.classList.add('focus');
    this.circle.classList.add('focus');
  }

  // Used AI assistance for implementing robust audio handling with fallbacks
  initializeAudioOnInteraction() {
    const initAudio = async () => {
        try {
            if (this.audioContext) return;
            
            // Used AI assistance for implementing the audio context and browser compatibility
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            const sounds = {
                start: '/static/audio/start.mp3',
                complete: '/static/audio/complete.mp3'
            };

            for (const [name, url] of Object.entries(sounds)) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.warn(`Failed to load sound ${name}: ${response.status}`);
                        continue;
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    if (this.audioContext) {
                        this.audioBuffers[name] = await this.audioContext.decodeAudioData(arrayBuffer);
                    }
                } catch (error) {
                    console.warn(`Error loading sound ${name}:`, error);
                }
            }
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    };

    // Initialize audio on first user interaction with timer controls
    const initOnInteraction = () => {
        initAudio();
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
    };

    document.addEventListener('click', initOnInteraction);
    document.addEventListener('keydown', initOnInteraction);
  }

  async playSound(type) {
    try {
        if (!this.audioContext || !this.audioBuffers[type]) {
            return; // Silently fail if audio isn't ready
        }

        if (this.audioContext.state === 'suspended') { //ai helped with this part of the code
            await this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[type];
        source.connect(this.audioContext.destination);
        source.start(0);
    } catch (error) {
        console.warn(`Error playing sound ${type}:`, error);
    }
  }

  initializeEventListeners() {
    this.startBtn.addEventListener('click', async () => {
      if (!this.hasNotificationPermission) {
        await this.requestNotificationPermission();
      }
      this.start();
    });
    
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());
    
    // Mode button event listeners, used ai for the dataset usage.
    this.modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newMode = btn.dataset.mode;
        const focus = parseInt(btn.dataset.focus) * 60;
        const break_ = parseInt(btn.dataset.break) * 60;
        
        if (this.isRunning || this.currentTime !== (this.currentPhase === 'focus' ? this.focusTime : this.breakTime)) {
          this.showConfirmDialog(
            'Switch Timer Mode?',
            'Switching modes will reset your current timer progress. Would you like to proceed?',
            () => {
              this.switchPreset(newMode, focus, break_);
              this.modeBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          );
        } else {
            this.switchPreset(newMode, focus, break_);
            this.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
      });
    });

    // Phase switch button event listeners
    this.switchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newPhase = btn.dataset.phase;
        
        if (this.isRunning || this.currentTime !== (this.currentPhase === 'focus' ? this.focusTime : this.breakTime)) {
          this.showConfirmDialog(
            'Switch Timer Phase?',
            `Switch to ${newPhase} phase? This will reset your current timer progress.`,
            () => {
              this.switchPhase(newPhase);
              this.switchBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          );
        } else {
          this.switchPhase(newPhase);
          this.switchBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-dialog-buttons">
        <button class="confirm-cancel">Cancel</button>
        <button class="confirm-proceed">Continue</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // Show with animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      dialog.classList.add('show');
    });
    
    function closeDialog() {
      overlay.classList.remove('show');
      dialog.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        dialog.remove();
      }, 300);
    }
    
    overlay.addEventListener('click', closeDialog);
    dialog.querySelector('.confirm-cancel').addEventListener('click', closeDialog);
    dialog.querySelector('.confirm-proceed').addEventListener('click', () => {
      onConfirm();
      closeDialog();
    });
  }

  switchPreset(mode, focusTime, breakTime) {
    this.currentPreset = mode;
    this.focusTime = focusTime;
    this.breakTime = breakTime;
    this.originalFocusTime = focusTime;
    this.originalBreakTime = breakTime;
    
    // Reset current time based on current phase
    this.currentTime = this.currentPhase === 'focus' ? focusTime : breakTime;
    
    // Reset timer state
    this.isRunning = false;
    cancelAnimationFrame(this.timer);
    this.startTime = null;
    this.expectedEndTime = null;
    
    // Update UI
    this.updateDisplay();
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.resetBtn.disabled = true;
    
    // Reset progress ring
    this.circle.style.strokeDashoffset = this.circumference;
  }

  switchPhase(phase) {
    if (phase === this.currentPhase) return;
    
    this.currentPhase = phase;
    this.currentTime = phase === 'focus' ? this.focusTime : this.breakTime;
    
    // Reset timer state
    this.isRunning = false;
    cancelAnimationFrame(this.timer);
    this.startTime = null;
    this.expectedEndTime = null;
    
    // Update UI with animations
    const timerText = document.querySelector('.timer-text');
    const progressRing = document.querySelector('.progress-ring__circle');
    
    timerText.classList.remove('focus', 'break');
    progressRing.classList.remove('focus', 'break');
    timerText.classList.add(phase);
    progressRing.classList.add(phase);
    
    this.updateDisplay();
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.resetBtn.disabled = true;
    
    // Animate progress ring reset
    this.circle.style.transition = 'stroke-dashoffset 0.3s ease';
    this.circle.style.strokeDashoffset = this.circumference;
    setTimeout(() => {
      this.circle.style.transition = '';
    }, 300);
    
    // Update switch buttons with animation
    this.switchBtns.forEach(btn => {
      const isActive = btn.dataset.phase === phase;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.style.transform = 'scale(1.1)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 200);
      }
    });
  }

  start() {
    if (this.isRunning) return;

    try {
      // Ensure valid timer state
      if (this.currentTime <= 0) {
        this.reset();
        return;
      }
      
      this.isRunning = true;
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.resetBtn.disabled = false;

      // Use high-precision timing
      this.startTime = performance.now();
      this.lastTick = this.startTime;
      this.expectedEndTime = this.startTime + (this.currentTime * 1000);

      // Ensure audio context is ready
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }

      this.playSound('start').catch(error => this.handleError(error));
      this.rafId = requestAnimationFrame(this.tick.bind(this));
      
      // Save state immediately
      this.saveState();
    } catch (error) {
      this.handleError(error);
      this.attemptRecovery();
    }
  }

  // Used AI assistance for implementing precise timer logic with drift correction
  tick(timestamp) {
    if (!this.isRunning) return;

    try {
      // Calculate precise time remaining
      const elapsed = timestamp - this.startTime;
      const expectedTimeRemaining = Math.ceil((this.expectedEndTime - timestamp) / 1000);
      const actualTimeRemaining = this.currentTime - Math.floor(elapsed / 1000);

      // Protect against negative time
      if (expectedTimeRemaining <= 0) {
        this.complete();
        return;
      }

      // Handle drift correction, used ai
      const drift = Math.abs(expectedTimeRemaining - actualTimeRemaining) * 1000;
      if (drift > this.DRIFT_THRESHOLD) {
        this.currentTime = expectedTimeRemaining;
        this.lastTick = timestamp;
      } else if (timestamp - this.lastTick >= 1000) {
        this.currentTime--;
        this.lastTick = timestamp;
      }

      // Update display with throttling
      this.updateDisplayThrottled();
      
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    } catch (error) {
      this.handleError(error);
      this.attemptRecovery();
    }
  }

  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    cancelAnimationFrame(this.timer);
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    
    // Store remaining time precisely
    if (this.startTime && this.expectedEndTime) {
      const remainingTime = Math.max(0, Math.ceil((this.expectedEndTime - performance.now()) / 1000));
      this.currentTime = remainingTime;
    }
  }

  reset() {
    this.isRunning = false;
    cancelAnimationFrame(this.timer);
    this.startTime = null;
    this.expectedEndTime = null;
    this.currentTime = this.currentPhase === 'focus' ? this.originalFocusTime : this.originalBreakTime;
    this.updateDisplay();
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.resetBtn.disabled = true;
    localStorage.removeItem('timerState');
  }

  switchMode(mode) {
    // Remove active class from all mode buttons first
    this.modeBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected mode button
    const modeElement = document.querySelector(`[data-mode="${mode}"]`);
    if (modeElement) {
        modeElement.classList.add('active');
    }
    
    clearInterval(this.timer);
    this.isRunning = false;
    this.currentTime = mode === 'focus' ? this.focusTime : this.breakTime;
    this.updateDisplay();
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.resetBtn.disabled = true;
    this.currentMode = mode;
    // Reset progress ring
    this.circle.style.strokeDashoffset = this.circumference; // Reset to empty
  }

  setPreset(focus, break_) {
    this.focusTime = focus;
    this.breakTime = break_;
    if (!this.isRunning) {
      this.currentTime = this.currentPhase === 'focus' ? focus : break_;
      this.updateDisplay();
      this.circle.style.strokeDashoffset = this.circumference;
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = this.currentTime % 60;
    this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    
    // Update progress ring - ensure consistent behavior for both phases
    const totalTime = this.currentPhase === 'focus' ? this.focusTime : this.breakTime;
    const progress = 1 - (this.currentTime / totalTime); // Invert progress for both phases
    const offset = this.circumference * (1 - progress);
    this.circle.style.strokeDashoffset = offset;

    // Debug information
    if (this.isRunning) {
      console.debug('Timer Update:', {
        phase: this.currentPhase,
        currentTime: this.currentTime,
        totalTime: totalTime,
        progress: progress,
        offset: offset
      });
    }
  }

  // Used AI assistance for implementing smooth animations and state management
  async complete() {
    try {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      
      const currentPhase = this.currentPhase;
      
      // Ensure timer shows exactly 00:00
      this.currentTime = 0;
      this.updateDisplay();
      
      // Play completion sound first
      await this.playSound('complete');
      
      // Save focus session if needed
      if (currentPhase === 'focus') {
        // Increment sessions count
        this.sessionsToday++;
        this.saveSessionsCount();
        this.updateSessionsDisplay();
        
        await this.saveFocusSession(this.originalFocusTime);
        await this.loadFocusStats();
      }
      
      // Show notification
      this.showPomodoroToast(currentPhase, 
        currentPhase === 'focus' ? 
          'Focus session complete! Take a break.' : 
          'Break complete! Ready to focus?'
      );
      
      // Switch phases and reset
      const nextPhase = currentPhase === 'focus' ? 'break' : 'focus';
      this.switchPhase(nextPhase);
      
    } catch (error) {
      this.handleError(error);
      this.attemptRecovery();
    } finally {
      // Reset controls
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.resetBtn.disabled = true;
      localStorage.removeItem('timerState');
    }
  }

  playCompletionSound(phase) {
    const audio = new Audio();
    audio.src = phase === 'focus' 
      ? '/static/sounds/focus-complete.mp3'
      : '/static/sounds/break-complete.mp3';
    audio.play().catch(err => console.log('Audio playback failed:', err));
  }

  // Add this method to test timer completion
  debugComplete(phase = null) {
    if (phase) {
      this.currentPhase = phase;
      this.currentTime = phase === 'focus' ? this.focusTime : this.breakTime;
    }
    this.currentTime = 3; // Set to 3 seconds
    this.start();
    console.log(`Debug: ${this.currentPhase} timer will complete in 3 seconds`);
  }

  debugProgress(percentage) {
    const totalTime = this.currentPhase === 'focus' ? this.focusTime : this.breakTime;
    this.currentTime = Math.floor(totalTime * (1 - (percentage / 100)));
    this.updateDisplay();
    console.log(`Debug: Set ${this.currentPhase} timer to ${percentage}% complete`);
  }

  debugState() {
    const state = {
      phase: this.currentPhase,
      currentTime: this.currentTime,
      totalTime: this.currentPhase === 'focus' ? this.focusTime : this.breakTime,
      isRunning: this.isRunning,
      progress: ((this.currentPhase === 'focus' ? this.focusTime : this.breakTime) - this.currentTime) / 
               (this.currentPhase === 'focus' ? this.focusTime : this.breakTime) * 100,
      expectedEndTime: this.expectedTime ? new Date(this.expectedTime).toLocaleTimeString() : null
    };
    console.table(state);
    return state;
  }

  async saveFocusSession(duration) {
    try {
      await fetch("/save_focus_session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken()
        },
        body: JSON.stringify({ duration })
      });
      this.loadFocusStats();
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  }

  async loadFocusStats() {
    try {
        const response = await fetch("/get_focus_stats");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            this.updateStatsDisplay(data.stats);
        } else {
            throw new Error(data.message || 'Failed to load focus stats');
        }
    } catch (error) {
        console.warn('Error loading focus stats:', error);
        // Show fallback UI
        document.getElementById('todayFocus').textContent = '-- m';
        document.getElementById('totalFocus').textContent = '-- m';
        const container = document.getElementById('focusChart').parentElement;
        container.innerHTML = '<div class="chart-fallback">Unable to load focus stats</div>';
    }
  }

  updateChart(dailyStats) {
    if (!dailyStats || !Array.isArray(dailyStats)) {
        console.warn('Invalid daily stats data for chart');
        return;
    }

    const ctx = document.getElementById('focusChart');
    if (!ctx) {
        console.warn('Chart canvas element not found');
        return;
    }

    try {
        if (this.chart) {
            this.chart.destroy();
        }
        
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        
        // Ensure we have valid dates and data
        const dates = dailyStats.map(d => new Date(d.date)).filter(d => !isNaN(d.getTime()));
        const data = dailyStats.map(d => Math.max(0, Math.round((d.duration || 0) / 60))); // Convert seconds to minutes, ensure non-negative

        if (dates.length === 0) {
            throw new Error('No valid dates in stats data');
        }

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dates.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(124, 58, 237, 0.5)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        titleColor: isDarkMode ? '#fff' : '#000',
                        bodyColor: isDarkMode ? '#fff' : '#000',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: (items) => {
                                const date = dates[items[0].dataIndex];
                                return date.toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                });
                            },
                            label: (context) => {
                                const minutes = context.parsed.y;
                                if (minutes >= 60) {
                                    const hours = Math.floor(minutes / 60);
                                    const mins = minutes % 60;
                                    return `${hours}h ${mins}m focused`;
                                }
                                return `${minutes}m focused`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => {
                                if (value >= 60) {
                                    const hours = Math.floor(value / 60);
                                    const mins = value % 60;
                                    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                                }
                                return `${value}m`;
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    } catch (error) {
        console.warn('Error initializing chart:', error);
        const container = ctx.parentElement;
        container.innerHTML = '<div class="chart-fallback">Unable to display chart</div>';
    }
  }

  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
      }
      return mins ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  updateStatsDisplay(stats) {
    try {
        if (!stats) {
            throw new Error('No stats data provided');
        }
        document.getElementById('todayFocus').textContent = this.formatDuration(stats.today || 0);
        document.getElementById('totalFocus').textContent = this.formatDuration(stats.total || 0);
        if (stats.daily && Array.isArray(stats.daily)) {
            this.updateChart(stats.daily);
        } else {
            throw new Error('Invalid daily stats data');
        }
    } catch (error) {
        console.warn('Error updating stats display:', error);
        // Show fallback UI
        document.getElementById('todayFocus').textContent = '-- m';
        document.getElementById('totalFocus').textContent = '-- m';
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.hasNotificationPermission = permission === 'granted';
    }
  }

  async notify(mode) {
    // Always play sound first
    await this.playSound('complete');
    
    // Show browser notification if permitted and page not visible
    if (!this.isPageVisible && this.hasNotificationPermission) {
      try {
        const notification = new Notification(
          mode === 'focus' ? '🎯 Focus Session Complete!' : '☕️ Break Complete!',
          {
            body: mode === 'focus' ? 'Great work! Time to take a break.' : 'Ready to focus again?',
            icon: '/static/favicon.ico',
            badge: '/static/favicon.ico',
            tag: 'pomodoro-alert',
            requireInteraction: true,
            vibrate: [200, 100, 200]
          }
        );
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Notification error:', error);
      }
    }

    // Try to focus window
    try {
      window.focus();
    } catch (error) {
      console.error('Window focus error:', error);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts if focus panel is active
      if (!document.querySelector('.focus-panel.active')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.isRunning) {
          this.pause();
        } else {
          this.start();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const nextPhase = this.currentPhase === 'focus' ? 'break' : 'focus';
        this.switchPhase(nextPhase);
      }
    });
  }

  saveState() {
    if (!this.isRunning) {
      localStorage.removeItem('timerState');
      return;
    }

    const state = {
      currentPhase: this.currentPhase,
      currentTime: this.currentTime,
      startTime: this.startTime,
      expectedEndTime: this.expectedEndTime,
      lastTick: this.lastTick,
      focusTime: this.focusTime,
      breakTime: this.breakTime,
      originalFocusTime: this.originalFocusTime,
      originalBreakTime: this.originalBreakTime,
      currentPreset: this.currentPreset
    };
    
    try {
      localStorage.setItem('timerState', JSON.stringify(state));
    } catch (error) {
      console.warn('Error saving timer state:', error);
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem('timerState');
      if (!savedState) return;

      const state = JSON.parse(savedState);
      
      // Restore timer settings
      this.currentPhase = state.currentPhase;
      this.focusTime = state.focusTime;
      this.breakTime = state.breakTime;
      this.originalFocusTime = state.originalFocusTime;
      this.originalBreakTime = state.originalBreakTime;
      this.currentPreset = state.currentPreset;
      
      // Update UI to match restored state
      this.updatePresetButtons();
      this.updatePhaseButtons();
      
      // Check if we should resume the timer
      const now = performance.now();
      const elapsed = now - state.lastTick;
      
      if (elapsed < 1000 && state.expectedEndTime > now) {
        // Resume timer with preserved timing
        this.currentTime = state.currentTime;
        this.startTime = state.startTime;
        this.expectedEndTime = state.expectedEndTime;
        this.lastTick = state.lastTick;
        this.isRunning = true;
        this.start();
      } else {
        // Start fresh with saved time
        this.currentTime = state.currentTime;
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.resetBtn.disabled = this.currentTime === (this.currentPhase === 'focus' ? this.focusTime : this.breakTime);
        this.updateDisplay();
      }
    } catch (error) {
      console.warn('Error loading timer state:', error);
      localStorage.removeItem('timerState');
      this.reset();
    }
  }

  updatePresetButtons() {
    this.modeBtns.forEach(btn => {
      const isActive = 
        parseInt(btn.dataset.focus) * 60 === this.focusTime &&
        parseInt(btn.dataset.break) * 60 === this.breakTime;
      btn.classList.toggle('active', isActive);
    });
  }

  updatePhaseButtons() {
    this.switchBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.phase === this.currentPhase);
    });
  }

  showPomodoroToast(phase, message) {
    // Remove any existing pomodoro toasts with fade out
    document.querySelectorAll('.pomodoro-toast').forEach(t => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    });
    
    const toast = document.createElement('div');
    toast.className = `pomodoro-toast ${phase}`;
    
    const icon = phase === 'focus' 
      ? '<i class="fas fa-check-circle"></i>'
      : '<i class="fas fa-coffee"></i>';
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    // Force reflow before adding show class
    void toast.offsetHeight;
    
    // Show with enhanced animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
      // Animate icon
      const iconElement = toast.querySelector('i');
      iconElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        iconElement.style.transform = '';
      }, 200);
    });

    // Remove with fade out
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Add confirmation dialog styles
  static initStyles() {
    const styles = document.createElement('style');
    styles.textContent = ``;
    document.head.appendChild(styles);
  }

  loadSessionsCount() {
    try {
      const savedData = localStorage.getItem('focusSessions');
      if (savedData) {
        const data = JSON.parse(savedData);
        const today = new Date().toDateString();
        
        if (data.date === today) {
          this.sessionsToday = data.count;
          this.lastSessionDate = data.date;
        } else {
          // Reset if it's a new day
          this.resetSessionsCount();
        }
      } else {
        this.resetSessionsCount();
      }
      this.updateSessionsDisplay();
    } catch (error) {
      console.warn('Error loading sessions count:', error);
      this.resetSessionsCount();
    }
  }

  resetSessionsCount() {
    this.sessionsToday = 0;
    this.lastSessionDate = new Date().toDateString();
    this.saveSessionsCount();
  }

  saveSessionsCount() {
    try {
      localStorage.setItem('focusSessions', JSON.stringify({
        count: this.sessionsToday,
        date: this.lastSessionDate
      }));
    } catch (error) {
      console.warn('Error saving sessions count:', error);
    }
  }

  checkDayChange() {
    const today = new Date().toDateString();
    if (this.lastSessionDate !== today) {
      this.resetSessionsCount();
    }
  }

  updateSessionsDisplay() {
    const sessionsElement = document.querySelector('.sessions-count');
    if (sessionsElement) {
      sessionsElement.textContent = this.sessionsToday;
      // Add bump animation
      sessionsElement.classList.remove('bump');
      void sessionsElement.offsetWidth; // Force reflow
      sessionsElement.classList.add('bump');
    }
  }

  initializeState() {
    // Reset all state variables
    this.startTime = null;
    this.expectedEndTime = null;
    this.lastTick = null;
    this.isRunning = false;
    this.hasNotificationPermission = false;
    this.isPageVisible = !document.hidden;
    
    // Initialize visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      if (!document.hidden && this.isRunning) {
        // Recalibrate timer when page becomes visible
        this.recalibrateTimer();
      }
    });
  }

  recalibrateTimer() {
    if (!this.isRunning || !this.startTime || !this.expectedEndTime) return;
    
    const now = performance.now();
    const expectedTimeRemaining = Math.ceil((this.expectedEndTime - now) / 1000);
    
    if (expectedTimeRemaining <= 0) {
      this.complete();
    } else {
      this.currentTime = expectedTimeRemaining;
      this.lastTick = now;
      this.updateDisplay();
    }
  }

  initializeErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
  }

  handleError(error) {
    console.warn('Timer error:', error);
    this.errors.push({ timestamp: Date.now(), error });
    this.errorCount++;

    if (this.errorCount >= this.MAX_ERRORS) {
      this.attemptRecovery();
    }
  }

  // Used AI assistance for implementing error recovery and handling
  attemptRecovery() {
    console.warn('Attempting timer recovery...');
    
    // Stop current timer
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Reset state
    this.startTime = null;
    this.expectedEndTime = null;
    this.lastTick = null;
    
    // Update UI
    this.updateDisplay();
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.resetBtn.disabled = false;

    // Clear error count after recovery timeout
    setTimeout(() => {
      this.errorCount = 0;
    }, this.RECOVERY_TIMEOUT);
  }

  // ai suggested i do this.
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Initialize static styles
PomodoroTimer.initStyles();

// Add focus panel toggle functionality
const focusToggle = document.getElementById('focusToggle');
const focusPanel = document.getElementById('focusPanel');
const closeFocus = document.getElementById('closeFocus');

function toggleFocusMode() {
  // Close reports panel if open
  if (reportsPanel.classList.contains('active')) {
    reportsPanel.classList.remove('active');
  }
  focusPanel.classList.toggle('active');
}

focusToggle.addEventListener('click', toggleFocusMode);
closeFocus.addEventListener('click', toggleFocusMode);

// Add keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    toggleFocusMode();
  }
  if (e.key === 'Escape' && focusPanel.classList.contains('active')) {
    toggleFocusMode();
  }
});

// Reports panel toggle functionality
const reportsToggle = document.getElementById('reportsToggle');
const reportsPanel = document.getElementById('reportsPanel');
const closeReports = document.getElementById('closeReports');

function toggleReports() {
  // Close focus panel if open
  if (focusPanel.classList.contains('active')) {
    focusPanel.classList.remove('active');
  }
  reportsPanel.classList.toggle('active');
}

reportsToggle.addEventListener('click', toggleReports);
closeReports.addEventListener('click', toggleReports);

// Add keyboard shortcut for reports (Ctrl + R)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    toggleReports();
  }
  if (e.key === 'Escape' && reportsPanel.classList.contains('active')) {
    toggleReports();
  }
});

// Help modal functionality
const helpToggle = document.getElementById('helpToggle');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');

function toggleHelp() {
  helpModal.classList.toggle('active');
  // Close other panels if open
  focusPanel.classList.remove('active');
  reportsPanel.classList.remove('active');
}

helpToggle.addEventListener('click', toggleHelp);
closeHelp.addEventListener('click', toggleHelp);

// Close modal when clicking outside
helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    toggleHelp();
  }
});

// Add ? shortcut for help
document.addEventListener('keydown', (e) => {
  if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    e.preventDefault();
    toggleHelp();
  }
  // Update existing Escape handler
  if (e.key === 'Escape') {
    if (helpModal.classList.contains('active')) {
      toggleHelp();
    } else if (reportsPanel.classList.contains('active')) {
      toggleReports();
    } else if (focusPanel.classList.contains('active')) {
      toggleFocusMode();
    }
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Initialize buttons
  const addButton = document.getElementById("addButton");
  const deleteAllButton = document.getElementById("deleteAllButton");
  const todoInput = document.getElementById("todoInput");

  if (addButton) {
    addButton.addEventListener("click", addTask);
  }

  if (todoInput) {
    todoInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addTask();
      }
    });
  }

  if (deleteAllButton) {
    deleteAllButton.addEventListener("click", deleteAllTasks);
  }

  // Initialize Pomodoro timer if we're on the dashboard
  if (document.querySelector('.focus-panel')) {
    // Initialize timer with audio context after user interaction
    const initTimer = () => {
      window.pomodoro = new PomodoroTimer();
      // Remove the event listener after initialization
      document.removeEventListener('click', initTimer);
    };
    document.addEventListener('click', initTimer, { once: true });
  }

  // Initialize drag and drop for tasks
  initializeDragAndDrop();

  // Fetch initial tasks
  fetchTasks();
});

function fetchTasks() {
  const loader = document.createElement('div');
  loader.className = 'loader';
  todoList.appendChild(loader);

  return fetch("/tasks")
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    })
    .then(data => {
      displayTasks(data);
    })
    .catch(error => {
      todoList.innerHTML = `
        <div class="error-message">
          Failed to load tasks. <button onclick="fetchTasks()">Retry</button>
        </div>
      `;
      console.error('Error:', error);
    })
    .finally(() => {
      loader.remove();
    });
}

function addTask() {
  const newTask = todoInput.value.trim();
  if (newTask !== "") {
    const tempId = 'temp-' + Date.now();
    const tempTask = { id: tempId, text: newTask, completed: false };
    addTaskToDOM(tempTask);
    updateTaskCount(1);
    todoInput.value = "";

    fetch("/add_task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken()
      },
      body: JSON.stringify({ text: newTask })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to add task');
      return response.json();
    })
    .then(data => {
      if (data.success) {
        const tempElement = document.querySelector(`[data-task-id="${tempId}"]`);
        if (tempElement) {
          // Update all relevant attributes with the real ID
          tempElement.setAttribute('data-task-id', data.id);
          const checkbox = tempElement.querySelector('input');
          const label = tempElement.querySelector('label');
          const deleteBtn = tempElement.querySelector('.delete-btn');
          
          checkbox.id = `input-${data.id}`;
          label.setAttribute('for', `input-${data.id}`);
          
          // Update onclick handlers with the real ID
          checkbox.setAttribute('onclick', `toggleTask(${data.id})`);
          label.setAttribute('ondblclick', `startEdit(${data.id}, this)`);
          deleteBtn.setAttribute('onclick', `deleteTask(${data.id})`);
        }
      }
    })
    .catch(error => {
      const tempElement = document.querySelector(`[data-task-id="${tempId}"]`);
      if (tempElement) {
        tempElement.remove();
        updateTaskCount(-1);
      }
      console.error('Error:', error);
      showToast('Failed to add task', 'error');
    });
  }
}

function addTaskToDOM(task) {
  const li = document.createElement("li");
  li.className = "todo-item fade-in-item";
  li.setAttribute('data-task-id', task.id);
  li.innerHTML = `
    <div class="todo-checkbox-group">
      <input 
        type="checkbox" 
        id="input-${task.id}" 
        ${task.completed ? "checked" : ""} 
        onclick="toggleTask(${task.id})"
      >
      <label for="input-${task.id}" class="todo-label" ondblclick="startEdit(${task.id}, this)">
        ${task.text}
      </label>
    </div>
    <button class="delete-btn" onclick="deleteTask(${task.id})" aria-label="Delete task">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;
  
  // Make the new item draggable
  li.draggable = true;
  
  todoList.appendChild(li);
  // Initialize drag and drop for the new item
  initializeDragAndDrop();
}

function displayTasks(tasks) {
  todoList.innerHTML = "";
  tasks.forEach(task => {
    addTaskToDOM(task);
  });
  const count = tasks.length;
  todoCount.textContent = count;
  updateTaskWord(count);
}

function editTask(id) {
  const todoItem = document.getElementById(`todo-${id}`);
  const existingText = todoItem.textContent;
  const inputElement = document.createElement("input");

  inputElement.value = existingText;
  todoItem.replaceWith(inputElement);
  inputElement.focus();

  inputElement.addEventListener("blur", function () {
    const updatedText = inputElement.value.trim();
    if (updatedText) {
      fetch("/update_task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken()
        },
        body: JSON.stringify({ id, text: updatedText })
      }).then(() => {
        inputElement.replaceWith(todoItem);
        todoItem.textContent = updatedText;
      });
    } else {
      fetchTasks();
    }
  });
}

function toggleTask(id) {
  const checkbox = document.getElementById(`input-${id}`);
  if (!checkbox) return;

  const completed = checkbox.checked;
  const todoItem = checkbox.closest('.todo-item');
  const label = todoItem.querySelector('.todo-label');
  
  // Optimistic update
  label.style.opacity = completed ? '0.7' : '1';
  
  fetch("/toggle_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    },
    body: JSON.stringify({ id, completed })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to toggle task');
    return response.json();
  })
  .then(data => {
    if (!data.success) throw new Error(data.message);
  })
  .catch(error => {
    console.error('Error:', error);
    // Revert the change
    checkbox.checked = !completed;
    label.style.opacity = '';
    showToast('Failed to update task', 'error');
  });
}

// Add undo functionality for delete
let deletedTasks = [];

function showUndoToast(message, undoCallback) {
  const toast = document.createElement('div');
  toast.className = 'toast minimal-toast';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="minimal-undo" aria-label="Undo">Undo</button>
  `;
  
  const undoBtn = toast.querySelector('.minimal-undo');
  undoBtn.addEventListener('click', () => {
    undoCallback();
    toast.remove();
  });
  
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Update the delete task function to use a simpler message
function deleteTask(id) {
  // Convert temp ID to string to match how it's stored in DOM
  const taskId = id.toString();
  const todoItem = document.querySelector(`li[data-task-id="${taskId}"]`);
  if (!todoItem) return;

  // Don't send delete request for temporary items
  if (taskId.startsWith('temp-')) {
    todoItem.remove();
    updateTaskCount(-1);
    return;
  }

  // Start deletion animation
  todoItem.classList.add('deleting');

  fetch("/delete_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    },
    body: JSON.stringify({ id: parseInt(id) })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  })
  .then(data => {
    if (!data.success) throw new Error(data.message);
    
    // Remove item after animation completes
    todoItem.addEventListener('animationend', () => {
      todoItem.remove();
      updateTaskCount(-1);
    }, { once: true });

    // Show minimal undo toast
    showUndoToast('Task deleted', () => restoreTask(data.task));
  })
  .catch(error => {
    console.error('Error:', error);
    todoItem.classList.remove('deleting');
    showToast('Failed to delete task', 'error');
  });
}

function restoreTask(taskData) {
  if (!taskData) return;

  fetch("/add_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    },
    body: JSON.stringify({ text: taskData.text })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to restore task');
    return response.json();
  })
  .then(data => {
    if (!data.success) throw new Error(data.message);
    
    const restoredTask = {
      id: data.id,
      text: taskData.text,
      completed: taskData.completed
    };
    
    addTaskToDOM(restoredTask);
    updateTaskCount(1);
    
    // If task was completed, toggle it
    if (taskData.completed) {
      toggleTask(data.id);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showToast('Failed to restore task', 'error');
  });
}

function deleteAllTasks() {
  fetch("/delete_all_tasks", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCsrfToken()
    }
  }).then(() => {
    const todoItems = document.querySelectorAll(".todo-item");
    
    // Animate count to zero smoothly
    animateCounter(parseInt(todoCount.textContent), 0);

    // Stagger removal of items with improved animation
    todoItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.transform = 'translateX(-8px)';
        item.style.opacity = '0.8';
        
        setTimeout(() => {
          item.style.transform = 'translateX(-100%) scale(0.98)';
          item.style.opacity = '0';
          
          setTimeout(() => {
            item.style.height = '0';
            item.style.margin = '0';
            item.style.padding = '0';
            setTimeout(() => item.remove(), 150);
          }, 150);
        }, 40);
      }, index * 40);
    });
  });
}

function updateTaskCount(change) {
  const currentCount = parseInt(todoCount.textContent);
  const newCount = Math.max(0, currentCount + change);
  animateCounter(currentCount, newCount);
  updateTaskWord(newCount);
}

// Used AI assistance for implementing smooth counter animations
function animateCounter(start, end) {
  const duration = 400;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutExpo = 1 - Math.pow(2, -10 * progress);
    const current = Math.round(start + (end - start) * easeOutExpo);
    
    todoCount.textContent = current;
    updateTaskWord(current);
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

function updateTaskWord(count) {
  const taskWord = count === 1 ? 'task' : 'tasks';
  const taskWordElement = document.querySelector('.task-word');
  if (taskWordElement) {
    taskWordElement.textContent = taskWord;
  }
}

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// Add new functions for inline editing
function startEdit(id, labelElement) {
  const currentText = labelElement.textContent.trim();
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = currentText;
  
  // Save current checkbox state
  const checkbox = document.getElementById(`input-${id}`);
  const wasChecked = checkbox.checked;
  
  // Temporarily disable checkbox during edit
  checkbox.disabled = true;
  
  // Replace label with input
  labelElement.parentNode.replaceChild(input, labelElement);
  input.focus();
  
  // Set cursor position to end of text
  input.setSelectionRange(input.value.length, input.value.length);
  
  function saveEdit() {
    const newText = input.value.trim();
    if (newText && newText !== currentText) {
      updateTask(id, newText).then(() => {
        labelElement.textContent = newText;
      });
    }
    // Restore checkbox state
    checkbox.disabled = false;
    input.parentNode.replaceChild(labelElement, input);
  }
  
  // Handle save on enter and blur
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      checkbox.disabled = false;
      input.parentNode.replaceChild(labelElement, input);
    }
  });
  
  input.addEventListener('blur', saveEdit);
}

function updateTask(id, newText) {
  return fetch("/update_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    },
    body: JSON.stringify({ id, text: newText })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      throw new Error(data.message);
    }
  })
  .catch(error => {
    console.error('Error updating task:', error);
    alert('Failed to update task. Please try again.');
  });
}

// Used AI assistance for implementing drag and drop reordering
function initializeDragAndDrop() {
  const list = document.getElementById('todoList');
  if (!list) return;

  let draggedItem = null;
  let originalPosition = null;
  
  function updateTaskOrder() {
    const taskItems = [...list.querySelectorAll('.todo-item')];
    const taskOrder = taskItems.map(item => 
      parseInt(item.getAttribute('data-task-id'))
    ).filter(id => !isNaN(id));

    if (taskOrder.length > 0) {
      fetch("/reorder_tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken()
        },
        body: JSON.stringify({ taskOrder })
      }).catch(error => console.error('Error saving task order:', error));
    }
  }

  list.addEventListener('dragstart', e => {
    draggedItem = e.target.closest('.todo-item');
    if (!draggedItem) return;
    
    originalPosition = [...list.children].indexOf(draggedItem);
    
    // Add dragging class and set drag image
    draggedItem.classList.add('dragging');
    
    // Fix for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for drag in Firefox
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    if (!draggedItem) return;

    const target = e.target.closest('.todo-item');
    if (!target || target === draggedItem) return;

    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      target.parentNode.insertBefore(draggedItem, target);
    } else {
      target.parentNode.insertBefore(draggedItem, target.nextSibling);
    }
  });

  list.addEventListener('dragend', e => {
    if (!draggedItem) return;
    
    draggedItem.classList.remove('dragging');
    
    const newPosition = [...list.children].indexOf(draggedItem);
    if (originalPosition !== newPosition) {
      updateTaskOrder();
    }
    
    draggedItem = null;
    originalPosition = null;
  });

  // Make all todo items draggable
  list.querySelectorAll('.todo-item').forEach(item => {
    item.draggable = true;
  });
}

// Add new theme helper function
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const moonIcon = document.querySelector('#themeToggle i');
  if (moonIcon) {
    moonIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Refresh charts if they exist
  if (window.pomodoro && window.pomodoro.chart) {
    window.pomodoro.loadFocusStats();
  }
}