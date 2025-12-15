/**
 * Room Page Data Mapper
 * room.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 객실 페이지 전용 기능 제공
 * URL 파라미터로 ?index=0,1,2...를 받아서 동적으로 객실 정보 표시
 */
class RoomMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentRoom = null;
        this.currentRoomIndex = null;
        this.currentRoomPageData = null;
    }

    // ============================================================================
    // 🔧 HELPER METHODS
    // ============================================================================


    // ============================================================================
    // 🏠 ROOM PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 객실 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentRoom() {
        if (!this.isDataLoaded || !this.data.rooms) {
            console.error('Data not loaded or no rooms data available');
            return null;
        }

        // URL에서 room id 추출
        const urlParams = new URLSearchParams(window.location.search);
        let roomId = urlParams.get('id');

        // id가 없으면 첫 번째 room으로 리다이렉트
        if (!roomId && this.data.rooms.length > 0) {
            console.warn('Room id not specified, redirecting to first room');
            window.location.href = `room.html?id=${this.data.rooms[0].id}`;
            return null;
        }

        if (!roomId) {
            console.error('Room id not specified in URL and no rooms available');
            return null;
        }

        // rooms 배열에서 해당 id의 객실 찾기
        const roomIndex = this.data.rooms.findIndex(room => room.id === roomId);

        if (roomIndex === -1) {
            console.error(`Room with id ${roomId} not found`);
            return null;
        }

        const room = this.data.rooms[roomIndex];
        this.currentRoom = room;
        this.currentRoomIndex = roomIndex; // 인덱스도 저장 (페이지 데이터 접근용)
        return room;
    }

    /**
     * 현재 객실 인덱스 가져오기
     */
    getCurrentRoomIndex() {
        if (this.currentRoomIndex !== undefined) {
            return this.currentRoomIndex;
        }

        // getCurrentRoom()이 호출되지 않았을 경우를 위한 fallback
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('id');

        if (roomId && this.data.rooms) {
            const index = this.data.rooms.findIndex(room => room.id === roomId);
            if (index !== -1) {
                this.currentRoomIndex = index;
                return index;
            }
        }

        return null;
    }

    /**
     * 현재 객실 페이지 데이터 가져오기 (캐시 포함)
     */
    getCurrentRoomPageData() {
        // 현재 room을 먼저 가져와서 캐시가 유효한지 확인
        const room = this.getCurrentRoom();
        if (!room || !room.id) {
            return null;
        }

        // 캐시된 데이터가 있고 같은 room이면 바로 반환
        if (this.currentRoomPageData && this.currentRoomPageData.id === room.id) {
            return this.currentRoomPageData;
        }

        const roomPages = this.safeGet(this.data, 'homepage.customFields.pages.room');
        if (!roomPages || !Array.isArray(roomPages)) {
            return null;
        }

        // pages.room 배열에서 현재 room.id와 일치하는 페이지 데이터 찾기
        const pageData = roomPages.find(page => page.id === room.id);
        if (!pageData) {
            return null;
        }

        // 캐시 저장
        this.currentRoomPageData = {
            id: room.id,
            data: pageData
        };

        return this.currentRoomPageData;
    }

    /**
     * Hero 섹션 매핑 (슬라이더, 텍스트)
     */
    mapHeroSection() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // Hero 텍스트 매핑
        this.mapHeroText(room);

        // Hero 이미지 슬라이더 초기화
        this.initializeHeroSlider(room);
    }



    /**
     * Hero 텍스트 섹션 매핑
     */
    mapHeroText(room) {
        // Hero 객실명 매핑
        const roomHeroName = this.safeSelect('[data-room-hero-name]');
        if (roomHeroName) {
            roomHeroName.textContent = room.name;
        }

        // Hero 설명 매핑 (JSON에서 roomPage.hero.title 찾기)
        const roomHeroDescription = this.safeSelect('[data-room-hero-description]');
        if (roomHeroDescription) {
            const roomPageData = this.getCurrentRoomPageData();
            const heroDescription = roomPageData?.data?.sections?.[0]?.hero?.title;

            if (heroDescription) {
                // XSS 방지 처리 후 줄바꿈을 <br>로 변환
                roomHeroDescription.innerHTML = this._formatTextWithLineBreaks(heroDescription);
            } else {
                // 기본값
                roomHeroDescription.textContent = `${room.name}에서 편안한 휴식을 즐기세요.`;
            }
        }
    }


    /**
     * Hero 이미지 슬라이더 초기화
     */
    initializeHeroSlider(room) {
        const slidesContainer = this.safeSelect('[data-room-hero-slides-container]');

        if (!slidesContainer) return;

        // JSON 구조에 따라 interior 이미지 배열 가져오기
        const interiorImages = room.images?.[0]?.interior;

        // isSelected가 true인 이미지만 필터링
        const selectedImages = this._getSortedSelectedImages(interiorImages);

        // 선택된 이미지가 없으면 빈 이미지 표시
        if (selectedImages.length === 0) {
            slidesContainer.innerHTML = `
                <div class="hero-slide active">
                    <img class="w-full h-full object-cover" alt="이미지 없음" loading="eager">
                </div>
            `;
            const img = slidesContainer.querySelector('img');
            ImageHelpers.applyPlaceholder(img);

            const totalSlidesElement = this.safeSelect('[data-room-total-slides]');
            if (totalSlidesElement) {
                totalSlidesElement.textContent = '01';
            }
            return;
        }

        // 기존 슬라이드 제거
        slidesContainer.innerHTML = '';

        // 이미 정렬된 이미지 사용
        const sortedImages = selectedImages;

        // 슬라이드 생성
        sortedImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.description || room.name;
            img.className = 'w-full h-full object-cover';
            img.loading = index === 0 ? 'eager' : 'lazy';
            img.setAttribute('data-image-fallback', '');

            slide.appendChild(img);
            slidesContainer.appendChild(slide);
        });

        // Total slides 인디케이터 업데이트
        const totalSlidesElement = this.safeSelect('[data-room-total-slides]');
        if (totalSlidesElement) {
            totalSlidesElement.textContent = String(sortedImages.length).padStart(2, '0');
        }

        // 전역 슬라이더 초기화 함수 호출 (room.js의 initializeSlider)
        if (typeof window.initializeSlider === 'function') {
            window.initializeSlider();
        }
    }

    /**
     * 객실 정보 섹션 매핑
     */
    mapRoomInfoSection() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실명 매핑
        const roomInfoName = this.safeSelect('[data-room-info-name]');
        if (roomInfoName) {
            roomInfoName.textContent = room.name;
        }

        // 객실 상세 설명 매핑
        const roomInfoDescription = this.safeSelect('[data-room-info-description]');
        if (roomInfoDescription) {
            const roomDescriptions = this.safeGet(this.data, 'homepage.customFields.roomPage.roomDescriptions');
            const roomDesc = roomDescriptions?.find(desc => desc.roomtypeId === room.id);
            const infoDescription = roomDesc?.infoDescription;

            // XSS 방지 처리 후 줄바꿈을 <br>로 변환
            roomInfoDescription.innerHTML = this._formatTextWithLineBreaks(
                infoDescription || room.description,
                `${room.name}의 상세 정보입니다.`
            );
        }

        // 수용인원 매핑
        const roomCapacity = this.safeSelect('[data-room-capacity]');
        if (roomCapacity) {
            const capacity = `기준 ${room.baseOccupancy || 2}인 / 최대 ${room.maxOccupancy || 4}인`;
            roomCapacity.textContent = capacity;
        }

        // 뷰 정보 매핑 (현재 room의 roomViews 배열의 모든 뷰 표시)
        const roomView = this.safeSelect('[data-room-view]');
        if (roomView) {
            const roomViews = room.roomViews || [];
            const viewInfo = roomViews.length > 0 ? roomViews.join(', ') : '객실 뷰';
            roomView.textContent = viewInfo;
        }

        // 침대 타입 매핑 (현재 room의 bedTypes 배열의 모든 타입 표시)
        const roomBedType = this.safeSelect('[data-room-bed-type]');
        if (roomBedType) {
            const bedTypes = room.bedTypes || [];
            const bedTypeInfo = bedTypes.length > 0 ? bedTypes.join(', ') : '킹사이즈 침대';
            roomBedType.textContent = bedTypeInfo;
        }

        // 체크인/체크아웃 정보 매핑
        const roomCheckinCheckout = this.safeSelect('[data-room-checkin-checkout]');
        if (roomCheckinCheckout) {
            const checkinTime = this.data.property?.checkinTime || '15:00';
            const checkoutTime = this.data.property?.checkoutTime || '11:00';
            roomCheckinCheckout.textContent = `체크인 ${checkinTime} / 체크아웃 ${checkoutTime}`;
        }

        // 객실 구조 매핑 (현재 room의 roomStructures 배열의 모든 구조 표시)
        const roomStructure = this.safeSelect('[data-room-structure]');
        if (roomStructure) {
            const roomStructures = room.roomStructures || [];
            const structureInfo = roomStructures.length > 0 ? roomStructures.join(', ') : '침실 1개, 화장실 1개';
            roomStructure.textContent = structureInfo;
        }

        // 객실 이용안내 매핑 (roomInfo 필드 사용, 줄바꿈 처리)
        const roomAdditionalInfo = this.safeSelect('[data-room-additional-info]');
        if (roomAdditionalInfo) {
            const roomInfo = room.roomInfo || '편안한 휴식 공간';
            // XSS 방지 처리 후 줄바꿈을 <br>로 변환
            roomAdditionalInfo.innerHTML = this._formatTextWithLineBreaks(roomInfo);
        }
    }

    /**
     * 객실 편의시설/특징 매핑
     */
    mapRoomAmenities() {
        const room = this.getCurrentRoom();
        if (!room || !room.amenities || room.amenities.length === 0) {
            return;
        }

        const amenitiesGrid = this.safeSelect('[data-room-amenities-grid]');
        if (!amenitiesGrid) {
            return;
        }

        // 기존 어메니티 제거
        amenitiesGrid.innerHTML = '';

        // JSON 데이터의 실제 어메니티들에 맞춘 아이콘 매핑 (기존 방식 유지)
        const amenityIcons = {
            // JSON에서 나오는 실제 어메니티들
            '간이 주방': 'M3 6h18M3 6l3-3h12l3 3M3 6v15a2 2 0 002 2h14a2 2 0 002-2V6M10 12h4',
            '냉장고': 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM12 8h.01M12 16h.01',
            '전자레인지': 'M3 7h18v10H3V7zM7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M9 12h6',
            '인덕션': 'M8 12a4 4 0 118 0 4 4 0 01-8 0zM12 8v8M8 12h8',
            '조리도구': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            '그릇': 'M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9zM8 12h8',
            '정수기': 'M12 2v20M8 5h8M6 12h12M8 19h8',
            '와이파이': 'M2 7h20M2 12h20M2 17h20',
            '에어컨': 'M3 12h18M3 8h18M3 16h18M12 3v18',
            '침구류': 'M3 7h18v10H3V7zM7 3h10v4H7V3z',
            '수건': 'M3 12h18M6 7h12M6 17h12',
            '어메니티': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            '청소용품': 'M6 2l3 6 5-4-8 13 4-7 6 2z',
            '헤어드라이어': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            '기본': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        };

        // 어메니티 아이템들 생성 (기존 방식과 동일)
        room.amenities.forEach(amenity => {
            const amenityDiv = document.createElement('div');
            amenityDiv.className = 'feature-item';

            const amenityName = amenity.name?.ko || amenity.name || amenity;
            const iconPath = amenityIcons[amenityName] || amenityIcons['기본'];

            amenityDiv.innerHTML = `
                <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"/>
                </svg>
                <span class="text-base md:text-lg text-gray-600">${amenityName}</span>
            `;

            amenitiesGrid.appendChild(amenityDiv);
        });
    }

    /**
     * 갤러리 아이템 생성 헬퍼 함수
     * @param {Object|null} image - 이미지 객체 (url, description 포함)
     * @param {string} roomName - 객실명 (alt 속성용)
     * @returns {HTMLElement} 생성된 갤러리 아이템 DOM 엘리먼트
     */
    _createGalleryItem(image, roomName) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.loading = 'lazy';

        if (image) {
            img.src = image.url;
            img.alt = image.description || roomName;
            img.className = 'w-full h-full object-cover';
            img.setAttribute('data-image-fallback', '');
        } else {
            img.src = ImageHelpers.EMPTY_IMAGE_SVG;
            img.alt = '이미지 없음';
            img.className = 'w-full h-full object-cover empty-image-placeholder';
        }

        galleryItem.appendChild(img);
        return galleryItem;
    }

    /**
     * 객실 갤러리 매핑
     */
    mapRoomGallery() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const galleryGrid = this.safeSelect('[data-room-gallery-grid]');
        if (!galleryGrid) {
            return;
        }

        // 기존 갤러리 제거
        galleryGrid.innerHTML = '';

        // room.images[0].interior 배열에서 이미지 가져오기 (hero 슬라이더와 동일한 소스)
        const interiorImages = room.images?.[0]?.interior;

        // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
        const sortedImages = this._getSortedSelectedImages(interiorImages);

        // 첫 4개 이미지(0,1,2,3번째)를 2:2 그리드 구조로 배치
        const firstFourImages = sortedImages.slice(0, 4);

        // 왼쪽 컬럼 생성
        const galleryLeft = document.createElement('div');
        galleryLeft.className = 'gallery-left';

        // 왼쪽 컬럼: 첫 2개 이미지 (0,1번째) - 부족하면 빈 이미지로 채우기
        for (let i = 0; i < 2; i++) {
            // Get the image data for the current gallery item (can be null if less than 4 images)
            const imageData = firstFourImages[i];
            galleryLeft.appendChild(this._createGalleryItem(imageData, room.name));
        }

        // 오른쪽 컬럼 생성
        const galleryRight = document.createElement('div');
        galleryRight.className = 'gallery-right';

        // 오른쪽 컬럼: 3,4번째 이미지 (2,3번째 인덱스) - 부족하면 빈 이미지로 채우기
        for (let i = 2; i < 4; i++) {
            // Get the image data for the current gallery item (can be null if less than 4 images)
            const imageData = firstFourImages[i];
            galleryRight.appendChild(this._createGalleryItem(imageData, room.name));
        }

        // 그리드에 추가
        galleryGrid.appendChild(galleryLeft);
        galleryGrid.appendChild(galleryRight);
    }

    /**
     * Exterior Area 섹션 매핑
     */
    mapExteriorArea() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // Main exterior area 이미지 매핑 (첫 번째 exterior 이미지 사용)
        const mainExteriorImage = this.safeSelect('[data-room-main-exterior-image]');
        if (mainExteriorImage) {
            mainExteriorImage.innerHTML = '';

            const img = document.createElement('img');

            // exterior 이미지 확인
            const exteriorImages = room.images?.[0]?.exterior;

            if (exteriorImages && exteriorImages.length > 0) {
                // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
                const selectedImages = this._getSortedSelectedImages(exteriorImages);

                if (selectedImages.length > 0) {
                    const firstImage = selectedImages[0];

                    img.src = firstImage.url;
                    img.alt = firstImage.description || room.name + ' Exterior';
                    img.className = 'w-full h-full object-cover';
                    img.setAttribute('data-image-fallback', '');
                } else {
                    // 선택된 이미지가 없으면 placeholder 사용
                    ImageHelpers.applyPlaceholder(img);
                }
            } else {
                // 이미지가 없으면 placeholder 사용
                ImageHelpers.applyPlaceholder(img);
            }

            mainExteriorImage.appendChild(img);
        }

        // Exterior area 텍스트 매핑 (gallery JSON 구조 기반)
        const exteriorDescription = this.safeSelect('[data-room-exterior-description]');
        if (exteriorDescription) {
            const roomPageData = this.getCurrentRoomPageData();
            const gallery = roomPageData?.data?.sections?.[0]?.gallery;

            // XSS 방지 처리 후 줄바꿈을 <br>로 변환
            exteriorDescription.innerHTML = this._formatTextWithLineBreaks(gallery?.title, '객실 갤러리 타이틀');
        }

        // Mobile gallery 매핑 (메인 이미지 제외한 나머지 3개)
        this._createExteriorGallery('[data-room-mobile-gallery]', 'mobile-gallery-item', room);

        // Desktop gallery 매핑 (메인 이미지 제외한 나머지 3개)
        this._createExteriorGallery('[data-room-desktop-gallery]', 'desktop-gallery-item', room);
    }

    /**
     * Exterior Gallery 생성 헬퍼
     * @param {string} containerSelector - 갤러리 컨테이너 셀렉터
     * @param {string} itemClassName - 갤러리 아이템 클래스명
     * @param {Object} room - 객실 정보
     */
    _createExteriorGallery(containerSelector, itemClassName, room) {
        const gallery = this.safeSelect(containerSelector);
        if (!gallery) return;

        gallery.innerHTML = '';

        const exteriorImages = room.images?.[0]?.exterior;
        const sortedImages = this._getSortedSelectedImages(exteriorImages);

        // 첫 번째 이미지(메인 이미지)를 제외한 나머지 이미지들로 썸네일 3개 생성
        const thumbnailImages = sortedImages.slice(1, 4);

        // 최대 3개까지 표시, 부족하면 빈 이미지로 채우기
        for (let i = 0; i < 3; i++) {
            const galleryItem = document.createElement('div');
            galleryItem.className = itemClassName;

            const img = document.createElement('img');

            if (thumbnailImages[i]) {
                img.src = thumbnailImages[i].url;
                img.alt = thumbnailImages[i].description || room.name;
                img.className = 'w-full h-full object-cover';
                img.loading = 'lazy';
                img.setAttribute('data-image-fallback', '');
            } else {
                img.src = ImageHelpers.EMPTY_IMAGE_SVG;
                img.alt = '이미지 없음';
                img.className = 'w-full h-full object-cover empty-image-placeholder';
                img.loading = 'lazy';
            }

            galleryItem.appendChild(img);
            gallery.appendChild(galleryItem);
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Room 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map room page: data not loaded');
            return;
        }

        const room = this.getCurrentRoom();
        if (!room) {
            console.error('Cannot map room page: room not found');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSection();
        this.mapRoomInfoSection();
        this.mapRoomAmenities();
        this.mapRoomGallery();
        this.mapExteriorArea();

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const pageSEO = (room?.name && property?.name) ? { title: `${room.name} - ${property.name}` } : null;
        this.updateMetaTags(pageSEO);

        // Open Graph 메타 태그 매핑
        const ogTitle = pageSEO?.title || this.data?.seo?.title || '';
        const ogDescription = room?.description || this.data?.seo?.description || '';

        // isSelected가 true인 이미지 중 첫 번째 찾기
        const thumbnailImages = this._getSortedSelectedImages(room?.images?.[0]?.thumbnail);
        const interiorImages = this._getSortedSelectedImages(room?.images?.[0]?.interior);
        const exteriorImages = this._getSortedSelectedImages(room?.images?.[0]?.exterior);

        const ogImage = thumbnailImages?.[0]?.url ||
                       interiorImages?.[0]?.url ||
                       exteriorImages?.[0]?.url || '';
        this.mapOpenGraphTags(ogTitle, ogDescription, ogImage);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * Room 페이지 Gallery 텍스트만 업데이트 (성능 최적화용)
     */
    mapRoomGalleryText() {
        if (!this.isDataLoaded) return;

        // Exterior area 텍스트 매핑 (gallery JSON 구조 기반)
        const exteriorDescription = this.safeSelect('[data-room-exterior-description]');
        if (exteriorDescription) {
            const roomPageData = this.getCurrentRoomPageData();
            const gallery = roomPageData?.data?.sections?.[0]?.gallery;

            // XSS 방지 처리 후 줄바꿈을 <br>로 변환
            exteriorDescription.innerHTML = this._formatTextWithLineBreaks(gallery?.title, '객실 갤러리 타이틀');
        }
    }

    /**
     * 네비게이션 함수 설정
     */
    setupNavigation() {
        // 홈으로 이동 함수 설정
        window.navigateToHome = () => {
            window.location.href = './index.html';
        };
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomMapper;
} else {
    window.RoomMapper = RoomMapper;
}
