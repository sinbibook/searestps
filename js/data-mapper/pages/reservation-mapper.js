/**
 * Reservation Page Data Mapper
 * reservation.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 예약 페이지 전용 기능 제공
 */
class ReservationMapper extends BaseDataMapper {

    // ============================================================================
    // 🎬 HERO SLIDER
    // ============================================================================

    /**
     * Hero 슬라이더 매핑 (directions-mapper / main-mapper 패턴과 동일)
     * homepage.customFields.pages.reservation.sections.0.hero.images
     * → [data-hero-slider] 에 .main-slide 동적 생성
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.hero');
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
            imgEl.alt = this.sanitizeText(img.description, '예약안내 이미지');
            imgEl.loading = index === 0 ? 'eager' : 'lazy';
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
        });
    }

    // ============================================================================
    // 📝 HERO CONTENT
    // ============================================================================

    /**
     * Hero 콘텐츠 매핑 (타이틀, 서브타이틀)
     * hero.title → [data-reservation-hero-title] (비어있으면 기본값 'Reservation' 유지)
     * about.description → [data-reservation-hero-description]
     */
    mapHeroContent() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.hero');
        const aboutData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.about');

        const titleEl = this.safeSelect('[data-reservation-hero-title]');
        if (titleEl) {
            titleEl.textContent = this.sanitizeText(heroData?.title, '예약안내 타이틀');
        }

        // 서브타이틀: about.description
        const descEl = this.safeSelect('[data-reservation-hero-description]');
        if (descEl) {
            descEl.innerHTML = this._formatTextWithLineBreaks(aboutData?.description, '예약안내 이미지1 설명');
        }
    }

    // ============================================================================
    // 🖼️ SIDE IMAGE
    // ============================================================================

    /**
     * 섹션 사이드 이미지 매핑
     * homepage.customFields.pages.reservation.sections.0.about.images[0]
     * → [data-reservation-side-image]
     */
    mapSideImage() {
        if (!this.isDataLoaded) return;

        const aboutData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.about');
        const imgEl = this.safeSelect('[data-reservation-side-image]');
        if (!imgEl) return;

        const images = (aboutData?.images || [])
            .filter(img => img.isSelected !== false && img.url)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (images.length > 0) {
            imgEl.src = images[0].url;
            imgEl.alt = this.sanitizeText(images[0].description, '예약안내 이미지');
            imgEl.classList.remove('empty-image-placeholder');
        } else {
            imgEl.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            imgEl.alt = '이미지 없음';
            imgEl.classList.add('empty-image-placeholder');
        }
    }

    // ============================================================================
    // 📋 INFO SECTIONS
    // ============================================================================

    /**
     * 텍스트 컨텐츠 매핑 헬퍼 메서드
     * @param {string} selector - DOM 선택자
     * @param {string} propertyKey - property 객체의 키
     * @private
     */
    _mapTextContent(selector, propertyKey) {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const element = this.safeSelect(selector);
        const textContent = property[propertyKey];

        if (element && textContent) {
            element.innerHTML = this._formatTextWithLineBreaks(textContent);
        }
    }

    /**
     * 이용안내 섹션 매핑
     * property.usageGuide → [data-usage-guide]
     */
    mapUsageSection() {
        this._mapTextContent('[data-usage-guide]', 'usageGuide');
    }

    /**
     * 예약안내 섹션 매핑
     * property.reservationGuide → [data-reservation-guide]
     */
    mapReservationGuideSection() {
        this._mapTextContent('[data-reservation-guide]', 'reservationGuide');
    }

    /**
     * 입/퇴실 안내 섹션 매핑
     * property.checkin → [data-checkin-time]
     * property.checkout → [data-checkout-time]
     * property.checkInOutInfo → [data-operation-info]
     */
    mapCheckInOutSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        const operationInfo = this.safeSelect('[data-operation-info]');
        if (operationInfo && property.checkInOutInfo) {
            operationInfo.innerHTML = this._formatTextWithLineBreaks(property.checkInOutInfo);
        }
    }

    /**
     * 환불 규정 섹션 매핑
     * property.refundSettings.customerRefundNotice → [data-refund-notes] (내용 있을 때만 .refund-text-section 노출)
     * property.refundPolicies → .refund-table-body (행 동적 생성)
     */
    mapRefundSection() {
        if (!this.isDataLoaded) return;

        const refundPolicies = this.safeGet(this.data, 'property.refundPolicies');
        const refundNotesElement = this.safeSelect('[data-refund-notes]');

        const refundSettings = this.safeGet(this.data, 'property.refundSettings');
        if (refundNotesElement && refundSettings?.customerRefundNotice) {
            refundNotesElement.innerHTML = this._formatTextWithLineBreaks(refundSettings.customerRefundNotice);
        }

        if (refundPolicies && Array.isArray(refundPolicies)) {
            this.mapRefundPoliciesTable(refundPolicies);
        }
    }

    /**
     * 환불 정책 테이블 동적 생성 (원본 가로형 2행 구조)
     * property.refundPolicies[] → [data-refund-table]
     * 구조: header-row(취소수수료 | N일 전...) + data-row(이용일기준 | %...)
     * @param {Array} refundPolicies - 환불 정책 배열
     */
    mapRefundPoliciesTable(refundPolicies) {
        const table = this.safeSelect('[data-refund-table]');
        if (!table || !refundPolicies) return;

        const sorted = [...refundPolicies]
            .filter(p => p.refundProcessingDays !== undefined && p.refundRate !== undefined)
            .sort((a, b) => b.refundProcessingDays - a.refundProcessingDays);

        if (sorted.length === 0) return;

        const headerRow = document.createElement('tr');
        headerRow.className = 'header-row';
        headerRow.innerHTML = '<td class="first-col">취소<br>수수료</td>';

        const dataRow = document.createElement('tr');
        dataRow.className = 'data-row';
        dataRow.innerHTML = '<td class="first-col">이용일<br>기준</td>';

        sorted.forEach(policy => {
            const dayText = policy.refundProcessingDays === 0
                ? '당일'
                : `${policy.refundProcessingDays}일 전`;

            const rateText = policy.refundRate === 0
                ? '환불 불가'
                : `${policy.refundRate}%`;

            const headerTd = document.createElement('td');
            headerTd.textContent = dayText;
            headerRow.appendChild(headerTd);

            const dataTd = document.createElement('td');
            dataTd.textContent = rateText;
            if (policy.refundRate === 0) dataTd.className = 'no-refund';
            dataRow.appendChild(dataTd);
        });

        table.innerHTML = '';
        table.appendChild(headerRow);
        table.appendChild(dataRow);
    }

    // ============================================================================
    // 🌙 CLOSING SECTION
    // ============================================================================

    /**
     * Closing 섹션 매핑 (main-mapper / directions-mapper / facility-mapper 동일 패턴)
     * homepage.customFields.pages.index.sections.0.closing
     * → [data-closing-image], [data-closing-title], [data-closing-description]
     */
    mapClosingSection() {
        if (!this.isDataLoaded) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        // 배경 이미지
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

        // 타이틀
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }

        // 설명
        const descEl = this.safeSelect('[data-closing-description]');
        if (descEl) {
            descEl.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }
    }

    // ============================================================================
    // 🔄 MAIN ENTRY POINT
    // ============================================================================

    /**
     * Reservation 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) return;

        // 히어로 섹션
        this.mapHeroSlider();
        this.mapHeroContent();
        this.mapSideImage();

        // 안내 섹션들
        this.mapUsageSection();
        this.mapReservationGuideSection();
        this.mapCheckInOutSection();
        this.mapRefundSection();

        // 마무리 섹션
        this.mapClosingSection();

        // 슬라이더 재초기화 (mapper가 DOM에 .main-slide를 동적 생성한 후 호출)
        if (typeof window.initMainSlideshow === 'function') {
            window.initMainSlideshow();
        }

        // 메타 태그 업데이트
        const propertyName = this.getPropertyName();
        this.updateMetaTags({
            title: `예약안내 - ${propertyName}`,
            description: this.data.property?.description || ''
        });

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화 (로컬 환경용, iframe 아닐 때만)
if (typeof window !== 'undefined' && window.parent === window) {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new ReservationMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReservationMapper;
} else {
    window.ReservationMapper = ReservationMapper;
}
