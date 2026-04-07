/**
 * Main Page Data Mapper
 * main.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 main 페이지 특화 기능 제공
 */
class MainMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 MAIN PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 이미지 매핑
     * homepage.customFields.pages.main.sections[0].hero.images → [data-main-hero-img]
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');
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
            imgEl.alt = this.sanitizeText(img.description, '히어로 이미지');
            imgEl.loading = index === 0 ? 'eager' : 'lazy';
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
        });
    }

/**
     * About 섹션 매핑 (제목 + 설명)
     * customFields.pages.main.sections[0].hero.title → [data-main-about-title]
     * customFields.pages.main.sections[0].hero.description → [data-main-about-description]
     */
    mapAboutSection() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');

        // About 제목 매핑
        const aboutTitle = this.safeSelect('[data-main-about-title]');
        if (aboutTitle) {
            aboutTitle.textContent = this.sanitizeText(heroData?.title, '소개 페이지 히어로 타이틀');
        }

        // About 설명 매핑
        const aboutDescription = this.safeSelect('[data-main-about-description]');
        if (aboutDescription) {
            aboutDescription.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '소개 페이지 히어로 설명');
        }
    }

/**
     * Introduction 섹션 매핑 (동적 블록 생성)
     * homepage.customFields.pages.main.sections[0].about[] → [data-main-introduction]
     */
    mapIntroductionSection() {
        if (!this.isDataLoaded) return;

        const aboutBlocks = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.about');
        const introContainer = this.safeSelect('[data-main-introduction]');
        const isDemo = this.dataSource === 'demo-filled.json';

        if (!introContainer) {
            return;
        }

        // 기존 about-block 제거
        introContainer.innerHTML = '';

        // 최소 2개 블록 보장
        const emptyImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
        const minBlocks = 2;
        let blocksToRender = Array.isArray(aboutBlocks) ? [...aboutBlocks] : [];

        // 부족한 블록 수만큼 기본 블록 추가
        while (blocksToRender.length < minBlocks) {
            blocksToRender.push(isDemo ? {
                title: '소개 섹션 타이틀',
                description: '소개 섹션 설명',
                images: ['./images/room.jpg']
            } : {
                title: '소개 섹션 타이틀',
                description: '소개 섹션 설명',
                images: [emptyImage],
                isEmpty: true
            });
        }

        // 각 con-block 생성 (block-1, block-2 순서)
        blocksToRender.forEach((block, index) => {
            const conBlock = this.createAboutBlock(block, index, isDemo);
            introContainer.appendChild(conBlock);
        });
    }

    /**
     * con-block 생성 헬퍼 함수
     * 기존 CSS 클래스(.con-block, .img-grid, .txt-content) 구조 유지
     */
    createAboutBlock(block, index, isDemo = true) {
        const isFirst = index === 0;
        const defaultImage = './images/room.jpg';
        const emptyImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;

        // con-block
        const conBlock = document.createElement('div');
        conBlock.className = `con-block ${isFirst ? 'block-1' : 'block-2'}`;

        // img-grid (block-2는 reverse)
        const imgGrid = document.createElement('div');
        imgGrid.className = isFirst ? 'img-grid' : 'img-grid reverse';

        // block.images 배열 정규화
        const rawImages = Array.isArray(block.images) ? block.images : [];
        const imageUrls = rawImages.map(img =>
            typeof img === 'string' ? img : (img?.url || null)
        ).filter(Boolean);

        // 5개 img-item 생성 (이미지 부족 시 empty placeholder 사용)
        for (let i = 0; i < 5; i++) {
            const item = document.createElement('div');
            item.className = `img-item i${i + 1}${i === 0 ? ' is-active' : ''}`;

            const img = document.createElement('img');
            if (imageUrls.length > 0 && imageUrls[i]) {
                img.src = imageUrls[i];
                img.alt = this.sanitizeText(block.title, '소개 이미지');
            } else if (imageUrls.length > 0) {
                img.src = emptyImage;
                img.alt = '이미지 없음';
                img.classList.add('empty-image-placeholder');
            } else if (block.isEmpty) {
                img.src = emptyImage;
                img.alt = '이미지 없음';
                img.classList.add('empty-image-placeholder');
            } else {
                img.src = isDemo ? defaultImage : emptyImage;
                img.alt = this.sanitizeText(block.title, '소개 이미지');
                if (!isDemo) img.classList.add('empty-image-placeholder');
            }

            item.appendChild(img);
            imgGrid.appendChild(item);
        }

        // txt-content (block-2는 align-start)
        const txtContent = document.createElement('div');
        txtContent.className = isFirst ? 'txt-content' : 'txt-content align-start';

        const title = document.createElement('h2');
        title.className = 'chapter-title';
        title.textContent = this.sanitizeText(block.title, '소개 섹션 타이틀');

        const description = document.createElement('p');
        description.className = 'desc-text';
        description.innerHTML = this._formatTextWithLineBreaks(block.description, '소개 섹션 설명');

        txtContent.appendChild(title);
        txtContent.appendChild(description);

        // block-1: [txt-content, img-grid], block-2: [img-grid, txt-content]
        if (isFirst) {
            conBlock.appendChild(txtContent);
            conBlock.appendChild(imgGrid);
        } else {
            conBlock.appendChild(imgGrid);
            conBlock.appendChild(txtContent);
        }

        return conBlock;
    }

    /**
     * Closing Section 매핑 (마무리 섹션)
     * homepage.customFields.pages.main.sections[0].closing → [data-closing-image], [data-closing-title], [data-closing-description]
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
     * Main 페이지 전체 매핑 실행
     */
    async mapPage() {

        if (!this.isDataLoaded) {
            return;
        }

        // Main 페이지 섹션들 순차 매핑
        this.mapHeroSlider();
        this.mapAboutSection();
        this.mapIntroductionSection();
        this.mapClosingSection();

        // 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // 갤러리 아코디언 재초기화 (mapper가 .img-grid를 동적 생성한 후)
        if (typeof window.initGallery === 'function') {
            window.initGallery();
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
        const mapper = new MainMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMapper;
} else {
    window.MainMapper = MainMapper;
}
