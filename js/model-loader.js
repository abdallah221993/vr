/**
 * Model Loader Module
 * Handles loading and management of 3D furniture models
 */

class ModelLoader {
    constructor() {
        this.models = {
            chair: {
                name: 'كرسي مكتب',
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
                scale: { x: 0.3, y: 0.3, z: 0.3 },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            },
            table: {
                name: 'طاولة طعام',
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf',
                scale: { x: 0.5, y: 0.5, z: 0.5 },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            },
            sofa: {
                name: 'أريكة مريحة',
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
        closeErrorBtn.addEventListener('click', () => {
            this.hideError();
        });
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.remove('hidden');
    }

    hideError() {
        this.errorModal.classList.add('hidden');
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

            // Remove existing model
            furnitureEntity.removeAttribute('gltf-model');
            
            // Set new model properties
            furnitureEntity.setAttribute('gltf-model', `url(${model.url})`);
            furnitureEntity.setAttribute('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
            furnitureEntity.setAttribute('scale', `${model.scale.x} ${model.scale.y} ${model.scale.z}`);
            furnitureEntity.setAttribute('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);

            // Wait for model to load
            const onModelLoaded = () => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                resolve();
            };

            const onModelError = (error) => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                reject(error);
            };

            furnitureEntity.addEventListener('model-loaded', onModelLoaded);
            furnitureEntity.addEventListener('model-error', onModelError);

            // Fallback timeout
            setTimeout(() => {
                furnitureEntity.removeEventListener('model-loaded', onModelLoaded);
                furnitureEntity.removeEventListener('model-error', onModelError);
                resolve(); // Resolve anyway to prevent hanging
            }, 10000);
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
