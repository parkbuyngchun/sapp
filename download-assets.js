// 오프라인 리소스 다운로드 스크립트
// 이 스크립트는 개발 시 한 번만 실행하여 필요한 폰트와 아이콘을 다운로드합니다.

const fs = require('fs');
const https = require('https');
const path = require('path');

// 다운로드할 폰트 파일들
const fontFiles = [
  {
    url: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1HqWqX5Hw.woff2',
    filename: 'noto-sans-kr-300.woff2',
    weight: '300'
  },
  {
    url: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1HqWqX5Hw.woff2',
    filename: 'noto-sans-kr-400.woff2',
    weight: '400'
  },
  {
    url: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1HqWqX5Hw.woff2',
    filename: 'noto-sans-kr-500.woff2',
    weight: '500'
  },
  {
    url: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1HqWqX5Hw.woff2',
    filename: 'noto-sans-kr-600.woff2',
    weight: '600'
  },
  {
    url: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1HqWqX5Hw.woff2',
    filename: 'noto-sans-kr-700.woff2',
    weight: '700'
  }
];

// Font Awesome 아이콘 파일들
const iconFiles = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
    filename: 'font-awesome.woff2'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff',
    filename: 'font-awesome.woff'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.ttf',
    filename: 'font-awesome.ttf'
  }
];

// 파일 다운로드 함수
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`다운로드 완료: ${filepath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // 파일 삭제
      console.error(`다운로드 실패: ${url}`, err.message);
      reject(err);
    });
  });
}

// 디렉토리 생성 함수
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`디렉토리 생성: ${dir}`);
  }
}

// 메인 실행 함수
async function downloadAssets() {
  console.log('오프라인 리소스 다운로드를 시작합니다...');
  
  try {
    // 디렉토리 생성
    ensureDir('./fonts');
    ensureDir('./icons');
    
    // 폰트 파일 다운로드
    console.log('\n폰트 파일 다운로드 중...');
    for (const font of fontFiles) {
      const filepath = path.join('./fonts', font.filename);
      await downloadFile(font.url, filepath);
    }
    
    // 아이콘 파일 다운로드
    console.log('\n아이콘 파일 다운로드 중...');
    for (const icon of iconFiles) {
      const filepath = path.join('./icons', icon.filename);
      await downloadFile(icon.url, filepath);
    }
    
    console.log('\n✅ 모든 오프라인 리소스 다운로드가 완료되었습니다!');
    console.log('이제 완전히 오프라인에서 사용할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 다운로드 중 오류가 발생했습니다:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  downloadAssets();
}

module.exports = { downloadAssets };
