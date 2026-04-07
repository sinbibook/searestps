/**
 * Facility Page Data Mapper
 * facility.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 시설 페이지 전용 기능 제공
 * URL 파라미터 ?id=... 로 시설을 선택하여 동적으로 매핑
 */


class FacilityMapper extends BaseDataMapper {

    // ============================================================================
    // 🔧 UTILITY METHODS
    // ============================================================================

    /**
     * URL 파라미터 ?id 기반으로 현재 시설 반환
     * id 없으면 첫 번째 시설로 리다이렉트
     */
    getCurrentFacility() {
        if (!this.isDataLoaded || !this.data.property?.facilities) return null;

        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id');

        const facilities = this.data.property.facilities;

        if (!facilityId && facilities.length > 0) {
            const sorted = [...facilities].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            navigateTo('facility', sorted[0].id);
            return null;
        }

        if (!facilityId) return null;

        return facilities.find(f => f.id === facilityId) || null;
    }

    /**
     * 시설 이미지 배열 반환 (sortOrder 오름차순 정렬, isSelected !== false 필터)
     */
    getFacilityImages(facility) {
        return (facility.images || [])
            .filter(img => img.isSelected !== false && img.url)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    // ============================================================================
    // 🎬 Hero Slider
    // ============================================================================

    /**
     * 히어로 슬라이더 매핑
     * 현재 시설 이미지 → [data-facility-hero-slider] 에 .main-slide 생성
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const facility = this.getCurrentFacility();
        if (!facility) return;

        const container = this.safeSelect('[data-facility-hero-slider]');
        if (!container) return;

        const images = this.getFacilityImages(facility);
        container.innerHTML = '';

        if (images.length === 0) {
            const slide = document.createElement('div');
            slide.className = 'main-slide';
            const img = document.createElement('img');
            img.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            img.alt = '이미지 없음';
            img.classList.add('empty-image-placeholder');
            slide.appendChild(img);
            container.appendChild(slide);
            return;
        }

        images.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'main-slide';
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = this.sanitizeText(image.description, facility.name);
            img.loading = index === 0 ? 'eager' : 'lazy';
            slide.appendChild(img);
            container.appendChild(slide);
        });

        // 히어로 서브타이틀 매핑
        const subtitleEl = this.safeSelect('[data-facility-hero-subtitle]');
        if (subtitleEl) {
            subtitleEl.innerHTML = this._formatTextWithLineBreaks(facility.description, '시설 설명');
        }
    }

    // ============================================================================
    // 🖼️ Con1 Slider
    // ============================================================================

    /**
     * Con1 이미지+텍스트 슬라이더 매핑
     * 현재 시설의 각 이미지 → [data-facility-con1-slider] 에 .main-img-slide
     *                        → [data-facility-con1-text] 에 .slider-text-slide
     */
    mapCon1Slider() {
        if (!this.isDataLoaded) return;

        const facility = this.getCurrentFacility();
        if (!facility) return;

        const titleEl = this.safeSelect('[data-facility-con1-title]');
        if (titleEl) titleEl.textContent = this.sanitizeText(facility.name, 'Special');

        const usageGuideEl = this.safeSelect('[data-facility-usage-guide]');
        if (usageGuideEl) {
            usageGuideEl.innerHTML = '<p class="usage-guide-label">시설 이용안내</p>' + this._formatTextWithLineBreaks(facility.usageGuide, '');
            usageGuideEl.style.display = facility.usageGuide ? '' : 'none';

            if (facility.usageGuide) {
                requestAnimationFrame(() => {
                    const sectionCon1 = document.querySelector('.section-con1');
                    if (!sectionCon1) return;
                    const sectionTop = sectionCon1.getBoundingClientRect().top;
                    const guideBottom = usageGuideEl.getBoundingClientRect().bottom;
                    const neededHeight = guideBottom - sectionTop + 80;
                    if (neededHeight > 1300) {
                        sectionCon1.style.minHeight = neededHeight + 'px';
                    }
                });
            }
        }

        const imgContainer = this.safeSelect('[data-facility-con1-slider]');
        const textContainer = this.safeSelect('[data-facility-con1-text]');
        if (!imgContainer || !textContainer) return;

        const images = [...this.getFacilityImages(facility)].reverse();
        imgContainer.innerHTML = '';
        textContainer.innerHTML = '';

        if (images.length === 0) {
            const imgSlide = document.createElement('div');
            imgSlide.className = 'main-img-slide active';
            const img = document.createElement('img');
            img.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            img.alt = '이미지 없음';
            img.classList.add('empty-image-placeholder');
            imgSlide.appendChild(img);
            imgContainer.appendChild(imgSlide);
            const textSlide = document.createElement('div');
            textSlide.className = 'slider-text-slide active';
            textContainer.appendChild(textSlide);
            return;
        }

        images.forEach((image, index) => {
            // 이미지 슬라이드
            const imgSlide = document.createElement('div');
            imgSlide.className = index === 0 ? 'main-img-slide active' : 'main-img-slide';
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = this.sanitizeText(image.description, facility.name);
            img.loading = index === 0 ? 'eager' : 'lazy';
            imgSlide.appendChild(img);
            imgContainer.appendChild(imgSlide);

            // 텍스트 슬라이드
            const textSlide = document.createElement('div');
            textSlide.className = index === 0 ? 'slider-text-slide active' : 'slider-text-slide';

            const rightDesc = document.createElement('p');
            rightDesc.className = 'right-desc';
            rightDesc.textContent = this.sanitizeText(image.description || facility.description, '');

            const rightTitle = document.createElement('div');
            rightTitle.className = 'right-title';
            const titleKo = document.createElement('p');
            titleKo.className = 'title-ko';
            titleKo.textContent = this.sanitizeText(facility.name, '시설명');
            rightTitle.appendChild(titleKo);

            textSlide.appendChild(rightDesc);
            textSlide.appendChild(rightTitle);
            textContainer.appendChild(textSlide);
        });
    }

    // ============================================================================
    // 🎠 Con2 Rolling Gallery
    // ============================================================================

    /**
     * Con2 롤링 갤러리 매핑
     * 현재 시설 이미지 → CSS 슬롯 클래스 순환 (jacuzzi/fire/swing/sauna)
     * × 2세트 생성 (무한 루프)
     */
    mapCon2Gallery() {
        if (!this.isDataLoaded) return;

        const facilities = this.safeGet(this.data, 'property.facilities');
        if (!facilities || !Array.isArray(facilities) || facilities.length === 0) return;

        const sortedFacilities = [...facilities]
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        const track = this.safeSelect('[data-facility-rolling-track]');
        if (!track) return;

        track.innerHTML = '';

        [0, 1].forEach(() => {
            const rollingSet = document.createElement('div');
            rollingSet.className = 'rolling-set';

            sortedFacilities.forEach((facility, index) => {
                const isLarge = index % 2 === 0;
                const images = this.getFacilityImages(facility);
                const firstImg = images[0] || null;

                const item = document.createElement('div');
                item.className = isLarge ? 'item-large' : 'item-small';

                const imgBox = document.createElement('div');
                imgBox.className = 'img-box';
                const img = document.createElement('img');
                img.src = firstImg ? firstImg.url : ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                img.alt = this.sanitizeText(facility.name, '시설명');
                img.loading = 'lazy';
                if (!firstImg) img.classList.add('empty-image-placeholder');
                imgBox.appendChild(img);
                item.appendChild(imgBox);

                const textBox = document.createElement('div');
                textBox.className = isLarge ? 'text-box' : 'text-box-bottom';

                const ko = document.createElement('p');
                ko.className = 'item-title-ko';
                ko.textContent = this.sanitizeText(facility.name, '시설명');
                textBox.appendChild(ko);

                if (isLarge) {
                    const desc = document.createElement('p');
                    desc.className = 'item-desc';
                    desc.innerHTML = this._formatTextWithLineBreaks(facility.description, '');
                    textBox.appendChild(desc);
                }

                item.appendChild(textBox);
                rollingSet.appendChild(item);
            });

            track.appendChild(rollingSet);
        });
    }

    // ============================================================================
    // ✨ Special Section (Content-3)
    // ============================================================================

    /**
     * Special 섹션 매핑 (index-mapper의 mapFacilitySection과 동일 방식)
     * 전체 시설 목록 → .meditation-image, .meditation-info, .special-right-image에 facility-slide 동적 생성
     */
    mapSpecialSection() {
        if (!this.isDataLoaded) return;

        const facilities = this.safeGet(this.data, 'property.facilities');
        if (!facilities || !Array.isArray(facilities) || facilities.length === 0) return;

        const sortedFacilities = [...facilities]
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        const leftImagesEl = this.safeSelect('.meditation-image');
        const infoEl = this.safeSelect('.meditation-info');
        const rightImagesEl = this.safeSelect('.special-right-image');

        if (leftImagesEl) leftImagesEl.innerHTML = '';
        if (infoEl) infoEl.innerHTML = '';

        const overlay = rightImagesEl ? rightImagesEl.querySelector('.image-overlay') : null;
        if (rightImagesEl) rightImagesEl.innerHTML = '';

        sortedFacilities.forEach((facility) => {
            const images = this.getFacilityImages(facility);
            const firstImg = images[0] || null;
            const secondImg = images[1] || null;

            // 왼쪽 이미지
            if (leftImagesEl) {
                const img = document.createElement('img');
                img.className = 'facility-slide';
                img.src = firstImg ? firstImg.url : ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                img.alt = this.sanitizeText(facility.name, '부대시설 이미지');
                if (!firstImg) img.classList.add('empty-image-placeholder');
                leftImagesEl.appendChild(img);
            }

            // 정보 슬라이드
            if (infoEl) {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'facility-slide';

                const title = document.createElement('h3');
                title.className = 'meditation-title';
                title.textContent = this.sanitizeText(facility.name, '부대시설명');

                const desc = document.createElement('p');
                desc.className = 'meditation-text';
                desc.innerHTML = this._formatTextWithLineBreaks(facility.description, '부대시설 설명');

                const facilityId = facility.id;
                const btn = document.createElement('button');
                btn.className = 'btn-outline';
                btn.textContent = 'View More';
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    navigateTo('facility', facilityId);
                });

                slideDiv.appendChild(title);
                slideDiv.appendChild(desc);
                slideDiv.appendChild(btn);
                infoEl.appendChild(slideDiv);
            }

            // 오른쪽 이미지
            if (rightImagesEl) {
                const img = document.createElement('img');
                img.className = 'facility-slide';
                const rightSrc = secondImg || firstImg;
                img.src = rightSrc ? rightSrc.url : ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                img.alt = this.sanitizeText(facility.name, '부대시설 이미지');
                if (!rightSrc) img.classList.add('empty-image-placeholder');
                rightImagesEl.appendChild(img);
            }
        });

        if (rightImagesEl && overlay) rightImagesEl.appendChild(overlay);
    }

    // ============================================================================
    // 🌙 Closing Section
    // ============================================================================

    /**
     * Closing 섹션 매핑 (index 페이지 closing 데이터 재사용)
     */
    mapClosingSection() {
        if (!this.isDataLoaded) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        const bgEl = this.safeSelect('[data-closing-image]');
        if (bgEl) {
            const selectedImages = (closingData?.images || [])
                .filter(img => img.isSelected === true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            if (selectedImages[0]?.url) {
                bgEl.style.backgroundImage = `url('${selectedImages[0].url}')`;
            } else {
                bgEl.classList.add('empty-image-placeholder');
            }
        }

        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }

        const descEl = this.safeSelect('[data-closing-description]');
        if (descEl) {
            descEl.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }
    }

    // ============================================================================
    // 🔄 MAIN ENTRY POINT
    // ============================================================================

    /**
     * Facility 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) return;

        const facility = this.getCurrentFacility();
        if (!facility) return;

        this.mapHeroSlider();
        this.mapCon1Slider();
        this.mapCon2Gallery();
        this.mapSpecialSection();
        this.mapClosingSection();

        // 슬라이더 재초기화
        if (typeof window.initFacilityMainSlider === 'function') {
            window.initFacilityMainSlider();
        }
        if (typeof window.initFacilityCon1Slider === 'function') {
            window.initFacilityCon1Slider();
        }
        if (typeof window.initFacilityRollingTouch === 'function') {
            window.initFacilityRollingTouch();
        }
        if (typeof window.initSpecialSlideshow === 'function') {
            window.initSpecialSlideshow();
        }

        // 메타 태그 업데이트
        this.updateMetaTags({
            title: `${this.sanitizeText(facility.name, 'Special')} - ${this.getPropertyName()}`,
            description: facility.description || this.data.property?.description || ''
        });

        // 스크롤 애니메이션 재초기화
        if (typeof window.initFacilityScrollAnimations === 'function') {
            window.initFacilityScrollAnimations();
        }
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

if (typeof window !== 'undefined' && window.parent === window) {
    document.addEventListener('DOMContentLoaded', async () => {
        const mapper = new FacilityMapper();
        await mapper.initialize();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilityMapper;
} else {
    window.FacilityMapper = FacilityMapper;
}
