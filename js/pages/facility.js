/**
 * Facility Page Functionality
 * 시설 페이지 슬라이더 기능
 */

// Navigation function
function navigateToHome() {
    window.location.href = './index.html';
}

// Facility Slider Functions
window.facilityCurrentSlide = 0;
window.facilityTotalSlides = 1;

function updateFacilitySlider() {
    const slides = document.querySelectorAll('.facility-slide');
    const indicators = document.querySelectorAll('.facility-indicator');

    slides.forEach((slide, index) => {
        slide.style.opacity = index === window.facilityCurrentSlide ? '1' : '0';
    });

    indicators.forEach((indicator, index) => {
        indicator.style.background = index === window.facilityCurrentSlide ? 'white' : 'rgba(255,255,255,0.5)';
    });
}

function nextFacilitySlide() {
    if (window.facilityTotalSlides <= 1) return;

    window.facilityCurrentSlide = (window.facilityCurrentSlide + 1) % window.facilityTotalSlides;
    updateFacilitySlider();
}

function prevFacilitySlide() {
    if (window.facilityTotalSlides <= 1) return;

    window.facilityCurrentSlide = window.facilityCurrentSlide === 0
        ? window.facilityTotalSlides - 1
        : window.facilityCurrentSlide - 1;
    updateFacilitySlider();
}

function goToFacilitySlide(index) {
    if (index >= 0 && index < window.facilityTotalSlides) {
        window.facilityCurrentSlide = index;
        updateFacilitySlider();
    }
}

// Auto-play functionality (optional)
let facilityAutoSlideTimer;
function startFacilityAutoSlide() {
    if (window.facilityTotalSlides <= 1) return;

    facilityAutoSlideTimer = setInterval(() => {
        nextFacilitySlide();
    }, 4000); // 4초마다 자동 슬라이드
}

function stopFacilityAutoSlide() {
    if (facilityAutoSlideTimer) {
        clearInterval(facilityAutoSlideTimer);
    }
}

// Touch 슬라이드 변수
let facilityTouchStartX = 0;
let facilityTouchEndX = 0;
let facilityIsTouchMove = false;

// Touch 이벤트 핸들러
function handleFacilityTouchStart(e) {
    facilityTouchStartX = e.changedTouches[0].screenX;
    facilityIsTouchMove = false;
}

function handleFacilityTouchMove(e) {
    facilityIsTouchMove = true;
}

function handleFacilityTouchEnd(e) {
    facilityTouchEndX = e.changedTouches[0].screenX;

    if (!facilityIsTouchMove) return;

    const threshold = 50; // 최소 스와이프 거리
    const swipeDistance = facilityTouchStartX - facilityTouchEndX;

    if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
            // 왼쪽으로 스와이프 = 다음 슬라이드
            nextFacilitySlide();
        } else {
            // 오른쪽으로 스와이프 = 이전 슬라이드
            prevFacilitySlide();
        }
    }
}

// Mouse hover와 Touch 이벤트 설정
document.addEventListener('DOMContentLoaded', function() {
    // Initialize FacilityMapper (PreviewHandler가 없을 때만)
    if (!window.previewHandler) {
        const facilityMapper = new FacilityMapper();
        facilityMapper.initialize().then(() => {
            facilityMapper.setupNavigation();
        }).catch(error => {
            console.error('❌ FacilityMapper initialization failed:', error);
        });
    }

    setTimeout(() => {
        const sliderWrapper = document.querySelector('.facility-slider-wrapper');
        if (sliderWrapper) {
            // Mouse 이벤트
            sliderWrapper.addEventListener('mouseenter', stopFacilityAutoSlide);
            sliderWrapper.addEventListener('mouseleave', startFacilityAutoSlide);

            // Touch 이벤트
            sliderWrapper.addEventListener('touchstart', handleFacilityTouchStart, { passive: true });
            sliderWrapper.addEventListener('touchmove', handleFacilityTouchMove, { passive: true });
            sliderWrapper.addEventListener('touchend', handleFacilityTouchEnd, { passive: true });

            // 초기 auto-play 시작
            startFacilityAutoSlide();
        }
    }, 1000);
});