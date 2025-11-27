/**
 * Directions Page Functionality
 * 오시는 길 페이지 기능
 */

// Navigation function
function navigateToHome() {
    window.location.href = './index.html';
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DirectionsMapper (PreviewHandler가 없을 때만)
    if (!window.previewHandler) {
        const directionsMapper = new DirectionsMapper();
        directionsMapper.initialize().then(() => {
            directionsMapper.mapPage();
        });
    }
});