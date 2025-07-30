// 다국어 지원 객체
const translations = {
    ko: {
        title: "한국 전통 요리 지도",
        main_title: "🍜 한국 전통 요리 탐험",
        about: "소개",
        search_placeholder: "음식 이름을 검색하세요...",
        select_city: "도시를 선택하세요",
        welcome_message: "지도에서 도시 마커를 클릭하여 전통 요리를 탐험해보세요!",
        origin: "유래",
        history: "역사적 배경",
        geography: "지리적 특징",
        back: "뒤로 가기"
    },
    en: {
        title: "Korean Traditional Food Map",
        main_title: "🍜 Explore Korean Traditional Cuisine",
        about: "About",
        search_placeholder: "Search for food names...",
        select_city: "Select a City",
        welcome_message: "Click on city markers on the map to explore traditional cuisine!",
        origin: "Origin",
        history: "Historical Background",
        geography: "Geographic Features",
        back: "Back"
    }
};

// 현재 언어 설정
let currentLang = 'ko';

// 지도 및 전역 변수
let map;
let markers = {};
let allFoodData = {};
let currentHighlightedMarker = null;

// 도시 좌표 정보
const cities = {
    seoul: { lat: 37.5665, lng: 126.9780, name: { ko: "서울", en: "Seoul" } },
    busan: { lat: 35.1796, lng: 129.0756, name: { ko: "부산", en: "Busan" } },
    jeonju: { lat: 35.8242, lng: 127.1480, name: { ko: "전주", en: "Jeonju" } },
    gangneung: { lat: 37.7519, lng: 128.8761, name: { ko: "강릉", en: "Gangneung" } },
    andong: { lat: 36.5684, lng: 128.7294, name: { ko: "안동", en: "Andong" } },
    jeju: { lat: 33.4996, lng: 126.5312, name: { ko: "제주", en: "Jeju" } },
    daegu: { lat: 35.8714, lng: 128.6014, name: { ko: "대구", en: "Daegu" } },
    gwangju: { lat: 35.1595, lng: 126.8526, name: { ko: "광주", en: "Gwangju" } },
    suwon: { lat: 37.2636, lng: 127.0286, name: { ko: "수원", en: "Suwon" } },
    incheon: { lat: 37.4563, lng: 126.7052, name: { ko: "인천", en: "Incheon" } },
    chuncheon: { lat: 37.8813, lng: 127.7298, name: { ko: "춘천", en: "Chuncheon" } },
    mokpo: { lat: 34.8118, lng: 126.3922, name: { ko: "목포", en: "Mokpo" } },
    daejeon: { lat: 36.3504, lng: 127.3845, name: { ko: "대전", en: "Daejeon" } },
    ansan: { lat: 37.3236, lng: 126.8219, name: { ko: "안산", en: "Ansan" } },
    hupo: { lat: 36.6789, lng: 129.4167, name: { ko: "후포", en: "Hupo" } },
    uijeongbu: { lat: 37.7384, lng: 127.0408, name: { ko: "의정부", en: "Uijeongbu" } }
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadCityData();
    setupEventListeners();
    applyTranslations(currentLang);
});

// 지도 초기화
function initializeMap() {
    map = L.map('map').setView([36.5, 127.5], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// 도시 데이터 로드
async function loadCityData() {
    console.log('Loading city data...');
    
    for (const [cityKey, cityInfo] of Object.entries(cities)) {
        try {
            console.log(`Loading data for ${cityKey}...`);
            const response = await fetch(`data/${cityKey}.json`);
            
            if (!response.ok) {
                console.error(`Failed to load ${cityKey}.json:`, response.status);
                // JSON 파일이 없어도 마커는 생성
                createMarker(cityKey, cityInfo);
                continue;
            }
            
            const cityData = await response.json();
            allFoodData[cityKey] = cityData;
            console.log(`Loaded ${cityKey} data:`, cityData);
            
            // 마커 생성
            createMarker(cityKey, cityInfo);
            
        } catch (error) {
            console.error(`Error loading ${cityKey} data:`, error);
            // 에러가 발생해도 마커는 생성
            createMarker(cityKey, cityInfo);
        }
    }
    console.log('All markers created:', markers);
}

// 마커 생성 함수 분리
function createMarker(cityKey, cityInfo) {
    console.log(`Creating marker for ${cityKey} at`, cityInfo.lat, cityInfo.lng);
    
    const marker = L.marker([cityInfo.lat, cityInfo.lng])
        .addTo(map)
        .bindPopup(`<strong>${cityInfo.name[currentLang]}</strong>`)
        .on('click', () => {
            console.log(`Marker clicked: ${cityKey}`);
            showCityFoods(cityKey);
        });
    
    markers[cityKey] = marker;
    console.log(`Marker created for ${cityKey}:`, marker);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 언어 전환 버튼
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    // 검색 기능
    const searchInput = document.getElementById('food-search');
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', () => {
        document.getElementById('search-results').style.display = 'block';
    });
    
    // 검색 결과 외부 클릭 시 숨기기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-results').style.display = 'none';
        }
    });

    // 패널 닫기 버튼
    document.getElementById('close-panel').addEventListener('click', closeCityPanel);
}

// 언어 전환
function switchLanguage(lang) {
    currentLang = lang;
    
    // 버튼 상태 업데이트
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
    
    // 번역 적용
    applyTranslations(lang);
    
    // 마커 팝업 업데이트
    updateMarkerPopups();
}

// 번역 적용
function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // placeholder 번역
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // title 번역
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (translations[lang] && translations[lang][key]) {
            element.title = translations[lang][key];
        }
    });
    
    // 페이지 타이틀 업데이트
    document.title = translations[lang].title;
}

// 마커 팝업 업데이트
function updateMarkerPopups() {
    Object.entries(markers).forEach(([cityKey, marker]) => {
        const cityName = cities[cityKey].name[currentLang];
        marker.setPopupContent(`<strong>${cityName}</strong>`);
    });
}

// 검색 처리
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (query.length === 0) {
        resultsContainer.style.display = 'none';
        clearHighlightedMarker();
        return;
    }
    
    const results = searchFoods(query);
    displaySearchResults(results);
    resultsContainer.style.display = 'block';
}

// 음식 검색
function searchFoods(query) {
    const results = [];
    
    Object.entries(allFoodData).forEach(([cityKey, cityData]) => {
        cityData.foods.forEach(food => {
            const foodName = food.name[currentLang].toLowerCase();
            if (foodName.includes(query)) {
                results.push({
                    cityKey,
                    cityName: cities[cityKey].name[currentLang],
                    food: food
                });
            }
        });
    });
    
    return results;
}

// 검색 결과 표시
function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
        return;
    }
    
    container.innerHTML = results.map(result => 
        `<div class="search-result-item" onclick="selectSearchResult('${result.cityKey}', '${result.food.id}')">
            <strong>${result.food.name[currentLang]}</strong> - ${result.cityName}
        </div>`
    ).join('');
}

// 검색 결과 선택
function selectSearchResult(cityKey, foodId) {
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('food-search').value = '';
    
    // 마커 하이라이트
    highlightMarker(cityKey);
    
    // 도시 음식 표시
    showCityFoods(cityKey);
    
    // 해당 음식으로 스크롤 (약간의 지연 후)
    setTimeout(() => {
        const foodElement = document.querySelector(`[data-food-id="${foodId}"]`);
        if (foodElement) {
            foodElement.scrollIntoView({ behavior: 'smooth' });
            foodElement.style.background = '#e3f2fd';
            setTimeout(() => {
                foodElement.style.background = '';
            }, 2000);
        }
    }, 500);
}

// 마커 하이라이트
function highlightMarker(cityKey) {
    clearHighlightedMarker();
    
    const marker = markers[cityKey];
    if (marker) {
        marker._icon.classList.add('highlight-marker');
        currentHighlightedMarker = marker;
        
        // 지도 중심을 해당 마커로 이동
        map.setView([cities[cityKey].lat, cities[cityKey].lng], 8);
    }
}

// 하이라이트 제거
function clearHighlightedMarker() {
    if (currentHighlightedMarker) {
        currentHighlightedMarker._icon.classList.remove('highlight-marker');
        currentHighlightedMarker = null;
    }
}

// 도시 음식 표시
function showCityFoods(cityKey) {
    console.log(`Showing foods for ${cityKey}`);
    
    const cityData = allFoodData[cityKey];
    const cityName = cities[cityKey].name[currentLang];
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');
    
    document.querySelector('.panel-header h3').textContent = cityName;
    
    // 데이터가 없는 경우 처리
    if (!cityData || !cityData.foods) {
        content.innerHTML = `
            <div class="city-foods">
                <p>이 도시의 음식 데이터를 불러오는 중입니다...</p>
                <p>또는 데이터 파일을 확인해주세요: data/${cityKey}.json</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="city-foods">
            ${cityData.foods.map(food => `
                <div class="food-item" data-food-id="${food.id}" onclick="showFoodDetail('${cityKey}', '${food.id}')">
                    <h4>${food.name[currentLang]}</h4>
                    <p>${food.description[currentLang]}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// 음식 상세 정보 표시
function showFoodDetail(cityKey, foodId) {
    const cityData = allFoodData[cityKey];
    const food = cityData.foods.find(f => f.id === foodId);
    const content = document.getElementById('panel-content');
    
    content.innerHTML = `
        <div class="food-detail">
            <button class="back-btn" onclick="showCityFoods('${cityKey}')">${translations[currentLang].back}</button>
            <h3>${food.name[currentLang]}</h3>
            
            <div class="detail-section">
                <h4>${translations[currentLang].origin}</h4>
                <p>${food.origin[currentLang]}</p>
            </div>
            
            <div class="detail-section">
                <h4>${translations[currentLang].history}</h4>
                <p>${food.history[currentLang]}</p>
            </div>
            
            <div class="detail-section">
                <h4>${translations[currentLang].geography}</h4>
                <p>${food.geography[currentLang]}</p>
            </div>
        </div>
    `;
}

// 도시 패널 닫기
function closeCityPanel() {
    const content = document.getElementById('panel-content');
    document.querySelector('.panel-header h3').textContent = translations[currentLang].select_city;
    content.innerHTML = `<p>${translations[currentLang].welcome_message}</p>`;
    clearHighlightedMarker();
}
