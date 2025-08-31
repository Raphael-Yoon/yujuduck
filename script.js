document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    // DOM 요소 및 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const coinDisplay = document.getElementById('coin-display');
    const resultDisplay = document.getElementById('result-display');
    const collectionContainer = document.getElementById('collection-container');
    const begConfirmationButtons = document.getElementById('beg-confirmation-buttons'); // New
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const dropButton = document.getElementById('drop-button');
    const showRankingsBtn = document.getElementById('show-rankings-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const rankingsModal = document.getElementById('rankings-modal');
    const collectedCountSpan = document.getElementById('collected-count');
    const playerNameInput = document.getElementById('player-name-input');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const closeRankingsBtn = document.getElementById('close-rankings-btn');
    const rankingsList = document.getElementById('rankings-list');
    

    // 게임 설정
    const prizeChuteX = -80;
    const prizeChuteWidth = 80;

    const tauntMessages = [
        '바보! 인형이 도망갔잖아!',
        '에휴, 그것도 못 잡니?',
        '다음 생에 잡으렴!',
        '코인만 날렸네!',
        '엄마한테 일러바칠 거야!',
        '넌 인형 뽑기 소질 없어!',
        '다음에 또 도전해봐! (과연 잡을 수 있을까?)',
        '실력이 부족하네!',
        '야 이 똥멍청이야!!'
    ];

    const celebrationMessages = [
        '와! ${dollName} 획득!',
        '대단해요! ${dollName}을(를) 잡았어요!',
        '컬렉션에 ${dollName} 추가!',
        '나이스 캐치! ${dollName}!'
    ];

    // 인형 데이터
    const dollData = [
        { id: 1, name: '인형 1호', rarity: 'Common', src: 'images/doll_01.png', type: 'normal' },
        { id: 2, name: '인형 2호', rarity: 'Common', src: 'images/doll_02.png', type: 'normal' },
        { id: 3, name: '인형 3호', rarity: 'Common', src: 'images/doll_03.png', type: 'normal' },
        { id: 4, name: '인형 4호', rarity: 'Common', src: 'images/doll_04.png', type: 'normal' },
        { id: 5, name: '인형 5호', rarity: 'Common', src: 'images/doll_05.png', type: 'normal' },
        { id: 6, name: '인형 6호', rarity: 'Common', src: 'images/doll_06.png', type: 'normal' },
        { id: 7, name: '인형 7호', rarity: 'Common', src: 'images/doll_07.png', type: 'normal' },
        { id: 8, name: '인형 8호', rarity: 'Common', src: 'images/doll_08.png', type: 'normal' },
        { id: 9, name: '인형 9호', rarity: 'Common', src: 'images/doll_09.png', type: 'normal' },
        { id: 10, name: '인형 10호', rarity: 'Common', src: 'images/doll_10.png', type: 'normal' },
        { id: 11, name: '인형 11호', rarity: 'Rare', src: 'images/doll_11.png', type: 'normal' },
        { id: 12, name: '인형 12호', rarity: 'Rare', src: 'images/doll_12.png', type: 'normal' },
        { id: 13, name: '인형 13호', rarity: 'Rare', src: 'images/doll_13.png', type: 'normal' },
        { id: 14, name: '인형 14호', rarity: 'Rare', src: 'images/doll_14.png', type: 'normal' },
        { id: 15, name: '인형 15호', rarity: 'Rare', src: 'images/doll_15.png', type: 'normal' },
        { id: 16, name: '인형 16호', rarity: 'Rare', src: 'images/doll_16.png', type: 'normal' },
        { id: 17, name: '인형 17호', rarity: 'Super Rare', src: 'images/doll_17.png', type: 'normal' },
        { id: 18, name: '인형 18호', rarity: 'Super Rare', src: 'images/doll_18.png', type: 'normal' },
        { id: 19, name: '폭탄 인형', rarity: 'Super Rare', src: 'images/doll_19.png', type: 'bomb' },
        { id: 20, name: '코인 인형', rarity: 'Super Rare', src: 'images/doll_20.png', type: 'coin' }
    ];

    // 게임 상태
    let coins = 1000;
    const collectedDolls = new Set();
    let dolls = [];
    let images = {};
    let clawOpenImg, clawClosedImg, prizeImg;
    let gameState = 'LOADING'; // LOADING, READY, MOVING, DROPPING, RAISING, RETURNING, RELEASING_DOLL, AWAITING_BEG_CONFIRMATION, COUNTDOWN
    let hasBeggedForMoney = false; // 엄마에게 돈을 조르는 기회는 1회만
    

    const claw = {
        x: canvas.width / 2,
        y: 50,
        width: 60,
        height: 60,
        speed: 3,
        isClosed: false,
        grabbedDoll: null,
        isShaking: false
    };

    // 이미지 로딩
    function loadImages(callback) {
        let loadedCount = 0;
        const totalCount = dollData.length + 3; // +2 for claw images, +1 for prize chute

        // Load doll images
        dollData.forEach(data => {
            const img = new Image();
            img.src = data.src;
            img.onload = () => {
                loadedCount++;
                images[data.src] = img;
                if (loadedCount === totalCount) {
                    callback();
                }
            };
            img.onerror = () => { // 이미지가 없어도 게임이 멈추지 않도록
                loadedCount++;
                console.error(`Could not load image: ${data.src}`);
                if (loadedCount === totalCount) {
                    callback();
                }
            }
        });

        // Load claw images
        clawOpenImg = new Image();
        clawOpenImg.src = 'images/catch_o.png';
        clawOpenImg.onload = () => {
            loadedCount++;
            if (loadedCount === totalCount) callback();
        }
        clawOpenImg.onerror = () => {
            loadedCount++;
            console.error(`Could not load image: images/catch_o.png`);
            if (loadedCount === totalCount) callback();
        }

        clawClosedImg = new Image();
        clawClosedImg.src = 'images/catch_c.png';
        clawClosedImg.onload = () => {
            loadedCount++;
            if (loadedCount === totalCount) callback();
        }
        clawClosedImg.onerror = () => {
            loadedCount++;
            console.error(`Could not load image: images/catch_c.png`);
            if (loadedCount === totalCount) callback();
        }

        prizeImg = new Image();
        prizeImg.src = 'images/prize.png';
        prizeImg.onload = () => {
            loadedCount++;
            if (loadedCount === totalCount) callback();
        }
        prizeImg.onerror = () => {
            loadedCount++;
            console.error(`Could not load image: images/prize.png`);
            if (loadedCount === totalCount) callback();
        }
    }

    // 게임 초기화
    function init() {
        // 모바일 기기인 경우 집게 속도 조절
        if (isMobileDevice()) {
            claw.speed = 3.5; // 모바일에서는 더 빠르게 (예시 값)
        } else {
            claw.speed = 3; // 데스크톱 기본 속도
        }

        createDolls();
        updateCollectionDisplay();
        addEventListeners();
        coinDisplay.textContent = `${coins}원`; // 초기 코인 표시
        gameState = 'READY';
        gameLoop();
    }

    // 이벤트 리스너 추가
    function addEventListeners() {
        document.addEventListener('keydown', handleKeyDown);
        document.getElementById('drop-button').addEventListener('click', startPlay);
        
        // 화살표 버튼 이벤트
        document.getElementById('left-button').addEventListener('click', moveClawLeft);
        document.getElementById('right-button').addEventListener('click', moveClawRight);
        
        // 터치 이벤트도 추가
        document.getElementById('left-button').addEventListener('touchstart', function(e) {
            e.preventDefault();
            moveClawLeft();
        });
        document.getElementById('right-button').addEventListener('touchstart', function(e) {
            e.preventDefault();
            moveClawRight();
        });

        // 엄마에게 돈 조르기 버튼 이벤트
        document.getElementById('confirm-beg-button').addEventListener('click', confirmBegForMoney);
        document.getElementById('decline-beg-button').addEventListener('click', declineBegForMoney);
        
        // 랭킹 관련 이벤트
        showRankingsBtn.addEventListener('click', showRankings);
        submitScoreBtn.addEventListener('click', submitScore);
        restartGameBtn.addEventListener('click', restartGame);
        closeRankingsBtn.addEventListener('click', () => {
            rankingsModal.style.display = 'none';
        });
        
        // 엔터키로 점수 제출
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitScore();
            }
        });
        

        // 마우스 이벤트
        canvas.addEventListener('mousedown', handleDragStart);
        canvas.addEventListener('mousemove', handleDragging);
        canvas.addEventListener('mouseup', handleDragEnd);
        canvas.addEventListener('mouseleave', handleDragEnd);

        // 터치 이벤트
        canvas.addEventListener('touchstart', handleDragStart);
        canvas.addEventListener('touchmove', handleDragging);
        canvas.addEventListener('touchend', handleDragEnd);
    }

    let isDragging = false;
    
    // 화살표 버튼으로 집게 이동
    function moveClawLeft() {
        if (gameState !== 'READY') return;
        claw.x = Math.max(0, claw.x - 20);
    }
    
    function moveClawRight() {
        if (gameState !== 'READY') return;
        claw.x = Math.min(canvas.width - claw.width, claw.x + 20);
    }

    function handleDragStart(e) {
        if (gameState !== 'READY') return;
        if (e.touches) e.preventDefault(); // 터치 이벤트 기본 동작 방지
        const pos = getMousePos(e);
        // 집게를 잡았는지 확인
        if (pos.x >= claw.x && pos.x <= claw.x + claw.width &&
            pos.y >= claw.y && pos.y <= claw.y + claw.height) {
            isDragging = true;
        }
    }

    function handleDragging(e) {
        if (!isDragging || gameState !== 'READY') return;
        if (e.touches) e.preventDefault(); // 터치 이벤트 기본 동작 방지
        const pos = getMousePos(e);
        claw.x = Math.max(0, Math.min(canvas.width - claw.width, pos.x - claw.width / 2));
    }

    function handleDragEnd(e) {
        isDragging = false;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        // 터치 이벤트 처리
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        // 마우스 이벤트 처리
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // 모바일 기기 감지 함수
    function isMobileDevice() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('Mobi') !== -1);
    }

    // 인형 생성 및 배치
    function createDolls() {
        dolls = [];
        const prizeChuteRect = { x: prizeChuteX, y: canvas.height - 200, width: 300, height: 200 };
        for (let i = 0; i < 15; i++) {
            const data = dollData[Math.floor(Math.random() * dollData.length)];
            let newDoll;
            do {
                newDoll = {
                    x: Math.random() * (canvas.width - 150) + 100, // 바닥에 무작위로
                    y: canvas.height - (Math.random() * 100 + 40),
                    width: 60,
                    height: 60,
                    isGrabbed: false,
                    isFalling: false,
                    ...data
                };
            } while (checkCollision(newDoll, prizeChuteRect));
            dolls.push(newDoll);
        }
    }

    // 키보드 입력 처리
    function handleKeyDown(e) {
        console.log('handleKeyDown - gameState:', gameState, 'key:', e.key);
        if (gameState !== 'READY') return;

        if (e.key === 'ArrowLeft') {
            claw.x = Math.max(0, claw.x - claw.speed);
        } else if (e.key === 'ArrowRight') {
            claw.x = Math.min(canvas.width - claw.width, claw.x + claw.speed);
        } else if (e.key === ' ' && gameState === 'READY') { // 스페이스바
            e.preventDefault();
            startPlay();
        }
    }

    function startPlay() {
        console.log('startPlay called - gameState:', gameState);
        if (coins < 100) {
            if (!hasBeggedForMoney) {
                gameState = 'AWAITING_BEG_CONFIRMATION';
                resultDisplay.textContent = '코인이 부족합니다! 엄마에게 돈을 조를까요? (예/아니오)';
                // TODO: 사용자에게 예/아니오 버튼을 표시하고 이벤트 리스너를 연결해야 합니다.
                // 게임 루프는 이 상태에서 일시 중지됩니다.
            } else {
                // 게임 종료 - 이름 입력받기
                showGameOver();
            }
            return;
        }
        coins -= 100;
        coinDisplay.textContent = `${coins}원`;
        resultDisplay.textContent = '';
        gameState = 'DROPPING';
        claw.isClosed = false;
        claw.grabbedDoll = null;
        console.log('startPlay - gameState set to DROPPING');
    }

    // 엄마에게 돈 조르기 확인 함수
    function confirmBegForMoney() {
        if (gameState !== 'AWAITING_BEG_CONFIRMATION') return;

        hasBeggedForMoney = true; // 기회 사용
        gameState = 'COUNTDOWN';
        begConfirmationButtons.style.display = 'none'; // 예/아니오 버튼 숨기기

        let count = 3;
        resultDisplay.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                resultDisplay.textContent = count;
            } else {
                clearInterval(countdownInterval);
                if (Math.random() < 0.6) { // 60% 확률로 돈을 줌
                    const moneyGiven = (Math.floor(Math.random() * 10) + 1) * 100; // 100원에서 1000원 사이 (100원 단위)
                    coins += moneyGiven;
                    coinDisplay.textContent = `${coins}원`;
                    resultDisplay.textContent = `엄마가 돈을 주셨어요! +${moneyGiven}원!`;
                } else {
                    resultDisplay.textContent = '엄마가 돈을 안 주셨어요...';
                }
                setTimeout(() => {
                    gameState = 'READY'; // 상태를 READY로 되돌림
                }, 1000); // Show message for 1 second
            }
        }, 1000);
    }

    // 엄마에게 돈 조르기 거절 함수
    function declineBegForMoney() {
        if (gameState !== 'AWAITING_BEG_CONFIRMATION') return;

        hasBeggedForMoney = true; // 기회 사용 (거절했어도 기회는 소진)
        resultDisplay.textContent = '코인이 부족합니다!';
        gameState = 'READY'; // 상태를 READY로 되돌림
        begConfirmationButtons.style.display = 'none'; // 예/아니오 버튼 숨기기
    }

    

    

    

    

    // 게임 루프
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // 상태 업데이트
    function update() {
        console.log('UPDATE - Current gameState:', gameState); // Debug log
        updateUIForGameState(); // UI 가시성 업데이트

        // 떨어지는 인형 처리
        dolls.forEach(doll => {
            if (doll.isFalling) {
                doll.y += claw.speed * 1.5; // 중력 효과
                // 바닥 또는 다른 인형과 닿으면 멈춤 (간단하게 바닥으로 처리)
                if (doll.y >= canvas.height - doll.height) {
                    doll.y = canvas.height - doll.height;
                    doll.isFalling = false;
                }
            }
        });

        if (gameState === 'DROPPING') {
            console.log('DEBUG: Entering DROPPING state. claw.y:', claw.y); // Debug log
            claw.y += claw.speed;

            let hitDoll = null;
            for (const doll of dolls) {
                if (!doll.isGrabbed && checkCollision(claw, doll)) {
                    hitDoll = doll;
                    console.log('DEBUG: Collision detected with doll:', doll.name); // Debug log
                    break;
                }
            }

            console.log('DEBUG: hitDoll is:', hitDoll ? hitDoll.name : 'null', 'claw.y:', claw.y, 'bottom threshold:', canvas.height - claw.height); // Debug log

            if (hitDoll) {
                // 잡기 확률
                if (Math.random() < 0.5) { // 50% 확률
                    claw.grabbedDoll = hitDoll;
                    hitDoll.isGrabbed = true;
                    console.log('DEBUG: Doll grabbed successfully.'); // Debug log
                } else {
                    console.log('DEBUG: Failed to grab doll (50% chance). Displaying taunt.'); // Debug log
                    resultDisplay.textContent = tauntMessages[Math.floor(Math.random() * tauntMessages.length)]; // Taunt here
                }
                claw.isClosed = true;
                gameState = 'RAISING';

                // 흔들림 이벤트 발동 (25% 확률)
                if (claw.grabbedDoll && Math.random() < 0.25) {
                    claw.isShaking = true;
                    resultDisplay.textContent = '집게가 심하게 흔들립니다!';
                    console.log('DEBUG: Claw shaking activated.'); // Debug log
                }
            } else if (claw.y >= canvas.height - claw.height) { // 바닥에 도달했지만 인형을 잡지 못함
                console.log('DEBUG: Claw hit bottom empty-handed. Displaying taunt.'); // Debug log
                claw.isClosed = true; // 집게 닫기 (빈손)
                gameState = 'RAISING';
                resultDisplay.textContent = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];
            }
        } else if (gameState === 'RAISING') {
            console.log('DEBUG: Entering RAISING state.'); // Debug log
            claw.y -= claw.speed;
            if (claw.grabbedDoll) {
                // 흔들릴 때 놓칠 확률 증가 (2.5%), 평소에는 (0.7%)
                const dropChance = claw.isShaking ? 0.025 : 0.007;
                if (Math.random() < dropChance) {
                    console.log('DEBUG: Doll dropped while raising. Displaying taunt.'); // Debug log
                    resultDisplay.textContent = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];
                    claw.grabbedDoll.isGrabbed = false;
                    claw.grabbedDoll.isFalling = true;
                    claw.grabbedDoll = null;
                    claw.isShaking = false; // 흔들림 멈춤
                } else {
                    claw.grabbedDoll.x = claw.x;
                    claw.grabbedDoll.y = claw.y + claw.height - 20; // Adjust overlap
                }
            }
            if (claw.y <= 50) {
                claw.isShaking = false; // 올라가면 흔들림 멈춤
                gameState = 'RETURNING';
            }
        } else if (gameState === 'RETURNING') {
            console.log('DEBUG: Entering RETURNING state.'); // Debug log
            const targetX = 50;
            // 수평 이동
            if (claw.x > targetX) {
                claw.x = Math.max(targetX, claw.x - claw.speed);
            } else if (claw.x < targetX) {
                claw.x = Math.min(targetX, claw.x + claw.speed);
            } else { // 목표 위치 도착
                gameState = 'RELEASING_DOLL';
                claw.isClosed = false; // 집게 열기
            }

            // 인형도 같이 이동
            if (claw.grabbedDoll) {
                claw.grabbedDoll.x = claw.x;
            }
        }
        else if (gameState === 'RELEASING_DOLL') {
            console.log('DEBUG: Entering RELEASING_DOLL state.'); // Debug log
            if (claw.grabbedDoll) {
                // 인형이 떨어지는 효과
                claw.grabbedDoll.y += claw.speed * 2;
                if (claw.grabbedDoll.y > canvas.height) {
                    // 인형 타입에 따라 다른 결과 처리
                    switch (claw.grabbedDoll.type) {
                        case 'bomb':
                            resultDisplay.textContent = '펑! 폭탄이었습니다...';
                            break;
                        case 'coin':
                            coins += 500;
                            coinDisplay.textContent = `${coins}원`;
                            resultDisplay.textContent = `코인 인형! +500 코인!`;
                            if (!collectedDolls.has(claw.grabbedDoll.id)) {
                                collectedDolls.add(claw.grabbedDoll.id);
                                updateCollectionDisplay();
                            }
                            break;
                        default: // normal
                            const messageTemplate = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
                            resultDisplay.textContent = messageTemplate.replace('${dollName}', claw.grabbedDoll.name);
                            
                            if (!collectedDolls.has(claw.grabbedDoll.id)) {
                                collectedDolls.add(claw.grabbedDoll.id);
                                updateCollectionDisplay();
                            }
                            break;
                    }
                    
                    // 잡힌 인형은 화면에서 제거
                    dolls = dolls.filter(d => d !== claw.grabbedDoll);
                    claw.grabbedDoll = null;
                    
                    // 게임 종료 조건 확인 (코인 부족하고 엄마에게 조를 기회도 없음)
                    if (coins < 100 && hasBeggedForMoney) {
                        showGameOver();
                        return;
                    }
                    
                    // 임시: 테스트용 게임 종료 (수집한 인형이 5개 이상일 때)
                    // if (collectedDolls.size >= 5) {
                    //     showGameOver();
                    //     return;
                    // }
                    
                    // 상태 리셋
                    resetClaw();
                }
            } else {
                // 잡은 인형이 없으면 바로 리셋
                resetClaw();
            }
        }
    }

    // 집게 초기화 함수
    function resetClaw() {
        claw.x = canvas.width / 2;
        claw.y = 50;
        claw.isClosed = false;
        claw.grabbedDoll = null;
        claw.isShaking = false; // 흔들림 상태 초기화
        gameState = 'READY';
    }

    // UI 요소 가시성 업데이트
    function updateUIForGameState() {
        // 엄마에게 돈 조르기 버튼 가시성
        if (gameState === 'AWAITING_BEG_CONFIRMATION') {
            begConfirmationButtons.style.display = 'block';
        } else {
            begConfirmationButtons.style.display = 'none';
        }

        // 게임 플레이 버튼 활성화/비활성화
        const enableButtons = (gameState === 'READY');
        leftButton.disabled = !enableButtons;
        rightButton.disabled = !enableButtons;
        dropButton.disabled = !enableButtons;
    }

    // 그리기
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 인형 그리기
        dolls.forEach(doll => {
            const img = images[doll.src];
            if (img) {
                ctx.drawImage(img, doll.x, doll.y, doll.width, doll.height);
            } else { // 이미지가 로드되지 않은 경우
                ctx.fillStyle = '#ff00ff'; // 눈에 띄는 색으로 표시
                ctx.fillRect(doll.x, doll.y, doll.width, doll.height);
            }
        });

        // 상품 배출구
        if (prizeImg && prizeImg.complete) {
            ctx.drawImage(prizeImg, prizeChuteX, canvas.height - 200, 300, 200);
        } else {
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(prizeChuteX, canvas.height - 50, prizeChuteWidth, 50);
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(prizeChuteX, canvas.height - 50, prizeChuteWidth, 10);
        }

        // 집게 그리기
        drawClaw();
    }

    function drawClaw() {
        let drawX = claw.x;
        if (claw.isShaking) {
            drawX += (Math.random() - 0.5) * 10; // 좌우로 5px 범위 내에서 흔들림
        }

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(drawX + claw.width / 2, 0);
        ctx.lineTo(drawX + claw.width / 2, claw.y);
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.stroke();

        const img = claw.isClosed ? clawClosedImg : clawOpenImg;
        if (img && img.complete) {
            ctx.drawImage(img, drawX, claw.y, claw.width, claw.height);
        } else {
            // Fallback drawing if image is not loaded
            ctx.fillStyle = '#999';
            ctx.fillRect(drawX, claw.y, claw.width, claw.height);
        }
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // 게임 오버 표시
    function showGameOver() {
        gameState = 'GAME_OVER';
        collectedCountSpan.textContent = collectedDolls.size;
        playerNameInput.value = '';
        gameOverModal.style.display = 'block';
        playerNameInput.focus();
    }

    // 점수 제출 (로컬만 사용)
    function submitScore() {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('이름을 입력하세요!');
            playerNameInput.focus();
            return;
        }

        // 버튼 비활성화
        submitScoreBtn.disabled = true;
        submitScoreBtn.textContent = '등록 중...';

        try {
            // 점수 데이터 생성
            const scoreData = {
                name: playerName,
                dollCount: collectedDolls.size,
                timestamp: Date.now()
            };

            // 로컬 스토리지에서 기존 랭킹 가져오기
            let localRankings = JSON.parse(localStorage.getItem('yujuduck-rankings') || '[]');
            
            // 새 점수 추가
            localRankings.push(scoreData);
            
            // 인형 개수 기준으로 내림차순 정렬, 같으면 빠른 시간순
            localRankings.sort((a, b) => {
                if (b.dollCount !== a.dollCount) {
                    return b.dollCount - a.dollCount;
                }
                return a.timestamp - b.timestamp;
            });
            
            // 상위 50개만 유지
            localRankings = localRankings.slice(0, 50);
            
            // 로컬 스토리지에 저장
            localStorage.setItem('yujuduck-rankings', JSON.stringify(localRankings));
            
            gameOverModal.style.display = 'none';
            alert('랭킹에 등록되었습니다!');
            showRankings();
            
        } catch (error) {
            console.error('Score submission error:', error);
            alert('점수 저장에 실패했습니다.');
        } finally {
            // 버튼 복원
            submitScoreBtn.disabled = false;
            submitScoreBtn.textContent = '랭킹 등록';
        }
    }

    // 랭킹 표시 (로컬 데이터 사용)
    function showRankings() {
        const localRankings = JSON.parse(localStorage.getItem('yujuduck-rankings') || '[]');
        displayRankings(localRankings);
        rankingsModal.style.display = 'block';
    }

    // 랭킹 목록 표시
    function displayRankings(rankings) {
        rankingsList.innerHTML = '';
        
        if (rankings.length === 0) {
            rankingsList.innerHTML = '<p>아직 랭킹이 없습니다.<br><small>게임을 완료하고 점수를 등록해보세요!</small></p>';
            return;
        }
        
        rankings.forEach((ranking, index) => {
            const item = document.createElement('div');
            item.classList.add('ranking-item');
            item.innerHTML = `
                <div class="rank">${index + 1}위</div>
                <div class="name">${ranking.name}</div>
                <div class="score">인형 ${ranking.dollCount}개</div>
                <div class="date">${new Date(ranking.timestamp).toLocaleDateString()}</div>
            `;
            rankingsList.appendChild(item);
        });
    }

    // 게임 재시작
    function restartGame() {
        coins = 1000;
        hasBeggedForMoney = false;
        collectedDolls.clear();
        coinDisplay.textContent = `${coins}원`;
        resultDisplay.textContent = '';
        gameOverModal.style.display = 'none';
        createDolls();
        updateCollectionDisplay();
        resetClaw();
    }


    // 컬렉션 표시 업데이트
    function updateCollectionDisplay() {
        collectionContainer.innerHTML = '';
        dollData.forEach(data => {
            const item = document.createElement('div');
            item.classList.add('collection-item');

            const img = document.createElement('img');
            const name = document.createElement('p');
            
            if (collectedDolls.has(data.id)) {
                const loadedImg = images[data.src];
                if(loadedImg) img.src = loadedImg.src;
                name.textContent = data.name;
                item.style.backgroundColor = '#e0ffe0';
            } else {
                // 아직 못 모은 인형
                img.style.opacity = '0.2';
                const loadedImg = images[data.src];
                if(loadedImg) img.src = loadedImg.src;
                name.textContent = '???';
            }
            
            item.appendChild(img);
            item.appendChild(name);
            collectionContainer.appendChild(item);
        });
    }

    // 게임 시작
    loadImages(init);
});