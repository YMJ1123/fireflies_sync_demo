// Mirollo-Strogatz 同步化理論模擬器
class MirolloStrogatzSimulator {
    constructor() {
        this.canvas = document.getElementById('simulationCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 模擬參數
        this.oscillators = [];
        this.numOscillators = 5;
        this.couplingStrength = 0.3;
        this.alpha = 2.0; // 凹函數參數（調低以便更容易觀察變化）
        // 將閾值設定為略低於 1，使狀態在有限時間內可跨越而觸發放電
        this.threshold = 0.999;
        this.dt = 0.008; // 減小時間步長以獲得更平滑的動畫
        
        // 狀態變量
        this.isRunning = false;
        this.timeStep = 0;
        this.fireCount = 0;
        this.animationId = null;
        this.lastTime = 0;
        
        // UI 元素
        this.setupUI();
        this.setupCanvas();
        this.initializeOscillators();
        this.render();
    }
    
    setupUI() {
        // 控制面板元素
        this.oscillatorCountSlider = document.getElementById('oscillatorCount');
        this.oscillatorCountValue = document.getElementById('oscillatorCountValue');
        this.couplingStrengthSlider = document.getElementById('couplingStrength');
        this.couplingStrengthValue = document.getElementById('couplingStrengthValue');
        
        this.randomizeBtn = document.getElementById('randomizeBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 統計顯示元素
        this.syncProgress = document.getElementById('syncProgress');
        this.syncPercentage = document.getElementById('syncPercentage');
        this.syncValue = document.getElementById('syncValue');
        this.fireCountDisplay = document.getElementById('fireCount');
        this.timeStepsDisplay = document.getElementById('timeSteps');
        
        // 事件監聽器
        this.oscillatorCountSlider.addEventListener('input', (e) => {
            this.numOscillators = parseInt(e.target.value);
            this.oscillatorCountValue.textContent = this.numOscillators;
            this.initializeOscillators();
            this.render();
        });
        
        this.couplingStrengthSlider.addEventListener('input', (e) => {
            this.couplingStrength = parseFloat(e.target.value);
            this.couplingStrengthValue.textContent = this.couplingStrength.toFixed(1);
        });
        
        this.randomizeBtn.addEventListener('click', () => {
            this.randomizeOscillators();
            this.render();
        });
        
        this.playPauseBtn.addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.resetSimulation();
        });
    }
    
    setupCanvas() {
        // 設置 canvas 尺寸
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = Math.min(600, rect.width - 32);
        this.canvas.height = Math.min(400, Math.max(300, this.canvas.width * 0.6));
        
        // 高 DPI 支持
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.width;
        const displayHeight = this.canvas.height;
        
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.canvasWidth = displayWidth;
        this.canvasHeight = displayHeight;
    }
    
    initializeOscillators() {
        this.oscillators = [];
        for (let i = 0; i < this.numOscillators; i++) {
            this.oscillators.push(new Oscillator(i, this.alpha));
        }
        this.positionOscillators();
        this.resetStats();
    }
    
    positionOscillators() {
        // 在圓形排列中放置振盪器
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.6;
        
        if (this.oscillators.length === 1) {
            this.oscillators[0].x = centerX;
            this.oscillators[0].y = centerY;
        } else {
            for (let i = 0; i < this.oscillators.length; i++) {
                const angle = (i / this.oscillators.length) * 2 * Math.PI - Math.PI / 2;
                this.oscillators[i].x = centerX + Math.cos(angle) * radius;
                this.oscillators[i].y = centerY + Math.sin(angle) * radius;
            }
        }
    }
    
    randomizeOscillators() {
        for (let oscillator of this.oscillators) {
            oscillator.state = Math.random() * 0.8; // 避免立即觸發
            oscillator.phase = Math.random() * 2;
            oscillator.fireTimer = 0;
        }
        this.resetStats();
    }
    
    resetSimulation() {
        this.isRunning = false;
        this.playPauseBtn.textContent = '開始模擬';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.initializeOscillators();
        this.render();
    }
    
    resetStats() {
        this.timeStep = 0;
        this.fireCount = 0;
        this.updateStats();
    }
    
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.playPauseBtn.textContent = '暫停模擬';
            this.lastTime = performance.now();
            this.animate();
        } else {
            this.playPauseBtn.textContent = '開始模擬';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // 限制最大時間步
        this.lastTime = currentTime;
        
        // 執行多個小步驟以獲得更平滑的模擬
        const steps = Math.max(1, Math.floor(deltaTime / this.dt));
        for (let i = 0; i < steps; i++) {
            this.updateSimulation();
        }
        
        this.render();
        this.updateStats();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateSimulation() {
        // 更新每個振盪器的狀態
        for (let oscillator of this.oscillators) {
            oscillator.update(this.dt);
        }
        
        // 檢查放電事件並應用耦合
        const firedOscillators = [];
        for (let oscillator of this.oscillators) {
            if (oscillator.state >= this.threshold && !oscillator.hasFired) {
                firedOscillators.push(oscillator);
                oscillator.fire();
                this.fireCount++;
            }
        }
        
        // 應用脈衝耦合
        if (firedOscillators.length > 0) {
            for (let oscillator of this.oscillators) {
                if (!oscillator.hasFired) {
                    // 耦合效應：其他振盪器狀態增加
                    const coupling = this.couplingStrength * 0.5;
                    oscillator.state = Math.min(this.threshold - 0.001, oscillator.state + coupling);
                    // 更新相位以保持一致性
                    if (oscillator.state > 0) {
                        oscillator.phase = -Math.log(1 - oscillator.state) / this.alpha;
                    }
                }
            }
        }
        
        // 重置放電狀態
        for (let oscillator of this.oscillators) {
            if (oscillator.hasFired) {
                oscillator.hasFired = false;
            }
        }
        
        this.timeStep++;
    }
    
    calculateSynchronization() {
        if (this.oscillators.length < 2) return 0;
        
        // 計算狀態方差
        const states = this.oscillators.map(osc => osc.state);
        const mean = states.reduce((sum, state) => sum + state, 0) / states.length;
        const variance = states.reduce((sum, state) => sum + Math.pow(state - mean, 2), 0) / states.length;
        
        // 同步化程度 = 1 - 正規化方差
        const maxVariance = 0.25; // 理論最大方差
        const syncLevel = Math.max(0, 1 - (variance / maxVariance));
        
        return syncLevel;
    }
    
    updateStats() {
        const syncLevel = this.calculateSynchronization();
        const syncPercent = (syncLevel * 100).toFixed(1);
        
        // 更新進度條
        this.syncProgress.style.width = `${syncPercent}%`;
        this.syncPercentage.textContent = `${syncPercent}%`;
        
        // 更新統計數據
        this.syncValue.textContent = `${syncPercent}%`;
        this.fireCountDisplay.textContent = this.fireCount.toString();
        this.timeStepsDisplay.textContent = Math.floor(this.timeStep / 10).toString();
    }
    
    render() {
        // 清空畫布
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 繪製連接線（淡化顯示耦合關係）
        this.renderConnections();
        
        // 繪製振盪器
        for (let i = 0; i < this.oscillators.length; i++) {
            this.renderOscillator(this.oscillators[i], i);
        }
        
        // 繪製中心標籤
        this.renderCenterLabel();
    }
    
    renderOscillator(oscillator, index) {
        const radius = 28;
        const state = Math.max(0, Math.min(1, oscillator.state));
        
        // 更鮮明的顏色變化：從深藍到鮮紅
        let color;
        if (state < 0.3) {
            // 深藍到藍色
            const t = state / 0.3;
            color = `rgb(${Math.floor(30 + t * 40)}, ${Math.floor(60 + t * 100)}, ${Math.floor(150 + t * 100)})`;
        } else if (state < 0.7) {
            // 藍色到橙色
            const t = (state - 0.3) / 0.4;
            color = `rgb(${Math.floor(70 + t * 180)}, ${Math.floor(160 + t * 90)}, ${Math.floor(250 - t * 200)})`;
        } else {
            // 橙色到紅色
            const t = (state - 0.7) / 0.3;
            color = `rgb(${Math.floor(250 + t * 5)}, ${Math.floor(100 - t * 100)}, ${Math.floor(50 - t * 50)})`;
        }
        
        // 繪製振盪器主體
        this.ctx.save();
        this.ctx.translate(oscillator.x, oscillator.y);
        
        // 如果剛剛放電或即將放電，添加發光效果
        if (oscillator.fireTimer > 0 || state > 0.9) {
            const glowIntensity = oscillator.fireTimer > 0 ? 1.0 : (state - 0.9) / 0.1;
            this.ctx.shadowBlur = 15 + glowIntensity * 20;
            this.ctx.shadowColor = color;
            
            // 額外的外圈效果
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius + 5 + glowIntensity * 10, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * glowIntensity})`;
            this.ctx.fill();
        }
        
        // 繪製主圓形
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // 繪製邊框
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 繪製狀態指示器（內圓）
        const innerRadius = radius * state * 0.75;
        if (innerRadius > 3) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, innerRadius, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + state * 0.4})`;
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // 繪製振盪器編號
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText((index + 1).toString(), oscillator.x, oscillator.y - radius - 20);
        
        // 繪製狀態值
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(state.toFixed(2), oscillator.x, oscillator.y + radius + 20);
    }
    
    renderConnections() {
        if (this.oscillators.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        // 繪製所有振盪器之間的連接線
        for (let i = 0; i < this.oscillators.length; i++) {
            for (let j = i + 1; j < this.oscillators.length; j++) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.oscillators[i].x, this.oscillators[i].y);
                this.ctx.lineTo(this.oscillators[j].x, this.oscillators[j].y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.setLineDash([]);
    }
    
    renderCenterLabel() {
        if (this.oscillators.length > 3) return; // 只在振盪器較少時顯示
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('脈衝耦合', centerX, centerY - 5);
        this.ctx.fillText('振盪器網絡', centerX, centerY + 8);
    }
}

// Kuramoto 互動式模擬器
class KuramotoSimulator {
    constructor() {
        this.canvas = document.getElementById('kuramotoCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // 參數
        this.numFlies = 100;
        this.couplingK = 2.2;
        this.dt = 0.03;
        this.omega0 = 1.0;
        this.omegaStd = 0.15;
        this.isRunning = false;
        this.lastTime = 0;

        // 狀態
        this.theta = [];
        this.omega = [];
        this.xy = [];

        // UI 綁定
        this.kN = document.getElementById('kN');
        this.kNValue = document.getElementById('kNValue');
        this.kCoupling = document.getElementById('kCoupling');
        this.kCouplingValue = document.getElementById('kCouplingValue');
        this.kOmega0 = document.getElementById('kOmega0');
        this.kOmega0Value = document.getElementById('kOmega0Value');
        this.kDt = document.getElementById('kDt');
        this.kDtValue = document.getElementById('kDtValue');
        this.kRandomizeBtn = document.getElementById('kRandomizeBtn');
        this.kPlayPauseBtn = document.getElementById('kPlayPauseBtn');
        this.kResetBtn = document.getElementById('kResetBtn');

        this.kSyncProgress = document.getElementById('kuramotoSyncProgress');
        this.kSyncPercentage = document.getElementById('kuramotoSyncPercentage');

        this.setupCanvas();
        this.bindEvents();
        this.initialize();
        this.render();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = Math.min(600, rect.width - 32);
        this.canvas.height = Math.min(400, Math.max(300, this.canvas.width * 0.6));
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.width;
        const displayHeight = this.canvas.height;
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        this.ctx.scale(dpr, dpr);
        this.canvasWidth = displayWidth;
        this.canvasHeight = displayHeight;
    }

    bindEvents() {
        if (this.kN) {
            this.kN.addEventListener('input', (e) => {
                this.numFlies = parseInt(e.target.value);
                this.kNValue.textContent = this.numFlies;
                this.initialize();
                this.render();
            });
        }
        if (this.kCoupling) {
            this.kCoupling.addEventListener('input', (e) => {
                this.couplingK = parseFloat(e.target.value);
                this.kCouplingValue.textContent = this.couplingK.toFixed(1);
            });
        }
        if (this.kDt) {
            this.kDt.addEventListener('input', (e) => {
                this.dt = parseFloat(e.target.value);
                this.kDtValue.textContent = this.dt.toFixed(3);
            });
        }
        if (this.kOmega0) {
            this.kOmega0.addEventListener('input', (e) => {
                const newOmega0 = parseFloat(e.target.value);
                // 以平移方式調整目前頻率，使其均值改為新值
                const delta = newOmega0 - this.omega0;
                for (let i = 0; i < this.omega.length; i++) this.omega[i] += delta;
                this.omega0 = newOmega0;
                this.kOmega0Value.textContent = this.omega0.toFixed(2);
            });
        }
        if (this.kRandomizeBtn) {
            this.kRandomizeBtn.addEventListener('click', () => {
                this.randomize();
                this.render();
            });
        }
        if (this.kPlayPauseBtn) {
            this.kPlayPauseBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        if (this.kResetBtn) {
            this.kResetBtn.addEventListener('click', () => {
                this.reset();
            });
        }
    }

    initialize() {
        // 隨機位置 [0,1]x[0,1]
        this.xy = Array.from({ length: this.numFlies }, () => [Math.random(), Math.random()]);
        // 隨機頻率與相位
        this.omega = Array.from({ length: this.numFlies }, () => this.omega0 + this.omegaStd * this.randn());
        this.theta = Array.from({ length: this.numFlies }, () => Math.random() * 2 * Math.PI);
        this.isRunning = false;
        if (this.kPlayPauseBtn) this.kPlayPauseBtn.textContent = '開始模擬';
        this.updateSyncDisplay();
    }

    randomize() {
        this.initialize();
    }

    reset() {
        this.initialize();
        this.render();
    }

    toggle() {
        this.isRunning = !this.isRunning;
        if (this.kPlayPauseBtn) this.kPlayPauseBtn.textContent = this.isRunning ? '暫停模擬' : '開始模擬';
        this.lastTime = performance.now();
        if (this.isRunning) this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        const now = performance.now();
        const dtSec = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        // 多個小步以穩定
        const subSteps = Math.max(1, Math.floor(dtSec / this.dt));
        for (let s = 0; s < subSteps; s++) this.step();
        this.render();
        this.updateSyncDisplay();
        requestAnimationFrame(() => this.animate());
    }

    step() {
        const N = this.numFlies;
        // order parameter
        const z = this.theta.map(th => [Math.cos(th), Math.sin(th)]);
        let meanX = 0, meanY = 0;
        for (let i = 0; i < N; i++) { meanX += z[i][0]; meanY += z[i][1]; }
        meanX /= N; meanY /= N;
        // update
        for (let i = 0; i < N; i++) {
            const th = this.theta[i];
            // Im(e^{-i theta_i} * mean_field)
            const coupling = (-Math.sin(th) * meanX + Math.cos(th) * meanY) * this.couplingK;
            const dtheta = this.omega[i] + coupling;
            this.theta[i] = (th + this.dt * dtheta) % (2 * Math.PI);
            if (this.theta[i] < 0) this.theta[i] += 2 * Math.PI;
        }
    }

    computeR() {
        const N = this.numFlies;
        let meanX = 0, meanY = 0;
        for (let i = 0; i < N; i++) { meanX += Math.cos(this.theta[i]); meanY += Math.sin(this.theta[i]); }
        meanX /= N; meanY /= N;
        const R = Math.sqrt(meanX * meanX + meanY * meanY);
        return R;
    }

    updateSyncDisplay() {
        const R = this.computeR();
        const percent = Math.round(R * 1000) / 10;
        if (this.kSyncProgress) this.kSyncProgress.style.width = `${percent}%`;
        if (this.kSyncPercentage) this.kSyncPercentage.textContent = `${percent}%`;
    }

    render() {
        if (!this.canvas) return;
        // 清背景
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        // 畫點
        const baseSize = 4;
        const flashSize = 10;
        const R = this.computeR();
        for (let i = 0; i < this.numFlies; i++) {
            const x = this.xy[i][0] * (this.canvasWidth - 20) + 10;
            const y = this.xy[i][1] * (this.canvasHeight - 20) + 10;
            const th = this.theta[i];
            const nearFlash = th < 0.15 || th > (2 * Math.PI - 0.15);
            const size = nearFlash ? flashSize : baseSize;
            const alpha = nearFlash ? 1.0 : 0.4;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(50, 184, 198, ${alpha})`;
            this.ctx.fill();
        }
        // 標題
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`R = ${this.computeR().toFixed(3)}`, 10, 16);
    }

    randn() {
        // Box–Muller transform
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
}

// 振盪器類別
class Oscillator {
    constructor(id, alpha = 2.0) {
        this.id = id;
        this.alpha = alpha;
        this.state = Math.random() * 0.6; // 初始狀態
        this.phase = 0; // 內部時間
        this.x = 0; // canvas 位置
        this.y = 0;
        this.hasFired = false;
        this.fireTimer = 0; // 用於顯示放電效果
    }
    
    update(dt) {
        // 更新放電計時器
        if (this.fireTimer > 0) {
            this.fireTimer -= dt * 5; // 放電效果持續時間
        }
        
        // 如果已經放電，跳過狀態更新
        if (this.hasFired) return;
        
        // 更新內部時間
        this.phase += dt;
        
        // 使用 Mirollo-Strogatz 模型更新狀態
        // x = f(φ) = 1 - exp(-αφ)
        this.state = 1 - Math.exp(-this.alpha * this.phase);
    }
    
    fire() {
        // 振盪器放電：重置狀態和相位
        this.state = 0;
        this.phase = 0;
        this.hasFired = true;
        this.fireTimer = 1.0; // 啟動放電視覺效果
    }
}

// 當 DOM 載入完成時初始化模擬器
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new MirolloStrogatzSimulator();
    const ksim = new KuramotoSimulator();
    
    // 將模擬器實例存儲在canvas元素上以便調整大小時使用
    document.getElementById('simulationCanvas').simulator = simulator;
    const kCanvas = document.getElementById('kuramotoCanvas');
    if (kCanvas) kCanvas.ksim = ksim;
});

// 處理視窗大小調整
window.addEventListener('resize', () => {
    setTimeout(() => {
        const canvas = document.getElementById('simulationCanvas');
        if (canvas && canvas.simulator) {
            canvas.simulator.setupCanvas();
            canvas.simulator.positionOscillators();
            canvas.simulator.render();
        }
        const kCanvas = document.getElementById('kuramotoCanvas');
        if (kCanvas && kCanvas.ksim) {
            kCanvas.ksim.setupCanvas();
            kCanvas.ksim.render();
        }
    }, 250);
});