/**
 * Room Page Data Mapper
 * room.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 객실 페이지 전용 기능 제공
 * URL 파라미터 ?id=... 로 객실을 선택하여 동적으로 매핑
 */
class RoomMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentRoom = null;
        this.currentRoomIndex = null;
    }

    // ============================================================================
    // 🏠 현재 객실 선택
    // ============================================================================

    /**
     * URL 파라미터 ?id 기반으로 현재 객실 반환
     * id 없으면 첫 번째 객실로 리다이렉트
     */
    getCurrentRoom() {
        if (!this.isDataLoaded || !this.data.rooms) return null;

        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('id');

        if (!roomId && this.data.rooms.length > 0) {
            navigateTo('room', this.data.rooms[0].id);
            return null;
        }

        if (!roomId) return null;

        const index = this.data.rooms.findIndex(r => r.id === roomId);
        if (index === -1) return null;

        this.currentRoom = this.data.rooms[index];
        this.currentRoomIndex = index;
        return this.currentRoom;
    }

    /**
     * 현재 객실의 커스텀 페이지 데이터 반환
     * homepage.customFields.pages.room[] 에서 현재 room.id와 일치하는 항목
     */
    getCurrentRoomPageData() {
        const room = this.getCurrentRoom();
        if (!room) return null;

        const roomPages = this.safeGet(this.data, 'homepage.customFields.pages.room');
        if (!roomPages || !Array.isArray(roomPages)) return null;

        return roomPages.find(page => page.id === room.id) || null;
    }

    // ============================================================================
    // 🎬 Hero Slider
    // ============================================================================

    /**
     * 히어로 슬라이더 매핑
     * roomtype_interior 이미지 → [data-room-slider] 에 .main-slide 생성
     */
    mapHeroSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const container = this.safeSelect('[data-room-slider]');
        if (!container) return;

        const images = this.getRoomImages(room, 'roomtype_interior');
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
            img.alt = this.sanitizeText(image.description, this.getRoomName(room));
            img.loading = index === 0 ? 'eager' : 'lazy';
            slide.appendChild(img);
            container.appendChild(slide);
        });
    }

    // ============================================================================
    // 📝 Hero Content
    // ============================================================================

    /**
     * 히어로 텍스트 매핑
     * [data-room-name] → 객실명
     * [data-room-description] → 커스텀 설명 (없으면 시스템 description)
     */
    mapHeroContent() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const nameEl = this.safeSelect('[data-room-name]');
        if (nameEl) {
            nameEl.textContent = this.getRoomName(room);
        }

        const descEl = this.safeSelect('[data-room-description]');
        if (descEl) {
            const pageData = this.getCurrentRoomPageData();
            const description = pageData?.sections?.[0]?.hero?.description || room.description;
            descEl.innerHTML = this._formatTextWithLineBreaks(description, '객실 설명');
        }
    }

    // ============================================================================
    // 🖼️ Exterior Slider + Tabs
    // ============================================================================

    /**
     * 외경 슬라이더 + 탭 매핑
     * roomtype_exterior 이미지 → [data-room-exterior-slider] 에 .room-slide 생성
     * [data-room-exterior-tabs] 에 .tab-item 생성
     */
    mapExteriorSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const sliderContainer = this.safeSelect('[data-room-exterior-slider]');
        if (!sliderContainer) return;

        const images = this.getRoomImages(room, 'roomtype_exterior');
        const overlay = sliderContainer.querySelector('.image-overlay');

        // 기존 room-slide 제거
        sliderContainer.querySelectorAll('.room-slide').forEach(el => el.remove());

        if (images.length === 0) {
            const slide = document.createElement('div');
            slide.className = 'room-slide active';
            const img = document.createElement('img');
            img.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            img.alt = '이미지 없음';
            img.classList.add('empty-image-placeholder');
            slide.appendChild(img);
            overlay ? sliderContainer.insertBefore(slide, overlay) : sliderContainer.appendChild(slide);
        } else {
            images.forEach((image, index) => {
                const slide = document.createElement('div');
                slide.className = index === 0 ? 'room-slide active' : 'room-slide';
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = this.sanitizeText(image.description, this.getRoomName(room));
                img.loading = index === 0 ? 'eager' : 'lazy';
                slide.appendChild(img);
                overlay ? sliderContainer.insertBefore(slide, overlay) : sliderContainer.appendChild(slide);
            });
        }

        // 탭 생성
        const tabsContainer = this.safeSelect('[data-room-exterior-tabs]');
        if (!tabsContainer || images.length === 0) return;

        tabsContainer.innerHTML = '';
        images.forEach((image, index) => {
            const tab = document.createElement('div');
            tab.className = index === 0 ? 'tab-item active' : 'tab-item';
            tab.style.top = (index * 95) + 'px';
            const span = document.createElement('span');
            span.textContent = this.sanitizeText(image.description, `이미지 설명 추가 ${String(index + 1).padStart(2, '0')}`);
            tab.appendChild(span);
            tabsContainer.appendChild(tab);
        });
    }

    // ============================================================================
    // 📋 Room Details
    // ============================================================================

    /**
     * 객실 상세 정보 매핑
     * [data-room-type]            → 객실 구성 (roomStructures)
     * [data-room-checkin-checkout] → 입/퇴실 시간
     * [data-room-capacity]        → 기준/최대 인원
     * [data-room-amenities]       → 어메니티 목록
     * [data-room-guide]           → 이용 안내사항 (li 생성)
     */
    mapRoomDetails() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실 소개
        const typeEl = this.safeSelect('[data-room-type]');
        if (typeEl) {
            typeEl.innerHTML = this._formatTextWithLineBreaks(room.description, '객실 소개');
        }

        // 입/퇴실
        const checkinEl = this.safeSelect('[data-room-checkin-checkout]');
        if (checkinEl) {
            const ts = room.timeSettings;
            checkinEl.textContent = `${ts?.checkin || '-'} / ${ts?.checkout || '-'}`;
        }

        // 기준 인원
        const capacityEl = this.safeSelect('[data-room-capacity]');
        if (capacityEl) {
            const base = room.baseOccupancy || 2;
            const max = room.maxOccupancy || 4;
            capacityEl.textContent = `기준 ${base}인 / 최대 ${max}인`;
        }

        // 비품 (어메니티)
        const amenitiesEl = this.safeSelect('[data-room-amenities]');
        if (amenitiesEl) {
            const list = (room.amenities || []).map(a => a.name?.ko || a.name || a);
            amenitiesEl.textContent = list.length > 0 ? list.join(' / ') : '-';
        }

        // 이용 안내사항
        const guideEl = this.safeSelect('[data-room-guide]');
        if (guideEl) {
            guideEl.innerHTML = '';
            const roomInfo = room.usageGuide || '';
            const lines = roomInfo.split(/\n/).filter(l => l.trim());

            if (lines.length > 0) {
                lines.forEach(line => {
                    const li = document.createElement('li');
                    li.textContent = line.trim();
                    guideEl.appendChild(li);
                });
            }
        }
    }

    // ============================================================================
    // 🃏 Room Preview Carousel
    // ============================================================================

    /**
     * 전체 객실 프리뷰 카드 매핑
     * [data-room-preview] 에 .room-card × 2세트 생성 (무한 루프용)
     * 각 카드 클릭 시 room.html?id=... 이동
     */
    mapRoomPreview() {
        if (!this.isDataLoaded || !this.data.rooms) return;

        const track = this.safeSelect('[data-room-preview]');
        if (!track) return;

        // 서브타이틀
        const subtitleEl = this.safeSelect('[data-room-preview-subtitle]');
        if (subtitleEl) {
            subtitleEl.textContent = `${this.getPropertyName()}에서 나만의 특별한 공간을 찾아보세요.`;
        }

        track.innerHTML = '';

        const rooms = this.data.rooms;

        // 룸 개수 저장 (carousel에서 롤링 여부 판단용)
        track.dataset.roomCount = rooms.length;

        // 무한 루프를 위해 2세트 생성
        [rooms, rooms].forEach(set => {
            set.forEach(room => {
                const card = document.createElement('div');
                card.className = 'room-card';
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    navigateTo('room', room.id);
                });

                // 이미지 — thumbnail만 사용
                const imageDiv = document.createElement('div');
                imageDiv.className = 'room-image';

                const thumbImages = this.getRoomImages(room, 'roomtype_thumbnail');
                const firstImage = thumbImages[0];

                const img = document.createElement('img');
                if (firstImage) {
                    img.src = firstImage.url;
                    img.alt = this.sanitizeText(firstImage.description, this.getRoomName(room));
                } else {
                    img.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                    img.alt = '이미지 없음';
                    img.classList.add('empty-image-placeholder');
                }
                img.loading = 'lazy';
                imageDiv.appendChild(img);

                // 정보
                const infoDiv = document.createElement('div');
                infoDiv.className = 'room-info';

                const h3 = document.createElement('h3');
                h3.textContent = this.getRoomName(room);

                const p = document.createElement('p');
                p.textContent = this.sanitizeText(room.description, '');

                const roomId = room.id;
                const btn = document.createElement('button');
                btn.className = 'btn-more';
                btn.textContent = 'View More';
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    navigateTo('room', roomId);
                });

                infoDiv.appendChild(h3);
                infoDiv.appendChild(p);
                infoDiv.appendChild(btn);

                card.appendChild(imageDiv);
                card.appendChild(infoDiv);
                track.appendChild(card);
            });
        });
    }

    // ============================================================================
    // 🔄 MAIN ENTRY POINT
    // ============================================================================

    /**
     * Room 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) return;

        const room = this.getCurrentRoom();
        if (!room) return;

        this.mapHeroSlider();
        this.mapHeroContent();
        this.mapExteriorSlider();
        this.mapRoomDetails();
        this.mapRoomPreview();

        // 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }
        if (typeof window.initRoomSlider === 'function') {
            window.initRoomSlider();
        }
        if (typeof window.initRoomPreviewCarousel === 'function') {
            window.initRoomPreviewCarousel();
        }

        // 메타 태그 업데이트
        const roomName = this.getRoomName(room);
        const propertyName = this.getPropertyName();
        this.updateMetaTags({
            title: `${roomName} - ${propertyName}`,
            description: room.description || this.data.property?.description || ''
        });

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
    document.addEventListener('DOMContentLoaded', async () => {
        const mapper = new RoomMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomMapper;
} else {
    window.RoomMapper = RoomMapper;
}
