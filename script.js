document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 및 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const coinDisplay = document.getElementById('coin-display');
    const resultDisplay = document.getElementById('result-display');
    const collectionContainer = document.getElementById('collection-container');

    // 게임 설정
    const prizeChuteX = 50;
    const prizeChuteWidth = 80;

    const tauntMessages = [
        '까비!',
        '거의 다 잡았는데!',
        '에이~',
        '다음에 다시 도전!',
        '인형이 도망갔어요!',
        '미끄러졌네요!'
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
    let gameState = 'LOADING'; // LOADING, READY, MOVING, DROPPING, RAISING, RETURNING, RELEASING_DOLL

    const claw = {
        x: canvas.width / 2,
        y: 50,
        width: 50,
        height: 35,
        speed: 3,
        isClosed: false,
        grabbedDoll: null,
        isShaking: false
    };

    // 이미지 로딩
    function loadImages(callback) {
        let loadedCount = 0;
        const totalCount = dollData.length;
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
    }

    // 게임 초기화
    function init() {
        createDolls();
        updateCollectionDisplay();
        addEventListeners();
        gameState = 'READY';
        gameLoop();
    }

    // 이벤트 리스너 추가
    function addEventListeners() {
        document.addEventListener('keydown', handleKeyDown);
        document.getElementById('drop-button').addEventListener('click', startPlay);

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

    function handleDragStart(e) {
        if (gameState !== 'READY') return;
        const pos = getMousePos(e);
        // 집게를 잡았는지 확인
        if (pos.x >= claw.x && pos.x <= claw.x + claw.width &&
            pos.y >= claw.y && pos.y <= claw.y + claw.height) {
            isDragging = true;
        }
    }

    function handleDragging(e) {
        if (!isDragging || gameState !== 'READY') return;
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

    // 인형 생성 및 배치
    function createDolls() {
        dolls = [];
        for (let i = 0; i < 15; i++) {
            const data = dollData[Math.floor(Math.random() * dollData.length)];
            dolls.push({
                x: Math.random() * (canvas.width - 150) + 100, // 바닥에 무작위로
                y: canvas.height - (Math.random() * 100 + 40),
                width: 60,
                height: 60,
                isGrabbed: false,
                isFalling: false,
                ...data
            });
        }
    }

    // 키보드 입력 처리
    function handleKeyDown(e) {
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
        if (coins < 100) {
            resultDisplay.textContent = '코인이 부족합니다!';
            return;
        }
        coins -= 100;
        coinDisplay.textContent = coins;
        resultDisplay.textContent = '';
        gameState = 'DROPPING';
        claw.isClosed = false;
        claw.grabbedDoll = null;
    }

    // 게임 루프
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // 상태 업데이트
    function update() {
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
            claw.y += claw.speed;
            if (claw.y >= canvas.height - claw.height - 50) { // 바닥 근처에 도달
                // 충돌 감지
                for (const doll of dolls) {
                    if (!doll.isGrabbed && checkCollision(claw, doll)) {
                        // 잡기 확률
                        if (Math.random() < 0.5) { // 50% 확률
                            claw.grabbedDoll = doll;
                            doll.isGrabbed = true;
                            break;
                        }
                    }
                }
                claw.isClosed = true;
                gameState = 'RAISING';

                // 흔들림 이벤트 발동 (25% 확률)
                if (claw.grabbedDoll && Math.random() < 0.25) {
                    claw.isShaking = true;
                    resultDisplay.textContent = '집게가 심하게 흔들립니다!';
                }
            }
        } else if (gameState === 'RAISING') {
            claw.y -= claw.speed;
            if (claw.grabbedDoll) {
                // 흔들릴 때 놓칠 확률 증가 (2.5%), 평소에는 (0.7%)
                const dropChance = claw.isShaking ? 0.025 : 0.007;
                if (Math.random() < dropChance) {
                    resultDisplay.textContent = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];
                    claw.grabbedDoll.isGrabbed = false;
                    claw.grabbedDoll.isFalling = true;
                    claw.grabbedDoll = null;
                    claw.isShaking = false; // 흔들림 멈춤
                } else {
                    claw.grabbedDoll.x = claw.x;
                    claw.grabbedDoll.y = claw.y + claw.height;
                }
            }
            if (claw.y <= 50) {
                claw.isShaking = false; // 올라가면 흔들림 멈춤
                gameState = 'RETURNING';
            }
        } else if (gameState === 'RETURNING') {
            const targetX = prizeChuteX + prizeChuteWidth / 2 - claw.width / 2;
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
        } else if (gameState === 'RELEASING_DOLL') {
            if (claw.grabbedDoll) {
                // 인형이 떨어지는 효과
                claw.grabbedDoll.y += claw.speed * 2;
                if (claw.grabbedDoll.y > canvas.height) {
                    // 인형 타입에 따라 다른 결과 처리
                    switch (claw.grabbedDoll.type) {
                        case 'bomb':
                            resultDisplay.textContent = '펑! 폭탄이었습니다...';
                            // TODO: 폭발 애니메이션 추가 가능
                            break;
                        case 'coin':
                            coins += 500;
                            coinDisplay.textContent = coins;
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
                    // 상태 리셋
                    resetClaw();
                }
            } else {
                // 잡은 인형이 없으면 바로 리셋
                resultDisplay.textContent = '이런, 놓쳤습니다!';
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

    // 그리기
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 상품 배출구
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(prizeChuteX, canvas.height - 50, prizeChuteWidth, 50);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(prizeChuteX, canvas.height - 50, prizeChuteWidth, 10);

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

        // 집게 그리기
        drawClaw();
    }

    function drawClaw() {
        let drawX = claw.x;
        if (claw.isShaking) {
            drawX += (Math.random() - 0.5) * 10; // 좌우로 5px 범위 내에서 흔들림
        }

        ctx.fillStyle = '#555';
        // 집게 라인
        ctx.fillRect(drawX + claw.width / 2 - 2, 0, 4, claw.y);
        // 집게 본체
        ctx.fillRect(drawX, claw.y, claw.width, claw.height);
        // 집게 팔
        ctx.beginPath();
        ctx.moveTo(drawX, claw.y + claw.height);
        if (claw.isClosed) {
            ctx.lineTo(drawX + claw.width / 2, claw.y + claw.height + 20);
            ctx.lineTo(drawX + claw.width, claw.y + claw.height);
        } else {
            ctx.lineTo(drawX - 10, claw.y + claw.height + 20);
            ctx.moveTo(drawX + claw.width, claw.y + claw.height);
            ctx.lineTo(drawX + claw.width + 10, claw.y + claw.height + 20);
        }
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 5;
        ctx.stroke();
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
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