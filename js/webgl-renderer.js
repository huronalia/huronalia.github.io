// WebGL renderer module
// Handles WebGL setup, shaders, and rendering

export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.gridProgram = null;
        this.positionBuffer = null;
        this.velocityBuffer = null;
        this.gridBuffer = null;
        this.locations = {};
        this.gridLocations = {};

        this.initialize();
    }

    initialize() {
        // Set up WebGL context
        this.gl = this.canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: false
        });

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Create shader programs
        this.createParticleProgram();
        this.createGridProgram();

        // Create buffers
        this.positionBuffer = this.gl.createBuffer();
        this.velocityBuffer = this.gl.createBuffer();
        this.createGridBuffer();
    }

    createParticleProgram() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_velocity;

            uniform vec2 u_resolution;
            uniform float u_pointSize;

            varying vec2 v_velocity;

            void main() {
                // Convert from pixel coordinates to clip space (-1 to 1)
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                // Flip Y axis (WebGL has Y up, canvas has Y down)
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

                // Set point size from uniform
                gl_PointSize = u_pointSize;

                // Pass velocity to fragment shader
                v_velocity = a_velocity;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;

            varying vec2 v_velocity;
            uniform float u_darkMode;

            void main() {
                // Calculate angle from velocity
                float angle = atan(v_velocity.y, v_velocity.x);
                // Convert angle to hue (0 to 1)
                float hue = (angle + 3.14159265) / (2.0 * 3.14159265);

                // Simple HSL to RGB conversion for saturation=0.8, lightness=0.6
                float h = hue * 6.0;
                float c = 0.48; // chroma (sat * (1 - abs(2*L - 1)))
                float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));

                vec3 rgb;
                if (h < 1.0) rgb = vec3(c, x, 0);
                else if (h < 2.0) rgb = vec3(x, c, 0);
                else if (h < 3.0) rgb = vec3(0, c, x);
                else if (h < 4.0) rgb = vec3(0, x, c);
                else if (h < 5.0) rgb = vec3(x, 0, c);
                else rgb = vec3(c, 0, x);

                // Add lightness - darker in dark mode
                float lightness = mix(0.4, 0.3, u_darkMode);
                rgb += vec3(lightness);

                gl_FragColor = vec4(rgb, 1.0);
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);

        // Get attribute and uniform locations
        this.locations.position = this.gl.getAttribLocation(this.program, 'a_position');
        this.locations.velocity = this.gl.getAttribLocation(this.program, 'a_velocity');
        this.locations.resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.locations.pointSize = this.gl.getUniformLocation(this.program, 'u_pointSize');
        this.locations.darkMode = this.gl.getUniformLocation(this.program, 'u_darkMode');
    }

    createGridProgram() {
        const gridVertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
            }
        `;

        const gridFragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_gridSize;
            uniform float u_darkMode;

            void main() {
                vec2 coord = gl_FragCoord.xy;

                // Calculate grid lines
                vec2 grid = mod(coord, u_gridSize);
                float lineWidth = 1.0;

                // Colors based on dark mode
                vec3 lineColor = mix(vec3(0.95), vec3(0.16), u_darkMode);
                vec3 bgColor = mix(vec3(1.0), vec3(0.1), u_darkMode);

                // Main grid lines
                if (grid.x < lineWidth || grid.y < lineWidth) {
                    gl_FragColor = vec4(lineColor, 1.0);
                } else {
                    gl_FragColor = vec4(bgColor, 1.0);
                }
            }
        `;

        const gridVertexShader = this.createShader(this.gl.VERTEX_SHADER, gridVertexShaderSource);
        const gridFragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, gridFragmentShaderSource);
        this.gridProgram = this.createProgram(gridVertexShader, gridFragmentShader);

        this.gridLocations.position = this.gl.getAttribLocation(this.gridProgram, 'a_position');
        this.gridLocations.resolution = this.gl.getUniformLocation(this.gridProgram, 'u_resolution');
        this.gridLocations.gridSize = this.gl.getUniformLocation(this.gridProgram, 'u_gridSize');
        this.gridLocations.darkMode = this.gl.getUniformLocation(this.gridProgram, 'u_darkMode');
    }

    createGridBuffer() {
        this.gridBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]), this.gl.STATIC_DRAW);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    render(positions, velocities, particleCount, particleSize, gridSize, darkMode = false) {
        const darkModeValue = darkMode ? 1.0 : 0.0;

        // Draw grid background
        this.gl.useProgram(this.gridProgram);
        this.gl.uniform2f(this.gridLocations.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.gridLocations.gridSize, gridSize);
        this.gl.uniform1f(this.gridLocations.darkMode, darkModeValue);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridBuffer);
        this.gl.enableVertexAttribArray(this.gridLocations.position);
        this.gl.vertexAttribPointer(this.gridLocations.position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // Enable blending for particles
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Upload position data to GPU
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

        // Upload velocity data to GPU
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.velocityBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, velocities, this.gl.DYNAMIC_DRAW);

        // Use shader program
        this.gl.useProgram(this.program);

        // Set uniforms
        this.gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.locations.pointSize, particleSize);
        this.gl.uniform1f(this.locations.darkMode, darkModeValue);

        // Set up position attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.locations.position);
        this.gl.vertexAttribPointer(this.locations.position, 2, this.gl.FLOAT, false, 0, 0);

        // Set up velocity attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.velocityBuffer);
        this.gl.enableVertexAttribArray(this.locations.velocity);
        this.gl.vertexAttribPointer(this.locations.velocity, 2, this.gl.FLOAT, false, 0, 0);

        // Draw all particles
        this.gl.drawArrays(this.gl.POINTS, 0, particleCount);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}
