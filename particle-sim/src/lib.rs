use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ParticleSystem {
    positions: Vec<f32>,  // [x1, y1, x2, y2, ...]
    velocities: Vec<f32>, // [vx1, vy1, vx2, vy2, ...]
    prev_positions: Vec<f32>,
    count: usize,
    canvas_width: f32,
    canvas_height: f32,
    gravity_wells: Vec<GravityWell>,

    // Convergence tracking
    position_history: Vec<f32>,  // Ring buffer: count * 2 * history_length
    history_index: usize,
    history_filled: bool,
    history_length: usize,
    convergence_threshold: f32,
    convergence_fraction: f32,
}

struct GravityWell {
    x: f32,
    y: f32,
    strength: f32,
}

#[wasm_bindgen]
impl ParticleSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(
        count: usize,
        canvas_width: f32,
        canvas_height: f32,
        history_length: usize,
        convergence_threshold: f32,
        convergence_fraction: f32,
    ) -> ParticleSystem {
        let mut positions = Vec::with_capacity(count * 2);
        let mut velocities = Vec::with_capacity(count * 2);
        let mut prev_positions = Vec::with_capacity(count * 2);

        // Initialize particles in corners
        for _ in 0..count {
            let corner = (js_sys::Math::random() * 4.0).floor() as u32;
            let (x, y) = match corner {
                0 => (0.0, 0.0), // Top-left
                1 => (canvas_width, 0.0), // Top-right
                2 => (0.0, canvas_height), // Bottom-left
                _ => (canvas_width, canvas_height), // Bottom-right
            };

            positions.push(x);
            positions.push(y);
            velocities.push(0.0);
            velocities.push(0.0);
            prev_positions.push(x);
            prev_positions.push(y);
        }

        // Initialize position history buffer
        let position_history = vec![0.0; count * 2 * history_length];

        ParticleSystem {
            positions,
            velocities,
            prev_positions,
            count,
            canvas_width,
            canvas_height,
            gravity_wells: Vec::new(),
            position_history,
            history_index: 0,
            history_filled: false,
            history_length,
            convergence_threshold,
            convergence_fraction,
        }
    }

    pub fn set_gravity_wells(&mut self, wells_data: &[f32]) {
        // Input format: [x1, y1, strength1, x2, y2, strength2, ...]
        self.gravity_wells.clear();
        for chunk in wells_data.chunks(3) {
            if chunk.len() == 3 {
                self.gravity_wells.push(GravityWell {
                    x: chunk[0],
                    y: chunk[1],
                    strength: chunk[2],
                });
            }
        }
    }

    pub fn update(&mut self, delta_time: f32, p: f32, d: f32, max_velocity: f32) {
        // Clamp delta_time to prevent instability from large time steps
        let delta_time = delta_time.min(2.0).max(0.0);

        // Validate inputs and use safe defaults if invalid
        let perturbation = if p.is_finite() { p * delta_time } else { 0.0 };
        let damping = if d.is_finite() && d > 0.0 { d.powf(delta_time).clamp(0.0, 1.0) } else { 0.95 };
        let max_velocity = if max_velocity.is_finite() && max_velocity > 0.0 { max_velocity } else { 10.0 };

        for i in 0..self.count {
            let idx = i * 2;
            let x_idx = idx;
            let y_idx = idx + 1;

            // Check for NaN/Inf in positions and reset if found
            if !self.positions[x_idx].is_finite() || !self.positions[y_idx].is_finite() {
                self.positions[x_idx] = self.canvas_width / 2.0;
                self.positions[y_idx] = self.canvas_height / 2.0;
                self.velocities[x_idx] = 0.0;
                self.velocities[y_idx] = 0.0;
            }

            // Check for NaN/Inf in velocities and reset if found
            if !self.velocities[x_idx].is_finite() || !self.velocities[y_idx].is_finite() {
                self.velocities[x_idx] = 0.0;
                self.velocities[y_idx] = 0.0;
            }

            // Store previous position
            self.prev_positions[x_idx] = self.positions[x_idx];
            self.prev_positions[y_idx] = self.positions[y_idx];

            // Brownian motion
            let random_x = js_sys::Math::random() as f32;
            let random_y = js_sys::Math::random() as f32;
            if random_x.is_finite() && random_y.is_finite() {
                self.velocities[x_idx] += (random_x - 0.5) * perturbation;
                self.velocities[y_idx] += (random_y - 0.5) * perturbation;
            }

            // Apply gravity from wells
            for well in &self.gravity_wells {
                // Validate well parameters
                if !well.x.is_finite() || !well.y.is_finite() || !well.strength.is_finite() {
                    continue;
                }

                let dx = well.x - self.positions[x_idx];
                let dy = well.y - self.positions[y_idx];
                let dist_sq = dx * dx + dy * dy;

                // Add minimum distance to prevent division by very small numbers
                let dist_sq = dist_sq.max(1.0);
                let dist = dist_sq.sqrt();

                if dist > 1.0 && dist < 1100000000.0 {
                    let force = (well.strength / dist_sq) * delta_time;

                    // Clamp force to prevent extreme accelerations
                    let force = force.clamp(-1000.0, 1000.0);

                    if force.is_finite() {
                        self.velocities[x_idx] += dx * force;
                        self.velocities[y_idx] += dy * force;
                    }
                }
            }

            // Apply damping
            self.velocities[x_idx] *= damping;
            self.velocities[y_idx] *= damping;

            // Clamp velocity to max_velocity
            let vel_sq = self.velocities[x_idx] * self.velocities[x_idx] +
                         self.velocities[y_idx] * self.velocities[y_idx];
            if vel_sq > max_velocity * max_velocity && vel_sq > 0.0 {
                let vel_mag = vel_sq.sqrt();
                if vel_mag > 0.0 && vel_mag.is_finite() {
                    let scale = max_velocity / vel_mag;
                    self.velocities[x_idx] *= scale;
                    self.velocities[y_idx] *= scale;
                }
            }

            // Additional velocity sanity check
            self.velocities[x_idx] = self.velocities[x_idx].clamp(-max_velocity * 2.0, max_velocity * 2.0);
            self.velocities[y_idx] = self.velocities[y_idx].clamp(-max_velocity * 2.0, max_velocity * 2.0);

            // Update position
            let dx = self.velocities[x_idx] * delta_time;
            let dy = self.velocities[y_idx] * delta_time;

            // Clamp position updates to prevent teleportation
            let dx = dx.clamp(-self.canvas_width, self.canvas_width);
            let dy = dy.clamp(-self.canvas_height, self.canvas_height);

            self.positions[x_idx] += dx;
            self.positions[y_idx] += dy;

            // Bounce off edges with bounds checking
            if self.positions[x_idx] < 0.0 {
                self.positions[x_idx] = 0.0;
                self.velocities[x_idx] = (self.velocities[x_idx] * -0.5).abs();
            }
            if self.positions[x_idx] > self.canvas_width {
                self.positions[x_idx] = self.canvas_width;
                self.velocities[x_idx] = -(self.velocities[x_idx] * -0.5).abs();
            }
            if self.positions[y_idx] < 0.0 {
                self.positions[y_idx] = 0.0;
                self.velocities[y_idx] = (self.velocities[y_idx] * -0.5).abs();
            }
            if self.positions[y_idx] > self.canvas_height {
                self.positions[y_idx] = self.canvas_height;
                self.velocities[y_idx] = -(self.velocities[y_idx] * -0.5).abs();
            }

            // Final sanity check on positions
            self.positions[x_idx] = self.positions[x_idx].clamp(0.0, self.canvas_width);
            self.positions[y_idx] = self.positions[y_idx].clamp(0.0, self.canvas_height);
        }

        // Update position history after all particles have been updated
        self.update_position_history();
    }

    fn update_position_history(&mut self) {
        for i in 0..self.count {
            let src_idx = i * 2;
            let dst_idx = (i * self.history_length * 2) + (self.history_index * 2);

            self.position_history[dst_idx] = self.positions[src_idx];
            self.position_history[dst_idx + 1] = self.positions[src_idx + 1];
        }

        self.history_index = (self.history_index + 1) % self.history_length;
        if self.history_index == 0 {
            self.history_filled = true;
        }
    }

    fn particle_variance(&self, particle_idx: usize) -> f32 {
        if !self.history_filled && self.history_index < 2 {
            return f32::INFINITY; // Not enough data
        }

        let frames_to_check = if self.history_filled {
            self.history_length
        } else {
            self.history_index
        };

        // Calculate mean position
        let mut mean_x = 0.0;
        let mut mean_y = 0.0;
        let base_idx = particle_idx * self.history_length * 2;

        for frame in 0..frames_to_check {
            let idx = base_idx + (frame * 2);
            mean_x += self.position_history[idx];
            mean_y += self.position_history[idx + 1];
        }
        mean_x /= frames_to_check as f32;
        mean_y /= frames_to_check as f32;

        // Calculate variance (sum of squared distances from mean)
        let mut variance = 0.0;
        for frame in 0..frames_to_check {
            let idx = base_idx + (frame * 2);
            let dx = self.position_history[idx] - mean_x;
            let dy = self.position_history[idx + 1] - mean_y;
            variance += dx * dx + dy * dy;
        }
        variance /= frames_to_check as f32;

        variance.sqrt() // Return standard deviation
    }

    pub fn has_converged(&self) -> bool {
        if !self.history_filled && self.history_index < self.history_length / 2 {
            return false; // Need at least half buffer filled
        }

        let mut converged_count = 0;

        for i in 0..self.count {
            let variance = self.particle_variance(i);
            if variance < self.convergence_threshold {
                converged_count += 1;
            }
        }

        let convergence_ratio = converged_count as f32 / self.count as f32;
        convergence_ratio >= self.convergence_fraction
    }

    pub fn get_convergence_ratio(&self) -> f32 {
        if !self.history_filled && self.history_index < 2 {
            return 0.0;
        }

        let mut converged_count = 0;
        for i in 0..self.count {
            if self.particle_variance(i) < self.convergence_threshold {
                converged_count += 1;
            }
        }
        converged_count as f32 / self.count as f32
    }

    pub fn get_positions(&self) -> *const f32 {
        self.positions.as_ptr()
    }

    pub fn get_velocities(&self) -> *const f32 {
        self.velocities.as_ptr()
    }

    pub fn get_count(&self) -> usize {
        self.count
    }

    pub fn resize_canvas(&mut self, width: f32, height: f32) {
        self.canvas_width = width;
        self.canvas_height = height;
    }
}
