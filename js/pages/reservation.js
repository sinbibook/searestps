/**
 * Reservation Page Functionality
 * 예약 페이지 기능
 */

// Navigation function
function navigateToHome() {
    window.location.href = './index.html';
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize ReservationMapper (PreviewHandler가 없을 때만)
    if (!window.previewHandler) {
        const reservationMapper = new ReservationMapper();
        reservationMapper.initialize().then(() => {
            reservationMapper.setupNavigation();
        }).catch(error => {
            console.error('❌ ReservationMapper initialization failed:', error);
        });
    }

    // Note: ImageWithFallback is loaded from ../js/image-with-fallback.js
    // It will automatically initialize images with [data-image-fallback] attribute
});