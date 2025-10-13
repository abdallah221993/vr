/**
 * Mobile Features Module
 * Handles mobile-specific functionality and optimizations
 */

class MobileFeatures {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
        
        this.initMobileFeatures();
        this.setupOrientationHandling();
        this.setupNetworkStatus();
        this.setupTouchOptimizations();
    }

    initMobileFeatures() {
        if (this.isMobile) {
            // Add mobile class to body
            document.body.classList.add('is-mobile');
            
            // Disable zoom on double tap for iOS
            if (this.isIOS) {
                document.addEventListener('touchstart', this.preventZoom.bind(this), { passive: false });
            }
            
            // Add viewport meta tag if not exists
            this.ensureViewportMeta();
            
            // Setup mobile-specific AR controls
            this.setupMobileARControls();
        }
    }

    ensureViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no';
    }

    preventZoom(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }

    setupOrientationHandling() {
        // Show orientation hint for very small screens in landscape
        const orientationHint = document.createElement('div');
        orientationHint.className = 'orientation-hint';
        orientationHint.innerHTML = `
            <div>
                <i class="fas fa-mobile-alt fa-3x mb-4"></i>
                <h3 class="text-xl font-bold mb-2">للحصول على أفضل تجربة</h3>
                <p>يرجى استخدام الهاتف في الوضع العمودي</p>
            </div>
        `;
        document.body.appendChild(orientationHint);

        const checkOrientation = () => {
            if (window.innerWidth < 480 && window.innerHeight < window.innerWidth) {
                orientationHint.classList.add('show');
            } else {
                orientationHint.classList.remove('show');
            }
        };

        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });
        
        window.addEventListener('resize', checkOrientation);
        checkOrientation();
    }

    setupNetworkStatus() {
        const networkStatus = document.createElement('div');
        networkStatus.className = 'network-status';
        networkStatus.innerHTML = '<i class="fas fa-wifi mr-2"></i>لا يوجد اتصال بالإنترنت';
        document.body.appendChild(networkStatus);

        const updateNetworkStatus = () => {
            if (navigator.onLine) {
                networkStatus.classList.remove('show');
            } else {
                networkStatus.classList.add('show');
                networkStatus.classList.remove('online');
            }
        };

        const showOnlineStatus = () => {
            networkStatus.innerHTML = '<i class="fas fa-wifi mr-2"></i>تم استعادة الاتصال';
            networkStatus.classList.add('online', 'show');
            setTimeout(() => {
                networkStatus.classList.remove('show');
            }, 3000);
        };

        window.addEventListener('online', showOnlineStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    }

    setupTouchOptimizations() {
        // Add touch-friendly classes
        document.querySelectorAll('button, .furniture-btn, input[type="file"] + label').forEach(element => {
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.touchAction = 'manipulation';
        });

        // Prevent context menu on long press for AR elements
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#ar-scene') || e.target.closest('.ar-controls')) {
                e.preventDefault();
            }
        });
    }

    setupMobileARControls() {
        // Duplicate control functionality for mobile and desktop versions
        const setupControlPair = (mobileId, desktopId, action) => {
            const mobileBtn = document.getElementById(mobileId);
            const desktopBtn = document.getElementById(desktopId);
            
            if (mobileBtn && desktopBtn) {
                const handler = () => {
                    if (window.arControls && typeof window.arControls[action] === 'function') {
                        window.arControls[action]();
                    }
                };
                
                mobileBtn.addEventListener('click', handler);
                mobileBtn.addEventListener('touchstart', handler, { passive: true });
                desktopBtn.addEventListener('click', handler);
            }
        };

        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                setupControlPair('scaleUp', 'scaleUpDesktop', 'scaleUp');
                setupControlPair('scaleDown', 'scaleDownDesktop', 'scaleDown');
                setupControlPair('rotateLeft', 'rotateLeftDesktop', 'rotateLeft');
                setupControlPair('rotateRight', 'rotateRightDesktop', 'rotateRight');
                setupControlPair('resetModel', 'resetModelDesktop', 'resetModel');
                setupControlPair('closeAR', 'closeARDesktop', 'closeAR');
                
                // Sync scale displays
                this.syncScaleDisplays();
            }, 1000);
        });
    }

    syncScaleDisplays() {
        const mobileScale = document.getElementById('scaleValue');
        const desktopScale = document.getElementById('scaleValueDesktop');
        
        if (mobileScale && desktopScale) {
            const observer = new MutationObserver(() => {
                if (mobileScale.textContent !== desktopScale.textContent) {
                    desktopScale.textContent = mobileScale.textContent;
                }
            });
            
            observer.observe(mobileScale, { childList: true, subtree: true });
        }
    }

    showMobileNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.innerHTML = message;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Vibration feedback for mobile devices
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator && this.isMobile) {
            navigator.vibrate(pattern);
        }
    }

    // Check if device has camera
    async checkCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            console.warn('Cannot check camera availability:', error);
            return false;
        }
    }

    // Request camera permission with user-friendly messaging
    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Prefer back camera
                } 
            });
            
            // Stop the stream immediately as we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.showMobileNotification('تم منح إذن الكاميرا بنجاح');
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            this.showCameraPermissionError(error);
            return false;
        }
    }

    showCameraPermissionError(error) {
        let message = 'يرجى السماح للتطبيق بالوصول للكاميرا';
        
        if (error.name === 'NotAllowedError') {
            message = 'تم رفض إذن الكاميرا. يرجى تفعيله من إعدادات المتصفح';
        } else if (error.name === 'NotFoundError') {
            message = 'لم يتم العثور على كاميرا في الجهاز';
        } else if (error.name === 'NotSupportedError') {
            message = 'متصفحك لا يدعم الوصول للكاميرا';
        }
        
        this.showMobileNotification(message, 'error', 5000);
    }

    // Performance monitoring for mobile
    monitorPerformance() {
        if ('performance' in window && 'memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
                const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
                
                if (used / total > 0.9) {
                    console.warn('High memory usage detected:', used, 'MB of', total, 'MB');
                    this.showMobileNotification('استخدام ذاكرة مرتفع، قد تتأثر الأداء', 'error');
                }
            };
            
            setInterval(checkMemory, 30000); // Check every 30 seconds
        }
    }

    // Initialize performance monitoring
    initPerformanceMonitoring() {
        if (this.isMobile) {
            this.monitorPerformance();
        }
    }
}

// Initialize mobile features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileFeatures = new MobileFeatures();
});

// Export for use in other modules
window.MobileFeatures = MobileFeatures;