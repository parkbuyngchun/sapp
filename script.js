// 전역 변수
let todos = [];
let currentDate = new Date();
let currentFilter = 'all';
let isWeekView = false;
let missionCount = 0; // 미션 수행 완료 카운터

// DOM 요소들
const selectedDateInput = document.getElementById('selectedDate');
const selectedDateText = document.getElementById('selectedDateText');
const selectedDayText = document.getElementById('selectedDayText');
const prevDayBtn = document.getElementById('prevDay');
const nextDayBtn = document.getElementById('nextDay');
const todayBtn = document.getElementById('todayBtn');
const weekViewBtn = document.getElementById('weekViewBtn');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const prioritySelect = document.getElementById('prioritySelect');
const timeInput = document.getElementById('timeInput');
const todosList = document.getElementById('todosList');
const totalTodosSpan = document.getElementById('totalTodos');
const completedTodosSpan = document.getElementById('completedTodos');
const pendingTodosSpan = document.getElementById('pendingTodos');
const filterButtons = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModal');
const editForm = document.getElementById('editForm');
const editTodoInput = document.getElementById('editTodoInput');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const editTimeInput = document.getElementById('editTimeInput');
const cancelEditBtn = document.getElementById('cancelEdit');
const voiceBtn = document.getElementById('voiceBtn');
const alarmSettingsBtn = document.getElementById('alarmSettingsBtn');

let editingTodoId = null;
let isListening = false;
let recognition = null;
let alarmPermission = false;
let scheduledAlarms = new Map(); // 스케줄된 알람들을 저장

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTodos();
    updateDisplay();
    registerServiceWorker();
    setupMissionCounterClick();
    initializeVoiceRecognition();
    initializeAlarmSystem();
    
    // 호환성 정보 표시
    showCompatibilityInfo();
});

// 앱 초기화
function initializeApp() {
    // 오늘 날짜로 설정
    const today = new Date();
    selectedDateInput.value = formatDateForInput(today);
    currentDate = new Date(today);
    updateDateDisplay();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 날짜 변경 이벤트
    selectedDateInput.addEventListener('change', handleDateChange);
    prevDayBtn.addEventListener('click', () => changeDate(-1));
    nextDayBtn.addEventListener('click', () => changeDate(1));
    todayBtn.addEventListener('click', goToToday);
    weekViewBtn.addEventListener('click', toggleWeekView);
    
    // 할일 추가 폼
    todoForm.addEventListener('submit', handleAddTodo);
    
    // 필터 버튼들
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            setFilter(filter);
        });
    });
    
    // 모달 관련
    closeModalBtn.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    editForm.addEventListener('submit', handleEditTodo);
    
    // 모달 외부 클릭으로 닫기
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.style.display === 'block') {
            closeModal();
        }
    });
}

// 날짜 변경 처리
function handleDateChange() {
    currentDate = new Date(selectedDateInput.value);
    updateDateDisplay();
    updateDisplay();
}

// 날짜 변경 (이전/다음)
function changeDate(direction) {
    currentDate.setDate(currentDate.getDate() + direction);
    selectedDateInput.value = formatDateForInput(currentDate);
    updateDateDisplay();
    updateDisplay();
}

// 오늘로 이동
function goToToday() {
    const today = new Date();
    currentDate = new Date(today);
    selectedDateInput.value = formatDateForInput(today);
    updateDateDisplay();
    updateDisplay();
}

// 할일 추가 처리
function handleAddTodo(e) {
    e.preventDefault();
    
    const text = todoInput.value.trim();
    const priority = prioritySelect.value;
    const time = timeInput.value;
    
    if (!text) {
        alert('할일을 입력해주세요.');
        return;
    }
    
    const todo = {
        id: Date.now().toString(),
        text: text,
        priority: priority,
        time: time,
        completed: false,
        date: formatDateForInput(currentDate),
        createdAt: new Date().toISOString()
    };
    
    todos.push(todo);
    saveTodos();
    updateDisplay();
    
    // 알람 스케줄링
    if (todo.time) {
        scheduleAlarm(todo);
    }
    
    // 폼 초기화
    todoInput.value = '';
    timeInput.value = '';
    prioritySelect.value = 'medium';
    todoInput.focus();
    
    // 성공 메시지
    showNotification('할일이 추가되었습니다!', 'success');
}

// 할일 완료 토글
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const wasCompleted = todo.completed;
        todo.completed = !todo.completed;
        
        // 미션 카운터 업데이트
        if (!wasCompleted && todo.completed) {
            missionCount++;
            showMissionCompleteAnimation();
            
            // 미션 레벨 달성 체크
            checkMissionLevelUp();
            
            showNotification(`🎉 미션 완료! 총 ${missionCount}개 완료`, 'success');
        } else if (wasCompleted && !todo.completed) {
            missionCount = Math.max(0, missionCount - 1);
            showNotification('할일을 다시 진행중으로 변경했습니다.', 'info');
        }
        
        saveTodos();
        updateDisplay();
        
        // 알람 업데이트
        if (todo.time) {
            if (todo.completed) {
                clearTodoAlarm(todo.id, todo.date, todo.time);
            } else {
                scheduleAlarm(todo);
            }
        }
    }
}

// 할일 삭제
function deleteTodo(id) {
    if (confirm('정말로 이 할일을 삭제하시겠습니까?')) {
        const todo = todos.find(t => t.id === id);
        if (todo && todo.time) {
            clearTodoAlarm(todo.id, todo.date, todo.time);
        }
        
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        updateDisplay();
        showNotification('할일이 삭제되었습니다.', 'warning');
    }
}

// 할일 수정 모달 열기
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        editingTodoId = id;
        editTodoInput.value = todo.text;
        editPrioritySelect.value = todo.priority;
        editTimeInput.value = todo.time;
        editModal.style.display = 'block';
        editTodoInput.focus();
    }
}

// 할일 수정 처리
function handleEditTodo(e) {
    e.preventDefault();
    
    const text = editTodoInput.value.trim();
    const priority = editPrioritySelect.value;
    const time = editTimeInput.value;
    
    if (!text) {
        alert('할일을 입력해주세요.');
        return;
    }
    
    const todo = todos.find(t => t.id === editingTodoId);
    if (todo) {
        const oldTime = todo.time;
        const oldDate = todo.date;
        
        todo.text = text;
        todo.priority = priority;
        todo.time = time;
        
        // 기존 알람 클리어
        if (oldTime) {
            clearTodoAlarm(todo.id, oldDate, oldTime);
        }
        
        // 새 알람 스케줄링
        if (todo.time && !todo.completed) {
            scheduleAlarm(todo);
        }
        
        saveTodos();
        updateDisplay();
        closeModal();
        showNotification('할일이 수정되었습니다!', 'success');
    }
}

// 모달 닫기
function closeModal() {
    editModal.style.display = 'none';
    editingTodoId = null;
    editForm.reset();
}

// 필터 설정
function setFilter(filter) {
    currentFilter = filter;
    
    // 필터 버튼 활성화 상태 업데이트
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    updateDisplay();
}

// 화면 업데이트
function updateDisplay() {
    updateTodosList();
    updateStats();
    updateMissionCounter();
}

// 할일 목록 업데이트
function updateTodosList() {
    const currentDateStr = formatDateForInput(currentDate);
    let filteredTodos = todos.filter(todo => todo.date === currentDateStr);
    
    // 필터 적용
    switch (currentFilter) {
        case 'completed':
            filteredTodos = filteredTodos.filter(todo => todo.completed);
            break;
        case 'pending':
            filteredTodos = filteredTodos.filter(todo => !todo.completed);
            break;
        // 'all'은 필터링하지 않음
    }
    
    // 1. 완료 상태별 정렬 (진행중 > 완료)
    filteredTodos.sort((a, b) => {
        if (a.completed === b.completed) {
            return 0;
        }
        return a.completed ? 1 : -1; // 진행중(false)이 먼저 오도록
    });
    
    // 2. 우선순위별 정렬 (높음 > 보통 > 낮음) - 같은 완료 상태 내에서
    filteredTodos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return 0; // 완료 상태가 다르면 이미 정렬됨
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // 3. 시간순 정렬 (시간이 있는 경우) - 같은 완료 상태, 같은 우선순위 내에서
    filteredTodos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return 0; // 완료 상태가 다르면 이미 정렬됨
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return 0; // 우선순위가 다르면 이미 정렬됨
        }
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }
        return 0;
    });
    
    if (filteredTodos.length === 0) {
        todosList.innerHTML = getEmptyStateHTML();
    } else {
        // 진행중인 할일과 완료된 할일을 분리
        const pendingTodos = filteredTodos.filter(todo => !todo.completed);
        const completedTodos = filteredTodos.filter(todo => todo.completed);
        
        let html = '';
        
        // 진행중인 할일
        if (pendingTodos.length > 0) {
            html += pendingTodos.map(todo => createTodoHTML(todo)).join('');
        }
        
        // 구분선 (진행중인 할일과 완료된 할일이 모두 있을 때)
        if (pendingTodos.length > 0 && completedTodos.length > 0) {
            html += '<div class="todo-divider"><span class="divider-text">완료된 할일</span></div>';
        }
        
        // 완료된 할일
        if (completedTodos.length > 0) {
            html += completedTodos.map(todo => createTodoHTML(todo)).join('');
        }
        
        todosList.innerHTML = html;
    }
}

// 통계 업데이트
function updateStats() {
    const currentDateStr = formatDateForInput(currentDate);
    const dayTodos = todos.filter(todo => todo.date === currentDateStr);
    
    const total = dayTodos.length;
    const completed = dayTodos.filter(todo => todo.completed).length;
    const pending = total - completed;
    
    totalTodosSpan.textContent = total;
    completedTodosSpan.textContent = completed;
    pendingTodosSpan.textContent = pending;
}

// 미션 카운터 업데이트
function updateMissionCounter() {
    const missionCountElement = document.getElementById('missionCount');
    if (missionCountElement) {
        missionCountElement.textContent = missionCount;
        
        // 미션 카운터에 특별한 효과 추가
        if (missionCount > 0) {
            missionCountElement.style.animation = 'missionCountBounce 0.5s ease-out';
            setTimeout(() => {
                missionCountElement.style.animation = '';
            }, 500);
        }
        
        // 미션 레벨에 따른 아이콘 변경
        updateMissionIcon();
    }
}

// 미션 레벨에 따른 아이콘 업데이트
function updateMissionIcon() {
    const missionIconElement = document.querySelector('.mission-icon');
    if (missionIconElement) {
        let icon = '🎯';
        
        if (missionCount >= 100) {
            icon = '🏆';
        } else if (missionCount >= 50) {
            icon = '⭐';
        } else if (missionCount >= 20) {
            icon = '🔥';
        } else if (missionCount >= 10) {
            icon = '💪';
        } else if (missionCount >= 5) {
            icon = '🎉';
        }
        
        missionIconElement.textContent = icon;
    }
}

// 미션 레벨 업 체크
function checkMissionLevelUp() {
    const levelMessages = {
        5: '🎉 첫 번째 레벨 달성! 5개 완료!',
        10: '💪 두 번째 레벨 달성! 10개 완료!',
        20: '🔥 세 번째 레벨 달성! 20개 완료!',
        50: '⭐ 네 번째 레벨 달성! 50개 완료!',
        100: '🏆 최고 레벨 달성! 100개 완료!'
    };
    
    if (levelMessages[missionCount]) {
        setTimeout(() => {
            showNotification(levelMessages[missionCount], 'success');
        }, 1000);
    }
}

// 미션 카운터 클릭 이벤트 설정
function setupMissionCounterClick() {
    const missionCounter = document.querySelector('.mission-counter');
    if (missionCounter) {
        missionCounter.addEventListener('click', showMissionDetails);
    }
}

// 미션 상세 정보 표시
function showMissionDetails() {
    const levelInfo = getMissionLevelInfo();
    const message = `🎯 미션 진행 현황\n\n완료한 할일: ${missionCount}개\n현재 레벨: ${levelInfo.level}\n다음 레벨까지: ${levelInfo.nextLevel - missionCount}개 남음\n\n${levelInfo.message}`;
    
    alert(message);
}

// 미션 레벨 정보 가져오기
function getMissionLevelInfo() {
    if (missionCount >= 100) {
        return {
            level: '🏆 최고 레벨',
            nextLevel: 100,
            message: '축하합니다! 최고 레벨에 도달했습니다!'
        };
    } else if (missionCount >= 50) {
        return {
            level: '⭐ 4단계',
            nextLevel: 100,
            message: '정말 대단해요! 거의 최고 레벨이에요!'
        };
    } else if (missionCount >= 20) {
        return {
            level: '🔥 3단계',
            nextLevel: 50,
            message: '훌륭해요! 계속 화이팅!'
        };
    } else if (missionCount >= 10) {
        return {
            level: '💪 2단계',
            nextLevel: 20,
            message: '잘하고 있어요! 조금만 더!'
        };
    } else if (missionCount >= 5) {
        return {
            level: '🎉 1단계',
            nextLevel: 10,
            message: '좋은 시작이에요! 계속해보세요!'
        };
    } else {
        return {
            level: '🎯 시작',
            nextLevel: 5,
            message: '첫 번째 목표는 5개 완료예요!'
        };
    }
}

// 음성 인식 초기화
function initializeVoiceRecognition() {
    // Web Speech API 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
        return;
    }
    
    // iOS Safari에서 HTTPS 확인
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('음성 인식은 HTTPS 환경에서만 작동합니다.');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
        return;
    }

    // SpeechRecognition 객체 생성
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // 음성 인식 설정
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ko-KR';
    
    // 음성 인식 이벤트 리스너
    recognition.onstart = function() {
        isListening = true;
        updateVoiceButtonState();
        showNotification('🎤 음성 인식이 시작되었습니다. 말씀해주세요!', 'info');
        
        // 음성 인식 상태 표시
        showVoiceStatus('listening');
    };
    
    recognition.onresult = function(event) {
        showVoiceStatus('processing');
        const transcript = event.results[0][0].transcript;
        processVoiceInput(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('음성 인식 오류:', event.error);
        isListening = false;
        updateVoiceButtonState();
        
        let errorMessage = '음성 인식 중 오류가 발생했습니다.';
        switch(event.error) {
            case 'no-speech':
                errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
                break;
            case 'audio-capture':
                errorMessage = '마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요.';
                break;
            case 'not-allowed':
                errorMessage = '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
                break;
        }
        showNotification(errorMessage, 'error');
    };
    
    recognition.onend = function() {
        isListening = false;
        updateVoiceButtonState();
        hideVoiceStatus();
    };
    
    // 음성 버튼 클릭 이벤트
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
    }
    
    // 알람 설정 버튼 클릭 이벤트
    if (alarmSettingsBtn) {
        alarmSettingsBtn.addEventListener('click', showAlarmSettings);
        
        // 알람 테스트 기능 (길게 누르기)
        let longPressTimer = null;
        alarmSettingsBtn.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(() => {
                testAlarm();
            }, 2000);
        });
        
        alarmSettingsBtn.addEventListener('touchend', function(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
    }
        
        // 모바일 터치 이벤트 추가
        voiceBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (!isListening) {
                toggleVoiceRecognition();
            }
        });
        
        // 길게 누르기로 음성 인식 중지
        let touchTimer;
        voiceBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            touchTimer = setTimeout(() => {
                if (isListening) {
                    recognition.stop();
                }
            }, 1000);
        });
        
        voiceBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(touchTimer);
        });
    }
}

// 음성 인식 토글
function toggleVoiceRecognition() {
    if (!recognition) {
        showNotification('음성 인식을 지원하지 않는 브라우저입니다.', 'error');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('음성 인식 시작 오류:', error);
            showNotification('음성 인식을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
    }
}

// 음성 버튼 상태 업데이트
function updateVoiceButtonState() {
    if (!voiceBtn) return;
    
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.title = '음성 인식 중... (클릭하여 중지)';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.title = '음성으로 할일 추가';
    }
}

// 음성 입력 결과 처리
function processVoiceInput(transcript) {
    console.log('음성 인식 결과:', transcript);
    
    // 음성 입력을 할일 텍스트에 설정
    if (todoInput) {
        const cleanTranscript = transcript.trim();
        todoInput.value = cleanTranscript;
        todoInput.focus();
        
        // 음성 입력 결과 표시
        showVoiceStatus('success');
        showNotification(`🎤 "${cleanTranscript}" 음성 입력이 완료되었습니다.`, 'success');
        
        // 우선순위 자동 감지
        const detectedPriority = detectPriorityFromVoice(cleanTranscript);
        if (detectedPriority && prioritySelect) {
            prioritySelect.value = detectedPriority;
            showNotification(`우선순위가 "${detectedPriority === 'high' ? '높음' : detectedPriority === 'medium' ? '보통' : '낮음'}"으로 자동 설정되었습니다.`, 'info');
        }
        
        // 시간 자동 감지
        const detectedTime = detectTimeFromVoice(cleanTranscript);
        if (detectedTime && timeInput) {
            timeInput.value = detectedTime;
            showNotification(`시간이 "${detectedTime}"으로 자동 설정되었습니다.`, 'info');
        }
        
        // 2초 후 자동으로 할일 추가
        setTimeout(() => {
            if (todoInput.value.trim()) {
                addTodo();
            }
        }, 2000);
    }
}

// 음성에서 우선순위 감지
function detectPriorityFromVoice(text) {
    const highKeywords = ['중요', '긴급', '높음', '빠르게', '즉시', '우선'];
    const lowKeywords = ['낮음', '나중에', '여유', '천천히', '낮은'];
    
    const lowerText = text.toLowerCase();
    
    for (let keyword of highKeywords) {
        if (lowerText.includes(keyword)) {
            return 'high';
        }
    }
    
    for (let keyword of lowKeywords) {
        if (lowerText.includes(keyword)) {
            return 'low';
        }
    }
    
    return null; // 기본값 사용
}

// 음성에서 시간 감지
function detectTimeFromVoice(text) {
    const timePatterns = [
        /(\d{1,2})시/,
        /(\d{1,2}):(\d{2})/,
        /오전\s*(\d{1,2})시/,
        /오후\s*(\d{1,2})시/,
        /(\d{1,2})시\s*(\d{1,2})분/
    ];
    
    for (let pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
            let hour = parseInt(match[1]);
            let minute = match[2] ? parseInt(match[2]) : 0;
            
            // 오후 시간 처리
            if (text.includes('오후') && hour < 12) {
                hour += 12;
            }
            
            // 24시간 형식으로 변환
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            return timeString;
        }
    }
    
    return null; // 시간 감지 실패
}

// 음성 인식 상태 표시
function showVoiceStatus(status) {
    // 기존 상태 표시 제거
    hideVoiceStatus();
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'voiceStatus';
    statusDiv.className = 'voice-status';
    
    let message = '';
    let icon = '';
    
    switch(status) {
        case 'listening':
            message = '🎤 듣고 있습니다...';
            icon = '🎤';
            break;
        case 'processing':
            message = '🔄 처리 중...';
            icon = '🔄';
            break;
        case 'success':
            message = '✅ 음성 인식 완료!';
            icon = '✅';
            break;
        case 'error':
            message = '❌ 음성 인식 실패';
            icon = '❌';
            break;
    }
    
    statusDiv.innerHTML = `
        <div class="voice-status-content">
            <span class="voice-status-icon">${icon}</span>
            <span class="voice-status-text">${message}</span>
        </div>
    `;
    
    // 할일 입력 필드 아래에 추가
    const inputGroup = document.querySelector('.input-group');
    if (inputGroup) {
        inputGroup.appendChild(statusDiv);
    }
}

// 음성 인식 상태 숨기기
function hideVoiceStatus() {
    const statusDiv = document.getElementById('voiceStatus');
    if (statusDiv) {
        statusDiv.remove();
    }
}

// 알람 시스템 초기화
function initializeAlarmSystem() {
    // 디바이스 및 브라우저 정보 로깅
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSamsung = /SamsungBrowser/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    
    console.log('🔍 디바이스 정보:', {
        userAgent: userAgent,
        isIOS: isIOS,
        isAndroid: isAndroid,
        isSamsung: isSamsung,
        isChrome: isChrome,
        protocol: window.location.protocol,
        hostname: window.location.hostname
    });
    
    // iOS Safari 알림 제한 확인
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    if (isIOS && isSafari) {
        console.log('iOS Safari에서는 웹 알림이 제한됩니다. PWA로 설치하면 더 나은 경험을 제공합니다.');
        showNotification('iOS에서는 PWA로 설치하면 알람 기능을 사용할 수 있습니다.', 'info');
        
        // iOS 대안: 페이지 타이틀 변경으로 알림 대체
        setupIOSAlarmAlternative();
        return;
    }
    
    // 삼성 브라우저 특별 처리
    if (isSamsung) {
        console.log('삼성 브라우저 감지됨. 알림 권한을 확인합니다.');
        showNotification('삼성 브라우저에서 알람 기능을 사용하려면 알림 권한이 필요합니다.', 'info');
        
        // 삼성 브라우저에서 알림 권한 요청 강화
        setTimeout(() => {
            if (Notification.permission === 'default') {
                showNotification('삼성 브라우저에서 알림을 허용하려면 브라우저 설정 > 사이트 설정 > 알림에서 허용해주세요.', 'warning');
            }
        }, 3000);
    }
    
    // 알림 권한 요청
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            alarmPermission = true;
            console.log('알림 권한이 이미 허용되어 있습니다.');
        } else if (Notification.permission !== 'denied') {
            requestNotificationPermission();
        } else {
            console.log('알림 권한이 거부되었습니다.');
            showNotification('알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.', 'warning');
        }
    } else {
        console.log('이 브라우저는 알림을 지원하지 않습니다.');
        showNotification('이 브라우저는 알림을 지원하지 않습니다.', 'warning');
    }
    
    // 기존 알람들 스케줄링
    scheduleAllAlarms();
}

// 알림 권한 요청
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            alarmPermission = true;
            showNotification('알림 권한이 허용되었습니다! 시간이 설정된 할일에 알람이 울립니다.', 'success');
            scheduleAllAlarms();
        } else {
            alarmPermission = false;
            showNotification('알림 권한이 거부되었습니다. 알람 기능을 사용하려면 브라우저 설정에서 알림을 허용해주세요.', 'warning');
        }
    } catch (error) {
        console.error('알림 권한 요청 실패:', error);
        alarmPermission = false;
    }
}

// 모든 알람 스케줄링
function scheduleAllAlarms() {
    if (!alarmPermission) return;
    
    // 기존 알람들 클리어
    clearAllAlarms();
    
    // 모든 할일에 대해 알람 스케줄링
    todos.forEach(todo => {
        if (todo.time && !todo.completed) {
            scheduleAlarm(todo);
        }
    });
}

// 개별 알람 스케줄링
function scheduleAlarm(todo) {
    console.log('🔔 알람 스케줄링 시도:', {
        todoId: todo.id,
        todoText: todo.text,
        todoTime: todo.time,
        todoDate: todo.date,
        completed: todo.completed,
        alarmPermission: alarmPermission
    });
    
    if (!alarmPermission) {
        console.warn('❌ 알람 권한이 없습니다.');
        return;
    }
    
    if (!todo.time) {
        console.warn('❌ 할일에 시간이 설정되지 않았습니다.');
        return;
    }
    
    if (todo.completed) {
        console.warn('❌ 완료된 할일은 알람을 스케줄링하지 않습니다.');
        return;
    }
    
    const alarmTime = calculateAlarmTime(todo.date, todo.time);
    console.log('⏰ 계산된 알람 시간:', {
        alarmTime: alarmTime,
        currentTime: new Date(),
        isFuture: alarmTime && alarmTime > new Date()
    });
    
    if (!alarmTime || alarmTime <= new Date()) {
        console.warn('❌ 과거 시간이므로 알람을 스케줄링하지 않습니다.');
        return;
    }
    
    const timeUntilAlarm = alarmTime.getTime() - new Date().getTime();
    console.log('⏱️ 알람까지 남은 시간:', {
        milliseconds: timeUntilAlarm,
        minutes: Math.round(timeUntilAlarm / 60000),
        hours: Math.round(timeUntilAlarm / 3600000)
    });
    
    // 알람 ID 생성
    const alarmId = `alarm_${todo.id}_${todo.date}_${todo.time}`;
    
    // 기존 알람이 있으면 취소
    if (scheduledAlarms.has(alarmId)) {
        console.log('🔄 기존 알람을 취소합니다:', alarmId);
        clearTimeout(scheduledAlarms.get(alarmId));
    }
    
    // 새 알람 스케줄링
    const timeoutId = setTimeout(() => {
        console.log('🔔 알람이 울렸습니다!', todo.text);
        showAlarmNotification(todo);
        scheduledAlarms.delete(alarmId);
    }, timeUntilAlarm);
    
    scheduledAlarms.set(alarmId, timeoutId);
    console.log(`✅ 알람 스케줄됨: ${todo.text} - ${alarmTime.toLocaleString()}`);
    
    // 현재 스케줄된 알람 목록 표시
    console.log('📋 현재 스케줄된 알람 목록:', Array.from(scheduledAlarms.keys()));
}

// 알람 시간 계산
function calculateAlarmTime(dateStr, timeStr) {
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const alarmDate = new Date(year, month - 1, day, hours, minutes, 0);
        return alarmDate;
    } catch (error) {
        console.error('알람 시간 계산 오류:', error);
        return null;
    }
}

// 알람 알림 표시
function showAlarmNotification(todo) {
    if (!alarmPermission) return;
    
    const notification = new Notification('⏰ 할일 알림', {
        body: `${todo.text}\n시간: ${todo.time}\n우선순위: ${getPriorityText(todo.priority)}`,
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png',
        tag: `todo-${todo.id}`,
        requireInteraction: true,
        actions: [
            { action: 'complete', title: '완료 처리' },
            { action: 'snooze', title: '10분 후 다시' }
        ]
    });
    
    // 알림 클릭 시 앱으로 포커스
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    // 알림 액션 처리
    notification.addEventListener('click', function(event) {
        if (event.action === 'complete') {
            toggleTodo(todo.id);
            showNotification('할일이 완료 처리되었습니다!', 'success');
        } else if (event.action === 'snooze') {
            // 10분 후 다시 알림
            setTimeout(() => {
                showAlarmNotification(todo);
            }, 10 * 60 * 1000);
            showNotification('10분 후에 다시 알림이 울립니다.', 'info');
        }
    });
    
    // 5초 후 자동 닫기
    setTimeout(() => {
        notification.close();
    }, 5000);
}

// 모든 알람 클리어
function clearAllAlarms() {
    scheduledAlarms.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    scheduledAlarms.clear();
}

// 특정 할일의 알람 클리어
function clearTodoAlarm(todoId, date, time) {
    const alarmId = `alarm_${todoId}_${date}_${time}`;
    if (scheduledAlarms.has(alarmId)) {
        clearTimeout(scheduledAlarms.get(alarmId));
        scheduledAlarms.delete(alarmId);
    }
}

// 알람 설정 모달 표시
function showAlarmSettings() {
    const currentDateStr = formatDateForInput(currentDate);
    const todayTodos = todos.filter(todo => todo.date === currentDateStr);
    const alarmTodos = todayTodos.filter(todo => todo.time && !todo.completed);
    
    let message = `📅 ${currentDateStr} 알람 설정 현황\n\n`;
    
    // 디버그 정보 추가
    message += `🔍 디버그 정보:\n`;
    message += `• 알림 권한: ${Notification.permission}\n`;
    message += `• 알람 활성화: ${alarmPermission ? '✅' : '❌'}\n`;
    message += `• 스케줄된 알람: ${scheduledAlarms.size}개\n`;
    message += `• 브라우저: ${navigator.userAgent.includes('SamsungBrowser') ? '삼성 브라우저' : '기타'}\n\n`;
    
    if (alarmTodos.length === 0) {
        message += '⏰ 설정된 알람이 없습니다.\n할일에 시간을 설정하면 자동으로 알람이 등록됩니다.';
    } else {
        message += `🔔 총 ${alarmTodos.length}개의 알람이 설정되어 있습니다:\n\n`;
        alarmTodos.forEach(todo => {
            const alarmTime = calculateAlarmTime(todo.date, todo.time);
            const timeStr = alarmTime ? alarmTime.toLocaleString() : '시간 오류';
            const isScheduled = scheduledAlarms.has(`alarm_${todo.id}_${todo.date}_${todo.time}`);
            message += `• ${todo.text}\n  ⏰ ${todo.time} (${timeStr})\n  📊 ${getPriorityText(todo.priority)}\n  🔔 스케줄: ${isScheduled ? '✅' : '❌'}\n\n`;
        });
    }
    
    message += '\n💡 알림 권한이 허용되어야 알람이 작동합니다.';
    message += '\n\n🔧 알람 테스트: 알람 설정 버튼을 2초간 길게 누르세요.';
    
    alert(message);
}

// iOS 대안 알람 시스템 설정
function setupIOSAlarmAlternative() {
    // iOS에서는 페이지 타이틀 변경과 사운드로 알림 대체
    const originalTitle = document.title;
    let alarmInterval = null;
    
    // 모든 할일에 대해 iOS 대안 알람 스케줄링
    todos.forEach(todo => {
        if (todo.time && !todo.completed) {
            scheduleIOSAlarm(todo, originalTitle);
        }
    });
}

// iOS 대안 알람 스케줄링
function scheduleIOSAlarm(todo, originalTitle) {
    const alarmTime = calculateAlarmTime(todo.date, todo.time);
    if (!alarmTime || alarmTime <= new Date()) {
        return;
    }
    
    const timeUntilAlarm = alarmTime.getTime() - new Date().getTime();
    
    setTimeout(() => {
        // 페이지 타이틀 변경으로 알림
        document.title = `⏰ ${todo.text} - 사랑이 스케줄`;
        
        // 사운드 재생 (가능한 경우)
        playAlarmSound();
        
        // 10초 후 원래 타이틀로 복원
        setTimeout(() => {
            document.title = originalTitle;
        }, 10000);
        
        // 화면에 알림 표시
        showIOSAlarmNotification(todo);
        
    }, timeUntilAlarm);
}

// iOS 알람 사운드 재생
function playAlarmSound() {
    try {
        // Web Audio API를 사용한 간단한 알람 사운드
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('사운드 재생을 지원하지 않습니다.');
    }
}

// iOS 알람 알림 표시
function showIOSAlarmNotification(todo) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'ios-alarm-notification';
    notificationDiv.innerHTML = `
        <div class="ios-alarm-content">
            <div class="ios-alarm-icon">⏰</div>
            <div class="ios-alarm-text">
                <div class="ios-alarm-title">할일 알림</div>
                <div class="ios-alarm-body">${todo.text}</div>
                <div class="ios-alarm-time">시간: ${todo.time}</div>
            </div>
            <button class="ios-alarm-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notificationDiv.parentElement) {
            notificationDiv.remove();
        }
    }, 5000);
}

// 호환성 정보 표시
function showCompatibilityInfo() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    let compatibilityInfo = '';
    
    if (isIOS) {
        if (isSafari) {
            compatibilityInfo = `
📱 iOS Safari 사용자 안내:
• 음성입력: HTTPS 환경에서 작동 (현재: ${window.location.protocol === 'https:' ? '✅ 지원' : '❌ HTTPS 필요'})
• 알람기능: PWA로 설치하면 더 나은 경험 제공
• 권장: Chrome 브라우저 사용 또는 PWA 설치
            `;
        } else if (isChrome) {
            compatibilityInfo = `
📱 iOS Chrome 사용자 안내:
• 음성입력: ✅ 지원됨
• 알람기능: ✅ 지원됨
• 모든 기능이 정상 작동합니다!
            `;
        }
    } else if (isAndroid) {
        compatibilityInfo = `
🤖 Android 사용자 안내:
• 음성입력: ✅ 지원됨
• 알람기능: ✅ 지원됨
• 모든 기능이 정상 작동합니다!
            `;
    }
    
    if (compatibilityInfo) {
        console.log(compatibilityInfo);
        
        // 첫 방문 시에만 표시
        if (!localStorage.getItem('compatibilityInfoShown')) {
            setTimeout(() => {
                showNotification(compatibilityInfo.trim(), 'info');
                localStorage.setItem('compatibilityInfoShown', 'true');
            }, 2000);
        }
    }
}

// 알람 테스트 함수
function testAlarm() {
    console.log('🧪 알람 테스트 시작');
    
    // 현재 상태 확인
    const status = {
        alarmPermission: alarmPermission,
        notificationSupport: 'Notification' in window,
        notificationPermission: Notification.permission,
        scheduledAlarmsCount: scheduledAlarms.size,
        currentTime: new Date().toLocaleString(),
        userAgent: navigator.userAgent
    };
    
    console.log('📊 현재 상태:', status);
    
    // 테스트 알림 표시
    if (alarmPermission && 'Notification' in window) {
        const testNotification = new Notification('🧪 알람 테스트', {
            body: '알람 기능이 정상적으로 작동합니다!',
            icon: 'icons/icon-192x192.png',
            tag: 'test-alarm'
        });
        
        testNotification.onclick = function() {
            window.focus();
            testNotification.close();
        };
        
        setTimeout(() => {
            testNotification.close();
        }, 3000);
        
        showNotification('알람 테스트가 완료되었습니다!', 'success');
    } else {
        showNotification('알람 권한이 없거나 지원되지 않습니다.', 'warning');
    }
    
    // 5초 후 테스트 알람 스케줄링
    const testTodo = {
        id: 'test-alarm',
        text: '테스트 알람',
        time: new Date(Date.now() + 5000).toTimeString().slice(0, 5),
        date: formatDateForInput(new Date()),
        priority: 'high',
        completed: false
    };
    
    console.log('⏰ 5초 후 테스트 알람 스케줄링:', testTodo);
    scheduleAlarm(testTodo);
}

// 할일 HTML 생성
function createTodoHTML(todo) {
    const priorityClass = `priority-${todo.priority}`;
    const completedClass = todo.completed ? 'completed' : '';
    const timeDisplay = todo.time ? `<span class="todo-time"><i class="fas fa-clock"></i> ${todo.time}</span>` : '';
    const alarmIcon = todo.time && !todo.completed ? '<span class="alarm-icon" title="알람 설정됨">🔔</span>' : '';
    
    // 할일 생성 날짜 정보 추가
    const createdDate = new Date(todo.createdAt);
    const createdDateStr = formatDateForInput(createdDate);
    const isCreatedToday = createdDateStr === formatDateForInput(new Date());
    const dateInfo = isCreatedToday ? '오늘 추가' : `${createdDate.getMonth() + 1}/${createdDate.getDate()}`;
    
    return `
        <div class="todo-item ${completedClass} ${priorityClass}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo('${todo.id}')">
            <div class="todo-content">
                <div class="todo-text ${todo.completed ? 'completed' : ''}">${escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    ${timeDisplay}
                    ${alarmIcon}
                    <span class="todo-priority ${todo.priority}">${getPriorityText(todo.priority)}</span>
                    <span class="todo-date-info">${dateInfo}</span>
                </div>
                <div class="todo-actions">
                    <button class="todo-btn edit-btn" onclick="editTodo('${todo.id}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-btn delete-btn" onclick="deleteTodo('${todo.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 빈 상태 HTML
function getEmptyStateHTML() {
    const messages = {
        all: '이 날짜에는 등록된 할일이 없습니다.',
        pending: '진행중인 할일이 없습니다.',
        completed: '완료된 할일이 없습니다.'
    };
    
    return `
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>할일이 없습니다</h3>
            <p>${messages[currentFilter]}</p>
        </div>
    `;
}

// 우선순위 텍스트
function getPriorityText(priority) {
    const texts = {
        high: '높음',
        medium: '보통',
        low: '낮음'
    };
    return texts[priority] || '보통';
}

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜 표시 업데이트 (요일 포함)
function updateDateDisplay() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dayOfWeek = currentDate.getDay();
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayEmojis = ['🌅', '💼', '🔥', '💪', '🚀', '🎉', '🎯'];
    
    selectedDateText.textContent = `${year}년 ${month}월 ${day}일`;
    selectedDayText.textContent = `${dayEmojis[dayOfWeek]} ${dayNames[dayOfWeek]}`;
    
    // 오늘 날짜인지 확인하여 특별한 스타일 적용
    if (isToday(currentDate)) {
        selectedDateText.style.color = '#fff';
        selectedDayText.style.background = 'rgba(255, 255, 255, 0.3)';
        selectedDayText.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    } else {
        selectedDateText.style.color = '#fff';
        selectedDayText.style.background = 'rgba(255, 255, 255, 0.2)';
        selectedDayText.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    }
}

// 오늘 날짜인지 확인
function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// 주간보기 토글
function toggleWeekView() {
    isWeekView = !isWeekView;
    weekViewBtn.classList.toggle('active', isWeekView);
    
    if (isWeekView) {
        weekViewBtn.innerHTML = '<i class="fas fa-calendar-day"></i> 일간보기';
        showWeekView();
    } else {
        weekViewBtn.innerHTML = '<i class="fas fa-calendar-week"></i> 주간보기';
        showDayView();
    }
}

// 주간보기 표시
function showWeekView() {
    const weekStart = getWeekStart(currentDate);
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        weekDays.push(day);
    }
    
    const weekHTML = weekDays.map(day => {
        const dayStr = formatDateForInput(day);
        const dayTodos = todos.filter(todo => todo.date === dayStr);
        const completedCount = dayTodos.filter(todo => todo.completed).length;
        const isTodayClass = isToday(day) ? 'today' : '';
        const isSelectedClass = dayStr === formatDateForInput(currentDate) ? 'selected' : '';
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayEmojis = ['🌅', '💼', '🔥', '💪', '🚀', '🎉', '🎯'];
        
        return `
            <div class="week-day ${isTodayClass} ${isSelectedClass}" onclick="selectWeekDay('${dayStr}')">
                <div class="week-day-header">
                    <span class="week-day-name">${dayNames[day.getDay()]}</span>
                    <span class="week-day-emoji">${dayEmojis[day.getDay()]}</span>
                </div>
                <div class="week-day-date">${day.getDate()}</div>
                <div class="week-day-todos">
                    <span class="todo-count">${dayTodos.length}</span>
                    <span class="completed-count">${completedCount}</span>
                </div>
            </div>
        `;
    }).join('');
    
    todosList.innerHTML = `
        <div class="week-view">
            <div class="week-days">
                ${weekHTML}
            </div>
            <div class="week-todos">
                <h3>${formatDateForInput(currentDate)} 할일</h3>
                <div id="weekTodosList" class="todos-list">
                    ${getCurrentDayTodos()}
                </div>
            </div>
        </div>
    `;
}

// 일간보기 표시
function showDayView() {
    updateTodosList();
}

// 주간 시작일 계산 (월요일 기준)
function getWeekStart(date) {
    const day = new Date(date);
    const dayOfWeek = day.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일이면 -6, 아니면 1 - dayOfWeek
    day.setDate(day.getDate() + diff);
    return day;
}

// 주간보기에서 특정 날짜 선택
function selectWeekDay(dateStr) {
    currentDate = new Date(dateStr);
    selectedDateInput.value = dateStr;
    updateDateDisplay();
    
    if (isWeekView) {
        showWeekView();
    } else {
        updateDisplay();
    }
}

// 현재 선택된 날짜의 할일 가져오기
function getCurrentDayTodos() {
    const currentDateStr = formatDateForInput(currentDate);
    let filteredTodos = todos.filter(todo => todo.date === currentDateStr);
    
    // 필터 적용
    switch (currentFilter) {
        case 'completed':
            filteredTodos = filteredTodos.filter(todo => todo.completed);
            break;
        case 'pending':
            filteredTodos = filteredTodos.filter(todo => !todo.completed);
            break;
    }
    
    // 정렬 적용 (진행중 > 완료 > 우선순위 > 시간)
    filteredTodos.sort((a, b) => {
        // 1. 완료 상태별 정렬 (진행중 > 완료)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // 2. 우선순위별 정렬 (높음 > 보통 > 낮음)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        // 3. 시간순 정렬
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }
        return 0;
    });
    
    if (filteredTodos.length === 0) {
        return getEmptyStateHTML();
    }
    
    return filteredTodos.map(todo => createTodoHTML(todo)).join('');
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 미션 완료 애니메이션
function showMissionCompleteAnimation() {
    // 미션 완료 아이콘 생성
    const missionIcon = document.createElement('div');
    missionIcon.className = 'mission-complete-animation';
    missionIcon.innerHTML = '🎯';
    missionIcon.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        z-index: 9999;
        pointer-events: none;
        animation: missionComplete 2s ease-out forwards;
    `;
    
    document.body.appendChild(missionIcon);
    
    // 2초 후 제거
    setTimeout(() => {
        if (missionIcon.parentNode) {
            missionIcon.parentNode.removeChild(missionIcon);
        }
    }, 2000);
}

// 로컬 스토리지에서 할일 로드
function loadTodos() {
    try {
        const saved = localStorage.getItem('sapp-todos');
        if (saved) {
            const parsedTodos = JSON.parse(saved);
            // 데이터 유효성 검사
            if (Array.isArray(parsedTodos)) {
                todos = parsedTodos;
                console.log('할일 데이터를 성공적으로 불러왔습니다:', todos.length, '개');
            } else {
                console.warn('저장된 데이터가 올바르지 않습니다. 빈 배열로 초기화합니다.');
                todos = [];
            }
        } else {
            console.log('저장된 할일 데이터가 없습니다. 새로 시작합니다.');
            todos = [];
        }
        
        // 미션 카운터 로드
        const savedMissionCount = localStorage.getItem('sapp-mission-count');
        if (savedMissionCount) {
            missionCount = parseInt(savedMissionCount) || 0;
            console.log('미션 카운터를 불러왔습니다:', missionCount);
        } else {
            missionCount = 0;
            console.log('저장된 미션 카운터가 없습니다. 0으로 초기화합니다.');
        }
    } catch (e) {
        console.error('할일 데이터를 불러오는데 실패했습니다:', e);
        todos = [];
        missionCount = 0;
        showNotification('데이터를 불러오는데 실패했습니다. 새로 시작합니다.', 'warning');
    }
}

// 로컬 스토리지에 할일 저장
function saveTodos() {
    try {
        const dataToSave = JSON.stringify(todos);
        localStorage.setItem('sapp-todos', dataToSave);
        localStorage.setItem('sapp-mission-count', missionCount.toString());
        console.log('할일 데이터를 성공적으로 저장했습니다:', todos.length, '개');
        console.log('미션 카운터를 저장했습니다:', missionCount);
        return true;
    } catch (e) {
        console.error('할일 데이터를 저장하는데 실패했습니다:', e);
        showNotification('데이터 저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.', 'error');
        return false;
    }
}

// 데이터 초기화 (디버깅용)
function clearAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        localStorage.removeItem('sapp-todos');
        todos = [];
        updateDisplay();
        showNotification('모든 데이터가 삭제되었습니다.', 'info');
    }
}

// 데이터 백업 (JSON 파일로 다운로드)
function exportData() {
    try {
        const dataStr = JSON.stringify(todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sapp-todos-${formatDateForInput(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification('데이터가 백업되었습니다.', 'success');
    } catch (e) {
        console.error('데이터 백업에 실패했습니다:', e);
        showNotification('데이터 백업에 실패했습니다.', 'error');
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 스타일 적용
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // 애니메이션 CSS 추가
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 알림 아이콘
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// 알림 색상
function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    return colors[type] || '#3498db';
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter로 할일 추가
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === todoInput) {
            todoForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl/Cmd + N으로 새 할일 입력창 포커스
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        todoInput.focus();
    }
});

// 모바일 터치 이벤트 처리
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // 수평 스와이프 감지 (최소 50px, 수직 움직임은 100px 이하)
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
        if (diffX > 0) {
            // 왼쪽으로 스와이프 - 다음 날
            changeDate(1);
        } else {
            // 오른쪽으로 스와이프 - 이전 날
            changeDate(-1);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

// 모바일에서 입력 필드 포커스 시 줌 방지
const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], select, textarea');
inputFields.forEach(field => {
    field.addEventListener('focus', function() {
        // iOS Safari에서 줌 방지
        if (window.innerWidth < 768) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        }
    });
    
    field.addEventListener('blur', function() {
        // 포커스 해제 시 원래 뷰포트 설정으로 복원
        if (window.innerWidth < 768) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        }
    });
});

// 페이지 언로드 시 데이터 저장 확인
window.addEventListener('beforeunload', function() {
    saveTodos();
});

// 주기적으로 데이터 저장 (5분마다)
setInterval(saveTodos, 5 * 60 * 1000);

// Service Worker 등록
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker 등록 성공:', registration.scope);
                    
                    // 업데이트 확인
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 새 버전이 설치되었을 때 사용자에게 알림
                                if (confirm('새 버전이 사용 가능합니다. 지금 업데이트하시겠습니까?')) {
                                    window.location.reload();
                                }
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('Service Worker 등록 실패:', error);
                });
        });
    } else {
        console.log('이 브라우저는 Service Worker를 지원하지 않습니다.');
    }
}

// 오프라인/온라인 상태 감지
window.addEventListener('online', () => {
    console.log('온라인 상태입니다.');
    showNotification('인터넷에 연결되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    console.log('오프라인 상태입니다.');
    showNotification('오프라인 모드입니다. 모든 기능이 로컬에서 작동합니다.', 'info');
});

// PWA 설치 프롬프트
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 설치 버튼 표시 (선택사항)
    showInstallButton();
});

function showInstallButton() {
    // 설치 버튼을 동적으로 생성하여 표시
    const installBtn = document.createElement('button');
    installBtn.textContent = '앱 설치';
    installBtn.className = 'install-btn';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--gradient-primary);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: var(--shadow);
        cursor: pointer;
        z-index: 1000;
        transition: var(--transition);
    `;
    
    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('사용자가 PWA 설치를 수락했습니다.');
                } else {
                    console.log('사용자가 PWA 설치를 거부했습니다.');
                }
                deferredPrompt = null;
                installBtn.remove();
            });
        }
    });
    
    document.body.appendChild(installBtn);
    
    // 5초 후 자동으로 숨김
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.remove();
        }
    }, 5000);
}
