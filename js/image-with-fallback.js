class ImageWithFallback {
    constructor(options = {}) {
        this.src = options.src || '';
        this.alt = options.alt || '';
        this.fallbackSrc = options.fallbackSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        this.className = options.className || '';
        this.loading = options.loading || 'lazy';
        this.quality = options.quality || 80;
        this.onError = options.onError || null;
        this.onLoad = options.onLoad || null;
        
        this.isLoading = true;
        this.hasError = false;
        this.currentSrc = this.src;
    }
    
    // Optimize Unsplash URLs for better compression
    optimizeImageUrl(url, quality = 80) {
        if (url.includes('unsplash.com')) {
            try {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.search);
                
                // Set optimal compression parameters
                params.set('q', quality.toString());
                params.set('auto', 'format');
                params.set('fm', 'webp');
                
                // Set responsive width if not already set
                if (!params.has('w')) {
                    params.set('w', '1200');
                }
                
                urlObj.search = params.toString();
                return urlObj.toString();
            } catch (e) {
                return url;
            }
        }
        return url;
    }
    
    handleError(imgElement, loadingPlaceholder) {
        if (!this.hasError) {
            this.hasError = true;
            this.currentSrc = this.fallbackSrc;
            this.isLoading = false;
            
            imgElement.src = this.fallbackSrc;
            imgElement.classList.add('error');
            loadingPlaceholder.classList.add('hidden');
            
            if (this.onError) {
                this.onError();
            }
        }
    }
    
    handleLoad(imgElement, loadingPlaceholder) {
        this.isLoading = false;
        imgElement.classList.add('loaded');
        loadingPlaceholder.classList.add('hidden');
        
        if (this.onLoad) {
            this.onLoad();
        }
    }
    
    createElement() {
        const optimizedSrc = this.optimizeImageUrl(this.currentSrc, this.quality);
        
        // Create container
        const container = document.createElement('div');
        container.className = `image-container ${this.className}`;
        
        // Create loading placeholder
        const loadingPlaceholder = document.createElement('div');
        loadingPlaceholder.className = 'loading-placeholder animate-pulse';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        loadingPlaceholder.appendChild(spinner);
        
        // Create main image
        const img = document.createElement('img');
        img.src = optimizedSrc;
        img.alt = this.alt;
        img.className = `fallback-image ${this.className}`;
        img.loading = this.loading;
        img.decoding = 'async';
        
        if (this.loading === 'eager') {
            img.fetchpriority = 'high';
        }
        
        // Event handlers
        img.addEventListener('error', () => {
            this.handleError(img, loadingPlaceholder);
        });
        
        img.addEventListener('load', () => {
            this.handleLoad(img, loadingPlaceholder);
        });
        
        // Append elements
        container.appendChild(loadingPlaceholder);
        container.appendChild(img);
        
        return container;
    }
    
    // Static method to create and append image to container
    static create(containerSelector, options) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container not found:', containerSelector);
            return null;
        }
        
        const imageComponent = new ImageWithFallback(options);
        const element = imageComponent.createElement();
        container.appendChild(element);
        
        return imageComponent;
    }
    
    // Static method to replace all images with data-image-fallback attribute
    static initAll() {
        const images = document.querySelectorAll('[data-image-fallback]');
        images.forEach(img => {
            const options = {
                src: img.getAttribute('src') || img.getAttribute('data-src'),
                alt: img.getAttribute('alt') || '',
                fallbackSrc: img.getAttribute('data-fallback-src'),
                className: img.className,
                loading: img.getAttribute('loading') || 'lazy',
                quality: parseInt(img.getAttribute('data-quality')) || 80
            };
            
            const imageComponent = new ImageWithFallback(options);
            const newElement = imageComponent.createElement();
            
            // Replace original image with new component
            img.parentNode.replaceChild(newElement, img);
        });
    }
}

// Global function for easy access
window.ImageWithFallback = ImageWithFallback;

// Initialize all images when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ImageWithFallback.initAll();
});