/**
 * Nearby Attractions Page Data Mapper
 * nearby-attractions.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 주변 관광지 페이지 특화 기능 제공
 */
class NearbyAttractionsMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 NEARBY ATTRACTIONS PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 이미지 매핑
     * homepage.customFields.nearbyAttractions.sections[0].hero.images → [data-nearby-attractions-hero-slider]
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.nearbyAttractions.sections.0.hero');
        const sliderContainer = this.safeSelect('[data-nearby-attractions-hero-slider]');
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
            imgEl.alt = this.sanitizeText(img.description, '주변 관광지 히어로 이미지');
            imgEl.loading = index === 0 ? 'eager' : 'lazy';
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
        });
    }

    /**
     * Hero 섹션 제목/설명 매핑
     * customFields.nearbyAttractions.sections[0].hero.title → [data-nearby-attractions-hero-title]
     * customFields.nearbyAttractions.sections[0].hero.description → [data-nearby-attractions-hero-description]
     */
    mapHeroContent() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.nearbyAttractions.sections.0.hero');

        // Hero 제목 매핑
        const heroTitle = this.safeSelect('[data-nearby-attractions-hero-title]');
        if (heroTitle) {
            heroTitle.textContent = this.sanitizeText(heroData?.title, '주변 관광지 히어로 타이틀');
        }

        // Hero 설명 매핑
        const heroDescription = this.safeSelect('[data-nearby-attractions-hero-description]');
        if (heroDescription) {
            heroDescription.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '주변 관광지 히어로 설명');
        }
    }

    /**
     * About 섹션 매핑 (관광지 블록 목록 동적 생성)
     * homepage.customFields.nearbyAttractions.sections[0].about[] → [data-nearby-attractions-about]
     */
    mapAboutSection() {
        if (!this.isDataLoaded) return;

        const aboutBlocks = this.safeGet(this.data, 'homepage.customFields.pages.nearbyAttractions.sections.0.about');
        const aboutContainer = this.safeSelect('[data-nearby-attractions-about]');
        const isDemo = this.dataSource === 'demo-filled.json';

        if (!aboutContainer) {
            return;
        }

        // 기존 about-block 제거
        aboutContainer.innerHTML = '';

        // 블록 리스트
        let blocksToRender = Array.isArray(aboutBlocks) ? [...aboutBlocks] : [];

        // 블록이 없으면 최소 1개 더미 블록 추가
        if (blocksToRender.length === 0) {
            blocksToRender.push(isDemo ? {
                title: '관광지명',
                description: '관광지 설명',
                images: ['./images/room.jpg']
            } : {
                title: '관광지명',
                description: '관광지 설명',
                images: [ImageHelpers.EMPTY_IMAGE_WITH_ICON],
                isEmpty: true
            });
        }

        // arrow-number 업데이트
        const arrowCount = this.safeSelect('[data-attractions-count]');
        if (arrowCount) {
            arrowCount.textContent = String(blocksToRender.length).padStart(2, '0');
        }

        // 각 attraction-block 생성
        blocksToRender.forEach((block, index) => {
            const attractionBlock = this.createAttractionBlock(block, index, isDemo);
            aboutContainer.appendChild(attractionBlock);
        });
    }

    /**
     * attraction-block 생성 헬퍼 함수
     * 3개까지 이미지를 아코디언 갤러리로 표시
     * 번갈아 레이아웃: odd, even 클래스 추가
     */
    createAttractionBlock(block, index, isDemo = true) {
        const isOdd = index % 2 === 0;
        const defaultImage = './images/room.jpg';
        const emptyImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;

        const block1 = document.createElement('div');
        block1.className = `attraction-block ${isOdd ? 'odd' : 'even'}`;

        // 이미지 갤러리 (최대 3개)
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'attraction-image';

        const imgGrid = document.createElement('div');
        imgGrid.className = 'img-grid';

        // 이미지 3개까지 처리 (isSelected true만)
        let images = block.images && Array.isArray(block.images) ? block.images : [];
        // 객체 배열인 경우 isSelected 필터링
        if (images.length > 0 && typeof images[0] === 'object') {
            images = images.filter(img => img.isSelected === true);
        }
        images = images.slice(0, 3);

        const imageUrls = images.map(img =>
            typeof img === 'string' ? img : (img && img.url ? img.url : null)
        ).filter(Boolean);

        if (imageUrls.length === 0 && !block.isEmpty) {
            imageUrls.push(isDemo ? defaultImage : emptyImage);
        }

        if (imageUrls.length === 0 && block.isEmpty) {
            imageUrls.push(emptyImage);
        }

        // 이미지가 1개일 때 single-image 클래스 추가
        if (imageUrls.length === 1) {
            imgWrapper.classList.add('single-image');
        }

        // 이미지 아이템 생성 (최대 3개)
        imageUrls.forEach((url, i) => {
            const imgItem = document.createElement('div');
            imgItem.className = `img-item i${i + 1}`;
            // 홀수 블록(1,3,5...): 마지막 이미지 활성화 (작은이미지 왼쪽, 큰이미지 오른쪽)
            // 짝수 블록(2,4,6...): 첫 번째 이미지 활성화 (큰이미지 왼쪽, 작은이미지 오른쪽)
            if (index % 2 === 0 && i === imageUrls.length - 1) {
                imgItem.classList.add('is-active');
            } else if (index % 2 === 1 && i === 0) {
                imgItem.classList.add('is-active');
            }

            const img = document.createElement('img');
            img.src = url;
            img.alt = this.sanitizeText(block.title, `관광지 이미지 ${i + 1}`);

            if (url === emptyImage) {
                img.classList.add('empty-image-placeholder');
            }

            imgItem.appendChild(img);
            imgGrid.appendChild(imgItem);
        });

        imgWrapper.appendChild(imgGrid);

        // 텍스트 부분
        const txtWrapper = document.createElement('div');
        txtWrapper.className = 'attraction-text';

        const title = document.createElement('h2');
        title.className = 'attraction-title';
        title.textContent = this.sanitizeText(block.title, '관광지 제목');

        const description = document.createElement('p');
        description.className = 'attraction-desc';
        description.innerHTML = this._formatTextWithLineBreaks(block.description, '관광지 설명');

        txtWrapper.appendChild(title);
        txtWrapper.appendChild(description);

        // Block: 번갈아 배치 (odd: img-text, even: text-img)
        if (isOdd) {
            block1.appendChild(imgWrapper);
            block1.appendChild(txtWrapper);
        } else {
            block1.appendChild(txtWrapper);
            block1.appendChild(imgWrapper);
        }

        return block1;
    }

    /**
     * Closing Section 매핑 (마무리 섹션)
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
        const descElement = this.safeSelect('[data-closing-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Nearby Attractions 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // enabled 체크 — false면 404로 리다이렉트
        const pageData = this.safeGet(this.data, 'homepage.customFields.pages.nearbyAttractions.sections.0');
        if (pageData?.enabled === false) {
            window.location.href = '404.html';
            return;
        }

        // Nearby Attractions 페이지 섹션들 순차 매핑
        this.mapHeroSlider();
        this.mapHeroContent();
        this.mapAboutSection();
        this.mapClosingSection();

        // 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // 스크롤 애니메이션 초기화 (mapper가 .attraction-block을 동적 생성한 후)
        if (typeof window.setupNearbyAttractionsAnimations === 'function') {
            window.setupNearbyAttractionsAnimations();
        }

        // 메타 태그 업데이트
        this.updateMetaTags();
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화 (로컬 환경용, iframe 아닐 때만)
if (typeof window !== 'undefined' && window.parent === window) {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new NearbyAttractionsMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NearbyAttractionsMapper;
} else {
    window.NearbyAttractionsMapper = NearbyAttractionsMapper;
}
