/**
 * Index Page Functionality
 * 메인 페이지 스크롤 애니메이션 및 인터랙션
 */

// Smooth scroll to next section
function scrollToNextSection() {
    const nextSection = document.querySelector('.essence-section');
    if (nextSection) {
        nextSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Enhanced Intersection Observer with React-style Staggered Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Special handling for gallery items with staggered animation
                if (entry.target.classList.contains('gallery-item')) {
                    const galleryItems = Array.from(entry.target.parentElement.children);
                    const index = galleryItems.indexOf(entry.target);
                    const delays = [0, 0.2, 0.4, 0.6]; // React delay values

                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, (delays[index] || 0) * 1000);
                } else {
                    entry.target.classList.add('animate');
                }
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.fade-in-up, .fade-in-scale, .gallery-item, .signature-item, .featured-pool').forEach(el => {
        observer.observe(el);
    });

    // Special handling for closing hero text
    const closingHeroText = document.querySelector('.index-closing-text');
    if (closingHeroText) {
        observer.observe(closingHeroText);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();

    // Initialize IndexMapper (PreviewHandler가 없을 때만)
    if (!window.previewHandler) {
        const indexMapper = new IndexMapper();
        indexMapper.initialize().catch(error => {
            console.error('❌ IndexMapper initialization failed:', error);
        });
    }
});