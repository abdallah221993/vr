/**
 * Image Manager Module
 * Handles image upload, processing and management for AR furniture visualization
 */

class ImageManager {
    constructor() {
        this.uploadedImages = [];
        this.currentImageIndex = 0;
        this.maxImages = 20;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        this.initImageUpload();
        this.loadStoredImages();
    }

    initImageUpload() {
        const uploadInput = document.getElementById('imageUpload');
        const uploadContainer = document.getElementById('uploadedImages');

        if (!uploadInput || !uploadContainer) {
            console.warn('Image upload elements not found');
            return;
        }

        uploadInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });

        // Drag and drop support
        const dropZone = uploadInput.parentElement;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#3B82F6';
            dropZone.style.backgroundColor = '#EBF8FF';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#D1D5DB';
            dropZone.style.backgroundColor = 'transparent';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#D1D5DB';
            dropZone.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            this.handleImageUpload(files);
        });
    }

    async handleImageUpload(files) {
        if (files.length === 0) return;

        const validFiles = Array.from(files).filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showNotification('لم يتم اختيار ملفات صالحة', 'error');
            return;
        }

        if (this.uploadedImages.length + validFiles.length > this.maxImages) {
            this.showNotification(`يمكن رفع ${this.maxImages} صورة كحد أقصى`, 'error');
            return;
        }

        this.showLoadingOverlay('جاري رفع الصور...');

        try {
            for (const file of validFiles) {
                await this.processImage(file);
            }
            
            this.updateImageGrid();
            this.saveImagesToStorage();
            this.showNotification(`تم رفع ${validFiles.length} صورة بنجاح`);
            
        } catch (error) {
            console.error('Error uploading images:', error);
            this.showNotification('حدث خطأ أثناء رفع الصور', 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    validateFile(file) {
        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            this.showNotification(`نوع الملف غير مدعوم: ${file.name}`, 'error');
            return false;
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            this.showNotification(`حجم الملف كبير جداً: ${file.name}`, 'error');
            return false;
        }

        return true;
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Create optimized version
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate optimal size (max 800px width/height)
                    const maxSize = 800;
                    let { width, height } = img;
                    
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // Create image object
                    const imageObj = {
                        id: this.generateId(),
                        name: file.name,
                        originalSize: file.size,
                        optimizedSize: optimizedDataUrl.length,
                        dataUrl: optimizedDataUrl,
                        uploadDate: new Date().toISOString(),
                        width: width,
                        height: height
                    };
                    
                    this.uploadedImages.push(imageObj);
                    resolve(imageObj);
                };
                
                img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            reader.readAsDataURL(file);
        });
    }

    updateImageGrid() {
        const container = document.getElementById('uploadedImages');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.uploadedImages.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        this.uploadedImages.forEach((image, index) => {
            const imageElement = this.createImageElement(image, index);
            container.appendChild(imageElement);
        });
    }

    createImageElement(image, index) {
        const div = document.createElement('div');
        div.className = 'uploaded-image';
        div.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}" loading="lazy">
            <button class="remove-btn" onclick="window.imageManager.removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
            <button class="use-btn" onclick="window.imageManager.useImageForAR(${index})">
                استخدم في AR
            </button>
            <div class="image-info">
                <span class="sr-only">${image.name}</span>
            </div>
        `;

        // Add click handler for preview
        div.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.previewImage(image);
            }
        });

        return div;
    }

    removeImage(index) {
        if (index >= 0 && index < this.uploadedImages.length) {
            this.uploadedImages.splice(index, 1);
            this.updateImageGrid();
            this.saveImagesToStorage();
            this.showNotification('تم حذف الصورة');
        }
    }

    useImageForAR(index) {
        if (index >= 0 && index < this.uploadedImages.length) {
            const image = this.uploadedImages[index];
            
            // Add custom furniture item to the grid
            this.addCustomFurnitureItem(image);
            this.showNotification('تم إضافة الصورة إلى قائمة الأثاث');
            
            // Vibrate on mobile
            if (window.mobileFeatures) {
                window.mobileFeatures.vibrate([50]);
            }
        }
    }

    addCustomFurnitureItem(image) {
        const furnitureGrid = document.getElementById('furnitureGrid');
        if (!furnitureGrid) return;

        // Check if already exists
        const existingBtn = furnitureGrid.querySelector(`[data-custom-id="${image.id}"]`);
        if (existingBtn) {
            // Update existing button
            const img = existingBtn.querySelector('img');
            if (img) {
                img.src = image.dataUrl;
            }
            return;
        }

        // Create new furniture button
        const button = document.createElement('button');
        button.className = 'furniture-btn';
        button.setAttribute('data-model', 'custom');
        button.setAttribute('data-name', image.name);
        button.setAttribute('data-custom-id', image.id);
        button.innerHTML = `
            <div class="w-8 h-8 md:w-12 md:h-12 mb-2 rounded overflow-hidden">
                <img src="${image.dataUrl}" alt="${image.name}" class="w-full h-full object-cover">
            </div>
            <span class="text-xs md:text-sm">${this.truncateName(image.name)}</span>
        `;

        // Add click handler
        button.addEventListener('click', () => {
            // Remove active class from other buttons
            furnitureGrid.querySelectorAll('.furniture-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to this button
            button.classList.add('active');
            
            // Use image in AR scene
            this.setupCustomModel(image);
        });

        furnitureGrid.appendChild(button);
    }

    setupCustomModel(image) {
        // Create a plane geometry with the image as texture
        const scene = document.getElementById('ar-scene');
        if (!scene) return;

        // Remove existing custom model
        const existingCustom = scene.querySelector('#customModel');
        if (existingCustom) {
            existingCustom.remove();
        }

        // Create new model
        const model = document.createElement('a-plane');
        model.id = 'customModel';
        model.setAttribute('src', image.dataUrl);
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('rotation', '-90 0 0');
        
        // Calculate scale based on image aspect ratio
        const aspectRatio = image.width / image.height;
        const scale = aspectRatio > 1 ? `${aspectRatio} 1 1` : `1 ${1/aspectRatio} 1`;
        model.setAttribute('scale', scale);
        
        model.setAttribute('material', 'transparent: true; alphaTest: 0.1');
        model.className = 'clickable';

        // Add to marker
        const marker = scene.querySelector('#marker');
        if (marker) {
            // Hide default furniture model
            const furnitureModel = marker.querySelector('#furnitureModel');
            if (furnitureModel) {
                furnitureModel.setAttribute('visible', false);
            }
            
            marker.appendChild(model);
        }
    }

    previewImage(image) {
        // Create modal for image preview
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="relative max-w-full max-h-full">
                <img src="${image.dataUrl}" alt="${image.name}" class="max-w-full max-h-full object-contain">
                <button class="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded">
                    <p class="font-semibold">${image.name}</p>
                    <p class="text-sm opacity-80">${image.width} × ${image.height} بكسل</p>
                    <p class="text-sm opacity-80">تم الرفع: ${new Date(image.uploadDate).toLocaleDateString('ar')}</p>
                </div>
            </div>
        `;

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    saveImagesToStorage() {
        try {
            localStorage.setItem('ar_furniture_images', JSON.stringify(this.uploadedImages));
        } catch (error) {
            console.warn('Failed to save images to localStorage:', error);
            this.showNotification('فشل في حفظ الصور محلياً', 'error');
        }
    }

    loadStoredImages() {
        try {
            const stored = localStorage.getItem('ar_furniture_images');
            if (stored) {
                this.uploadedImages = JSON.parse(stored);
                this.updateImageGrid();
            }
        } catch (error) {
            console.warn('Failed to load images from localStorage:', error);
        }
    }

    clearAllImages() {
        this.uploadedImages = [];
        this.updateImageGrid();
        this.saveImagesToStorage();
        
        // Remove custom furniture buttons
        const furnitureGrid = document.getElementById('furnitureGrid');
        if (furnitureGrid) {
            furnitureGrid.querySelectorAll('[data-custom-id]').forEach(btn => btn.remove());
        }
        
        this.showNotification('تم حذف جميع الصور');
    }

    exportImages() {
        const data = {
            images: this.uploadedImages,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ar_furniture_images_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('تم تصدير الصور');
    }

    async importImages(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.images && Array.isArray(data.images)) {
                this.uploadedImages = [...this.uploadedImages, ...data.images];
                this.updateImageGrid();
                this.saveImagesToStorage();
                this.showNotification(`تم استيراد ${data.images.length} صورة`);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('فشل في استيراد الملف', 'error');
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    truncateName(name, maxLength = 15) {
        if (name.length <= maxLength) return name;
        return name.substr(0, maxLength - 3) + '...';
    }

    showNotification(message, type = 'success') {
        if (window.mobileFeatures) {
            window.mobileFeatures.showMobileNotification(message, type);
        } else {
            alert(message);
        }
    }

    showLoadingOverlay(message) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('p');
            if (text) text.textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageManager = new ImageManager();
});

// Export for use in other modules
window.ImageManager = ImageManager;