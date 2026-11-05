// Vercel 서버리스 함수: 공공데이터포털 에어코리아 API 프록시 핸들러
module.exports = async function handler(req, res) {
  // 브라우저 교차 출처 리소스 공유(CORS) 허용 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // 모든 도메인에서의 요청 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 허용할 HTTP 메서드 목록 설정
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  // 프리플라이트(OPTIONS) 요청에 대해 즉시 200 성공 응답 반환
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 주소 쿼리스트링에서 sido(시도 이름)를 추출하며, 전달되지 않은 경우 기본값으로 '서울' 지정
  const sido = req.query.sido || '서울';

  // 서버 환경변수(AIRKOREA_KEY)에서 에어코리아 인증키 읽기 (코드에 직접 노출하지 않음)
  const apiKey = process.env.AIRKOREA_KEY;

  // 서버에 환경변수 키가 설정되어 있지 않은 경우 오류 응답 반환
  if (!apiKey) {
    return res.status(500).json({
      error: '서버 환경변수 AIRKOREA_KEY가 설정되지 않았습니다. Vercel 환경변수 또는 .env.local 설정을 확인해주세요.'
    });
  }

  // 환경변수에 등록된 Encoding 인증키를 요청 주소에 안전하게 붙이기 위해 encodeURIComponent 적용
  const encodedKey = encodeURIComponent(apiKey);
  // 전달받은 시도 한글 이름을 안전하게 URL 인코딩 처리
  const encodedSido = encodeURIComponent(sido);

  // 에어코리아 시도별 실시간 대기오염 측정정보 조회 API 최종 요청 URL 구성
  const targetUrl = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${encodedKey}&returnType=json&numOfRows=100&pageNo=1&sidoName=${encodedSido}&ver=1.3`;

  try {
    // 공공데이터포털 서버로 비동기 GET 요청 전송
    const apiRes = await fetch(targetUrl);
    // 응답 본문을 텍스트 형태로 먼저 수신 (XML 또는 JSON 둘 다 수신 가능하도록 처리)
    const textData = await apiRes.text();

    // JSON 파싱 결과를 저장할 변수 선언
    let jsonData;
    try {
      // 응답 문자열을 JSON 객체로 변환 시도
      jsonData = JSON.parse(textData);
    } catch (parseError) {
      // 파싱 실패 시(공공데이터포털의 인증 오류 XML 응답 등): 한국어 안내 메시지 반환
      return res.status(400).json({
        error: '인증키 또는 요청값을 확인해주세요.',
        raw: textData
      });
    }

    // 공공데이터포털 응답 헤더 객체 추출
    const header = jsonData?.response?.header;

    // 응답 헤더가 존재하고 resultCode가 정상('00')이 아닐 때 처리
    if (header && header.resultCode !== '00') {
      return res.status(400).json({
        error: `공공데이터 API 오류 [${header.resultMsg || '오류'}]: 인증키 또는 요청값을 확인해주세요.`,
        resultCode: header.resultCode
      });
    }

    // 정상적으로 파싱된 대기오염 JSON 데이터를 클라이언트에 200 상태 코드로 반환
    return res.status(200).json(jsonData);

  } catch (error) {
    // 네트워크 연결 실패 등 예외 발생 시 500 오류 및 한국어 안내 메시지 반환
    return res.status(500).json({
      error: '에어코리아 서버와의 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message
    });
  }
};

