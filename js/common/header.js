/**
 * Header Component Functionality
 * 헤더 컴포넌트 기능
 */

// Constants
const YBS_BOOKING_URL_BASE = 'https://rev.yapen.co.kr/external?ypIdx=';

// Header functionality - Make functions global for dynamic loading
let mobileMenuOpen = false;
let subMenusVisible = false;

// Global navigation function
window.navigateTo = function(page) {
    // Validate page parameter
    if (!page || page === 'undefined' || page === 'null' || typeof page !== 'string') {
        return false;
    }

    // Handle special cases
    if (page === 'home') {
        window.location.href = '../pages/index.html';
        return;
    }
    if (page === 'reservation-info') {
        window.location.href = '../pages/reservation.html';
        return;
    }

    // Use URL router if available, otherwise direct navigation
    if (window.navigateToPage) {
        window.navigateToPage(page);
    } else {
        // Direct navigation fallback
        window.location.href = `../pages/${page}.html`;
    }

    closeMobileMenu();
    window.hideSubMenus();
};

// Room navigation is now handled by PropertyDataMapper.navigateToRoom

// Make mobile menu functions global
window.toggleMobileMenu = function() {
    mobileMenuOpen = !mobileMenuOpen;
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    const body = document.body;

    if (mobileMenuOpen) {
        if (mobileMenu) mobileMenu.classList.add('show');
        if (menuIcon) menuIcon.style.display = 'none';
        if (closeIcon) closeIcon.style.display = 'block';

        // body 스크롤 막기
        body.style.overflow = 'hidden';
    } else {
        if (mobileMenu) mobileMenu.classList.remove('show');
        if (menuIcon) menuIcon.style.display = 'block';
        if (closeIcon) closeIcon.style.display = 'none';

        // body 스크롤 복원
        body.style.overflow = '';
    }
};

function closeMobileMenu() {
    if (mobileMenuOpen) {
        window.toggleMobileMenu();
    }
}

// Make submenu functions global
window.showSubMenus = function() {
    if (window.innerWidth >= 1024) {
        subMenusVisible = true;
        const subMenus = document.getElementById('sub-menus');
        const subMenuItems = document.querySelectorAll('.sub-menu-item');

        if (subMenus) subMenus.classList.add('show');

        // Animate sub menu items
        subMenuItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate');
            }, index * 50);
        });
    }
};

window.hideSubMenus = function() {
    if (window.innerWidth >= 1024) {
        subMenusVisible = false;
        const subMenus = document.getElementById('sub-menus');
        const subMenuItems = document.querySelectorAll('.sub-menu-item');

        if (subMenus) subMenus.classList.remove('show');
        subMenuItems.forEach(item => {
            item.classList.remove('animate');
        });
    }
};

// Close mobile menu when clicking outside or resizing
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && mobileMenuOpen) {
        closeMobileMenu();
    }
    if (window.innerWidth < 1024 && subMenusVisible) {
        window.hideSubMenus();
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const header = document.getElementById('header');
    if (mobileMenuOpen && !header.contains(e.target)) {
        closeMobileMenu();
    }
});

// Header scroll effect
let lastScrollY = 0;
let ticking = false;

function updateHeader() {
    const header = document.getElementById('header');
    const scrollY = window.scrollY;

    if (scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
    }
}

// Listen for scroll events
window.addEventListener('scroll', requestTick);

// 전역 예약 함수 (어디서든 호출 가능)
window.openReservation = function() {
    const isPreviewMode = window.parent !== window;
    const buttons = document.querySelectorAll('[data-booking-engine]');
    const realtimeBookingId = buttons.length > 0 ? buttons[0].getAttribute('data-realtime-booking-id') : null;

    if (realtimeBookingId) {
        const reservationUrl = `https://www.bookingplay.co.kr/booking/1/${realtimeBookingId}`;

        if (isPreviewMode) {
            // 미리보기 환경: 부모 창(어드민)에 메시지 전송
            window.parent.postMessage({
                type: 'OPEN_RESERVATION',
                url: reservationUrl,
                realtimeBookingId: realtimeBookingId
            }, window.previewHandler?.parentOrigin || '*');
        } else {
            // 일반 환경: 새 창으로 열기
            window.open(reservationUrl, '_blank', 'noopener,noreferrer');
        }
    } else {
        if (!isPreviewMode) {
            window.location.href = '../pages/reservation.html';
        }
    }
};

/**
 * YBS 예약 버튼 초기화
 * ybsId를 사용하여 YBS 예약 페이지를 새 창으로 열기
 */
window.initializeYBSButtons = function() {
    const ybsButtons = document.querySelectorAll('[data-ybs-booking]');

    if (ybsButtons.length === 0) {
        return;
    }

    ybsButtons.forEach((button) => {
        const ybsId = button.getAttribute('data-ybs-id');

        // ybsId가 있을 때만 버튼 표시
        if (ybsId && ybsId.trim() !== '') {
            button.classList.remove('hidden');

            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();

                const isPreviewMode = window.parent !== window;
                const ybsUrl = `${YBS_BOOKING_URL_BASE}${ybsId}`;

                if (isPreviewMode) {
                    // 미리보기 환경: 부모 창(어드민)에 메시지 전송
                    window.parent.postMessage({
                        type: 'OPEN_YBS_RESERVATION',
                        url: ybsUrl,
                        ybsId: ybsId
                    }, window.previewHandler?.parentOrigin || '*');
                } else {
                    // 일반 환경: 새 창으로 열기
                    window.open(ybsUrl, '_blank', 'noopener,noreferrer');
                }
            };
        }
    });
};

/**
 * 예약 버튼 초기화
 * realtime_booking_id를 사용하여 예약 페이지를 새 창으로 열기
 */
window.initializeReservationButtons = function() {
    const reservationButtons = document.querySelectorAll('[data-booking-engine]');

    if (reservationButtons.length === 0) {
        return;
    }

    reservationButtons.forEach((button) => {
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openReservation();
        };
    });
};

/**
 * 페이지 버튼 초기화 통합 함수
 */
function initializePageButtons() {
    updateHeader();
    initializeReservationButtons();
    initializeYBSButtons();
}

// DOM이 준비되면 버튼 초기화 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageButtons);
} else {
    initializePageButtons();
}
