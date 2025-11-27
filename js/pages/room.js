/**
 * Room Page Functionality
 * 객실 페이지 슬라이더 및 갤러리 기능
 */

import { initSwipeHandler } from '../utils/swipe-handler.js';

// Global variables
let currentSlide = 0;
let autoSlideTimer;

// Mobile gallery drag functionality
let isDragging = false;
let startX = 0;
let scrollLeft = 0;
const mobileGallery = document.getElementById('mobile-gallery');

// Navigation function
function navigateToHome() {
    window.location.href = './index.html';
}

function updateSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicatorCurrent = document.querySelector('.indicator-current');
  const indicatorProgress = document.querySelector('.indicator-progress');

  // 슬라이드가 없으면 리턴
  if (slides.length === 0) return;

  // currentSlide가 범위를 벗어나면 수정
  if (currentSlide >= slides.length) {
    currentSlide = 0;
  } else if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }

  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
  });

  const totalSlides = slides.length;
  if (indicatorCurrent) {
    indicatorCurrent.textContent = String(currentSlide + 1).padStart(2, '0');
  }
  if (indicatorProgress) {
    indicatorProgress.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
  }
}

function nextSlide() {
  const totalSlides = document.querySelectorAll('.hero-slide').length;
  if (totalSlides === 0) return;

  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider();
  resetAutoSlide();
}

function prevSlide() {
  const totalSlides = document.querySelectorAll('.hero-slide').length;
  currentSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
  updateSlider();
  resetAutoSlide();
}

function goToSlide(index) {
  currentSlide = index;
  updateSlider();
  resetAutoSlide();
}

function startAutoSlide() {
  // 기존 타이머가 있다면 먼저 정리
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
  }

  autoSlideTimer = setInterval(() => {
    nextSlide();
  }, 5000);
}

function resetAutoSlide() {
  clearInterval(autoSlideTimer);
  autoSlideTimer = null;
  startAutoSlide();
}

// 슬라이더 초기화 함수 (hero 슬라이드 생성 후 호출)
function initializeSlider() {
  // 기존 타이머 정리
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }

  // currentSlide 리셋
  currentSlide = 0;

  // 슬라이더 업데이트 및 자동 재생 시작
  updateSlider();
  startAutoSlide();
}

// 전역으로 노출
window.initializeSlider = initializeSlider;

// Mobile gallery drag handlers
function initializeMobileGallery() {
    if (!mobileGallery) return;

    mobileGallery.addEventListener('mousedown', (e) => {
        isDragging = true;
        mobileGallery.classList.add('dragging');
        startX = e.pageX - mobileGallery.offsetLeft;
        scrollLeft = mobileGallery.scrollLeft;
        e.preventDefault();
    });

    mobileGallery.addEventListener('mouseleave', () => {
        isDragging = false;
        mobileGallery.classList.remove('dragging');
    });

    mobileGallery.addEventListener('mouseup', () => {
        isDragging = false;
        mobileGallery.classList.remove('dragging');
    });

    mobileGallery.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - mobileGallery.offsetLeft;
        const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
        mobileGallery.scrollLeft = scrollLeft - walk;
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize mobile gallery
  initializeMobileGallery();

  // Initialize hero slider navigation buttons
  const prevButton = document.querySelector('.nav-button.prev');
  const nextButton = document.querySelector('.nav-button.next');

  if (prevButton) {
    prevButton.addEventListener('click', prevSlide);
  }

  if (nextButton) {
    nextButton.addEventListener('click', nextSlide);
  }

  // Initialize touch swipe for hero section
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    initSwipeHandler(heroSection, nextSlide, prevSlide);
  }

  // Initialize RoomMapper (PreviewHandler가 없을 때만)
  if (!window.previewHandler) {
    const roomMapper = new RoomMapper();
    roomMapper.initialize().then(() => {
      roomMapper.setupNavigation();
      // 슬라이더 초기화는 RoomMapper의 initializeHeroSlider에서 호출됨
    }).catch(error => {
      console.error('❌ RoomMapper initialization failed:', error);
    });
  }
});