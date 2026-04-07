/**
 * Directions Page Data Mapper
 * directions.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 오시는길 페이지 전용 기능 제공
 */
class DirectionsMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🗺️ DIRECTIONS PAGE MAPPINGS
    // ============================================================================

    /**
     * Hero 슬라이더 매핑
     * homepage.customFields.pages.directions.sections[0].hero.images → [data-hero-slider]
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');
        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        const images = heroData?.images || [];
        let normalizedImages = [];

        if (images.length > 0) {
            if (typeof images[0] === 'string') {
                normalizedImages = images.map(url => ({ url, description: '' }));
            } else {
                normalizedImages = images
                    .filter(img => img.isSelected === true)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(img => ({ url: img.url, description: img.description || '' }));
            }
        }

        sliderContainer.innerHTML = '';

        if (normalizedImages.length === 0) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'main-slide';
            const imgEl = document.createElement('img');
            imgEl.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            imgEl.alt = '이미지 없음';
            imgEl.classList.add('empty-image-placeholder');
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        normalizedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'main-slide';
            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.alt = this.sanitizeText(img.description, '오시는길 이미지');
            imgEl.loading = index === 0 ? 'eager' : 'lazy';
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
        });
    }

    /**
     * Hero 콘텐츠 매핑 (타이틀, 설명)
     * homepage.customFields.pages.directions.sections[0].hero → [data-directions-title], [data-directions-description]
     */
    mapHeroContent() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');

        const titleEl = this.safeSelect('[data-directions-title]');
        if (titleEl) {
            titleEl.textContent = this.sanitizeText(heroData?.title, '오시는길 타이틀');
        }

        const descEl = this.safeSelect('[data-directions-description]');
        if (descEl) {
            const firstImage = (heroData?.images || [])
                .filter(img => img.isSelected === true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
            descEl.innerHTML = this._formatTextWithLineBreaks(firstImage?.description, '오시는길 설명');
        }
    }

    /**
     * Location Info 섹션 매핑 (주소, 전화번호)
     * property.address → [data-directions-address]
     * property.contactPhone → [data-directions-phone]
     */
    mapLocationInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 주소 매핑
        const addressEl = this.safeSelect('[data-directions-address]');
        if (addressEl) {
            const address = property?.location?.address || property?.address;
            addressEl.textContent = this.sanitizeText(address, '숙소 주소');
        }

        // 전화번호 매핑
        const phoneEl = this.safeSelect('[data-directions-phone]');
        if (phoneEl) {
            phoneEl.textContent = this.sanitizeText(property?.contactPhone, '전화번호');
        }
    }

    /**
     * Kakao 지도 초기화
     * property.latitude, property.longitude → #kakao-map
     * SDK: directions.html에서 js/kakao-maps-sdk.js 정적 로드
     */
    initKakaoMap() {
        if (!this.isDataLoaded) return;

        const mapContainer = document.getElementById('kakao-map');
        if (!mapContainer) return;

        const lat = this.data?.property?.latitude;
        const lng = this.data?.property?.longitude;

        if (!lat || !lng) {
            const img = document.createElement('img');
            img.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            img.alt = '지도';
            img.classList.add('empty-image-placeholder');
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            mapContainer.appendChild(img);
            return;
        }

        if (!window.kakao || !window.kakao.maps) {
            console.warn('[DirectionsMapper] Kakao SDK not loaded');
            return;
        }

        kakao.maps.load(() => {
            this._createKakaoMap(lat, lng, mapContainer);
        });
    }

    /**
     * 카카오 지도 생성 (마커 포함)
     */
    _createKakaoMap(lat, lng, container) {
        const coords = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(container, {
            center: coords,
            level: 5
        });
        const marker = new kakao.maps.Marker({ position: coords });
        marker.setMap(map);
    }

    /**
     * Closing Section 매핑 (index 페이지 closing 데이터 재사용)
     * homepage.customFields.pages.index.sections[0].closing → [data-closing-image], [data-closing-title], [data-closing-description]
     */
    mapClosingSection() {
        if (!this.isDataLoaded) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        // 배경 이미지 매핑
        const bgEl = this.safeSelect('[data-closing-image]');
        if (bgEl) {
            const selectedImages = (closingData?.images || [])
                .filter(img => img.isSelected === true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            if (selectedImages.length > 0) {
                bgEl.style.backgroundImage = `url('${selectedImages[0].url}')`;
                bgEl.classList.remove('empty-image-placeholder');
            } else {
                bgEl.style.backgroundImage = `url('${ImageHelpers.EMPTY_IMAGE_WITH_ICON}')`;
                bgEl.classList.add('empty-image-placeholder');
            }
        }

        // 타이틀 매핑
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }

        // 설명 매핑
        const descEl = this.safeSelect('[data-closing-description]');
        if (descEl) {
            descEl.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Directions 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        this.mapHeroSlider();
        this.mapHeroContent();
        this.mapLocationInfo();
        this.mapClosingSection();
        this.initKakaoMap();

        // 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // 메타 태그 업데이트
        this.updateMetaTags();

        // 스크롤 애니메이션 재초기화
        if (typeof window.setupScrollAnimations === 'function') {
            window.setupScrollAnimations();
        }
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화 (로컬 환경용, iframe 아닐 때만)
if (typeof window !== 'undefined' && window.parent === window) {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new DirectionsMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectionsMapper;
} else {
    window.DirectionsMapper = DirectionsMapper;
}
