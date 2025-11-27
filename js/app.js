/**
 * App.js - 메인 애플리케이션 로직
 * 전역 이벤트 리스너, 공통 기능, 페이지별 초기화
 */

(function() {
    'use strict';

    // 애플리케이션 전역 객체
    const App = {
        // 초기화 상태
        initialized: false,
        
        // 현재 페이지 정보
        currentPage: null,
        
        // 설정
        config: {
            scrollOffset: 80,
            transitionDuration: 300,
            breakpoints: {
                mobile: 768,
                tablet: 1024,
                desktop: 1280
            }
        },

        // 초기화 함수
        init() {
            if (this.initialized) return;

            this.detectCurrentPage();
            this.initEventListeners();
            this.initScrollEffects();
            this.initNavigation();
            this.initForms();
            this.initModals();
            this.initImageLazyLoad();
            
            this.initialized = true;
            
            // 페이지별 초기화
            this.initPageSpecific();

            // 커스텀 이벤트 발생
            Utils.Event.trigger(document, 'app:initialized', { page: this.currentPage });
        },

        // 현재 페이지 감지
        detectCurrentPage() {
            const path = window.location.pathname;
            const fileName = path.split('/').pop() || 'index';
            
            if (fileName.includes('main')) {
                this.currentPage = 'main';
            } else if (fileName.includes('spaces')) {
                this.currentPage = 'spaces';
            } else if (fileName.includes('amenities')) {
                this.currentPage = 'amenities';
            } else if (fileName.includes('room')) {
                this.currentPage = 'room';
            } else if (fileName.includes('bbq')) {
                this.currentPage = 'bbq';
            } else if (fileName.includes('pool')) {
                this.currentPage = 'pool';
            } else {
                this.currentPage = 'default';
            }
        },

        // 전역 이벤트 리스너 설정
        initEventListeners() {
            // 윈도우 리사이즈
            Utils.Event.on(window, 'resize', Utils.Performance.throttle(() => {
                this.handleResize();
            }, 250));

            // 스크롤 이벤트
            Utils.Event.on(window, 'scroll', Utils.Performance.throttle(() => {
                this.handleScroll();
            }, 16));

            // 페이지 가시성 변경
            Utils.Event.on(document, 'visibilitychange', () => {
                this.handleVisibilityChange();
            });

            // 키보드 이벤트 (접근성)
            Utils.Event.on(document, 'keydown', (e) => {
                this.handleKeydown(e);
            });
        },

        // 스크롤 효과 초기화
        initScrollEffects() {
            const elementsToAnimate = Utils.DOM.$$('[data-animate-on-scroll]');
            
            if (elementsToAnimate.length === 0) return;

            // Intersection Observer 설정
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const animationType = element.dataset.animateOnScroll || 'fade-in-up';
                        
                        Utils.DOM.addClass(element, 'animate-' + animationType);
                        observer.unobserve(element);
                    }
                });
            }, observerOptions);

            elementsToAnimate.forEach(el => {
                observer.observe(el);
            });
        },

        // 네비게이션 초기화
        initNavigation() {
            // 부드러운 스크롤 앵커 링크
            const anchorLinks = Utils.DOM.$$('a[href^="#"]');
            
            anchorLinks.forEach(link => {
                Utils.Event.on(link, 'click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = Utils.DOM.$('#' + targetId);
                    
                    if (targetElement) {
                        const offsetTop = targetElement.offsetTop - this.config.scrollOffset;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // 모바일 메뉴 토글
            const menuToggle = Utils.DOM.$('.menu-toggle');
            const mobileMenu = Utils.DOM.$('.mobile-menu');
            
            if (menuToggle && mobileMenu) {
                Utils.Event.on(menuToggle, 'click', () => {
                    Utils.DOM.toggleClass(mobileMenu, 'active');
                    Utils.DOM.toggleClass(menuToggle, 'active');
                });
            }
        },

        // 폼 초기화
        initForms() {
            const forms = Utils.DOM.$$('form[data-validate]');
            
            forms.forEach(form => {
                Utils.Event.on(form, 'submit', (e) => {
                    e.preventDefault();
                    this.validateForm(form);
                });

                // 실시간 유효성 검사
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    Utils.Event.on(input, 'blur', () => {
                        this.validateField(input);
                    });
                });
            });
        },

        // 모달 초기화
        initModals() {
            const modalTriggers = Utils.DOM.$$('[data-modal-trigger]');
            
            modalTriggers.forEach(trigger => {
                Utils.Event.on(trigger, 'click', (e) => {
                    e.preventDefault();
                    const modalId = trigger.dataset.modalTrigger;
                    this.openModal(modalId);
                });
            });

            // 모달 닫기
            Utils.Event.on(document, 'click', (e) => {
                if (e.target.matches('.modal-close, .modal-backdrop')) {
                    this.closeModal();
                }
            });

            // ESC 키로 모달 닫기
            Utils.Event.on(document, 'keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            });
        },

        // 이미지 지연 로딩 초기화
        initImageLazyLoad() {
            if ('IntersectionObserver' in window) {
                const lazyImages = Utils.DOM.$$('img[data-src]');
                
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            Utils.DOM.removeClass(img, 'lazy');
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px'
                });

                lazyImages.forEach(img => imageObserver.observe(img));
            }
        },

        // 페이지별 특화 초기화
        initPageSpecific() {
            switch (this.currentPage) {
                case 'main':
                    this.initMainPage();
                    break;
                case 'spaces':
                    this.initSpacesPage();
                    break;
                case 'amenities':
                    this.initAmenitiesPage();
                    break;
                case 'room':
                    this.initRoomPage();
                    break;
                default:
            }
        },

        // 스페이스 페이지 초기화
        initSpacesPage() {
            // Room 카드 호버 효과 개선
            const roomCards = Utils.DOM.$$('.room-card');
            roomCards.forEach(card => {
                Utils.Event.on(card, 'mouseenter', () => {
                    Utils.DOM.addClass(card, 'hover-active');
                });
                
                Utils.Event.on(card, 'mouseleave', () => {
                    Utils.DOM.removeClass(card, 'hover-active');
                });
            });
        },

        // 어메니티 페이지 초기화
        initAmenitiesPage() {
            // 갤러리 그리드 초기화
            const galleries = Utils.DOM.$$('[data-animated-gallery]');
            galleries.forEach(gallery => {
                // 이미 초기화된 갤러리인지 확인
                if (!gallery.classList.contains('animated-fade-gallery')) {
                    // 수동 갤러리 초기화 로직 추가 가능
                }
            });
        },

        // 이벤트 핸들러들
        handleResize() {
            const width = window.innerWidth;
            
            // 브레이크포인트 감지
            if (width <= this.config.breakpoints.mobile) {
                Utils.Event.trigger(document, 'breakpoint:mobile');
            } else if (width <= this.config.breakpoints.tablet) {
                Utils.Event.trigger(document, 'breakpoint:tablet');
            } else {
                Utils.Event.trigger(document, 'breakpoint:desktop');
            }
        },

        handleScroll() {
            const scrollTop = window.pageYOffset;
            
            // 헤더 스크롤 효과
            const header = Utils.DOM.$('header, .header');
            if (header) {
                if (scrollTop > 100) {
                    Utils.DOM.addClass(header, 'scrolled');
                } else {
                    Utils.DOM.removeClass(header, 'scrolled');
                }
            }

            // Back to top 버튼
            const backToTop = Utils.DOM.$('.back-to-top');
            if (backToTop) {
                if (scrollTop > 300) {
                    Utils.DOM.addClass(backToTop, 'visible');
                } else {
                    Utils.DOM.removeClass(backToTop, 'visible');
                }
            }

            Utils.Event.trigger(document, 'app:scroll', { scrollTop });
        },

        handleVisibilityChange() {
            if (document.hidden) {
                Utils.Event.trigger(document, 'app:hidden');
            } else {
                Utils.Event.trigger(document, 'app:visible');
            }
        },

        handleKeydown(e) {
            // 접근성을 위한 키보드 네비게이션
            if (e.key === 'Tab') {
                Utils.DOM.addClass(document.body, 'keyboard-nav');
            }
        },

        // 유틸리티 메서드들
        validateForm(form) {
            let isValid = true;
            const fields = form.querySelectorAll('input, textarea, select');
            
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (isValid) {
                this.submitForm(form);
            }

            return isValid;
        },

        validateField(field) {
            const value = field.value.trim();
            const rules = field.dataset.validate ? field.dataset.validate.split('|') : [];
            let isValid = true;
            let errorMessage = '';

            rules.forEach(rule => {
                if (rule === 'required' && !value) {
                    isValid = false;
                    errorMessage = '필수 입력 항목입니다.';
                } else if (rule === 'email' && value && !Utils.Validation.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = '올바른 이메일 주소를 입력해주세요.';
                } else if (rule === 'phone' && value && !Utils.Validation.isValidPhone(value)) {
                    isValid = false;
                    errorMessage = '올바른 전화번호를 입력해주세요.';
                }
            });

            this.showFieldError(field, isValid ? null : errorMessage);
            return isValid;
        },

        showFieldError(field, message) {
            const errorElement = field.parentNode.querySelector('.field-error');
            
            if (message) {
                Utils.DOM.addClass(field, 'error');
                if (!errorElement) {
                    const error = Utils.DOM.createElement('div', {
                        className: 'field-error',
                        textContent: message
                    });
                    field.parentNode.appendChild(error);
                } else {
                    errorElement.textContent = message;
                }
            } else {
                Utils.DOM.removeClass(field, 'error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        },

        submitForm(form) {
            // 폼 제출 로직 (실제 구현 필요)
            Utils.Event.trigger(form, 'form:submitted');
        },

        openModal(modalId) {
            const modal = Utils.DOM.$('#' + modalId);
            if (modal) {
                Utils.DOM.addClass(modal, 'active');
                Utils.DOM.addClass(document.body, 'modal-open');
                Utils.Event.trigger(modal, 'modal:opened');
            }
        },

        closeModal() {
            const activeModal = Utils.DOM.$('.modal.active');
            if (activeModal) {
                Utils.DOM.removeClass(activeModal, 'active');
                Utils.DOM.removeClass(document.body, 'modal-open');
                Utils.Event.trigger(activeModal, 'modal:closed');
            }
        }
    };

    // DOM 준비 완료시 앱 초기화
    if (document.readyState === 'loading') {
        Utils.Event.on(document, 'DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // 전역 App 객체 노출
    window.App = App;

})();