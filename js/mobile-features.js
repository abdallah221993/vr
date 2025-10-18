/**
 * Mobile Features Module
 * Handles mobile-specific functionality and optimizations
 */

class MobileFeatures {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
        
        this.init();
    }

    init() {
        if (this.isMobile) {
            console.log('📱 Mobile device detected');
            document.body.classList.add('is-mobile');
            
            if (this.isIOS) {
                console.log('🍎 iOS device detected');
                this.setupIOSOptimizations();
            }
            
            if (this.isAndroid) {
                console.log('🤖 Android device detected');
                this.setupAndroidOptimizations();
            }
            
            this.ensureViewportMeta();
            this.setupOrientationHandling();
            this.setupTouchOptimizations();
        }
    }

    setupIOSOptimizations() {
        // Disable double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Prevent pinch zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
    }

    setupAndroidOptimizations() {
        // Android-specific optimizations can be added here
        console.log('✅ Android optimizations applied');
    }

    ensureViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }

    setupOrientationHandling() {
        const handleOrientation = () => {
            const orientation = window.screen.orientation?.type || 
                              (window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary');
            
            document.body.setAttribute('data-orientation', orientation);
            console.log('📐 Orientation changed:', orientation);
        };

        window.addEventListener('orientationchange', handleOrientation);
        window.addEventListener('resize', handleOrientation);
        handleOrientation();
    }

    setupTouchOptimizations() {
        // Add touch-action CSS for better performance
        const style = document.createElement('style');
        style.textContent = `
            .furniture-btn,
            .control-btn,
            button {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Prevent text selection on mobile */
            .furniture-btn,
            .control-panel,
            .ar-controls {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        `;
        document.head.appendChild(style);
    }

    vibrate(duration = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    showInstallPrompt() {
        // PWA install prompt (future feature)
        console.log('📲 PWA install prompt feature coming soon...');
    }
}

// Initialize Mobile Features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileFeatures = new MobileFeatures();
    });
} else {
    window.mobileFeatures = new MobileFeatures();
}
