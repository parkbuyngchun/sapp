# 💖 사랑이 스케줄 - 오프라인 PWA

일자별 할일을 기록하고 일정을 관리하는 완전 오프라인 PWA(Progressive Web App)입니다.

## ✨ 주요 기능

- 📱 **완전 오프라인 작동** - 인터넷 연결 없이도 모든 기능 사용 가능
- 📅 **일자별 할일 관리** - 날짜별로 할일을 체계적으로 관리
- ⭐ **우선순위 설정** - 높음/보통/낮음 우선순위로 할일 분류
- ⏰ **시간 설정** - 각 할일에 시간을 지정하여 스케줄링
- 📊 **통계 기능** - 전체/완료/진행중 할일 통계 제공
- 📱 **모바일 최적화** - 휴대폰에서 사용하기 최적화된 UI/UX
- 💾 **로컬 저장** - 브라우저 localStorage에 데이터 저장
- 🎨 **세련된 디자인** - 글래스모피즘과 그라데이션을 활용한 현대적 디자인

## 🚀 설치 및 실행

### 1. 개발 서버 실행
```bash
npm start
```

### 2. PWA 리소스 설정 (최초 1회)
```bash
# 오프라인 폰트 및 아이콘 다운로드
npm run download-assets

# PWA 아이콘 생성 (브라우저에서 열림)
npm run create-icons
```

### 3. 완전 설정 (한 번에)
```bash
npm run pwa-setup
```

## 📱 PWA 설치 방법

### 모바일 (Android/iOS)
1. 브라우저에서 웹앱 접속
2. "홈 화면에 추가" 또는 "앱 설치" 선택
3. 홈 화면에 앱 아이콘 생성 완료

### 데스크톱 (Chrome/Edge)
1. 브라우저 주소창 우측의 설치 아이콘 클릭
2. "설치" 버튼 클릭
3. 독립적인 앱 창에서 실행

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest
- **Storage**: localStorage
- **Fonts**: Noto Sans KR (로컬 저장)
- **Icons**: Font Awesome (로컬 저장)
- **Server**: live-server (개발용)

## 📁 프로젝트 구조

```
sapp/
├── index.html              # 메인 HTML 파일
├── style.css               # 스타일시트
├── script.js               # JavaScript 로직
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker
├── download-assets.js      # 오프라인 리소스 다운로드 스크립트
├── create-icons.html       # PWA 아이콘 생성기
├── fonts/                  # 로컬 폰트 파일
│   ├── noto-sans-kr-300.woff2
│   ├── noto-sans-kr-400.woff2
│   ├── noto-sans-kr-500.woff2
│   ├── noto-sans-kr-600.woff2
│   └── noto-sans-kr-700.woff2
├── icons/                  # PWA 아이콘 및 Font Awesome
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── font-awesome.woff2
│   ├── font-awesome.woff
│   └── font-awesome.ttf
└── package.json            # 프로젝트 설정
```

## 🎨 디자인 특징

- **글래스모피즘**: 반투명 배경과 블러 효과
- **그라데이션**: 부드러운 색상 전환
- **반응형 디자인**: 모바일 우선 설계
- **애니메이션**: 부드러운 전환과 호버 효과
- **타이포그래피**: Noto Sans KR 폰트로 한글 최적화

## 💾 데이터 저장

- **저장 위치**: 브라우저 localStorage
- **저장 키**: `sapp-todos`
- **자동 저장**: 할일 추가/수정/삭제 시 자동 저장
- **백업**: 브라우저 데이터 내보내기/가져오기 기능

## 🔄 오프라인 작동 원리

1. **Service Worker**: 네트워크 요청을 가로채서 캐시된 리소스 제공
2. **로컬 폰트**: Google Fonts 대신 로컬 폰트 파일 사용
3. **로컬 아이콘**: Font Awesome CDN 대신 로컬 아이콘 파일 사용
4. **캐싱 전략**: 정적 리소스는 Cache First, 동적 리소스는 Network First

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 서버 실행 (포트 8080)
npm start

# 오프라인 리소스 다운로드
npm run download-assets

# PWA 아이콘 생성
npm run create-icons

# PWA 완전 설정
npm run pwa-setup
```

## 📱 지원 브라우저

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Samsung Internet 12+

## 🎯 사용 시나리오

- 📝 **일일 할일 관리**: 매일의 할일을 체계적으로 관리
- 📅 **주간 계획**: 주간 단위로 할일을 미리 계획
- ⏰ **시간 관리**: 시간대별로 할일을 배치하여 효율적인 시간 관리
- 📊 **진행률 추적**: 완료된 할일과 진행중인 할일을 한눈에 확인

## 🔒 개인정보 보호

- 모든 데이터는 사용자의 브라우저에만 저장
- 서버로 데이터 전송 없음
- 완전한 로컬 데이터 관리

## 📄 라이선스

ISC License

---

**💖 사랑이 스케줄과 함께 습관을 만들어가세요!**
