/**
 * Model Loader Module
 * Handles loading and management of multiple 3D furniture models
 */

class ModelLoader {
  constructor() {
    this.models = {
      chair: {
        name: 'كرسي مكتب',
        icon: 'fa-chair',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      table: {
        name: 'طاولة طعام',
        icon: 'fa-table',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf',
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      sofa: {
        name: 'أريكة مريحة',
        icon: 'fa-couch',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf',
        scale: { x: 0.4, y: 0.4, z: 0.4 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      bed: {
        name: 'سرير',
        icon: 'fa-bed',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf',
        scale: { x: 0.6, y: 0.6, z: 0.6 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      shelf: {
        name: 'رف كتب',
        icon: 'fa-book',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      lamp: {
        name: 'مصباح أرضي',
        icon: 'fa-lightbulb',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF/Lantern.gltf',
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      }
    };
    
    this.selectedModels = []; // Array to store selected models
    this.currentActiveModel = null;
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.errorModal = document.getElementById('errorModal');
    this.errorMessage = document.getElementById('errorMessage');
    
    this.init();
  }

  init() {
    this.renderFurnitureGrid();
    this.setupErrorHandling();
    this.setupSelectionHandlers();
    
    // Setup AFRAME component for marker detection
    if (typeof AFRAME !== 'undefined') {
      this.setupARComponents();
    } else {
      setTimeout(() => this.setupARComponents(), 1000);
    }
  }

  setupARComponents() {
    if (typeof AFRAME === 'undefined') return;
    
    // Register markerhandler component if not already registered
    if (!AFRAME.components.markerhandler) {
      AFRAME.registerComponent('markerhandler', {
        init: function () {
          const markerEl = this.el;
          
          markerEl.addEventListener('markerFound', () => {
            console.log('✅ Marker detected - showing all furniture models');
            const models = markerEl.querySelectorAll('[data-furniture-model]');
            models.forEach(model => {
              model.setAttribute('visible', 'true');
            });
          });
          
          markerEl.addEventListener('markerLost', () => {
            console.log('❌ Marker lost - hiding all furniture models');
            const models = markerEl.querySelectorAll('[data-furniture-model]');
            models.forEach(model => {
              model.setAttribute('visible', 'false');
            });
          });
        }
      });
      console.log('✅ Markerhandler component registered');
    }
  }

  renderFurnitureGrid() {
    const grid = document.getElementById('furnitureGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    Object.keys(this.models).forEach(modelKey => {
      const model = this.models[modelKey];
      const button = document.createElement('button');
      button.className = 'furniture-btn';
      button.dataset.model = modelKey;
      button.innerHTML = `
        <i class="fas ${model.icon} text-3xl md:text-4xl mb-2"></i>
        <span class="text-sm md:text-base font-semibold">${model.name}</span>
      `;
      
      button.addEventListener('click', () => this.toggleModelSelection(modelKey));
      grid.appendChild(button);
    });
  }

  toggleModelSelection(modelKey) {
    const model = this.models[modelKey];
    if (!model) return;
    
    const index = this.selectedModels.findIndex(m => m.key === modelKey);
    
    if (index > -1) {
      // Remove from selection
      this.selectedModels.splice(index, 1);
    } else {
      // Add to selection
      this.selectedModels.push({
        key: modelKey,
        ...model
      });
    }
    
    this.updateSelectionUI();
    this.updateSelectedItemsDisplay();
  }

  updateSelectionUI() {
    // Update furniture grid buttons
    const buttons = document.querySelectorAll('.furniture-btn');
    buttons.forEach(btn => {
      const modelKey = btn.dataset.model;
      const isSelected = this.selectedModels.some(m => m.key === modelKey);
      
      if (isSelected) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateSelectedItemsDisplay() {
    const section = document.getElementById('selectedItemsSection');
    const list = document.getElementById('selectedItemsList');
    const count = document.getElementById('selectedCount');
    
    if (!section || !list || !count) return;
    
    // Show/hide section based on selection
    if (this.selectedModels.length > 0) {
      section.style.display = 'block';
      count.textContent = this.selectedModels.length;
    } else {
      section.style.display = 'none';
      return;
    }
    
    // Render selected items
    list.innerHTML = '';
    this.selectedModels.forEach((model, index) => {
      const item = document.createElement('div');
      item.className = 'bg-green-50 border-2 border-green-500 rounded-lg p-3 flex flex-col items-center justify-center relative';
      item.innerHTML = `
        <button class="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs" 
                data-remove="${model.key}">
          <i class="fas fa-times"></i>
        </button>
        <i class="fas ${model.icon} text-2xl text-green-600 mb-2"></i>
        <span class="text-sm font-semibold text-gray-800">${model.name}</span>
      `;
      
      const removeBtn = item.querySelector('[data-remove]');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModelSelection(model.key);
      });
      
      list.appendChild(item);
    });
  }

  setupSelectionHandlers() {
    const clearBtn = document.getElementById('clearSelection');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectedModels = [];
        this.updateSelectionUI();
        this.updateSelectedItemsDisplay();
      });
    }
  }

  setupErrorHandling() {
    const closeErrorBtn = document.getElementById('closeError');
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener('click', () => {
        this.hideError();
      });
    }
  }

  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }
    if (this.errorModal) {
      this.errorModal.classList.remove('hidden');
    }
  }

  hideError() {
    if (this.errorModal) {
      this.errorModal.classList.add('hidden');
    }
  }

  // Load all selected models into AR scene
  async loadSelectedModelsToAR() {
    const markerContainer = document.getElementById('markerContainer');
    if (!markerContainer) {
      this.showError('لم يتم العثور على حاوية AR');
      return;
    }

    if (this.selectedModels.length === 0) {
      this.showError('الرجاء اختيار قطعة أثاث واحدة على الأقل');
      return;
    }

    try {
      this.showLoading();
      
      // Clear existing models
      const existingModels = markerContainer.querySelectorAll('[data-furniture-model]');
      existingModels.forEach(model => model.remove());

      // Load all selected models
      const spacing = 1; // Distance between models
      const modelsPerRow = 3; // Number of models per row
      
      for (let i = 0; i < this.selectedModels.length; i++) {
        const model = this.selectedModels[i];
        const row = Math.floor(i / modelsPerRow);
        const col = i % modelsPerRow;
        
        // Calculate position with spacing
        const xPos = (col - Math.floor(modelsPerRow / 2)) * spacing;
        const zPos = row * spacing;
        
        await this.createModelEntity(model, markerContainer, {
          x: xPos,
          y: model.position.y,
          z: zPos
        }, i);
      }
      
      this.hideLoading();
      console.log(`✅ Loaded ${this.selectedModels.length} models to AR scene`);
      
    } catch (error) {
      this.hideLoading();
      console.error('❌ Error loading models:', error);
      this.showError('فشل في تحميل النماذج. يرجى المحاولة مرة أخرى.');
    }
  }

  createModelEntity(model, container, position, index) {
    return new Promise((resolve, reject) => {
      const entity = document.createElement('a-entity');
      entity.setAttribute('data-furniture-model', model.key);
      entity.setAttribute('data-model-index', index);
      entity.setAttribute('gltf-model', `url(${model.url})`);
      entity.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
      entity.setAttribute('scale', `${model.scale.x} ${model.scale.y} ${model.scale.z}`);
      entity.setAttribute('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);
      entity.setAttribute('visible', 'false'); // Will be shown when marker is detected
      
      // Add gesture handling for touch interactions
      entity.setAttribute('gesture-handler', '');
      
      // Listen for model load events
      entity.addEventListener('model-loaded', () => {
        console.log(`✅ Model loaded: ${model.name} (${index})`);
        resolve();
      });
      
      entity.addEventListener('model-error', (error) => {
        console.error(`❌ Model error: ${model.name} (${index})`, error);
        reject(error);
      });
      
      container.appendChild(entity);
      
      // Fallback timeout
      setTimeout(() => {
        console.warn(`⚠️ Model load timeout: ${model.name} (${index})`);
        resolve();
      }, 10000);
    });
  }

  // Add a new instance of the currently active model
  addModelInstance() {
    if (this.selectedModels.length === 0) {
      this.showError('الرجاء اختيار قطعة أثاث أولاً');
      return;
    }
    
    // Get the last selected model
    const lastModel = this.selectedModels[this.selectedModels.length - 1];
    
    // Add another instance of the same model
    this.selectedModels.push({
      ...lastModel,
      key: `${lastModel.key}_${Date.now()}`
    });
    
    // Reload models in AR
    this.loadSelectedModelsToAR();
  }

  // Remove the last added model
  removeLastModel() {
    if (this.selectedModels.length === 0) {
      this.showError('لا توجد نماذج للحذف');
      return;
    }
    
    this.selectedModels.pop();
    this.updateSelectedItemsDisplay();
    this.loadSelectedModelsToAR();
  }

  updateModelProperty(property, value, modelIndex = null) {
    const markerContainer = document.getElementById('markerContainer');
    if (!markerContainer) return;
    
    if (modelIndex !== null) {
      // Update specific model
      const model = markerContainer.querySelector(`[data-model-index="${modelIndex}"]`);
      if (model) {
        model.setAttribute(property, value);
      }
    } else {
      // Update all models
      const models = markerContainer.querySelectorAll('[data-furniture-model]');
      models.forEach(model => {
        model.setAttribute(property, value);
      });
    }
  }

  resetModels() {
    const markerContainer = document.getElementById('markerContainer');
    if (!markerContainer) return;
    
    const models = markerContainer.querySelectorAll('[data-furniture-model]');
    models.forEach((modelEl, index) => {
      const modelKey = modelEl.getAttribute('data-furniture-model');
      const model = this.selectedModels.find(m => m.key === modelKey);
      
      if (model) {
        modelEl.setAttribute('scale', `${model.scale.x} ${model.scale.y} ${model.scale.z}`);
        modelEl.setAttribute('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);
      }
    });
  }

  getSelectedModels() {
    return this.selectedModels;
  }
}

// Export for use in other modules
window.ModelLoader = ModelLoader;
