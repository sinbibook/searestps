/**
 * Nearby Attractions Page - Hero Slider + Scroll Animations
 */

(function() {
    // ============================================================================
    // 🎬 HERO SLIDESHOW (from main.js)
    // ============================================================================

    function initMainSlideshow() {
        const slides = document.querySelectorAll('.main-slide');
        if (slides.length === 0) return;

        if (slides.length === 1) {
            slides[0].classList.add('active');
            const arrow = document.querySelector('.main-arrow');
            if (arrow) arrow.style.display = 'none';
            return;
        }

        const bg = document.querySelector('.main-bg');
        const progress = document.querySelector('.title-divider .bar-progress');
        const arrowNums = document.querySelectorAll('.main-arrow .arrow-number');
        const arrowLeft = document.querySelector('.main-arrow .arrow-left');
        const arrowRight = document.querySelector('.main-arrow .arrow-right');
        let current = 0;
        const total = slides.length;

        function padNum(n) {
            return n < 10 ? '0' + n : '' + n;
        }

        function updateNumbers() {
            if (arrowNums.length >= 2) {
                arrowNums[0].textContent = padNum(current + 1);
                arrowNums[1].textContent = padNum(total);
            }
        }

        function isMobileScroll() {
            return bg && bg.scrollWidth > bg.clientWidth;
        }

        function goTo(index) {
            slides[current].classList.remove('active');
            current = (index + total) % total;
            slides[current].classList.add('active');
            updateNumbers();
            if (isMobileScroll()) {
                bg.scrollTo({ left: current * bg.offsetWidth, behavior: 'smooth' });
            }
        }

        function restartProgress() {
            if (!progress) return;
            progress.style.animation = 'none';
            progress.offsetHeight;
            progress.style.animation = '';
        }

        updateNumbers();
        slides[0].classList.add('active');

        if (progress) {
            progress.addEventListener('animationiteration', () => {
                goTo(current + 1);
            });
        }

        if (bg) {
            let scrollTimer;
            bg.addEventListener('scroll', () => {
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    const snapped = Math.round(bg.scrollLeft / bg.offsetWidth);
                    if (snapped !== current && snapped >= 0 && snapped < total) {
                        slides[current].classList.remove('active');
                        current = snapped;
                        slides[current].classList.add('active');
                        updateNumbers();
                        restartProgress();
                    }
                }, 150);
            });
        }

        if (arrowLeft) {
            arrowLeft.style.cursor = 'pointer';
            arrowLeft.addEventListener('click', () => {
                goTo(current - 1);
                restartProgress();
            });
        }

        if (arrowRight) {
            arrowRight.style.cursor = 'pointer';
            arrowRight.addEventListener('click', () => {
                goTo(current + 1);
                restartProgress();
            });
        }
    }

    // ============================================================================
    // 🎨 GALLERY INTERACTION (Accordion)
    // ============================================================================

    function initGalleryInteraction() {
        const isMobile = window.innerWidth <= 768;

        document.querySelectorAll('.attraction-image .img-grid').forEach(function(grid) {
            const items = grid.querySelectorAll('.img-item');

            if (isMobile) {
                let current = 0;
                const total = items.length;
                const itemWidth = grid.offsetWidth;

                setInterval(function() {
                    current = (current + 1) % total;
                    grid.scrollTo({
                        left: current * itemWidth,
                        behavior: 'smooth'
                    });
                }, 3000);
            } else {
                function setActive(target) {
                    items.forEach(function(i) { i.classList.remove('is-active'); });
                    target.classList.add('is-active');
                }

                items.forEach(function(item) {
                    item.addEventListener('mouseenter', function() {
                        setActive(item);
                    });
                    item.addEventListener('click', function() {
                        setActive(item);
                    });
                });
            }
        });
    }

    // ============================================================================
    // 🎨 SCROLL ANIMATIONS SETUP
    // ============================================================================

    function setupScrollAnimations() {
        const animateElements = document.querySelectorAll('.attraction-block');

        if (animateElements.length === 0) {
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animateElements.forEach(element => {
            observer.observe(element);
        });
    }

    function setupFullBannerAnimation() {
        const bannerElement = document.querySelector('.closing-section');

        if (!bannerElement) {
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        observer.observe(bannerElement);
    }

    window.initHeroSlider = initMainSlideshow;
    window.setupNearbyAttractionsAnimations = function() {
        initGalleryInteraction();
        setupScrollAnimations();
        setupFullBannerAnimation();
    };

    // ============================================================================
    // 🚀 INITIALIZATION
    // ============================================================================

    if (typeof window !== 'undefined' && window.parent === window) {
        window.addEventListener('DOMContentLoaded', () => {
            initMainSlideshow();
            initGalleryInteraction();
            setTimeout(() => {
                setupScrollAnimations();
                setupFullBannerAnimation();
            }, 1000);
        });
    }
})();
