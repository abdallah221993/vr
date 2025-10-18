/**
 * Model Loader Module
 * Handles loading and management of 3D furniture models
 */

class ModelLoader {
    constructor() {
        this.models = {
            chair: {
                name: 'كرسي مكتب',
                assetId: '#chairModel', // استخدم assetId أولاً (يمكنك رفع النموذج محلياً لاحقاً)
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
                scale: { x: 0.3, y: 0.3, z: 0.3 },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            },
            table: {
                name: 'طاولة طعام',
                assetId: '#tableModel',
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf',
                scale: { x: 0.5, y: 0.5, z: 0.5 },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            },
            sofa: {
                name: 'أريكة مريحة',
                assetId: '#sofaModel',
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf',
                scale: { x: 0.4, y: 0.4, z: 0.4 },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            }
        };
        
        this.currentModel = 'chair';
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.init();
    }

    init() {
        this.setupFurnitureSelection();
        this.setupErrorHandling();

        // Attach debug listeners to furniture entity (in case it's present early)
        document.addEventListener('DOMContentLoaded', () => {
            const furnitureEntity = document.getElementById('furnitureModel');
            if (furnitureEntity) {
                furnitureEntity.addEventListener('model-loaded', (e) => {
                    console.log('Debug: furnitureModel model-loaded', e);
                });
                furnitureEntity.addEventListener('model-error', (err) => {
                    console.error('Debug: furnitureModel model-error', err);
                });
            }
        });
    }

    setupFurnitureSelection() {
        const furnitureButtons = document.querySelectorAll('.furniture-btn');
        
        furnitureButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                furnitureButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Get selected model
                const modelType = button.dataset.model;
                this.switchModel(modelType);
            });
        });
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
        if (this.loadingOverlay) this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.add('hidden');
    }

    showError(message) {
        if (this.errorMessage) this.errorMessage.textContent = message;
        if (this.errorModal) this.errorModal.classList.remove('hidden');
    }

    hideError() {
        if (this.errorModal) this.errorModal.classList.add('hidden');
    }

    async switchModel(modelType) {
        if (!this.models[modelType]) {
            this.showError('النموذج المطلوب غير متوفر');
            return;
        }

        this.currentModel = modelType;
        const model = this.models[modelType];
        
        try {
            this.showLoading();
            await this.loadModel(model);
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('فشل في تحميل النموذج. يرجى المحاولة مرة أخرى.');
            console.error('Model loading error:', error);
        }
    }

    async loadModel(model) {
        return new Promise((resolve, reject) => {
            const furnitureEntity = document.getElementById('furnitureModel');
            
            if (!furnitureEntity) {
                reject(new Error('Furniture entity not found'));
                return;
            }

            // Hide entity until model loaded
            furnitureEntity.setAttribute('visible', 'false');

            // Remove existing model attribute (if any)
            furnitureEntity.removeAttribute('gltf-model');

            // Prefer using assetId (a-asset-item) to avoid CORS; fallback to URL
            if (model.assetId) {
                furnitureEntity.setAttribute('gltf-model', model.assetId);
            } else if (model.url) {
                furnitureEntity.setAttribute('gltf-model', `url(${model.url})`);
            }

            // Apply transform attributes immediately
            furnitureEntity.setAttribute('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
            furnitureEntity.setAttribute('scale', `${model.scale.x} ${model.scale.y} ${model.scale.z}`);
            furnitureEntity.setAttribute('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);

            // Wait for model to load
            const onModelLoaded = (e) => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                console.log('Model loaded:', model.name, e);
                // Show model when ready
                furnitureEntity.setAttribute('visible', 'true');
                resolve();
            };

            const onModelError = (error) => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                console.error('Model error:', model.name, error);
                // Show user-friendly error
                this.showError('فشل في تحميل ملف النموذج (راجع Console لمزيد من التفاصيل).');
                reject(error);
            };

            furnitureEntity.addEventListener('model-loaded', onModelLoaded);
            furnitureEntity.addEventListener('model-error', onModelError);

            // Fallback timeout: if model doesn't emit events, resolve after timeout but keep entity visible = false
            const fallback = setTimeout(() => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                console.warn('Model load timeout, showing entity for debugging');
                // Optionally show it (commented out by default)
                // furnitureEntity.setAttribute('visible', 'true');
                resolve();
            }, 15000);
        });
    }

    getCurrentModel() {
        return this.models[this.currentModel];
    }

    updateModelProperty(property, value) {
        const furnitureEntity = document.getElementById('furnitureModel');
        if (furnitureEntity) {
            furnitureEntity.setAttribute(property, value);
        }
    }

    resetModel() {
        const model = this.getCurrentModel();
        this.updateModelProperty('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
        this.updateModelProperty('scale', `${model.scale.x} ${model.scale.y} ${model.scale.z}`);
        this.updateModelProperty('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);
    }
}

// Export for use in other modules
window.ModelLoader = ModelLoader;