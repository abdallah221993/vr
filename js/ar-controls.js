/**
 * AR Controls Module (robust binding for toggle button + full AR lifecycle)
 */

class ARControls {
  constructor() {
    this.isARActive = false;
    this.currentScale = 1.0;
    this.currentRotationY = 0;

    // Elements (may be null if DOM not ready yet)
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

    this.modelLoader = new ModelLoader();

    this.init();
  }

  init() {
    // Ensure we bind event listeners even if DOM elements are added later
    this.setupEventListeners();
    this.setupARComponents();

    // Robustly ensure toggle button bound (in case it was not present when constructor ran)
    this.ensureToggleBinding();
  }

  setupEventListeners() {
    // Close button
    if (this.closeARBtn) {
      this.closeARBtn.addEventListener('click', () => this.stopAR());
    }

    // Scale / rotate / reset (buttons may be null on some viewports)
    if (this.scaleUpBtn) this.scaleUpBtn.addEventListener('click', () => this.adjustScale(0.1));
    if (this.scaleDownBtn) this.scaleDownBtn.addEventListener('click', () => this.adjustScale(-0.1));
    if (this.rotateLeftBtn) this.rotateLeftBtn.addEventListener('click', () => this.adjustRotation(-45));
    if (this.rotateRightBtn) this.rotateRightBtn.addEventListener('click', () => this.adjustRotation(45));
    if (this.resetModelBtn) this.resetModelBtn.addEventListener('click', () => this.resetModel());

    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 500));
  }

  // Try to bind the toggle button now, and keep retrying for a short while if not found.
  ensureToggleBinding(retries = 10, delay = 200) {
    const tryBind = () => {
      this.toggleARButton = document.getElementById('toggleARButton');
      if (this.toggleARButton) {
        // remove any previous handler we might have added in an earlier attempt
        try { this.toggleARButton.removeEventListener('click', this._toggleHandler); } catch(e){}
        this._toggleHandler = () => this.toggleAR();
        this.toggleARButton.addEventListener('click', this._toggleHandler);
        this.toggleARButton.style.cursor = 'pointer';
        console.log('ARControls: toggleARButton bound.');
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
            console.warn('ARControls: toggleARButton not found after retries.');
          }
        }
      }, delay);
    }
  }

  setupARComponents() {
    const register = () => {
      if (typeof AFRAME === 'undefined') {
        console.warn('AFRAME not ready yet, retrying component registration...');
        setTimeout(register, 200);
        return;
      }
      // Register markerhandler component if not registered yet
      if (!AFRAME.components.markerhandler) {
        AFRAME.registerComponent('markerhandler', {
          init: function () {
            const markerEl = this.el;
            markerEl.addEventListener('markerFound', () => {
              console.log('Marker detected — showing furniture');
              const furniture = markerEl.querySelector('#furnitureModel');
              if (furniture) furniture.setAttribute('visible', 'true');
            });
            markerEl.addEventListener('markerLost', () => {
              console.log('Marker lost — hiding furniture');
              const furniture = markerEl.querySelector('#furnitureModel');
              if (furniture) furniture.setAttribute('visible', 'false');
            });
          }
        });
        console.log('ARControls: markerhandler registered.');
      } else {
        console.log('ARControls: markerhandler already registered.');
      }
    };

    register();
  }

  async checkCameraPermissions() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(t => t.stop());
        console.log('Camera permissions available');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Camera permissions not available:', e);
      this.modelLoader.showError('لا يمكن الوصول إلى الكاميرا. يرجى التأكد من الأذونات.');
      return false;
    }
  }

  async toggleAR() {
    if (this.isARActive) return this.stopAR();
    return this.startAR();
  }

  async startAR() {
    try {
      this.modelLoader.showLoading();
      this.logARRelatedScripts();

      if (!(await this.checkCameraPermissions())) {
        this.modelLoader.hideLoading();
        return;
      }

      if (this.arContainer) {
        this.arContainer.style.display = 'block';
        this.arContainer.classList.remove('hidden');
      }
      this.isARActive = true;
      this.updateToggleButton();

      await this.initializeARScene();

      try {
        const video = await this.waitForARVideo(20000);
        if (video) {
          video.style.position = 'absolute';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.zIndex = '0';
          console.log('AR video element styled and visible.');
        }
      } catch (err) {
        console.warn('Video element not found inside AR scene after wait:', err);
      }

      this.modelLoader.hideLoading();
      console.log('AR started and container shown.');
    } catch (error) {
      this.modelLoader.hideLoading();
      console.error('AR initialization error:', error);
      this.modelLoader.showError('فشل في تفعيل الواقع المعزز.');
    }
  }

  // ... (waitForARVideo, initializeARScene, stopAR, stopCameraStream, updateToggleButton, adjustScale, adjustRotation, resetModel, handleResize, logARRelatedScripts)
  waitForARVideo(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.arScene) return reject(new Error('AR scene not found'));
      const checkVideo = () => {
        const v = this.arScene.querySelector('video');
        if (v) return v;
        const anyVideo = document.querySelector('video');
        return anyVideo;
      };
      const found = checkVideo();
      if (found) return resolve(found);

      let resolved = false;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeName && node.nodeName.toLowerCase() === 'video') {
              resolved = true;
              observer.disconnect();
              resolve(node);
              return;
            }
            if (node.querySelector && node.querySelector('video')) {
              resolved = true;
              observer.disconnect();
              resolve(node.querySelector('video'));
              return;
            }
          }
        }
      });

      observer.observe(this.arScene, { childList: true, subtree: true });

      const interval = 300;
      let elapsed = 0;
      const poll = setInterval(() => {
        elapsed += interval;
        const v = checkVideo();
        if (v) {
          resolved = true;
          clearInterval(poll);
          observer.disconnect();
          return resolve(v);
        }
        if (elapsed >= timeout) {
          clearInterval(poll);
          observer.disconnect();
          if (!resolved) return reject(new Error('timeout waiting for video'));
        }
      }, interval);
    });
  }

  async initializeARScene() {
    return new Promise((resolve) => {
      const scene = this.arScene;
      if (!scene) return setTimeout(resolve, 1500);
      if (scene.hasLoaded) return resolve();
      scene.addEventListener('loaded', () => resolve());
      setTimeout(resolve, 3000);
    });
  }

  stopAR() {
    if (this.arContainer) {
      this.arContainer.style.display = 'none';
      this.arContainer.classList.add('hidden');
    }
    this.isARActive = false;
    this.updateToggleButton();
    this.stopCameraStream();
  }

  stopCameraStream() {
    try {
      const video = this.arScene && this.arScene.querySelector('video');
      if (video && video.srcObject && video.srcObject.getTracks) {
        video.srcObject.getTracks().forEach(t => { try { t.stop(); } catch(e){} });
        console.log('Camera stream stopped.');
      }
      document.querySelectorAll('video').forEach(v => {
        if (v && v.srcObject && v.srcObject.getTracks) {
          v.srcObject.getTracks().forEach(t => { try { t.stop(); } catch(e){} });
        }
      });
    } catch (err) {
      console.warn('Error stopping camera streams:', err);
    }
  }

  updateToggleButton() {
    const buttonText = this.toggleARButton && this.toggleARButton.querySelector('span');
    const buttonIcon = this.toggleARButton && this.toggleARButton.querySelector('i');
    if (!this.toggleARButton || !buttonText || !buttonIcon) return;
    if (this.isARActive) {
      buttonText.textContent = 'إيقاف الواقع المعزز'; buttonIcon.className = 'fas fa-stop mr-2';
      this.toggleARButton.classList.remove('bg-blue-600','hover:bg-blue-700'); this.toggleARButton.classList.add('bg-red-600','hover:bg-red-700');
    } else {
      buttonText.textContent = 'تفعيل الواقع المعزز'; buttonIcon.className = 'fas fa-camera mr-2';
      this.toggleARButton.classList.remove('bg-red-600','hover:bg-red-700'); this.toggleARButton.classList.add('bg-blue-600','hover:bg-blue-700');
    }
  }

  adjustScale(delta) { this.currentScale = Math.max(0.1, Math.min(2.0, this.currentScale + delta)); this.modelLoader.updateModelProperty('scale', `${this.currentScale} ${this.currentScale} ${this.currentScale}`); if(this.scaleValue) this.scaleValue.textContent = `${Math.round(this.currentScale*100)}%`; }
  adjustRotation(delta) { this.currentRotationY = (this.currentRotationY + delta) % 360; this.modelLoader.updateModelProperty('rotation', `0 ${this.currentRotationY} 0`); }
  resetModel() { this.currentScale = 1.0; this.currentRotationY = 0; this.modelLoader.resetModel(); if(this.scaleValue) this.scaleValue.textContent = '100%'; }

  handleResize() {
    if (this.isARActive && this.arScene) {
      try { if (this.arScene.renderer && this.arScene.renderer.setSize) this.arScene.renderer.setSize(window.innerWidth, window.innerHeight); } catch(e){}
    }
  }

  logARRelatedScripts() {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    console.log('Loaded scripts count:', scripts.length);
    scripts.filter(u => /aframe|ar\.js|arjs|three/i.test(u)).forEach(u => console.log('AR-related script:', u));
  }
}

// Initialize AR Controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => { window.arControls = new ARControls(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && window.arControls && window.arControls.isARActive) window.arControls.stopAR(); });