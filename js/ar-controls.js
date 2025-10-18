/**
 * AR Controls Module
 * Handles AR activation, camera permissions, and model controls
 */

class ARControls {
  constructor() {
    this.isARActive = false;
    this.currentScale = 1.0;
    this.currentRotationY = 0;
    this.selectedModelIndex = null; // Index of currently selected model for individual control

    // DOM Elements
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
    this.addModelBtn = document.getElementById('addModelBtn');
    this.removeModelBtn = document.getElementById('removeModelBtn');

    this.modelLoader = new ModelLoader();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.ensureToggleBinding();
    this.setupGestureHandler();
  }

  setupEventListeners() {
    // Toggle AR Button
    if (this.toggleARButton) {
      this.toggleARButton.addEventListener('click', () => this.toggleAR());
    }

    // Close AR Button
    if (this.closeARBtn) {
      this.closeARBtn.addEventListener('click', () => this.stopAR());
    }

    // Scale Controls
    if (this.scaleUpBtn) {
      this.scaleUpBtn.addEventListener('click', () => this.adjustScale(0.1));
    }
    if (this.scaleDownBtn) {
      this.scaleDownBtn.addEventListener('click', () => this.adjustScale(-0.1));
    }

    // Rotation Controls
    if (this.rotateLeftBtn) {
      this.rotateLeftBtn.addEventListener('click', () => this.adjustRotation(-45));
    }
    if (this.rotateRightBtn) {
      this.rotateRightBtn.addEventListener('click', () => this.adjustRotation(45));
    }

    // Reset Button
    if (this.resetModelBtn) {
      this.resetModelBtn.addEventListener('click', () => this.resetModels());
    }

    // Add/Remove Model Buttons
    if (this.addModelBtn) {
      this.addModelBtn.addEventListener('click', () => this.addModel());
    }
    if (this.removeModelBtn) {
      this.removeModelBtn.addEventListener('click', () => this.removeModel());
    }

    // Window events
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 500);
    });

    // Stop AR when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isARActive) {
        this.stopAR();
      }
    });
  }

  ensureToggleBinding(retries = 10, delay = 200) {
    const tryBind = () => {
      this.toggleARButton = document.getElementById('toggleARButton');
      if (this.toggleARButton) {
        console.log('✅ AR toggle button found and bound');
        return true;
      }
      return false;
    };

    if (!tryBind() && retries > 0) {
      const intervalId = setInterval(() => {
        if (tryBind()) {
          clearInterval(intervalId);
        } else {
          retries -= 1;
          if (retries <= 0) {
            clearInterval(intervalId);
            console.warn('⚠️ AR toggle button not found after retries');
          }
        }
      }, delay);
    }
  }

  setupGestureHandler() {
    // Wait for AFRAME to be ready
    if (typeof AFRAME === 'undefined') {
      setTimeout(() => this.setupGestureHandler(), 500);
      return;
    }

    // Register gesture-handler component for touch interactions
    if (!AFRAME.components['gesture-handler']) {
      AFRAME.registerComponent('gesture-handler', {
        schema: {
          enabled: { default: true }
        },

        init: function () {
          this.handleScale = this.handleScale.bind(this);
          this.handleRotation = this.handleRotation.bind(this);
          
          this.isVisible = false;
          this.initialScale = this.el.object3D.scale.clone();
          this.scaleFactor = 1;

          this.el.sceneEl.addEventListener('markerFound', () => {
            this.isVisible = true;
          });

          this.el.sceneEl.addEventListener('markerLost', () => {
            this.isVisible = false;
          });
        },

        handleRotation: function (event) {
          if (this.isVisible) {
            this.el.object3D.rotation.y += event.detail.rotationDelta;
          }
        },

        handleScale: function (event) {
          if (this.isVisible) {
            this.scaleFactor *= 1 + event.detail.spreadChange / event.detail.startSpread;
            this.scaleFactor = Math.min(Math.max(this.scaleFactor, 0.3), 3);
            
            this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
            this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
            this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
          }
        }
      });

      console.log('✅ Gesture handler component registered');
    }

    // Register gesture-detector component
    if (!AFRAME.components['gesture-detector']) {
      AFRAME.registerComponent('gesture-detector', {
        schema: {
          enabled: { default: true }
        },

        init: function () {
          this.handleTouchStart = this.handleTouchStart.bind(this);
          this.handleTouchMove = this.handleTouchMove.bind(this);
          this.handleTouchEnd = this.handleTouchEnd.bind(this);

          this.touchStarted = false;
          this.touchCount = 0;

          this.canvas = this.el.sceneEl.canvas;
          this.canvas.addEventListener('touchstart', this.handleTouchStart);
          this.canvas.addEventListener('touchmove', this.handleTouchMove);
          this.canvas.addEventListener('touchend', this.handleTouchEnd);
        },

        remove: function () {
          this.canvas.removeEventListener('touchstart', this.handleTouchStart);
          this.canvas.removeEventListener('touchmove', this.handleTouchMove);
          this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        },

        handleTouchStart: function (event) {
          this.touchStarted = true;
          this.touchCount = event.touches.length;

          if (this.touchCount === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.startSpread = this.calculateDistance(touch1, touch2);
            this.startAngle = this.calculateAngle(touch1, touch2);
          }
        },

        handleTouchMove: function (event) {
          if (!this.touchStarted) return;

          if (this.touchCount === 2 && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentSpread = this.calculateDistance(touch1, touch2);
            const currentAngle = this.calculateAngle(touch1, touch2);

            // Scale gesture
            const spreadChange = currentSpread - this.startSpread;
            this.el.emit('scale', {
              spreadChange: spreadChange,
              startSpread: this.startSpread
            });

            // Rotation gesture
            const rotationDelta = currentAngle - this.startAngle;
            this.el.emit('rotation', {
              rotationDelta: rotationDelta
            });

            this.startSpread = currentSpread;
            this.startAngle = currentAngle;
          }
        },

        handleTouchEnd: function (event) {
          this.touchStarted = false;
          this.touchCount = 0;
        },

        calculateDistance: function (touch1, touch2) {
          const dx = touch2.clientX - touch1.clientX;
          const dy = touch2.clientY - touch1.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        },

        calculateAngle: function (touch1, touch2) {
          const dx = touch2.clientX - touch1.clientX;
          const dy = touch2.clientY - touch1.clientY;
          return Math.atan2(dy, dx);
        }
      });

      console.log('✅ Gesture detector component registered');
    }
  }

  async checkCameraPermissions() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Camera permissions granted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Camera permissions denied:', error);
      this.modelLoader.showError('لا يمكن الوصول إلى الكاميرا. يرجى التأكد من منح الأذونات اللازمة.');
      return false;
    }
  }

  async toggleAR() {
    if (this.isARActive) {
      return this.stopAR();
    }
    return this.startAR();
  }

  async startAR() {
    try {
      // Check if models are selected
      if (this.modelLoader.getSelectedModels().length === 0) {
        this.modelLoader.showError('الرجاء اختيار قطعة أثاث واحدة على الأقل قبل تفعيل الواقع المعزز');
        return;
      }

      this.modelLoader.showLoading();

      // Check camera permissions
      const hasPermission = await this.checkCameraPermissions();
      if (!hasPermission) {
        this.modelLoader.hideLoading();
        return;
      }

      // Show AR container
      if (this.arContainer) {
        this.arContainer.style.display = 'block';
        this.arContainer.classList.remove('hidden');
      }

      this.isARActive = true;
      this.updateToggleButton();

      // Wait for AR scene to initialize
      await this.initializeARScene();

      // Load selected models
      await this.modelLoader.loadSelectedModelsToAR();

      // Wait for video stream
      try {
        const video = await this.waitForARVideo(15000);
        if (video) {
          this.styleVideoElement(video);
          console.log('✅ AR video stream active');
        }
      } catch (err) {
        console.warn('⚠️ Video element not found:', err);
      }

      this.modelLoader.hideLoading();
      console.log('✅ AR started successfully');

    } catch (error) {
      this.modelLoader.hideLoading();
      console.error('❌ AR initialization error:', error);
      this.modelLoader.showError('فشل في تفعيل الواقع المعزز. يرجى المحاولة مرة أخرى.');
    }
  }

  styleVideoElement(video) {
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.zIndex = '0';
  }

  waitForARVideo(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!this.arScene) {
        return reject(new Error('AR scene not found'));
      }

      const checkVideo = () => {
        const video = this.arScene.querySelector('video') || document.querySelector('video');
        return video;
      };

      const existingVideo = checkVideo();
      if (existingVideo) {
        return resolve(existingVideo);
      }

      let resolved = false;
      const observer = new MutationObserver(() => {
        const video = checkVideo();
        if (video) {
          resolved = true;
          observer.disconnect();
          resolve(video);
        }
      });

      observer.observe(this.arScene, { childList: true, subtree: true });

      // Polling fallback
      const interval = setInterval(() => {
        const video = checkVideo();
        if (video) {
          resolved = true;
          clearInterval(interval);
          observer.disconnect();
          resolve(video);
        }
      }, 300);

      // Timeout
      setTimeout(() => {
        clearInterval(interval);
        observer.disconnect();
        if (!resolved) {
          reject(new Error('Timeout waiting for video'));
        }
      }, timeout);
    });
  }

  async initializeARScene() {
    return new Promise((resolve) => {
      const scene = this.arScene;
      if (!scene) {
        return setTimeout(resolve, 1500);
      }

      if (scene.hasLoaded) {
        return resolve();
      }

      scene.addEventListener('loaded', () => resolve());
      setTimeout(resolve, 3000);
    });
  }

  stopAR() {
    console.log('🛑 Stopping AR...');
    
    // Hide AR container
    if (this.arContainer) {
      this.arContainer.style.display = 'none';
      this.arContainer.classList.add('hidden');
    }

    this.isARActive = false;
    this.updateToggleButton();
    this.stopCameraStream();

    console.log('✅ AR stopped');
  }

  stopCameraStream() {
    try {
      // Stop video streams
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video.srcObject && video.srcObject.getTracks) {
          video.srcObject.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (e) {
              console.warn('Error stopping track:', e);
            }
          });
        }
      });
      console.log('✅ Camera streams stopped');
    } catch (err) {
      console.warn('⚠️ Error stopping camera streams:', err);
    }
  }

  updateToggleButton() {
    if (!this.toggleARButton) return;

    const buttonText = this.toggleARButton.querySelector('span');
    const buttonIcon = this.toggleARButton.querySelector('i');

    if (!buttonText || !buttonIcon) return;

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
    this.currentScale = Math.max(0.1, Math.min(3.0, this.currentScale + delta));
    this.modelLoader.updateModelProperty(
      'scale',
      `${this.currentScale} ${this.currentScale} ${this.currentScale}`,
      this.selectedModelIndex
    );
    
    if (this.scaleValue) {
      this.scaleValue.textContent = `${Math.round(this.currentScale * 100)}%`;
    }
  }

  adjustRotation(delta) {
    this.currentRotationY = (this.currentRotationY + delta) % 360;
    this.modelLoader.updateModelProperty(
      'rotation',
      `0 ${this.currentRotationY} 0`,
      this.selectedModelIndex
    );
  }

  resetModels() {
    this.currentScale = 1.0;
    this.currentRotationY = 0;
    this.modelLoader.resetModels();
    
    if (this.scaleValue) {
      this.scaleValue.textContent = '100%';
    }
  }

  addModel() {
    this.modelLoader.addModelInstance();
  }

  removeModel() {
    this.modelLoader.removeLastModel();
  }

  handleResize() {
    if (this.isARActive && this.arScene) {
      try {
        if (this.arScene.renderer && this.arScene.renderer.setSize) {
          this.arScene.renderer.setSize(window.innerWidth, window.innerHeight);
        }
      } catch (e) {
        console.warn('Error resizing AR scene:', e);
      }
    }
  }
}

// Initialize AR Controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing AR Controls...');
  window.arControls = new ARControls();
});
