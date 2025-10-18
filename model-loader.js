/**
 * Model Loader Module - Markerless AR Version
 * Handles furniture models and selection for WebXR
 */

class ModelLoader {
  constructor() {
    // Furniture models with real and working 3D URLs (GLB format)
    this.models = {
      chair: {
        id: 'chair',
        name: 'كرسي 3D محلي',
        icon: 'fa-chair',
        color: '#3b82f6',
        url: './assets/products/chair.glb', // ← المسار المحلي
        scale: 0.6,
        description: 'كرسي ثلاثي الأبعاد من مجلد المشروع'
      },
      table: {
        id: 'table',
        name: 'طاولة طعام',
        icon: 'fa-table',
        color: '#10b981',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CoffeeCart/glTF-Binary/CoffeeCart.glb',
        scale: 0.4,
        description: 'طاولة طعام خشبية أنيقة'
      },
      sofa: {
        id: 'sofa',
        name: 'أريكة حديثة',
        icon: 'fa-couch',
        color: '#8b5cf6',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
        scale: 1.0,
        description: 'أريكة مريحة لغرفة المعيشة (نموذج افتراضي)'
      },
      bed: {
        id: 'bed',
        name: 'سرير مزدوج',
        icon: 'fa-bed',
        color: '#f59e0b',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
        scale: 0.8,
        description: 'سرير مريح لغرفة النوم (نموذج مبدئي)'
      },
      shelf: {
        id: 'shelf',
        name: 'رف كتب',
        icon: 'fa-book',
        color: '#06b6d4',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
        scale: 0.8,
        description: 'رف كتب أنيق لتخزين الكتب والديكور'
      },
      lamp: {
        id: 'lamp',
        name: 'مصباح أرضي',
        icon: 'fa-lightbulb',
        color: '#ec4899',
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
        scale: 0.6,
        description: 'مصباح أرضي أنيق للإضاءة الداخلية'
      }
    };

    this.selectedModels = new Set();
    this.init();
  }

  init() {
    console.log('📦 Model Loader initialized - Markerless AR');
    this.renderFurnitureGrid();
    this.attachEventListeners();
  }

  renderFurnitureGrid() {
    const grid = document.getElementById('furnitureGrid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(this.models).forEach(([id, model]) => {
      const card = this.createFurnitureCard(id, model);
      grid.appendChild(card);
    });
  }

  createFurnitureCard(id, model) {
    const card = document.createElement('div');
    card.className = 'furniture-card';
    card.dataset.modelId = id;

    card.innerHTML = `
      <div class="checkmark">
        <i class="fas fa-check"></i>
      </div>
      <div class="icon" style="color: ${model.color}">
        <i class="fas ${model.icon}"></i>
      </div>
      <div class="name">${model.name}</div>
      <div class="text-xs text-gray-500 mt-1">${model.description}</div>
    `;

    return card;
  }

  attachEventListeners() {
    document.getElementById('furnitureGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.furniture-card');
      if (!card) return;

      const modelId = card.dataset.modelId;
      this.toggleModelSelection(modelId, card);
    });
  }

  toggleModelSelection(modelId, card) {
    if (this.selectedModels.has(modelId)) {
      this.selectedModels.delete(modelId);
      card.classList.remove('selected');
    } else {
      this.selectedModels.clear();
      document.querySelectorAll('.furniture-card').forEach(c => {
        c.classList.remove('selected');
      });
      this.selectedModels.add(modelId);
      card.classList.add('selected');
    }

    this.updateSelectedCounter();
    this.notifySelectionChanged();
  }

  updateSelectedCounter() {
    const counter = document.getElementById('selectedCounter');
    const count = document.getElementById('selectedCount');
    
    if (!counter || !count) return;

    const selectedCount = this.selectedModels.size;
    
    if (selectedCount > 0) {
      counter.classList.remove('hidden');
      count.textContent = selectedCount;
    } else {
      counter.classList.add('hidden');
    }
  }

  notifySelectionChanged() {
    const event = new CustomEvent('furnitureSelectionChanged', {
      detail: {
        selectedModels: Array.from(this.selectedModels),
        models: this.models
      }
    });
    document.dispatchEvent(event);
  }

  getSelectedModels() {
    return Array.from(this.selectedModels).map(id => ({
      id,
      ...this.models[id]
    }));
  }

  getModel(id) {
    return this.models[id];
  }

  hasSelection() {
    return this.selectedModels.size > 0;
  }
}

// Initialize on DOM ready
let modelLoader;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    modelLoader = new ModelLoader();
  });
} else {
  modelLoader = new ModelLoader();
}
