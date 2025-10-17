/**
 * AR Controls Module (updated)
 * Ensures proper ordering and checks for video element after AR initialization
 */

class ARControls {
  constructor() {
    this.isARActive = false;
    this.currentScale = 1.0;
    this.currentRotationY = 0;

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
    this.setupEventListeners();
    this.setupARComponents();
    // don't request camera until user clicks toggle
  }

  setupEventListeners() {
    if (this.toggleARButton) {
      this.toggleARButton.addEventListener('click', () => this.toggleAR());
    }
    if (this.closeARBtn) {
      this.closeARBtn.addEventListener('click', () => this.stopAR());
    }
    if (this.scaleUpBtn) this.scaleUpBtn.addEventListener('click', () => this.adjustScale(0.1));
    if (this.scaleDownBtn) this.scaleDownBtn.addEventListener('click', () => this.adjustScale(-0.1));
    if (this.rotateLeftBtn) this.rotateLeftBtn.addEventListener('click', () => this.adjustRotation(-45));
    if (this.rotateRightBtn) this.rotateRightBtn.addEventListener('click', () => this.adjustRotation(45));
    if (this.resetModelBtn) this.resetModelBtn.addEventListener('click', () => this.resetModel());

    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 500));
  }

  setupARComponents() {
    if (typeof AFRAME !== 'undefined') {
      AFRAME.registerComponent('markerhandler', {
        init: function () {
          this.el.addEventListener('markerFound', () => { console.log('Marker detected'); this.el.setAttribute('visible', true); });
          this.el.addEventListener('markerLost', () => { console.log('Marker lost'); this.el.setAttribute('visible', false); });
        }
      });
      // touch-controls kept as before (if present)
    }
  }

  async checkCameraPermissions() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(t => t.stop());
        console.log('Camera permissions available');
        return true;
      }
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

      if (!(await this.checkCameraPermissions())) {
        this.modelLoader.hideLoading();
        return;
      }

      // show container reliably
      if (this.arContainer) {
        this.arContainer.style.display = 'block';
        this.arContainer.classList.remove('hidden');
      }
      this.isARActive = true;
      this.updateToggleButton();

      // wait for scene
      await this.initializeARScene();

      // Give AR.js time to attach stream & create <video>
      setTimeout(() => {
        const video = this.arScene && this.arScene.querySelector('video');
        if (video) {
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
      }, 900);

      this.modelLoader.hideLoading();
      console.log('AR started and container shown.');
    } catch (error) {
      this.modelLoader.hideLoading();
      console.error('AR initialization error:', error);
      try { alert('حدث خطأ في تشغيل الكاميرا: ' + (error.message || error)); } catch(e){}

      if (error.name === 'NotAllowedError') {
        this.modelLoader.showError('تم رفض الوصول إلى الكاميرا.');
      } else if (error.name === 'NotFoundError') {
        this.modelLoader.showError('لم يتم العثور على كاميرا.');
      } else {
        this.modelLoader.showError('فشل في تفعيل الواقع المعزز.');
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
    this.stopCameraStream();
  }

  stopCameraStream() {
    try {
      const video = this.arScene && this.arScene.querySelector('video');
      if (video && video.srcObject && video.srcObject.getTracks) {
        video.srcObject.getTracks().forEach(t => { try { t.stop(); } catch(e){} });
        console.log('Camera stream stopped.');
      }
      // also attempt to stop any other video srcObjects
      document.querySelectorAll('video').forEach(v => {
        if (v && v.srcObject && v.srcObject.getTracks) {
          v.srcObject.getTracks().forEach(t => { try { t.stop(); } catch(e){} });
        }
      });
    } catch (err) {
      console.warn('Error stopping camera streams:', err);
    }
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
}

document.addEventListener('DOMContentLoaded', () => { window.arControls = new ARControls(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && window.arControls && window.arControls.isARActive) window.arControls.stopAR(); });