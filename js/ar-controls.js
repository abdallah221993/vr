/**
 * AR Controls Module
 * Handles AR scene management and user interactions
 */

class ARControls {
    constructor() {
        this.isARActive = false;
        this.currentScale = 1.0;
        this.currentRotationY = 0;
        
        // DOM elements
        this.toggleARButton = document.getElementById('toggleARButton');
        this.arContainer = document.getElementById('arContainer');
        this.arScene = document.getElementById('ar-scene');
        this.closeARBtn = document.getElementById('closeAR');
        this.scaleUpBtn = document.getElementById('scaleUp');
        this.scaleDownBtn = document.getElementById('scaleDown');
        this.scaleValue = document.getElementById('scaleValue');
        this.rotateLeftBtn = document.getElementById('rotateLeft');
        this.rotateRightBtn = document.getElementById('rotateRight');
        this.resetModelBtn = document.getElementById('resetModel');
        
        // Initialize model loader
        this.modelLoader = new ModelLoader();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupARComponents();
        // Do not request camera automatically here; wait for user action or explicit permission request
    }

    setupEventListeners() {
        // Toggle AR
        if (this.toggleARButton) {
            this.toggleARButton.addEventListener('click', () => {
                this.toggleAR();
            });
        }

        // Close AR
        if (this.closeARBtn) {
            this.closeARBtn.addEventListener('click', () => {
                this.stopAR();
            });
        }

        // Scale controls
        if (this.scaleUpBtn) {
            this.scaleUpBtn.addEventListener('click', () => {
                this.adjustScale(0.1);
            });
        }
        if (this.scaleDownBtn) {
            this.scaleDownBtn.addEventListener('click', () => {
                this.adjustScale(-0.1);
            });
        }

        // Rotation controls
        if (this.rotateLeftBtn) {
            this.rotateLeftBtn.addEventListener('click', () => {
                this.adjustRotation(-45);
            });
        }
        if (this.rotateRightBtn) {
            this.rotateRightBtn.addEventListener('click', () => {
                this.adjustRotation(45);
            });
        }

        // Reset model
        if (this.resetModelBtn) {
            this.resetModelBtn.addEventListener('click', () => {
                this.resetModel();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    setupARComponents() {
        // Register custom A-Frame components
        if (typeof AFRAME !== 'undefined') {
            // Marker handler component
            AFRAME.registerComponent('markerhandler', {
                init: function () {
                    this.el.addEventListener('markerFound', () => {
                        console.log('Marker detected');
                        this.el.setAttribute('visible', true);
                    });

                    this.el.addEventListener('markerLost', () => {
                        console.log('Marker lost');
                        this.el.setAttribute('visible', false);
                    });
                }
            });

            // Touch controls component
            AFRAME.registerComponent('touch-controls', {
                init: function () {
                    let startX = 0;
                    let startY = 0;
                    let currentRotationY = 0;

                    this.el.addEventListener('touchstart', (e) => {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                    });

                    this.el.addEventListener('touchmove', (e) => {
                        e.preventDefault();
                        const deltaX = e.touches[0].clientX - startX;
                        currentRotationY += deltaX * 0.5;
                        
                        const rotation = this.el.getAttribute('rotation');
                        this.el.setAttribute('rotation', `${rotation.x} ${currentRotationY} ${rotation.z}`);
                    });
                }
            });
        }
    }

    async checkCameraPermissions() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                stream.getTracks().forEach(track => track.stop());
                console.log('Camera permissions available');
                return true;
            }
        } catch (error) {
            console.warn('Camera permissions not available:', error);
            this.showCameraError();
            return false;
        }
    }

    showCameraError() {
        this.modelLoader.showError(
            'لا يمكن الوصول إلى الكاميرا. يرجى التأكد من منح الإذن للموقع للوصول إلى الكاميرا.'
        );
    }

    async toggleAR() {
        if (this.isARActive) {
            this.stopAR();
        } else {
            await this.startAR();
        }
    }

    async startAR() {
        try {
            this.modelLoader.showLoading();

            // Request camera permission first (prompts user)
            if (!(await this.checkCameraPermissions())) {
                this.modelLoader.hideLoading();
                return;
            }

            // Show AR container (use display to avoid Tailwind/CSS conflicts)
            if (this.arContainer) {
                this.arContainer.style.display = 'block';
                this.arContainer.classList.remove('hidden');
            }
            this.isARActive = true;
            this.updateToggleButton();

            // Wait for A-Frame scene to be ready
            await this.initializeARScene();

            // Give AR.js a bit to attach video stream; then check and adjust video element if present
            setTimeout(() => {
                try {
                    const video = this.arScene && this.arScene.querySelector('video');
                    if (video) {
                        // Ensure video fills the scene canvas and is visible
                        video.style.position = 'absolute';
                        video.style.top = '0';
                        video.style.left = '0';
                        video.style.width = '100%';
                        video.style.height = '100%';
                        video.style.objectFit = 'cover';
                        video.style.zIndex = '0';
                        console.log('AR video element styled and visible.');
                    } else {
                        console.warn('Video element not found inside AR scene yet.');
                    }
                } catch (err) {
                    console.error('Error adjusting AR video element:', err);
                }
            }, 800);

            this.modelLoader.hideLoading();
            console.log('AR started and container shown.');
        } catch (error) {
            this.modelLoader.hideLoading();
            console.error('AR initialization error:', error);

            // إشعار للمستخدم
            try { alert('حدث خطأ في تشغيل الكاميرا: ' + (error.message || error)); } catch(e){}

            if (error.name === 'NotAllowedError') {
                this.modelLoader.showError(
                    'تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح.'
                );
            } else if (error.name === 'NotFoundError') {
                this.modelLoader.showError(
                    'لم يتم العثور على كاميرا. يرجى التأكد من وجود كاميرا متصلة بالجهاز.'
                );
            } else {
                this.modelLoader.showError(
                    'فشل في تفعيل الواقع المعزز. يرجى المحاولة مرة أخرى.'
                );
            }
        }
    }

    stopAR() {
        if (this.arContainer) {
            this.arContainer.style.display = 'none';
            this.arContainer.classList.add('hidden');
        }
        this.isARActive = false;
        this.updateToggleButton();
        
        // Stop camera stream if A-Frame attached it to a video element
        this.stopCameraStream();
    }

    stopCameraStream() {
        try {
            const video = this.arScene && this.arScene.querySelector('video');
            if (video) {
                const stream = video.srcObject || (video.mozCaptureStream && video.mozCaptureStream());
                if (stream && stream.getTracks) {
                    stream.getTracks().forEach(t => {
                        try { t.stop(); } catch(e){}
                    });
                    console.log('Camera stream stopped.');
                }
            }

            // Also attempt to stop any MediaStream on hidden <video> tags
            const videos = document.querySelectorAll('video');
            videos.forEach(v => {
                if (v && v.srcObject && v.srcObject.getTracks) {
                    v.srcObject.getTracks().forEach(t => {
                        try { t.stop(); } catch(e){}
                    });
                }
            });
        } catch (err) {
            console.warn('Error stopping camera streams:', err);
        }
    }

    async initializeARScene() {
        return new Promise((resolve) => {
            const scene = this.arScene;
            
            if (!scene) {
                // If scene not found, resolve after a timeout (fail gracefully)
                setTimeout(resolve, 1500);
                return;
            }

            if (scene.hasLoaded) {
                resolve();
                return;
            }

            scene.addEventListener('loaded', () => {
                resolve();
            });

            // Fallback timeout
            setTimeout(resolve, 3000);
        });
    }

    updateToggleButton() {
        const buttonText = this.toggleARButton && this.toggleARButton.querySelector('span');
        const buttonIcon = this.toggleARButton && this.toggleARButton.querySelector('i');
        
        if (!this.toggleARButton || !buttonText || !buttonIcon) return;
        
        if (this.isARActive) {
            buttonText.textContent = 'إيقاف الواقع المعزز';
            buttonIcon.className = 'fas fa-stop mr-2';
            this.toggleARButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            this.toggleARButton.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            buttonText.textContent = 'تفعيل الواقع المعزز';
            buttonIcon.className = 'fas fa-camera mr-2';
            this.toggleARButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            this.toggleARButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    adjustScale(delta) {
        this.currentScale = Math.max(0.1, Math.min(2.0, this.currentScale + delta));
        const scaleValue = `${this.currentScale} ${this.currentScale} ${this.currentScale}`;
        
        this.modelLoader.updateModelProperty('scale', scaleValue);
        if (this.scaleValue) this.scaleValue.textContent = `${Math.round(this.currentScale * 100)}%`;
    }

    adjustRotation(delta) {
        this.currentRotationY = (this.currentRotationY + delta) % 360;
        const rotationValue = '0 ' + this.currentRotationY + ' 0';
        
        this.modelLoader.updateModelProperty('rotation', rotationValue);
    }

    resetModel() {
        this.currentScale = 1.0;
        this.currentRotationY = 0;
        
        this.modelLoader.resetModel();
        if (this.scaleValue) this.scaleValue.textContent = '100%';
    }

    handleResize() {
        if (this.isARActive && this.arScene) {
            // Force scene to recalculate dimensions if needed
            // e.g., trigger a resize on renderer if available
            try {
                const sceneEl = this.arScene;
                if (sceneEl && sceneEl.renderer && sceneEl.renderer.domElement) {
                    sceneEl.renderer.setSize(window.innerWidth, window.innerHeight);
                }
            } catch (e) {
                // ignore
            }
        }
    }
}

// Initialize AR Controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arControls = new ARControls();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.arControls && window.arControls.isARActive) {
        window.arControls.stopAR();
    }
});