/**
 * AnimatedFadeGallery - Vanilla JavaScript Gallery Component
 * 3-image layout gallery with scroll-triggered animations
 * 
 * Usage:
 * const gallery = new AnimatedFadeGallery({
 *   containerId: 'my-gallery',
 *   images: {
 *     main: 'path/to/main-image.jpg',
 *     topRight: 'path/to/top-right.jpg',
 *     bottomRight: 'path/to/bottom-right.jpg'
 *   },
 *   title: 'Gallery Title',
 *   description: 'Gallery description text'
 * });
 */

class AnimatedFadeGallery {
    constructor(options) {
        this.container = document.getElementById(options.containerId);
        this.options = {
            images: options.images || {},
            title: options.title || '',
            description: options.description || '',
            animationDelay: options.animationDelay || 200,
            staggerDelay: options.staggerDelay || 300,
            textDelay: options.textDelay || 1000,
            threshold: options.threshold || 0.2,
            ...options
        };
        
        this.isAnimated = false;
        this.observer = null;
        
        this.init();
    }

    init() {
        this.createGallery();
        this.setupIntersectionObserver();
        this.initImageWithFallback();
        this.setupImageHandlers();
    }

    createGallery() {
        this.container.className = 'animated-fade-gallery';
        
        this.container.innerHTML = `
            <div class="gallery-header">
                <h2 class="gallery-title">${this.options.title}</h2>
                <p class="gallery-description">${this.options.description}</p>
            </div>
            <div class="gallery-grid">
                <div class="gallery-item main-image">
                    <div class="image-with-fallback" data-src="${this.options.images.main}">
                        <img alt="Main gallery image" class="gallery-img">
                        <div class="fallback">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </div>
                    </div>
                    <div class="image-overlay"></div>
                </div>
                <div class="gallery-item top-right">
                    <div class="image-with-fallback" data-src="${this.options.images.topRight}">
                        <img alt="Gallery detail" class="gallery-img">
                        <div class="fallback">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </div>
                    </div>
                    <div class="image-overlay"></div>
                </div>
                <div class="gallery-item bottom-right">
                    <div class="image-with-fallback" data-src="${this.options.images.bottomRight}">
                        <img alt="Gallery feature" class="gallery-img">
                        <div class="fallback">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </div>
                    </div>
                    <div class="image-overlay"></div>
                </div>
            </div>
        `;
        
        this.galleryItems = this.container.querySelectorAll('.gallery-item');
        this.galleryHeader = this.container.querySelector('.gallery-header');
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isAnimated) {
                    this.animateGallery();
                    this.isAnimated = true;
                }
            });
        }, {
            threshold: this.options.threshold,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }

    animateGallery() {
        // Animate gallery items first with stagger
        this.galleryItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
            }, this.options.animationDelay + (index * this.options.staggerDelay));
        });

        // Animate header after items (matching TSX 1s delay)
        setTimeout(() => {
            this.galleryHeader.classList.add('animate-in');
        }, this.options.textDelay);
    }

    initImageWithFallback() {
        const containers = this.container.querySelectorAll('.image-with-fallback');
        
        containers.forEach(container => {
            const img = container.querySelector('img');
            const fallback = container.querySelector('.fallback');
            const src = container.dataset.src;
            
            if (img && src) {
                img.classList.add('loading');
                
                img.onload = function() {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                };
                
                img.onerror = function() {
                    img.classList.add('error');
                    container.classList.add('show-fallback');
                };
                
                // Set the src to start loading
                img.src = src;
            }
        });
    }

    setupImageHandlers() {
        const images = this.container.querySelectorAll('.gallery-img');
        
        images.forEach(img => {
            // Additional hover effects can be added here
            img.addEventListener('mouseenter', () => {
                // Custom hover logic if needed
            });
        });
    }

    updateImages(newImages) {
        this.options.images = { ...this.options.images, ...newImages };
        
        const containers = this.container.querySelectorAll('.image-with-fallback');
        if (newImages.main && containers[0]) {
            containers[0].dataset.src = newImages.main;
            const img = containers[0].querySelector('img');
            if (img) img.src = newImages.main;
        }
        if (newImages.topRight && containers[1]) {
            containers[1].dataset.src = newImages.topRight;
            const img = containers[1].querySelector('img');
            if (img) img.src = newImages.topRight;
        }
        if (newImages.bottomRight && containers[2]) {
            containers[2].dataset.src = newImages.bottomRight;
            const img = containers[2].querySelector('img');
            if (img) img.src = newImages.bottomRight;
        }
    }

    updateContent(title, description) {
        if (title) {
            this.options.title = title;
            const titleEl = this.container.querySelector('.gallery-title');
            if (titleEl) titleEl.textContent = title;
        }
        
        if (description) {
            this.options.description = description;
            const descEl = this.container.querySelector('.gallery-description');
            if (descEl) descEl.textContent = description;
        }
    }

    reset() {
        this.isAnimated = false;
        this.galleryHeader?.classList.remove('animate-in');
        this.galleryItems.forEach(item => {
            item.classList.remove('animate-in');
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.container.innerHTML = '';
        this.container.className = '';
    }
}

// Auto-initialize galleries with data attributes
document.addEventListener('DOMContentLoaded', function() {
    const autoGalleries = document.querySelectorAll('[data-animated-gallery]');
    
    autoGalleries.forEach(gallery => {
        const images = {
            main: gallery.dataset.mainImage,
            topRight: gallery.dataset.topRightImage,
            bottomRight: gallery.dataset.bottomRightImage
        };
        
        const options = {
            containerId: gallery.id,
            images: images,
            title: gallery.dataset.title || '',
            description: gallery.dataset.description || '',
            animationDelay: parseInt(gallery.dataset.animationDelay) || 200,
            staggerDelay: parseInt(gallery.dataset.staggerDelay) || 300,
            textDelay: parseInt(gallery.dataset.textDelay) || 1000,
            threshold: parseFloat(gallery.dataset.threshold) || 0.2
        };
        
        new AnimatedFadeGallery(options);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedFadeGallery;
}