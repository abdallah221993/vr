/**
 * AR Viewer Module - Markerless AR with Model Viewer
 * Handles AR activation and model controls without markers
 * FIXED: Model loading timeout issues
 */

class ARViewer {
  constructor() {
    this.modelViewer = null;
    this.currentModel = null;
    this.currentScale = 1.0;
    this.currentRotation = 0;
    this.isViewerActive = false;
    this.loadingTimeout = null;

    // DOM Elements
    this.startARButton = document.getElementById('startARButton');
    this.arViewerContainer = document.getElementById('arViewerContainer');
    this.closeViewerBtn = document.getElementById('closeViewer');
    this.scaleUpBtn = document.getElementById('scaleUp');
    this.scaleDownBtn = document.getElementById('scaleDown');
    this.rotateLeftBtn = document.getElementById('rotateLeft');
    this.rotateRightBtn = document.getElementById('rotateRight');
    this.resetModelBtn = document.getElementById('resetModel');
    this.scaleValue = document.getElementById('scaleValue');
    this.currentModelName = document.getElementById('currentModelName');

    this.init();
  }

  init() {
    console.log('📱 AR Viewer initialized - Markerless AR (FIXED)');
    this.attachEventListeners();
    
    // Wait for model-viewer to be defined before checking AR support
    if (customElements.get('model-viewer')) {
      this.checkARSupport();
    } else {
      customElements.whenDefined('model-viewer').then(() => {
        this.checkARSupport();
      });
    }
  }

  attachEventListeners() {
    // Start AR button
    this.startARButton?.addEventListener('click', () => this.handleStartAR());

    // Close viewer
    this.closeViewerBtn?.addEventListener('click', () => this.closeViewer());

    // Scale controls
    this.scaleUpBtn?.addEventListener('click', () => this.adjustScale(0.1));
    this.scaleDownBtn?.addEventListener('click', () => this.adjustScale(-0.1));

    // Rotation controls
    this.rotateLeftBtn?.addEventListener('click', () => this.rotate(-30));
    this.rotateRightBtn?.addEventListener('click', () => this.rotate(30));

    // Reset button
    this.resetModelBtn?.addEventListener('click', () => this.resetModel());

    // Listen for furniture selection changes
    document.addEventListener('furnitureSelectionChanged', (e) => {
      this.onSelectionChanged(e.detail);
    });
  }

  async checkARSupport() {
    const viewer = document.getElementById('arViewer');
    if (!viewer) {
      console.warn('⚠️ Model viewer element not found');
      return;
    }

    this.modelViewer = viewer;

    try {
      // Check if AR is supported
      const arSupported = await this.modelViewer.canActivateAR;
      console.log('🔍 AR Support:', arSupported ? 'Yes ✅' : 'No ❌');
      
      if (!arSupported) {
        this.showARNotSupported();
      }
    } catch (error) {
      console.warn('⚠️ Could not check AR support:', error);
    }
  }

  showARNotSupported() {
    const message = `
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-4" role="alert">
        <div class="flex items-center gap-3">
          <i class="fas fa-exclamation-triangle text-2xl"></i>
          <div>
            <p class="font-bold">الواقع المعزز غير مدعوم</p>
            <p class="text-sm">متصفحك لا يدعم WebXR. جرب Chrome على Android أو Safari على iOS.</p>
          </div>
        </div>
      </div>
    `;
    
    this.startARButton?.insertAdjacentHTML('beforebegin', message);
  }

  onSelectionChanged(detail) {
    const { selectedModels, models } = detail;
    
    if (selectedModels.length > 0) {
      const modelId = selectedModels[0];
      this.currentModel = models[modelId];
      console.log('✅ Model selected:', this.currentModel.name);
    } else {
      this.currentModel = null;
      console.log('❌ No model selected');
    }
  }

  async handleStartAR() {
    if (!this.currentModel) {
      this.showMessage('⚠️ الرجاء اختيار قطعة أثاث أولاً', 'warning');
      return;
    }

    if (!this.modelViewer) {
      this.showMessage('❌ عارض النماذج غير جاهز. الرجاء إعادة تحميل الصفحة', 'error');
      return;
    }

    try {
      this.showMessage('⏳ جاري تحميل النموذج...', 'info');
      await this.loadModel(this.currentModel);
      this.showViewer();
      this.showMessage('✅ جاهز! يمكنك الآن عرض الأثاث في الواقع المعزز', 'success');
    } catch (error) {
      console.error('❌ Error loading model:', error);
      this.showMessage('❌ حدث خطأ في تحميل النموذج: ' + error.message, 'error', 5000);
    }
  }

  async loadModel(model) {
    if (!this.modelViewer) {
      throw new Error('Model viewer not initialized');
    }

    console.log('🔄 Loading model:', model.name, 'from', model.url);

    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    // Set the model source FIRST
    this.modelViewer.src = model.url;
    
    // Set initial scale
    this.currentScale = model.scale || 1.0;
    this.modelViewer.scale = `${this.currentScale} ${this.currentScale} ${this.currentScale}`;
    
    // Update UI
    this.currentModelName.textContent = model.name;
    this.updateScaleDisplay();

    // Set AR properties
    this.modelViewer.setAttribute('ar', '');
    this.modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    this.modelViewer.setAttribute('camera-controls', '');
    this.modelViewer.setAttribute('touch-action', 'pan-y');
    this.modelViewer.setAttribute('shadow-intensity', '1');
    this.modelViewer.setAttribute('auto-rotate', '');
    this.modelViewer.setAttribute('loading', 'eager');

    // iOS Quick Look support
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      this.modelViewer.setAttribute('ios-src', model.url);
    }

    // Wait for model to load with BETTER timeout handling
    return new Promise((resolve, reject) => {
      let loadCompleted = false;

      // Longer timeout - 30 seconds
      this.loadingTimeout = setTimeout(() => {
        if (!loadCompleted) {
          console.error('❌ Model load timeout after 30s');
          reject(new Error('تحميل النموذج استغرق وقتاً طويلاً. تحقق من اتصال الإنترنت'));
        }
      }, 30000);
      
      const onLoad = () => {
        loadCompleted = true;
        clearTimeout(this.loadingTimeout);
        console.log('✅ Model loaded successfully:', model.name);
        cleanup();
        resolve();
      };

      const onError = (e) => {
        loadCompleted = true;
        clearTimeout(this.loadingTimeout);
        console.error('❌ Model load error:', e);
        cleanup();
        reject(new Error('فشل تحميل النموذج. الملف قد يكون تالفاً أو غير متاح'));
      };

      const cleanup = () => {
        this.modelViewer.removeEventListener('load', onLoad);
        this.modelViewer.removeEventListener('error', onError);
      };

      this.modelViewer.addEventListener('load', onLoad, { once: true });
      this.modelViewer.addEventListener('error', onError, { once: true });

      // IMPORTANT: Force loading by checking if already loaded
      // This handles cases where the model loads before listeners are attached
      setTimeout(() => {
        if (this.modelViewer.loaded && !loadCompleted) {
          console.log('✅ Model was already loaded');
          onLoad();
        }
      }, 100);
    });
  }

  showViewer() {
    this.arViewerContainer?.classList.remove('hidden');
    this.arViewerContainer?.classList.add('fade-in');
    this.isViewerActive = true;

    // Scroll to viewer
    setTimeout(() => {
      this.arViewerContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  closeViewer() {
    this.arViewerContainer?.classList.add('hidden');
    this.isViewerActive = false;
    this.resetModel();
  }

  adjustScale(delta) {
    if (!this.modelViewer) return;

    this.currentScale = Math.max(0.1, Math.min(3.0, this.currentScale + delta));
    this.modelViewer.scale = `${this.currentScale} ${this.currentScale} ${this.currentScale}`;
    this.updateScaleDisplay();

    // Visual feedback
    this.showMessage(`📏 الحجم: ${Math.round(this.currentScale * 100)}%`, 'info', 1000);
  }

  rotate(degrees) {
    if (!this.modelViewer) return;

    this.currentRotation += degrees;
    
    // Get current camera orbit
    try {
      const orbit = this.modelViewer.getCameraOrbit();
      orbit.theta += degrees * Math.PI / 180;
      this.modelViewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`;

      // Visual feedback
      this.showMessage(`🔄 تم الدوران ${degrees > 0 ? 'يميناً' : 'يساراً'}`, 'info', 1000);
    } catch (error) {
      console.warn('Could not rotate:', error);
    }
  }

  resetModel() {
    if (!this.modelViewer || !this.currentModel) return;

    this.currentScale = this.currentModel.scale || 1.0;
    this.currentRotation = 0;

    this.modelViewer.scale = `${this.currentScale} ${this.currentScale} ${this.currentScale}`;
    
    try {
      this.modelViewer.resetTurntableRotation();
      this.modelViewer.cameraOrbit = 'auto auto auto';
    } catch (error) {
      console.warn('Could not reset camera:', error);
    }
    
    this.updateScaleDisplay();
    this.showMessage('↺ تم إعادة التعيين', 'success', 1500);
  }

  updateScaleDisplay() {
    if (this.scaleValue) {
      this.scaleValue.textContent = `${Math.round(this.currentScale * 100)}%`;
    }
  }

  showMessage(text, type = 'info', duration = 3000) {
    // Remove existing messages
    const existing = document.querySelectorAll('.toast-message');
    existing.forEach(el => el.remove());

    // Create message element
    const colors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    const message = document.createElement('div');
    message.className = `toast-message fixed top-20 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
    message.style.maxWidth = '90%';
    message.style.textAlign = 'center';
    message.textContent = text;

    document.body.appendChild(message);

    // Auto remove
    setTimeout(() => {
      message.style.opacity = '0';
      message.style.transition = 'opacity 0.3s';
      setTimeout(() => message.remove(), 300);
    }, duration);
  }
}

// Initialize on DOM ready
let arViewer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    arViewer = new ARViewer();
  });
} else {
  arViewer = new ARViewer();
}
