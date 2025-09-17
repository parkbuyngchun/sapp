// 전역 변수
let todos = [];
let currentDate = new Date();
let currentFilter = 'all';
let isWeekView = false;

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

let editingTodoId = null;

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTodos();
    updateDisplay();
    registerServiceWorker();
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
        todo.completed = !todo.completed;
        saveTodos();
        updateDisplay();
        
        const message = todo.completed ? '할일을 완료했습니다!' : '할일을 다시 진행중으로 변경했습니다.';
        showNotification(message, 'info');
    }
}

// 할일 삭제
function deleteTodo(id) {
    if (confirm('정말로 이 할일을 삭제하시겠습니까?')) {
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
        todo.text = text;
        todo.priority = priority;
        todo.time = time;
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
    
    // 우선순위별 정렬 (높음 > 보통 > 낮음)
    filteredTodos.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // 시간순 정렬 (시간이 있는 경우)
    filteredTodos.sort((a, b) => {
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }
        return 0;
    });
    
    if (filteredTodos.length === 0) {
        todosList.innerHTML = getEmptyStateHTML();
    } else {
        todosList.innerHTML = filteredTodos.map(todo => createTodoHTML(todo)).join('');
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

// 할일 HTML 생성
function createTodoHTML(todo) {
    const priorityClass = `priority-${todo.priority}`;
    const completedClass = todo.completed ? 'completed' : '';
    const timeDisplay = todo.time ? `<span class="todo-time"><i class="fas fa-clock"></i> ${todo.time}</span>` : '';
    
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
    } catch (e) {
        console.error('할일 데이터를 불러오는데 실패했습니다:', e);
        todos = [];
        showNotification('데이터를 불러오는데 실패했습니다. 새로 시작합니다.', 'warning');
    }
}

// 로컬 스토리지에 할일 저장
function saveTodos() {
    try {
        const dataToSave = JSON.stringify(todos);
        localStorage.setItem('sapp-todos', dataToSave);
        console.log('할일 데이터를 성공적으로 저장했습니다:', todos.length, '개');
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
