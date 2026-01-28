/**
 * Index Page Data Mapper
 * Extends BaseDataMapper for Index page specific mappings
 */
class IndexMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    /**
     * 메인 매핑 메서드
     */
    async mapPage() {
        if (!this.isDataLoaded) return;

        try {
            // SEO 메타 태그 업데이트
            this.updateMetaTags();

            // 각 섹션 매핑
            this.mapHeroSection();
            this.mapEssenceSection();
            this.mapRoomsSection();
            this.mapGallerySection();
            this.mapClosingSection();

            // E-commerce 등록번호 매핑 (footer)
            this.mapEcommerceRegistration();

            // 애니메이션 재초기화
            this.reinitializeScrollAnimations();

            // 슬라이더 재초기화
            this.reinitializeSliders();

        } catch (error) {
            console.error('IndexMapper mapPage error:', error);
        }
    }

    /**
     * 슬라이더 재초기화
     */
    reinitializeSliders() {
        // Hero 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // Essence 슬라이더는 initEssenceImages에서 초기화됨

        // Gallery 슬라이더 재초기화
        if (typeof window.setupInfiniteSlider === 'function') {
            const gallerySlider = document.querySelector('.gallery-slider');
            if (gallerySlider && gallerySlider.querySelectorAll('.gallery-item').length > 0) {
                window.setupInfiniteSlider();
                if (typeof window.setupDragAndSwipe === 'function') {
                    window.setupDragAndSwipe();
                }
            }
        }
    }

    /**
     * 스크롤 애니메이션 재초기화
     */
    reinitializeScrollAnimations() {
        // mapRoomsSection 이후에 실행되도록 setTimeout 사용
        setTimeout(() => {
            if (typeof window.initScrollAnimations === 'function') {
                window.initScrollAnimations();
            } else {
                // initScrollAnimations 함수가 없으면 직접 애니메이션 등록
                this.initDirectAnimations();
            }
        }, 200);
    }

    /**
     * 직접적인 애니메이션 등록 (fallback)
     */
    initDirectAnimations() {
        console.log('Index Mapper: Using direct animations');

        const animationPairs = [
            { selector: '.room-item', className: 'animate-fade-in' },
            { selector: '.gallery-item', className: 'animate-fade-in' },
            { selector: '.rooms-title', className: 'animate-slide-right' },
            { selector: '.gallery-section-title', className: 'animate-slide-left' },
            { selector: '.gallery-title', className: 'animate-slide-up' },
            { selector: '.gallery-description', className: 'animate-slide-up' }
        ];

        if (typeof IntersectionObserver !== 'undefined') {
            animationPairs.forEach(pair => {
                const elements = document.querySelectorAll(pair.selector);
                elements.forEach(element => {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add(pair.className);
                                observer.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

                    observer.observe(element);
                });
            });
        } else {
            // IntersectionObserver가 지원되지 않으면 즉시 애니메이션 클래스 추가
            animationPairs.forEach(pair => {
                const elements = document.querySelectorAll(pair.selector);
                elements.forEach(el => el.classList.add(pair.className));
            });
        }
    }

    // ============================================================================
    // 🎯 HERO SECTION MAPPING
    // ============================================================================

    /**
     * Hero Section 매핑 (메인 소개 섹션)
     */
    mapHeroSection() {
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.hero');
        if (!heroData) return;

        // 숙소 영문명 매핑 (customFields 우선)
        const propertyNameEn = this.getPropertyNameEn();
        const heroPropertyNameEn = this.safeSelect('[data-hero-property-name-en]');
        if (heroPropertyNameEn) {
            heroPropertyNameEn.textContent = propertyNameEn;
        }

        // 메인 소개 타이틀 매핑
        const heroTitleElement = this.safeSelect('[data-hero-title]');
        if (heroTitleElement) {
            heroTitleElement.textContent = this.sanitizeText(heroData?.title, '메인 히어로 타이틀');
        }

        // 메인 소개 설명 매핑
        const heroDescElement = this.safeSelect('[data-hero-description]');
        if (heroDescElement) {
            heroDescElement.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '메인 히어로 설명');
        }

        // 히어로 슬라이더 이미지 매핑
        if (heroData.images && Array.isArray(heroData.images)) {
            // window.heroImageData에 이미지 저장 (index.js에서 사용)
            window.heroImageData = {
                images: heroData.images
            };
            this.mapHeroSlider(heroData.images);
        }
    }

    /**
     * Hero Slider 이미지 매핑
     */
    mapHeroSlider(images) {
        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        const isDemo = this.dataSource === 'demo-filled.json';

        // 이미지 배열 정규화 (url, description 포함)
        let normalizedImages = [];
        if (images && Array.isArray(images) && images.length > 0) {
            if (typeof images[0] === 'string') {
                // 문자열 배열인 경우
                normalizedImages = images.map(url => ({ url, description: '' }));
            } else {
                // 객체 배열인 경우 (API 데이터)
                normalizedImages = images
                    .filter(img => img.isSelected === true)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(img => ({ url: img.url, description: img.description || '' }));
            }
        }

        // 슬라이더 초기화
        sliderContainer.innerHTML = '';

        if (normalizedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 슬라이드 추가
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide active';

            const imgElement = document.createElement('img');

            if (isDemo) {
                imgElement.src = './images/hero.jpg';
                imgElement.alt = '히어로 이미지';
            } else {
                imgElement.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                imgElement.alt = '이미지 없음';
                imgElement.classList.add('empty-image-placeholder');
            }

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        // 이미지 생성
        normalizedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide';
            if (index === 0) {
                slideDiv.classList.add('active');
            }

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.alt = this.sanitizeText(img.description, '히어로 이미지');
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });
    }

    // ============================================================================
    // 💎 ESSENCE SECTION MAPPING
    // ============================================================================

    /**
     * Essence Section 매핑 (핵심 메시지 섹션)
     */
    mapEssenceSection() {
        const essenceData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.essence');
        if (!essenceData) return;

        // 숙소 영문명 매핑 (customFields 우선)
        const propertyNameEn = this.getPropertyNameEn();
        const propertyNameElement = this.safeSelect('[data-property-name-en]');
        if (propertyNameElement) {
            propertyNameElement.textContent = propertyNameEn;
        }

        // 타이틀 매핑
        const titleElement = this.safeSelect('[data-essence-title]');
        if (titleElement) {
            titleElement.textContent = this.sanitizeText(essenceData?.title, '특징 섹션 타이틀');
        }

        // 설명 매핑
        const descElement = this.safeSelect('[data-essence-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(essenceData?.description, '특징 섹션 설명');
        }

        // 이미지 매핑 - 3개 이미지 순환 슬라이더용
        this.initEssenceImages(essenceData.images || []);
    }

    /**
     * Essence 이미지 초기화 (갯수 제한 없음)
     */
    initEssenceImages(images) {
        const isDemo = this.dataSource === 'demo-filled.json';

        // 기본 이미지 설정 (demo용) - {url, description} 형태
        const defaultImages = [
            { url: './images/pool.jpg', description: '에센스 이미지' },
            { url: './images/sky.jpg', description: '에센스 이미지' },
            { url: './images/shadow.jpg', description: '에센스 이미지' }
        ];

        // empty-image (standard-template-data.json용)
        const emptyImageObj = { url: ImageHelpers.EMPTY_IMAGE_WITH_ICON, description: '' };

        // 이미지 배열 정규화 ({url, description} 형태)
        let normalizedImages = [];
        if (images && Array.isArray(images) && images.length > 0) {
            if (typeof images[0] === 'string') {
                // 문자열 배열인 경우
                normalizedImages = images.map(url => ({ url, description: '' }));
            } else {
                // 객체 배열인 경우 (API 데이터)
                normalizedImages = images
                    .filter(img => img.isSelected !== false)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(img => ({ url: img.url, description: img.description || '' }));
            }
        }

        // 최종 이미지 배열 생성
        let finalImages;
        let useEmptyImage = false;

        if (normalizedImages.length === 0) {
            if (isDemo) {
                finalImages = defaultImages;
            } else {
                finalImages = [emptyImageObj, emptyImageObj, emptyImageObj];
                useEmptyImage = true;
            }
        } else if (normalizedImages.length === 1) {
            finalImages = [
                normalizedImages[0],
                isDemo ? defaultImages[1] : emptyImageObj,
                isDemo ? defaultImages[2] : emptyImageObj
            ];
        } else if (normalizedImages.length === 2) {
            finalImages = [
                normalizedImages[0],
                normalizedImages[1],
                isDemo ? defaultImages[2] : emptyImageObj
            ];
        } else {
            finalImages = normalizedImages;
        }

        // window에 이미지 데이터 저장 (index.js에서 사용)
        window.essenceImageData = {
            images: finalImages.map(img => img.url),
            descriptions: finalImages.map(img => img.description)
        };

        // 초기 이미지 설정 (첫 3개만 HTML에 설정)
        const mainImg = this.safeSelect('[data-essence-image]');
        const thumb1 = this.safeSelect('.essence-thumb[data-slide="0"] img');
        const thumb2 = this.safeSelect('.essence-thumb[data-slide="1"] img');

        if (mainImg && finalImages.length > 2) {
            mainImg.src = finalImages[2].url;
            mainImg.alt = useEmptyImage ? '이미지 없음' : this.sanitizeText(finalImages[2].description, '에센스 이미지');
            if (useEmptyImage) mainImg.classList.add('empty-image-placeholder');
        }
        if (thumb1 && finalImages.length > 0) {
            thumb1.src = finalImages[0].url;
            thumb1.alt = useEmptyImage ? '이미지 없음' : this.sanitizeText(finalImages[0].description, '에센스 이미지');
            if (useEmptyImage) thumb1.classList.add('empty-image-placeholder');
        }
        if (thumb2 && finalImages.length > 1) {
            thumb2.src = finalImages[1].url;
            thumb2.alt = useEmptyImage ? '이미지 없음' : this.sanitizeText(finalImages[1].description, '에센스 이미지');
            if (useEmptyImage) thumb2.classList.add('empty-image-placeholder');
        }

        // 이미지 로드 후 슬라이더 초기화
        setTimeout(() => {
            if (typeof window.initEssenceSlider === 'function') {
                window.initEssenceSlider();
            }
        }, 100);
    }

    // ============================================================================
    // 🖼️ GALLERY SECTION MAPPING
    // ============================================================================

    /**
     * Gallery Section 매핑 (갤러리 섹션)
     */
    mapGallerySection() {
        const galleryData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.gallery');

        // Gallery 섹션 타이틀에 숙소 영문명 매핑 (customFields 우선)
        const propertyNameEn = this.getPropertyNameEn();
        const galleryPropertyNameElement = this.safeSelect('[data-gallery-property-name]');
        if (galleryPropertyNameElement) {
            galleryPropertyNameElement.textContent = propertyNameEn;
        }

        // 데이터가 없어도 기본 텍스트라도 보이도록 처리
        if (!galleryData) {
            // 타이틀 매핑 (fallback)
            const titleElement = this.safeSelect('[data-gallery-title]');
            if (titleElement) {
                titleElement.textContent = '갤러리';
            }

            // 설명 매핑 (fallback)
            const descElement = this.safeSelect('[data-gallery-description]');
            if (descElement) {
                descElement.textContent = '이미지가 준비 중입니다.';
            }

            // 갤러리 아이템 매핑 (빈 배열 → isDemo 체크로 empty-image 또는 fallback)
            this.mapGalleryItems([]);
            return;
        }

        // 타이틀 매핑
        const titleElement = this.safeSelect('[data-gallery-title]');
        if (titleElement) {
            titleElement.textContent = this.sanitizeText(galleryData?.title, '갤러리 섹션 타이틀');
        }

        // 설명 매핑
        const descElement = this.safeSelect('[data-gallery-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(galleryData?.description, '갤러리 섹션 설명');
        }

        // 갤러리 아이템 매핑
        const images = galleryData.images && Array.isArray(galleryData.images) ? galleryData.images : [];
        this.mapGalleryItems(images);
    }

    /**
     * Gallery Items 동적 생성
     */
    mapGalleryItems(images) {
        const sliderContainer = this.safeSelect('[data-gallery-grid]');
        if (!sliderContainer) return;

        const isDemo = this.dataSource === 'demo-filled.json';

        // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬 (최대 5개)
        const selectedImages = images
            .filter(img => img.isSelected === true)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(0, 5);

        // 기존 내용 초기화
        sliderContainer.innerHTML = '';

        // 이미지가 없을 때 처리
        if (selectedImages.length === 0) {
            if (isDemo) {
                // demo 모드: fallback 이미지 사용
                const fallbackImages = [
                    './images/sky.jpg',
                    './images/pool.jpg',
                    './images/shadow.jpg',
                    './images/exterior.jpg',
                    './images/flower.jpg'
                ];

                fallbackImages.forEach((imageUrl, index) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'gallery-item';

                    const imgElement = document.createElement('img');
                    imgElement.src = imageUrl;
                    imgElement.alt = '이미지 설명';

                    const descriptionSpan = document.createElement('span');
                    descriptionSpan.className = 'gallery-item-description';
                    descriptionSpan.textContent = '이미지 설명';

                    itemDiv.appendChild(imgElement);
                    itemDiv.appendChild(descriptionSpan);
                    sliderContainer.appendChild(itemDiv);
                });
            } else {
                // standard-template-data.json: empty-image placeholder 사용
                const emptyImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;

                for (let i = 0; i < 5; i++) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'gallery-item';

                    const imgElement = document.createElement('img');
                    imgElement.src = emptyImage;
                    imgElement.alt = '이미지 없음';
                    imgElement.classList.add('empty-image-placeholder');

                    const descriptionSpan = document.createElement('span');
                    descriptionSpan.className = 'gallery-item-description';
                    descriptionSpan.textContent = '이미지 설명';

                    itemDiv.appendChild(imgElement);
                    itemDiv.appendChild(descriptionSpan);
                    sliderContainer.appendChild(itemDiv);
                }
            }
            return;
        }


        // 갤러리 아이템 생성 (5개 고정)
        for (let i = 0; i < 5; i++) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';

            const imgElement = document.createElement('img');
            const descriptionSpan = document.createElement('span');
            descriptionSpan.className = 'gallery-item-description';

            if (i < selectedImages.length) {
                // 선택된 이미지가 있는 경우
                const img = selectedImages[i];
                imgElement.src = img.url;
                imgElement.alt = this.sanitizeText(img.description, '이미지 설명');
                imgElement.loading = 'lazy';
                descriptionSpan.textContent = this.sanitizeText(img.description, '이미지 설명');
            } else {
                // 이미지가 없는 슬롯은 empty-image로 채움
                imgElement.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                imgElement.alt = '이미지 없음';
                imgElement.classList.add('empty-image-placeholder');
                descriptionSpan.textContent = '이미지 설명';
            }

            itemDiv.appendChild(imgElement);
            itemDiv.appendChild(descriptionSpan);
            sliderContainer.appendChild(itemDiv);
        }
    }

    // ============================================================================
    // 🏠 ROOMS SECTION MAPPING
    // ============================================================================

    /**
     * Rooms Section 매핑
     */
    mapRoomsSection() {
        const roomsData = this.safeGet(this.data, 'rooms');
        if (!roomsData || !Array.isArray(roomsData)) return;

        const roomsContainer = this.safeSelect('[data-rooms-grid]');
        if (!roomsContainer) return;

        // 전체 룸 표시
        const displayRooms = roomsData;

        roomsContainer.innerHTML = '';

        displayRooms.forEach((room) => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            // 전체 클릭 이벤트 제거 - ROOM VIEW 버튼만 클릭 가능

            // 객실명 가져오기 (customFields 우선)
            const roomName = this.getRoomName(room);
            const isShortText = roomName.length <= 7; // 7글자 이하면 줄 표시

            // 룸 이미지 (customFields 우선, thumbnail 카테고리)
            const thumbnailImages = this.getRoomImages(room, 'roomtype_thumbnail');
            const isDemo = this.dataSource === 'demo-filled.json';
            let roomImage, imageClass;

            if (thumbnailImages.length > 0 && thumbnailImages[0]?.url) {
                roomImage = thumbnailImages[0].url;
                imageClass = '';
            } else if (isDemo) {
                // demo-filled.json: 기본 이미지 사용
                roomImage = './images/room.jpg';
                imageClass = '';
            } else {
                // standard-template-data.json: empty-image 사용
                roomImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                imageClass = 'empty-image-placeholder';
            }

            roomItem.innerHTML = `
                <div class="room-number${isShortText ? ' short-text' : ''}">${roomName}</div>
                <div class="room-image">
                    <img alt="${roomName}" loading="lazy" class="${imageClass}">
                </div>
                <div class="room-content">
                    <h3 class="room-name">${roomName}</h3>
                    <p class="room-description">${this._formatTextWithLineBreaks(room.description, '객실 설명')}</p>
                    <button class="room-view-btn" onclick="navigateTo('room', '${room.id}')">
                        ROOM VIEW
                    </button>
                </div>
            `;

            // src는 직접 할당 (data URI 깨짐 방지)
            roomItem.querySelector('.room-image img').src = roomImage;

            roomsContainer.appendChild(roomItem);
        });

        // 드래그 스크롤 기능 추가
        this.addDragScrollToRooms(roomsContainer);
    }

    /**
     * 룸 컨테이너에 드래그 스크롤 기능 추가
     */
    addDragScrollToRooms(container) {
        let isDown = false;
        let startX;
        let scrollLeft;

        // 마우스 이벤트
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.style.cursor = 'grabbing';
            container.style.scrollBehavior = 'auto';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            e.preventDefault();
        });

        document.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
            container.style.scrollBehavior = 'smooth';
        });

        document.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
            container.style.scrollBehavior = 'smooth';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        });

        // 터치 이벤트
        let startTouchX = 0;
        let startScrollLeft = 0;
        let isScrolling = false;

        container.addEventListener('touchstart', (e) => {
            startTouchX = e.touches[0].pageX;
            startScrollLeft = container.scrollLeft;
            isScrolling = true;
            container.style.scrollBehavior = 'auto';

            // 모바일에서 수직 스크롤 방지
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;

            const touchX = e.touches[0].pageX;
            const walk = startTouchX - touchX;

            // 수평 이동이 충분할 때만 스크롤 방지
            if (Math.abs(walk) > 5) {
                e.preventDefault();
                e.stopPropagation();
            }

            container.scrollLeft = startScrollLeft + walk;
        }, { passive: false });

        container.addEventListener('touchend', () => {
            isScrolling = false;
            container.style.scrollBehavior = 'smooth';

            // 스크롤 복원
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }, { passive: false });

        // 부드러운 스크롤 추가
        container.style.scrollBehavior = 'smooth';
    }

    /**
     * 룸 페이지로 이동
     */
    navigateToRoom(roomId) {
        if (typeof navigateTo === 'function') {
            navigateTo('room', roomId);
        }
    }

    // ============================================================================
    // 🎬 CLOSING SECTION MAPPING
    // ============================================================================

    /**
     * Closing Section 매핑 (마무리 섹션)
     */
    mapClosingSection() {
        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');
        const isDemo = this.dataSource === 'demo-filled.json';

        // 배경 이미지 매핑
        const bgImg = this.safeSelect('[data-closing-bg-img]');
        if (bgImg) {
            // isSelected: true인 이미지만 필터링하고 정렬
            const selectedImages = (closingData?.images || [])
                .filter(img => img.isSelected === true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            if (selectedImages.length > 0) {
                bgImg.src = selectedImages[0].url;
                bgImg.classList.remove('empty-image-placeholder');
            } else if (isDemo) {
                bgImg.src = './images/sky.jpg';
                bgImg.classList.remove('empty-image-placeholder');
            } else {
                bgImg.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                bgImg.classList.add('empty-image-placeholder');
            }
            bgImg.alt = 'Closing Background';
        }

        // 숙소 영문명 매핑 (customFields 우선, 굵은 세로 텍스트)
        const propertyNameEn = this.getPropertyNameEn();
        const closingPropertyName = this.safeSelect('[data-closing-property-name]');
        if (closingPropertyName) {
            closingPropertyName.textContent = propertyNameEn;
        }

        // 타이틀 매핑 (얇은 세로 텍스트)
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }

        // 설명 매핑 (가로 텍스트)
        const descElement = this.safeSelect('[data-closing-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(
                closingData?.description,
                '마무리 섹션 설명'
            );
        }
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화 (로컬 환경용, iframe 아닐 때만)
if (typeof window !== 'undefined' && window.parent === window) {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new IndexMapper();
        await mapper.initialize();
        // 매핑 완료 알림 (index.js에서 수신)
        window.dispatchEvent(new CustomEvent('mapperReady'));
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexMapper;
} else {
    window.IndexMapper = IndexMapper;
}
