// Vercel 서버리스 프록시 API 엔드포인트 주소 (/api/dust)
const API_ENDPOINT = '/api/dust';

// 지역(시·도) 선택 드롭다운 요소 가져오기
const sidoSelect = document.getElementById('sidoSelect');

// 공기 신호등 상단 대형 대표 카드 컨테이너 가져오기
const trafficCard = document.getElementById('trafficCard');

// 공기 신호등 상단 지역 이름 표시 요소 가져오기
const trafficRegion = document.getElementById('trafficRegion');

// 아주 크게 표시될 신호등 이모지(🔵🟢🟠🔴⚪) 요소 가져오기
const trafficEmoji = document.getElementById('trafficEmoji');

// 아주 크게 표시될 상태 텍스트(좋음/보통/나쁨/매우나쁨) 요소 가져오기
const trafficStatusText = document.getElementById('trafficStatusText');

// 평균 미세먼지 수치를 표시할 숫자 요소 가져오기
const trafficAverageValue = document.getElementById('trafficAverageValue');

// 나쁨 이상 시 마스크 권고 등을 표시할 한 줄 안내 문구 요소 가져오기
const trafficNotice = document.getElementById('trafficNotice');

// 데이터 로딩 중 및 오류 상태를 알리는 안내 메시지 요소 가져오기
const statusMessage = document.getElementById('statusMessage');

// 측정소별 카드가 은은하게 나열될 부모 그리드 컨테이너 가져오기
const stationGrid = document.getElementById('stationGrid');

// 미세먼지 등급 번호('1','2','3','4')에 해당하는 신호등 이모지(🔵🟢🟠🔴) 반환 함수
function getTrafficEmoji(grade) {
  // 1등급은 파란색 원 이모지 반환
  if (grade === '1') return '🔵';
  // 2등급은 초록색 원 이모지 반환
  if (grade === '2') return '🟢';
  // 3등급은 주황색 원 이모지 반환
  if (grade === '3') return '🟠';
  // 4등급은 빨간색 원 이모지 반환
  if (grade === '4') return '🔴';
  // 등급이 없거나 측정 불가일 때는 흰색/회색 원 이모지 반환
  return '⚪';
}

// 미세먼지 등급 번호에 해당하는 한글 상태 텍스트 반환 함수
function getGradeText(grade) {
  // 1등급 한글 상태
  if (grade === '1') return '좋음';
  // 2등급 한글 상태
  if (grade === '2') return '보통';
  // 3등급 한글 상태
  if (grade === '3') return '나쁨';
  // 4등급 한글 상태
  if (grade === '4') return '매우나쁨';
  // 등급이 없을 때 한글 상태
  return '측정 정보 없음';
}

// 등급에 따라 은은하게 적용할 CSS 테마 클래스명 반환 함수
function getGradeClass(grade) {
  // 1등급 테마 클래스 (파랑)
  if (grade === '1') return 'grade-1';
  // 2등급 테마 클래스 (초록)
  if (grade === '2') return 'grade-2';
  // 3등급 테마 클래스 (주황)
  if (grade === '3') return 'grade-3';
  // 4등급 테마 클래스 (빨강)
  if (grade === '4') return 'grade-4';
  // 등급 없음 테마 클래스 (회색)
  return 'grade-none';
}

// 대기 상태 등급에 따라 표시할 한 줄 안내 문구 반환 함수 (나쁨 이상이면 '외출 시 마스크를 챙기세요')
function getTrafficNotice(grade) {
  // 1등급 좋음일 때의 안내 문구
  if (grade === '1') return '공기가 맑고 쾌적해요! 환기하기 좋은 날입니다.';
  // 2등급 보통일 때의 안내 문구
  if (grade === '2') return '무난한 공기 상태예요. 일상적인 야외 활동이 가능합니다.';
  // 3등급 나쁨일 때의 필수 안내 문구 (마스크 착용 권고)
  if (grade === '3') return '외출 시 마스크를 챙기세요!';
  // 4등급 매우나쁨일 때의 필수 안내 문구 (마스크 착용 권고 및 외출 자제)
  if (grade === '4') return '외출 시 마스크를 챙기세요! (가급적 외출을 자제하세요)';
  // 정보가 없을 때의 기본 안내 문구
  return '현재 대기 정보를 불러오는 중이거나 점검 중입니다.';
}

// 수치 형태의 평균 미세먼지 농도에 따라 한국 환경부 기준 등급 번호를 계산하는 함수
function calculateGradeFromValue(pm10) {
  // 유효한 숫자가 아닌 경우 빈 문자열 반환
  if (pm10 === null || isNaN(pm10)) return '';
  // 0 ~ 30 ㎍/㎥ 구간은 좋음(1)
  if (pm10 <= 30) return '1';
  // 31 ~ 80 ㎍/㎥ 구간은 보통(2)
  if (pm10 <= 80) return '2';
  // 81 ~ 150 ㎍/㎥ 구간은 나쁨(3)
  if (pm10 <= 150) return '3';
  // 151 ㎍/㎥ 이상 구간은 매우나쁨(4)
  return '4';
}

// 측정 시각 문자열(예: '2026-10-28 16:00')을 '2026년 10월 28일 16시 기준'처럼 한국어로 변환하는 함수
function formatKoreanDateTime(dateTimeStr) {
  // 측정 일시 문자열이 비어있는 경우 처리
  if (!dateTimeStr || dateTimeStr.trim() === '') {
    return '측정 시각 미상';
  }

  // 'YYYY-MM-DD HH:mm' 형태의 정규식 패턴 분석
  const regex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
  // 정규식 매칭 수행
  const match = dateTimeStr.trim().match(regex);

  // 패턴이 정상적으로 매칭된 경우 한국어 포맷으로 조립
  if (match) {
    // 4자리 연도 추출
    const year = match[1];
    // 앞자리 0을 제거한 월 숫자 추출
    const month = parseInt(match[2], 10);
    // 앞자리 0을 제거한 일 숫자 추출
    const day = parseInt(match[3], 10);
    // 앞자리 0을 제거한 시간 숫자 추출
    const hour = parseInt(match[4], 10);
    // 'YYYY년 M월 D일 H시 기준' 형태의 한국어 문자열 반환
    return `${year}년 ${month}월 ${day}일 ${hour}시 기준`;
  }

  // 다른 포맷으로 들어온 경우 뒤에 '기준'만 덧붙여 안전하게 반환
  return `${dateTimeStr.trim()} 기준`;
}

// 측정값이 '-' 이거나 유효하지 않은 경우 '측정 안 됨'으로 변환하는 함수
function formatDustValue(rawValue) {
  // 값이 없거나 공백이거나 하이픈('-')인 경우 '측정 안 됨' 문자열 반환
  if (!rawValue || rawValue.trim() === '' || rawValue.trim() === '-') {
    return '측정 안 됨';
  }
  // 유효한 수치인 경우 단위(㎍/㎥)와 함께 반환
  return `${rawValue.trim()} ㎍/㎥`;
}

// 선택된 시·도의 대기오염 정보를 서버리스 API(/api/dust)로부터 비동기로 조회하는 함수
async function fetchAirQualityData(sidoName) {
  // 데이터를 불러오는 동안 요구사항에 맞게 '불러오는 중...' 문구 표시
  statusMessage.textContent = '불러오는 중...';
  // 로딩 안내 메시지 노출
  statusMessage.style.display = 'block';
  // 기존 측정소 카드 목록 비우기
  stationGrid.innerHTML = '';

  // Vercel 프록시 API 호출 주소 생성
  const requestUrl = `${API_ENDPOINT}?sido=${encodeURIComponent(sidoName)}`;

  try {
    // 비동기 HTTP GET 요청 전송
    const response = await fetch(requestUrl);
    // 응답 JSON 본문 파싱
    const data = await response.json();

    // 서버리스 함수에서 반환한 에러 응답 처리
    if (!response.ok || data.error) {
      // 서버에서 전달된 한국어 에러 메시지 추출
      const errMsg = data.error || '대기오염 데이터를 불러오지 못했습니다.';
      // 에러 메시지를 상태 안내란에 표시
      statusMessage.textContent = errMsg;
      // 상단 공기 신호등 카드를 빈 상태로 초기화
      updateTrafficCard(sidoName, null);
      return;
    }

    // 측정소 데이터 배열 추출
    const items = data?.response?.body?.items;

    // 측정소 데이터가 비어 있는 경우 처리
    if (!items || items.length === 0) {
      // 데이터 없음 안내 문구 표시
      statusMessage.textContent = `${sidoName} 지역에 대한 측정소 데이터가 없습니다.`;
      // 상단 공기 신호등 초기화
      updateTrafficCard(sidoName, null);
      return;
    }

    // 정상적으로 데이터를 불러왔으므로 '불러오는 중...' 안내 문구 숨김
    statusMessage.style.display = 'none';

    // 해당 지역의 측정소별 수치를 토대로 평균 수치 계산 및 상단 공기 신호등 갱신
    calculateAndDisplayTraffic(sidoName, items);

    // 각 측정소별 카드들을 은은한 등급 색상으로 화면에 렌더링
    renderStationCards(items);

  } catch (error) {
    // 네트워크 실패 등 예외 발생 시 콘솔 로그 출력
    console.error('대기오염 정보 조회 실패:', error);
    // 화면에 사용자 친화적 오류 메시지 표시
    statusMessage.textContent = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    // 상단 공기 신호등 카드 초기화
    updateTrafficCard(sidoName, null);
  }
}

// 측정소 데이터 목록에서 유효한 pm10Value만 필터링하여 평균값을 계산하는 함수
function calculateAndDisplayTraffic(sidoName, items) {
  // 미세먼지 수치 총합 변수
  let sum = 0;
  // 유효한 수치를 가진 측정소 수 카운트 변수
  let validCount = 0;

  // 전체 측정소 목록 순회
  items.forEach(item => {
    // 미세먼지 원본 값
    const rawVal = item.pm10Value;
    // 하이픈('-') 및 빈 값이 아닌 유효한 수치인지 검사 (평균 계산 시 제외 처리)
    if (rawVal && rawVal.trim() !== '' && rawVal.trim() !== '-' && !isNaN(Number(rawVal))) {
      // 유효한 숫자인 경우에만 합산
      sum += Number(rawVal);
      // 유효 개수 증가
      validCount += 1;
    }
  });

  // 유효한 측정소가 1개 이상이면 반올림 평균 계산, 없으면 null 반환
  const average = validCount > 0 ? Math.round(sum / validCount) : null;

  // 상단 공기 신호등 카드 업데이트 함수 호출
  updateTrafficCard(sidoName, average);
}

// 맨 위 공기 신호등 대형 카드(이모지, 상태텍스트, 평균수치, 마스크 안내문구)를 갱신하는 함수
function updateTrafficCard(sidoName, averageValue) {
  // 상단 지역명 업데이트
  trafficRegion.textContent = `${sidoName} 대기 상태`;

  // 기본 클래스 초기화
  trafficCard.className = 'traffic-card';

  // 평균값이 존재하는 정상적인 경우 처리
  if (averageValue !== null) {
    // 평균 수치를 바탕으로 환경부 기준 등급 번호('1','2','3','4') 계산
    const grade = calculateGradeFromValue(averageValue);

    // 등급 테마 클래스 추가 (은은한 배경과 테두리 색상 반영)
    trafficCard.classList.add(getGradeClass(grade));
    // 이모지(🔵🟢🟠🔴) 아주 크게 표시
    trafficEmoji.textContent = getTrafficEmoji(grade);
    // 상태 텍스트(좋음/보통/나쁨/매우나쁨) 아주 크게 표시
    trafficStatusText.textContent = getGradeText(grade);
    // 평균 수치를 큰 숫자로 표시
    trafficAverageValue.textContent = averageValue;
    // 나쁨 이상이면 '외출 시 마스크를 챙기세요' 문구 반영
    trafficNotice.textContent = getTrafficNotice(grade);
  } else {
    // 유효한 측정값이 없는 경우 회색 테마 적용
    trafficCard.classList.add('grade-none');
    // 비어있는 이모지 표시
    trafficEmoji.textContent = '⚪';
    // 상태 텍스트를 측정 정보 없음으로 설정
    trafficStatusText.textContent = '측정 불가';
    // 평균 수치를 '측정 안 됨'으로 표시
    trafficAverageValue.textContent = '측정 안 됨';
    // 안내 문구를 기본 정보 없음으로 설정
    trafficNotice.textContent = getTrafficNotice('');
  }
}

// 각 측정소별 카드를 은은한 등급 색상과 함께 그리드에 렌더링하는 함수
function renderStationCards(items) {
  // 그리드 내용 비우기
  stationGrid.innerHTML = '';

  // 각 측정소 데이터를 바탕으로 카드 요소 생성
  items.forEach(item => {
    // 측정소 이름 추출
    const stationName = item.stationName || '측정소명 미상';
    // 미세먼지 수치 포맷팅 ('-'이면 '측정 안 됨')
    const pm10Display = formatDustValue(item.pm10Value);
    // 초미세먼지 수치 포맷팅 ('-'이면 '측정 안 됨')
    const pm25Display = formatDustValue(item.pm25Value);
    // 측정 시각을 '2026년 10월 28일 16시 기준'처럼 한국어로 변환
    const koreanDataTime = formatKoreanDateTime(item.dataTime);
    // 미세먼지 등급 값 추출 (1, 2, 3, 4 또는 빈 값)
    const pm10Grade = item.pm10Grade ? item.pm10Grade.trim() : '';

    // 등급에 따른 은은한 테두리 및 배경 테마 클래스 (비어있으면 회색인 grade-none 적용)
    const gradeClass = getGradeClass(pm10Grade);
    // 등급에 해당하는 이모지 가져오기
    const emoji = getTrafficEmoji(pm10Grade);
    // 등급에 해당하는 한국어 텍스트 가져오기
    const gradeText = getGradeText(pm10Grade);

    // 카드 요소 생성
    const card = document.createElement('div');
    // 기본 카드 클래스 및 등급별 은은한 테마 클래스 추가
    card.className = `station-card ${gradeClass}`;

    // 카드 내부 HTML 구성 (측정소명, 이모지+등급뱃지, 미세먼지/초미세먼지, 한국어 측정시각)
    card.innerHTML = `
      <!-- 카드 상단: 측정소 이름 및 등급 이모지 뱃지 -->
      <div class="card-header">
        <h3 class="station-name">${stationName}</h3>
        <span class="station-badge">${emoji} ${gradeText}</span>
      </div>
      <!-- 카드 본문: 미세먼지 및 초미세먼지 농도 -->
      <div class="card-body">
        <div class="dust-row">
          <span class="dust-name">미세먼지 (PM10)</span>
          <span class="dust-number">${pm10Display}</span>
        </div>
        <div class="dust-row">
          <span class="dust-name">초미세먼지 (PM2.5)</span>
          <span class="dust-number">${pm25Display}</span>
        </div>
      </div>
      <!-- 카드 푸터: '2026년 10월 28일 16시 기준' 포맷의 한국어 측정 시각 -->
      <div class="card-footer">
        ${koreanDataTime}
      </div>
    `;

    // 완성된 측정소 카드를 그리드에 추가
    stationGrid.appendChild(card);
  });
}

// 시·도 드롭다운 변경 이벤트 발생 시 새 지역의 데이터 조회 실행
sidoSelect.addEventListener('change', (event) => {
  // 선택된 시·도 값 추출
  const selectedSido = event.target.value;
  // 해당 지역의 공기 신호등 데이터 조회
  fetchAirQualityData(selectedSido);
});

// 페이지가 처음 로드되었을 때 기본 선택값('서울')으로 첫 공기 신호등 데이터 호출
window.addEventListener('DOMContentLoaded', () => {
  // 초기 실행
  fetchAirQualityData(sidoSelect.value);
});
