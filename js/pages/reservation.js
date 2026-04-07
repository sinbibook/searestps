// Main Hero Slideshow
function initMainSlideshow() {
    var slides = document.querySelectorAll('.main-slide');
    if (slides.length === 0) return;

    // 슬라이드 1개: active만 붙이고 화살표 숨김 후 종료
    if (slides.length === 1) {
        slides[0].classList.add('active');
        var arrow = document.querySelector('.main-arrow');
        if (arrow) arrow.style.display = 'none';
        return;
    }

    var bg = document.querySelector('.main-bg');
    var progress = document.querySelector('.title-divider .bar-progress');
    var arrowNums = document.querySelectorAll('.main-arrow .arrow-number');
    var arrowLeft = document.querySelector('.main-arrow .arrow-left');
    var arrowRight = document.querySelector('.main-arrow .arrow-right');
    var current = 0;
    var total = slides.length;

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
        progress.addEventListener('animationiteration', function() {
            goTo(current + 1);
        });
    }

    if (bg) {
        var scrollTimer;
        bg.addEventListener('scroll', function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                var snapped = Math.round(bg.scrollLeft / bg.offsetWidth);
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
        arrowLeft.addEventListener('click', function() {
            goTo(current - 1);
            restartProgress();
        });
    }

    if (arrowRight) {
        arrowRight.style.cursor = 'pointer';
        arrowRight.addEventListener('click', function() {
            goTo(current + 1);
            restartProgress();
        });
    }
}

// 스티키 헤더 (page-title, tabs-group, side-img-wrapper)
function initStickyElements() {
    if (window.innerWidth <= 768) return;

    var sectionCon = document.querySelector('.section-con');
    if (!sectionCon) return;

    var pageTitle = sectionCon.querySelector('.page-title');
    var tabsGroup = sectionCon.querySelector('.tabs-group');

    var stickyEls = [pageTitle, tabsGroup].filter(Boolean);
    if (stickyEls.length === 0) return;

    // 스티키 헤더 배경 (스크롤 시 텍스트 가림용)
    var headerBg = document.createElement('div');
    headerBg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:342px;background:var(--color-primary);z-index:4;margin-left:0;';
    sectionCon.insertBefore(headerBg, sectionCon.firstChild);
    stickyEls.push(headerBg);

    function update() {
        var rect = sectionCon.getBoundingClientRect();

        if (rect.top < 0 && rect.bottom > 600) {
            var ty = -rect.top;
            for (var i = 0; i < stickyEls.length; i++) {
                stickyEls[i].style.transform = 'translateY(' + ty + 'px)';
            }
        } else if (rect.top >= 0) {
            for (var i = 0; i < stickyEls.length; i++) {
                stickyEls[i].style.transform = '';
            }
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// 탭 네비게이션 (클릭 시 해당 섹션으로 스크롤 + 스크롤 시 활성 탭 업데이트)
function initTabNavigation() {
    var tabs = document.querySelectorAll('.tabs-group .tab-btn');
    var sections = [];

    tabs.forEach(function(tab) {
        var href = tab.getAttribute('href');
        if (href && href !== '#') {
            var target = document.getElementById(href.substring(1));
            if (target) {
                sections.push({ tab: tab, el: target });
            }
        }
    });

    // 탭 클릭 시 스크롤
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();

            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');

            var href = this.getAttribute('href');
            if (!href || href === '#') return;
            var targetEl = document.getElementById(href.substring(1));
            if (!targetEl) return;

            var targetRect = targetEl.getBoundingClientRect();
            var scrollTo = window.scrollY + targetRect.top - 420;

            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        });
    });

    // 스크롤 시 활성 탭 업데이트
    function updateActiveTab() {
        for (var i = sections.length - 1; i >= 0; i--) {
            var rect = sections[i].el.getBoundingClientRect();
            if (rect.top <= 450) {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                sections[i].tab.classList.add('active');
                break;
            }
        }
    }

    window.addEventListener('scroll', updateActiveTab, { passive: true });
}

// sticky 경계 설정 (side-img-wrapper → fee-table-container 하단에서 멈춤)
function initStickyBoundary() {
    if (window.innerWidth <= 768) return;

    var sectionCon = document.querySelector('.section-con');
    if (!sectionCon) return;

    var sideImg = sectionCon.querySelector('.side-img-wrapper');
    var feeTable = sectionCon.querySelector('.fee-table-container');
    if (!sideImg || !feeTable) return;

    // side-img-wrapper를 감싸는 boundary wrapper 생성
    var wrapper = document.createElement('div');
    wrapper.className = 'sticky-boundary';
    wrapper.style.cssText = 'position:relative;width:100%;margin-left:0;overflow:visible;pointer-events:none;';

    sideImg.parentNode.insertBefore(wrapper, sideImg);
    wrapper.appendChild(sideImg);
    sideImg.style.pointerEvents = 'auto';

    function updateHeight() {
        var sectionTop = sectionCon.getBoundingClientRect().top + window.scrollY;
        var feeBottom = feeTable.getBoundingClientRect().bottom + window.scrollY;
        wrapper.style.height = (feeBottom - sectionTop) + 'px';
    }

    // 레이아웃 안정 후 높이 계산
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            updateHeight();
        });
    });

    window.addEventListener('resize', updateHeight);
}

// 아코디언 토글 (모바일 전용)
function initReservationAccordion() {
    if (window.innerWidth > 768) return;

    var titles = document.querySelectorAll('.info-section .section-title');
    titles.forEach(function(title) {
        title.addEventListener('click', function() {
            var section = this.closest('.info-section');
            if (section.classList.contains('is-open')) {
                section.classList.remove('is-open');
            } else {
                section.classList.add('is-open');
            }
        });
    });
}

// Global expose for mapper reinit
window.initMainSlideshow = initMainSlideshow;
window.initHeroSlider = initMainSlideshow;

// 스크롤 기반 이미지 및 텍스트 애니메이션 시스템
document.addEventListener('DOMContentLoaded', function() {
    initMainSlideshow();
    initStickyElements();
    initTabNavigation();
    initStickyBoundary();
    initReservationAccordion();
    // 타이핑 애니메이션 처리
    const typingText = document.querySelector('.typing-text');
    if (typingText) {
        setTimeout(() => {
            typingText.classList.add('typed');
        }, 2700);
    }
    // 모든 이미지 패널 가져오기
    const imagePanels = document.querySelectorAll('.reservation-panel-image');
    // 모든 reservation 박스 가져오기
    const reservationBoxes = document.querySelectorAll('.reservation-box');

    // 이미지 애니메이션을 위한 Intersection Observer 설정
    const imageObserverOptions = {
        root: null,
        rootMargin: '-20% 0px',
        threshold: 0
    };

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // CSS에서 border-radius를 처리하므로 JavaScript에서는 설정하지 않음
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, imageObserverOptions);

    // 텍스트 박스 애니메이션을 위한 Intersection Observer 설정
    const textObserverOptions = {
        root: null,
        rootMargin: '-10% 0px',
        threshold: 0.2
    };

    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, textObserverOptions);

    // 각 이미지 패널 관찰 시작
    imagePanels.forEach(panel => {
        imageObserver.observe(panel);
    });

    // 각 텍스트 박스 관찰 시작
    reservationBoxes.forEach(box => {
        textObserver.observe(box);
    });

});