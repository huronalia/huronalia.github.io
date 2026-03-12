// Settings panel UI module
// Handles all UI interactions for the settings panel

export class SettingsPanel {
    constructor() {
        // Baseline values
        this.BASELINE = {
            PERTURBATION: 0.9,
            DAMPING: 0.99,
            MAX_VELOCITY: 10,
            MIN_VELOCITY: 3,
            VELOCITY_DECAY: 0.3,
            MAX_WELL_GRAVITY: 15,
            GRAVITY_MULTIPLIER: 0.01,
            PARTICLE_SIZE: 4,
            SIM_SPEED: 1.0,
            GRID_SIZE: 13
        };

        // Current settings
        this.settings = {
            perturbation: this.BASELINE.PERTURBATION,
            damping: this.BASELINE.DAMPING,
            maxVelocity: this.BASELINE.MAX_VELOCITY,
            minVelocity: this.BASELINE.MIN_VELOCITY,
            velocityDecay: this.BASELINE.VELOCITY_DECAY,
            maxWellGravity: this.BASELINE.MAX_WELL_GRAVITY,
            gravityMultiplier: this.BASELINE.GRAVITY_MULTIPLIER,
            particleSize: this.BASELINE.PARTICLE_SIZE,
            simSpeed: this.BASELINE.SIM_SPEED,
            gridSize: this.BASELINE.GRID_SIZE,
            wellRegenerationEnabled: true,
            convergenceRegenerationEnabled: true,
            currentMaxVelocity: this.BASELINE.MAX_VELOCITY
        };

        // DOM elements
        this.elements = {};
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Panel
        this.elements.settingsButton = document.getElementById('settings-button');
        this.elements.settingsPanel = document.getElementById('settings-panel');

        // Displays
        this.elements.fpsDisplay = document.getElementById('fps-display');
        this.elements.particleInput = document.getElementById('particle-input');
        this.elements.particleGoBtn = document.getElementById('particle-go-btn');
        this.elements.convergenceDisplay = document.getElementById('convergence-display');

        // Sliders and their value displays
        this.elements.perturbationSlider = document.getElementById('perturbation-slider');
        this.elements.perturbationValue = document.getElementById('perturbation-value');
        this.elements.dampingSlider = document.getElementById('damping-slider');
        this.elements.dampingValue = document.getElementById('damping-value');
        this.elements.maxVelocitySlider = document.getElementById('max-velocity-slider');
        this.elements.maxVelocityValue = document.getElementById('max-velocity-value');
        this.elements.minVelocitySlider = document.getElementById('min-velocity-slider');
        this.elements.minVelocityValue = document.getElementById('min-velocity-value');
        this.elements.velocityDecaySlider = document.getElementById('velocity-decay-slider');
        this.elements.velocityDecayValue = document.getElementById('velocity-decay-value');
        this.elements.maxWellGravitySlider = document.getElementById('max-well-gravity-slider');
        this.elements.maxWellGravityValue = document.getElementById('max-well-gravity-value');
        this.elements.gravityMultiplierSlider = document.getElementById('gravity-multiplier-slider');
        this.elements.gravityMultiplierValue = document.getElementById('gravity-multiplier-value');
        this.elements.particleSizeSlider = document.getElementById('particle-size-slider');
        this.elements.particleSizeValue = document.getElementById('particle-size-value');
        this.elements.simSpeedSlider = document.getElementById('sim-speed-slider');
        this.elements.simSpeedValue = document.getElementById('sim-speed-value');
        this.elements.gridSizeSlider = document.getElementById('grid-size-slider');
        this.elements.gridSizeValue = document.getElementById('grid-size-value');

        // Checkboxes
        this.elements.wellRegenerationCheckbox = document.getElementById('well-regeneration-checkbox');
        this.elements.convergenceRegenerationCheckbox = document.getElementById('convergence-regeneration-checkbox');

        // Buttons
        this.elements.resetBtn = document.getElementById('reset-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
    }

    attachEventListeners() {
        // Toggle settings panel
        this.elements.settingsButton.addEventListener('click', () => {
            this.elements.settingsPanel.classList.toggle('visible');
        });

        // Reset button
        this.elements.resetBtn.addEventListener('click', () => this.resetSettings());

        // Restart button
        this.elements.restartBtn.addEventListener('click', () => {
            window.location.reload();
        });

        // Particle input handling
        let currentParticleCount = 50000;
        this.elements.particleInput.addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value);
            if (newValue !== currentParticleCount && newValue >= 100 && newValue <= 200000) {
                this.elements.particleGoBtn.classList.remove('hidden');
            } else {
                this.elements.particleGoBtn.classList.add('hidden');
            }
        });

        this.elements.particleGoBtn.addEventListener('click', () => {
            const newCount = parseInt(this.elements.particleInput.value);
            if (newCount >= 100 && newCount <= 200000) {
                localStorage.setItem('particleCount', newCount);
                window.location.reload();
            }
        });

        // Slider event listeners
        this.elements.perturbationSlider.addEventListener('input', (e) => {
            this.settings.perturbation = parseFloat(e.target.value);
            this.elements.perturbationValue.textContent = this.settings.perturbation.toFixed(1);
        });

        this.elements.dampingSlider.addEventListener('input', (e) => {
            this.settings.damping = parseFloat(e.target.value);
            this.elements.dampingValue.textContent = this.settings.damping.toFixed(3);
        });

        this.elements.maxVelocitySlider.addEventListener('input', (e) => {
            this.settings.maxVelocity = parseFloat(e.target.value);

            if (this.settings.maxVelocity < this.settings.minVelocity) {
                this.settings.minVelocity = this.settings.maxVelocity;
                this.elements.minVelocitySlider.value = this.settings.minVelocity;
                this.elements.minVelocityValue.textContent = this.settings.minVelocity.toFixed(1);
            }

            this.elements.maxVelocityValue.textContent = this.settings.maxVelocity.toFixed(1);
            this.settings.currentMaxVelocity = this.settings.maxVelocity;
        });

        this.elements.minVelocitySlider.addEventListener('input', (e) => {
            this.settings.minVelocity = parseFloat(e.target.value);

            if (this.settings.minVelocity > this.settings.maxVelocity) {
                this.settings.maxVelocity = this.settings.minVelocity;
                this.elements.maxVelocitySlider.value = this.settings.maxVelocity;
                this.elements.maxVelocityValue.textContent = this.settings.maxVelocity.toFixed(1);
                this.settings.currentMaxVelocity = this.settings.maxVelocity;
            }

            this.elements.minVelocityValue.textContent = this.settings.minVelocity.toFixed(1);
        });

        this.elements.velocityDecaySlider.addEventListener('input', (e) => {
            this.settings.velocityDecay = parseFloat(e.target.value);
            this.elements.velocityDecayValue.textContent = this.settings.velocityDecay.toFixed(2);
        });

        this.elements.maxWellGravitySlider.addEventListener('input', (e) => {
            this.settings.maxWellGravity = parseFloat(e.target.value);
            this.elements.maxWellGravityValue.textContent = this.settings.maxWellGravity.toFixed(1);
        });

        this.elements.gravityMultiplierSlider.addEventListener('input', (e) => {
            this.settings.gravityMultiplier = parseFloat(e.target.value);
            this.elements.gravityMultiplierValue.textContent = this.settings.gravityMultiplier.toFixed(3);
        });

        this.elements.particleSizeSlider.addEventListener('input', (e) => {
            this.settings.particleSize = parseFloat(e.target.value);
            this.elements.particleSizeValue.textContent = this.settings.particleSize.toFixed(1);
        });

        this.elements.simSpeedSlider.addEventListener('input', (e) => {
            this.settings.simSpeed = parseFloat(e.target.value);
            this.elements.simSpeedValue.textContent = this.settings.simSpeed.toFixed(1);
        });

        this.elements.gridSizeSlider.addEventListener('input', (e) => {
            this.settings.gridSize = parseFloat(e.target.value);
            this.elements.gridSizeValue.textContent = this.settings.gridSize.toFixed(0);
        });

        this.elements.wellRegenerationCheckbox.addEventListener('change', (e) => {
            this.settings.wellRegenerationEnabled = e.target.checked;
        });

        this.elements.convergenceRegenerationCheckbox.addEventListener('change', (e) => {
            this.settings.convergenceRegenerationEnabled = e.target.checked;
        });
    }

    resetSettings() {
        this.settings.perturbation = this.BASELINE.PERTURBATION;
        this.settings.damping = this.BASELINE.DAMPING;
        this.settings.maxVelocity = this.BASELINE.MAX_VELOCITY;
        this.settings.minVelocity = this.BASELINE.MIN_VELOCITY;
        this.settings.velocityDecay = this.BASELINE.VELOCITY_DECAY;
        this.settings.maxWellGravity = this.BASELINE.MAX_WELL_GRAVITY;
        this.settings.gravityMultiplier = this.BASELINE.GRAVITY_MULTIPLIER;
        this.settings.particleSize = this.BASELINE.PARTICLE_SIZE;
        this.settings.simSpeed = this.BASELINE.SIM_SPEED;
        this.settings.gridSize = this.BASELINE.GRID_SIZE;
        this.settings.currentMaxVelocity = this.BASELINE.MAX_VELOCITY;

        this.elements.perturbationSlider.value = this.BASELINE.PERTURBATION;
        this.elements.perturbationValue.textContent = this.BASELINE.PERTURBATION.toFixed(1);
        this.elements.dampingSlider.value = this.BASELINE.DAMPING;
        this.elements.dampingValue.textContent = this.BASELINE.DAMPING.toFixed(3);
        this.elements.maxVelocitySlider.value = this.BASELINE.MAX_VELOCITY;
        this.elements.maxVelocityValue.textContent = this.BASELINE.MAX_VELOCITY.toFixed(0);
        this.elements.minVelocitySlider.value = this.BASELINE.MIN_VELOCITY;
        this.elements.minVelocityValue.textContent = this.BASELINE.MIN_VELOCITY.toFixed(1);
        this.elements.velocityDecaySlider.value = this.BASELINE.VELOCITY_DECAY;
        this.elements.velocityDecayValue.textContent = this.BASELINE.VELOCITY_DECAY.toFixed(2);
        this.elements.maxWellGravitySlider.value = this.BASELINE.MAX_WELL_GRAVITY;
        this.elements.maxWellGravityValue.textContent = this.BASELINE.MAX_WELL_GRAVITY.toFixed(1);
        this.elements.gravityMultiplierSlider.value = this.BASELINE.GRAVITY_MULTIPLIER;
        this.elements.gravityMultiplierValue.textContent = this.BASELINE.GRAVITY_MULTIPLIER.toFixed(3);
        this.elements.particleSizeSlider.value = this.BASELINE.PARTICLE_SIZE;
        this.elements.particleSizeValue.textContent = this.BASELINE.PARTICLE_SIZE.toFixed(1);
        this.elements.simSpeedSlider.value = this.BASELINE.SIM_SPEED;
        this.elements.simSpeedValue.textContent = this.BASELINE.SIM_SPEED.toFixed(1);
        this.elements.gridSizeSlider.value = this.BASELINE.GRID_SIZE;
        this.elements.gridSizeValue.textContent = this.BASELINE.GRID_SIZE.toFixed(0);
    }

    updateStats(fps, convergenceRatio, converged) {
        this.elements.fpsDisplay.textContent = fps.toString();
        this.elements.convergenceDisplay.textContent =
            `${(convergenceRatio * 100).toFixed(1)}%${converged ? ' ✓' : ''}`;
    }

    getSettings() {
        return this.settings;
    }

    updateCurrentMaxVelocity(value) {
        this.settings.currentMaxVelocity = value;
    }

    getStoredParticleCount() {
        const storedParticleCount = localStorage.getItem('particleCount');
        if (storedParticleCount) {
            const count = parseInt(storedParticleCount);
            this.elements.particleInput.value = count;
            localStorage.removeItem('particleCount');
            return count;
        }
        return 50000;
    }
}
