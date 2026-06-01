/**
 * Aether: 3D Holographic Tilt & Glare Reflections
 * Calculates relative cursor positions within glass elements,
 * applying smooth 3D perspective rotates and moving shine effects.
 */

class GlassTilt {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            maxTilt: options.maxTilt || 12,       // Maximum rotation angle in degrees
            perspective: options.perspective || 1000, // 3D depth perspective
            speed: options.speed || 300,          // Transition speed in ms
            scale: options.scale || 1.03,         // Scale effect on hover
            glare: options.glare !== undefined ? options.glare : true, // Enable specular glare shine
            ...options
        };

        this.width = null;
        this.height = null;
        this.left = null;
        this.top = null;
        this.glareElement = null;

        this.init();
    }

    init() {
        // Setup transition styles
        this.element.style.transition = `transform ${this.options.speed}ms cubic-bezier(0.25, 1, 0.5, 1)`;
        this.element.style.transformStyle = 'preserve-3d';

        // Create glare element if enabled
        if (this.options.glare) {
            this.createGlare();
        }

        // Bind event handlers
        this.onMouseEnterBind = this.onMouseEnter.bind(this);
        this.onMouseMoveBind = this.onMouseMove.bind(this);
        this.onMouseLeaveBind = this.onMouseLeave.bind(this);

        this.element.addEventListener('mouseenter', this.onMouseEnterBind);
        this.element.addEventListener('mousemove', this.onMouseMoveBind);
        this.element.addEventListener('mouseleave', this.onMouseLeaveBind);
    }

    createGlare() {
        // Ensure element has relative/absolute positioning so glare is bound
        const computedStyle = window.getComputedStyle(this.element);
        if (computedStyle.position === 'static') {
            this.element.style.position = 'relative';
        }

        // Glare Container
        this.glareElement = document.createElement('div');
        this.glareElement.classList.add('glass-glare-overlay');
        
        // CSS Style for the glare overlay
        Object.assign(this.glareElement.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            borderRadius: computedStyle.borderRadius || '16px',
            zIndex: '5'
        });

        // Glowing Reflection Dot Inner Element
        const glareInner = document.createElement('div');
        glareInner.classList.add('glass-glare-inner');
        Object.assign(glareInner.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 65%)',
            opacity: '0',
            pointerEvents: 'none',
            transition: `opacity ${this.options.speed}ms cubic-bezier(0.25, 1, 0.5, 1)`
        });

        this.glareElement.appendChild(glareInner);
        this.element.appendChild(this.glareElement);
        this.glareInner = glareInner;
    }

    onMouseEnter() {
        this.updateDimensions();
        this.element.style.transition = 'none'; // Lock transition for real-time tracking
        if (this.glareInner) {
            this.glareInner.style.transition = 'none';
            this.glareInner.style.opacity = '1';
        }
    }

    onMouseMove(e) {
        const mouseX = e.clientX - this.left;
        const mouseY = e.clientY - this.top;

        // Calculate normalized positions (-0.5 to 0.5)
        const normX = mouseX / this.width - 0.5;
        const normY = mouseY / this.height - 0.5;

        // Calculate rotation angles
        const tiltX = (normY * this.options.maxTilt).toFixed(2); // Invert axis: moving up tilts it up (rotation around X)
        const tiltY = (normX * this.options.maxTilt).toFixed(2); // Moving right tilts it right (rotation around Y)

        // Apply 3D matrix transform
        this.element.style.transform = `
            perspective(${this.options.perspective}px) 
            rotateX(${-tiltX}deg) 
            rotateY(${tiltY}deg) 
            scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})
        `;

        // Update Glare Position
        if (this.glareInner) {
            const pxX = (mouseX / this.width) * 100;
            const pxY = (mouseY / this.height) * 100;
            this.glareInner.style.background = `radial-gradient(circle at ${pxX}% ${pxY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 60%)`;
        }
    }

    onMouseLeave() {
        // Restore transition for smooth snapping back
        this.element.style.transition = `transform ${this.options.speed}ms cubic-bezier(0.25, 1, 0.5, 1)`;
        this.element.style.transform = `perspective(${this.options.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
        
        if (this.glareInner) {
            this.glareInner.style.transition = `opacity ${this.options.speed}ms cubic-bezier(0.25, 1, 0.5, 1)`;
            this.glareInner.style.opacity = '0';
        }
    }

    updateDimensions() {
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.left = rect.left;
        this.top = rect.top;
    }

    destroy() {
        this.element.removeEventListener('mouseenter', this.onMouseEnterBind);
        this.element.removeEventListener('mousemove', this.onMouseMoveBind);
        this.element.removeEventListener('mouseleave', this.onMouseLeaveBind);
        if (this.glareElement && this.element.contains(this.glareElement)) {
            this.element.removeChild(this.glareElement);
        }
    }
}

// Global initialization utility
window.initGlassTilt = function(selector, options) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
        // Prevent double tilt initialisation
        if (!card.dataset.tiltInitialized) {
            new GlassTilt(card, options);
            card.dataset.tiltInitialized = 'true';
        }
    });
};
