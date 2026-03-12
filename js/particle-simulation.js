// Particle simulation module
// Handles initialization and updates of the WASM particle system

export class ParticleSimulation {
    constructor(config) {
        this.particleCount = config.particleCount || 50000;
        this.wellCount = config.wellCount || 35;
        this.canvasWidth = config.canvasWidth;
        this.canvasHeight = config.canvasHeight;
        this.particleSystem = null;
        this.wellsData = [];
        this.wasmModule = null;
    }

    async initialize(wasmInit, ParticleSystem) {
        // Initialize WASM
        this.wasmModule = await wasmInit();

        // Create particle system with convergence parameters
        this.particleSystem = new ParticleSystem(
            this.particleCount,
            this.canvasWidth,
            this.canvasHeight,
            60,      // history_length: track 60 frames (~1 second at 60fps)
            10.0,    // convergence_threshold: std dev < 10 pixels
            0.9995   // convergence_fraction: 99.95% of particles must converge
        );

        // Initialize gravity wells
        const centers = this.poissonDiskSampling(this.canvasWidth, this.canvasHeight, 160);
        const actualWellCount = Math.min(this.wellCount, centers.length);
        const initialWellStrength = 0.01 * 2; // Start at 2x the multiplier

        for (let i = 0; i < actualWellCount; i++) {
            if (centers[i]) {
                this.wellsData.push(centers[i][0], centers[i][1], initialWellStrength);
            }
        }

        this.particleSystem.set_gravity_wells(new Float32Array(this.wellsData));
    }

    update(deltaTime, settings) {
        // Update gravity wells
        let regenerateWells = false;
        for (let i = 0; i < this.wellCount; i++) {
            this.wellsData[i * 3 + 2] += settings.gravityMultiplier * deltaTime;
            this.wellsData[i * 3 + 2] = Math.min(this.wellsData[i * 3 + 2], settings.maxWellGravity);
            if (settings.wellRegenerationEnabled && this.wellsData[i * 3 + 2] === settings.maxWellGravity) {
                regenerateWells = true;
            }
        }

        // Check for convergence and optionally regenerate wells
        const converged = this.particleSystem.has_converged();
        if (converged && !regenerateWells && settings.convergenceRegenerationEnabled) {
            regenerateWells = true;
        }

        if (regenerateWells) {
            this.regenerateWells(settings.gravityMultiplier);
        }

        this.particleSystem.set_gravity_wells(new Float32Array(this.wellsData));

        // Update particles in WASM
        const currentMaxVelocity = regenerateWells
            ? settings.maxVelocity
            : Math.max(settings.currentMaxVelocity - settings.velocityDecay, settings.minVelocity);

        this.particleSystem.update(
            deltaTime,
            settings.perturbation,
            settings.damping,
            currentMaxVelocity
        );

        return { regenerated: regenerateWells, currentMaxVelocity };
    }

    regenerateWells(gravityMultiplier) {
        const centers = this.poissonDiskSampling(this.canvasWidth, this.canvasHeight, 160);
        this.wellsData = [];
        const actualWellCount = Math.min(this.wellCount, centers.length);
        const initialWellStrength = gravityMultiplier * 2;

        for (let i = 0; i < actualWellCount; i++) {
            if (centers[i]) {
                this.wellsData.push(centers[i][0], centers[i][1], initialWellStrength);
            }
        }
    }

    getPositions() {
        return this.particleSystem.get_positions();
    }

    getVelocities() {
        return this.particleSystem.get_velocities();
    }

    getConvergenceRatio() {
        return this.particleSystem.get_convergence_ratio();
    }

    hasConverged() {
        return this.particleSystem.has_converged();
    }

    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.particleSystem.resize_canvas(width, height);
    }

    getMemory() {
        return this.wasmModule.memory;
    }

    // Poisson disk sampling for well distribution
    poissonDiskSampling(w, h, r, k = 30) {
        const cellSize = r / Math.sqrt(2);
        const gridW = Math.ceil(w / cellSize);
        const gridH = Math.ceil(h / cellSize);
        const grid = Array(gridH).fill(null).map(() => Array(gridW).fill(-1));

        const points = [];
        const active = [];

        const p0 = [Math.random() * w, Math.random() * h];
        points.push(p0);
        active.push(0);
        grid[Math.floor(p0[1] / cellSize)][Math.floor(p0[0] / cellSize)] = 0;

        while (active.length > 0) {
            const idx = active[Math.floor(Math.random() * active.length)];
            const point = points[idx];
            let found = false;

            for (let i = 0; i < k; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const radius = r + Math.random() * r;
                const candidate = [
                    point[0] + radius * Math.cos(angle),
                    point[1] + radius * Math.sin(angle)
                ];

                if (candidate[0] >= 0 && candidate[0] < w &&
                    candidate[1] >= 0 && candidate[1] < h) {

                    const gx = Math.floor(candidate[0] / cellSize);
                    const gy = Math.floor(candidate[1] / cellSize);

                    let valid = true;
                    for (let dy = -2; dy <= 2 && valid; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            const nx = gx + dx, ny = gy + dy;
                            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH &&
                                grid[ny][nx] !== -1) {
                                const other = points[grid[ny][nx]];
                                const dist = Math.hypot(candidate[0] - other[0],
                                    candidate[1] - other[1]);
                                if (dist < r) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                    }

                    if (valid) {
                        points.push(candidate);
                        active.push(points.length - 1);
                        grid[gy][gx] = points.length - 1;
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                active.splice(active.indexOf(idx), 1);
            }
        }

        return points;
    }
}
