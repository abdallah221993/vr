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
        this.checkCameraPermissions();
    }

    setupEventListeners() {
        // Toggle AR
        this.toggleARButton.addEventListener('click', () => {
            this.toggleAR();
        });

        // Close AR
        this.closeARBtn.addEventListener('click', () => {
            this.stopAR();
        });

        // Scale controls
        this.scaleUpBtn.addEventListener('click', () => {
            this.adjustScale(0.1);
        });

        this.scaleDownBtn.addEventListener('click', () => {
            this.adjustScale(-0.1);
        });

        // Rotation controls
        this.rotateLeftBtn.addEventListener('click', () => {
            this.adjustRotation(-45);
        });

        this.rotateRightBtn.addEventListener('click', () => {
            this.adjustRotation(45);
        });

        // Reset model
        this.resetModelBtn.addEventListener('click', () => {
            this.resetModel();
        });

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
                // Check if camera permission is available
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                stream.getTracks().forEach(track => track.stop());
                console.log('Camera permissions available');
            }
        } catch (error) {
            console.warn('Camera permissions not available:', error);
            this.showCameraError();
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
            
            // Request camera permissions
            await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            
            // Show AR container
            this.arContainer.style.display = 'block';
            this.isARActive = true;
            
            // Update button text
            this.updateToggleButton();
            
            // Initialize AR scene
            await this.initializeARScene();
            
            this.modelLoader.hideLoading();
            
        } catch (error) {
            this.modelLoader.hideLoading();
            console.error('AR initialization error:', error);
            
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
        this.arContainer.classList.add('hidden');
        this.isARActive = false;
        this.updateToggleButton();
        
        // Stop camera stream
        this.stopCameraStream();
    }

    stopCameraStream() {
        const video = this.arScene.querySelector('video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    async initializeARScene() {
        return new Promise((resolve) => {
            const scene = this.arScene;
            
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
        const buttonText = this.toggleARButton.querySelector('span');
        const buttonIcon = this.toggleARButton.querySelector('i');
        
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
        this.scaleValue.textContent = `${Math.round(this.currentScale * 100)}%`;
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
        this.scaleValue.textContent = '100%';
    }

    handleResize() {
        if (this.isARActive && this.arScene) {
            // Force scene to recalculate dimensions
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
