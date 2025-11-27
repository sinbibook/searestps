/**
 * AnimatedMasonrySlider - Vanilla JavaScript Image Slider Component
 * Auto-rotating image slider with navigation controls and progress indicators
 * 
 * Usage:
 * const slider = new AnimatedMasonrySlider({
 *   containerId: 'my-slider',
 *   images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
 *   title: 'Slider Title',
 *   description: 'Slider description text'
 * });
 */

class AnimatedMasonrySlider {
    constructor(options) {
        this.container = document.getElementById(options.containerId);
        this.options = {
            images: options.images || [],
            title: options.title || '',
            description: options.description || '',
            contentTitle: options.contentTitle || 'Premium Collection',
            contentText: options.contentText || 'Experience luxury amenities',
            autoRotateInterval: options.autoRotateInterval || 5000,
            animationDuration: options.animationDuration || 800,
            threshold: options.threshold || 0.2,
            ...options
        };
        
        this.currentIndex = 0;
        this.isAnimated = false;
        this.observer = null;
        this.autoRotateTimer = null;
        
        this.init();
    }

    init() {
        this.createSlider();
        this.setupIntersectionObserver();
        this.initImageWithFallback();
        this.startAutoRotate();
        this.setupEventListeners();
    }

    createSlider() {
        this.container.className = 'animated-masonry-slider';
        
        this.container.innerHTML = `
            <!-- Header Section -->
            <div class="slider-header">
                <h2 class="slider-title">${this.options.title}</h2>
                <p class="slider-description">${this.options.description}</p>
            </div>

            <!-- Main Slider Container -->
            <div class="slider-main-container">
                <div class="slider-viewport">
                    <div class="slider-track">
                        ${this.options.images.map((image, index) => `
                            <div class="slider-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                                <div class="image-with-fallback" data-src="${image}">
                                    <img alt="Premium amenities ${index + 1}" class="slider-image">
                                    <div class="fallback">
                                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21,15 16,10 5,21"/>
                                        </svg>
                                    </div>
                                </div>
                                
                                <!-- Elegant Overlay -->
                                <div class="slider-overlay"></div>
                                
                                <!-- Content Overlay -->
                                <div class="slider-content">
                                    <div class="slider-content-inner">
                                        <h3 class="slider-content-title">${this.options.contentTitle}</h3>
                                        <p class="slider-content-text">${this.options.contentText}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Navigation Arrows - Hidden on Mobile -->
                <button class="slider-nav slider-nav-prev" aria-label="Previous slide">
                    <svg class="slider-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                
                <button class="slider-nav slider-nav-next" aria-label="Next slide">
                    <svg class="slider-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                <!-- Progress Indicator -->
                <div class="slider-progress">
                    <div class="slider-progress-inner">
                        <!-- Current Slide Number -->
                        <span class="slider-progress-current">${String(this.currentIndex + 1).padStart(2, '0')}</span>
                        
                        <!-- Progress Line -->
                        <div class="slider-progress-bar">
                            <div class="slider-progress-bg"></div>
                            <div class="slider-progress-fill" style="width: ${((this.currentIndex + 1) / this.options.images.length) * 100}%"></div>
                        </div>
                        
                        <!-- Total Slides Number -->
                        <span class="slider-progress-total">${String(this.options.images.length).padStart(2, '0')}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.sliderHeader = this.container.querySelector('.slider-header');
        this.sliderViewport = this.container.querySelector('.slider-viewport');
        this.slides = this.container.querySelectorAll('.slider-slide');
        this.prevBtn = this.container.querySelector('.slider-nav-prev');
        this.nextBtn = this.container.querySelector('.slider-nav-next');
        this.progressCurrent = this.container.querySelector('.slider-progress-current');
        this.progressFill = this.container.querySelector('.slider-progress-fill');
    }

    setupIntersectionObserver() {
        // 폴백 모드 지원
        if (!window.IntersectionObserver || window.FALLBACK_MODE) {
            // 폴백: 페이지 로드 시 즉시 애니메이션
            setTimeout(() => {
                if (!this.isAnimated) {
                    this.animateSlider();
                    this.isAnimated = true;
                }
            }, 1000);
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isAnimated) {
                    // 성능을 위해 observer 즉시 정리
                    this.observer.unobserve(this.container);
                    
                    this.animateSlider();
                    this.isAnimated = true;
                }
            });
        }, {
            threshold: this.options.threshold,
            rootMargin: '-50px' // 더 일찍 트리거되도록 조정
        });

        this.observer.observe(this.container);
    }

    animateSlider() {
        // Animate main container
        setTimeout(() => {
            this.sliderViewport.classList.add('animate-in');
        }, 0);

        // Animate header with delay
        setTimeout(() => {
            this.sliderHeader.classList.add('animate-in');
        }, 200);

        // Animate progress indicator
        setTimeout(() => {
            this.container.querySelector('.slider-progress').classList.add('animate-in');
        }, 600);
    }

    initImageWithFallback() {
        const containers = this.container.querySelectorAll('.image-with-fallback');
        const imagePromises = [];
        
        containers.forEach((container, index) => {
            const img = container.querySelector('img');
            const fallback = container.querySelector('.fallback');
            const src = container.dataset.src;
            
            if (img && src) {
                img.classList.add('loading');
                
                // 이미지 로딩을 Promise로 처리
                const imagePromise = new Promise((resolve) => {
                    const handleLoad = () => {
                        img.classList.remove('loading');
                        img.classList.add('loaded');
                        resolve({ success: true, index });
                    };
                    
                    const handleError = () => {
                        img.classList.add('error');
                        container.classList.add('show-fallback');
                        console.warn(`Image failed to load: ${src}`);
                        resolve({ success: false, index });
                    };
                    
                    // 이미지가 이미 로드된 경우
                    if (img.complete) {
                        handleLoad();
                    } else {
                        img.onload = handleLoad;
                        img.onerror = handleError;
                        img.src = src;
                    }
                });
                
                imagePromises.push(imagePromise);
            }
        });
        
        // 모든 이미지 로딩 완료 처리
        Promise.allSettled(imagePromises).then(results => {
            const failed = results.filter(result => result.value?.success === false).length;
            if (failed > 0) {
                console.info(`${failed}/${results.length} images failed to load, using fallbacks`);
            }
        });
    }

    setupEventListeners() {
        // Navigation buttons (중복 이벤트 방지)
        if (!this.prevBtn.hasAttribute('data-listener-attached')) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
            this.prevBtn.setAttribute('data-listener-attached', 'true');
        }
        
        if (!this.nextBtn.hasAttribute('data-listener-attached')) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
            this.nextBtn.setAttribute('data-listener-attached', 'true');
        }

        // 마우스 호버 처리 (쓰로틀링 적용)
        let hoverTimeout;
        this.container.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            this.pauseAutoRotate();
        });
        
        this.container.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => this.startAutoRotate(), 100);
        });

        // 키보드 내비게이션 (성능 최적화)
        if (!document.documentElement.hasAttribute('data-slider-keyboard-attached')) {
            document.addEventListener('keydown', (e) => {
                if (this.container.matches(':hover')) {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.prevSlide();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        this.nextSlide();
                    }
                }
            });
            document.documentElement.setAttribute('data-slider-keyboard-attached', 'true');
        }

        // 터치 지원 (향상된 터치 감지)
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;

        this.sliderViewport.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        this.sliderViewport.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            const swipeTime = touchEndTime - touchStartTime;
            
            // 수평 스와이프이고, 시간 내에 충분한 거리를 이동했는지 확인
            if (Math.abs(diffX) > Math.abs(diffY) && 
                Math.abs(diffX) > minSwipeDistance && 
                swipeTime < maxSwipeTime) {
                
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        }, { passive: true });
    }

    nextSlide() {
        this.pauseAutoRotate();
        this.currentIndex = (this.currentIndex + 1) % this.options.images.length;
        this.updateSlide();
        this.startAutoRotate();
    }

    prevSlide() {
        this.pauseAutoRotate();
        this.currentIndex = (this.currentIndex - 1 + this.options.images.length) % this.options.images.length;
        this.updateSlide();
        this.startAutoRotate();
    }

    updateSlide() {
        // Update active slide
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentIndex);
        });

        // Update progress indicator
        this.progressCurrent.textContent = String(this.currentIndex + 1).padStart(2, '0');
        this.progressFill.style.width = `${((this.currentIndex + 1) / this.options.images.length) * 100}%`;

        // Add transition class for smooth animation
        this.sliderViewport.classList.add('transitioning');
        setTimeout(() => {
            this.sliderViewport.classList.remove('transitioning');
        }, this.options.animationDuration);
    }

    startAutoRotate() {
        this.pauseAutoRotate(); // Clear any existing timer
        this.autoRotateTimer = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.options.images.length;
            this.updateSlide();
        }, this.options.autoRotateInterval);
    }

    pauseAutoRotate() {
        if (this.autoRotateTimer) {
            clearInterval(this.autoRotateTimer);
            this.autoRotateTimer = null;
        }
    }

    updateImages(newImages) {
        this.options.images = newImages;
        this.currentIndex = 0;
        this.createSlider();
        this.initImageWithFallback();
        this.startAutoRotate();
    }

    updateContent(title, description) {
        if (title) {
            this.options.title = title;
            const titleEl = this.container.querySelector('.slider-title');
            if (titleEl) titleEl.textContent = title;
        }
        
        if (description) {
            this.options.description = description;
            const descEl = this.container.querySelector('.slider-description');
            if (descEl) descEl.textContent = description;
        }
    }

    goToSlide(index) {
        if (index >= 0 && index < this.options.images.length) {
            this.pauseAutoRotate();
            this.currentIndex = index;
            this.updateSlide();
            this.startAutoRotate();
        }
    }

    reset() {
        this.isAnimated = false;
        this.currentIndex = 0;
        this.sliderHeader?.classList.remove('animate-in');
        this.sliderViewport?.classList.remove('animate-in');
        this.container.querySelector('.slider-progress')?.classList.remove('animate-in');
        this.updateSlide();
    }

    destroy() {
        this.pauseAutoRotate();
        
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.container.innerHTML = '';
        this.container.className = '';
    }
}

// Auto-initialize sliders with data attributes
document.addEventListener('DOMContentLoaded', function() {
    const autoSliders = document.querySelectorAll('[data-animated-slider]');
    
    autoSliders.forEach(slider => {
        const images = [];
        let i = 1;
        while (slider.dataset[`image${i}`]) {
            images.push(slider.dataset[`image${i}`]);
            i++;
        }
        
        const options = {
            containerId: slider.id,
            images: images,
            title: slider.dataset.title || '',
            description: slider.dataset.description || '',
            autoRotateInterval: parseInt(slider.dataset.autoRotateInterval) || 5000,
            animationDuration: parseInt(slider.dataset.animationDuration) || 800,
            threshold: parseFloat(slider.dataset.threshold) || 0.2
        };
        
        new AnimatedMasonrySlider(options);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedMasonrySlider;
}

// Make sure AnimatedMasonrySlider is available globally
window.AnimatedMasonrySlider = AnimatedMasonrySlider;