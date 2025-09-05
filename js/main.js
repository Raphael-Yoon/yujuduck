import { GameEngine } from './gameEngine.js';
import { GameRenderer } from './renderer.js';
import { GAME_STATES } from './constants.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    
    // DOM 요소
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const coinDisplay = document.getElementById('coin-display');
    const resultDisplay = document.getElementById('result-display');
    const collectionContainer = document.getElementById('collection-container');
    const begConfirmationButtons = document.getElementById('beg-confirmation-buttons');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const dropButton = document.getElementById('drop-button');
    const gameOverModal = document.getElementById('game-over-modal');
    const collectedCountSpan = document.getElementById('collected-count');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const playerNameInput = document.getElementById('player-name-input');
    const saveScoreBtn = document.getElementById('save-score-btn');

    // 게임 엔진과 렌더러 초기화
    const gameEngine = new GameEngine(canvas, ctx);
    const renderer = new GameRenderer(canvas, ctx, gameEngine);

    // Firebase 설정
    const firebaseConfig = {
        databaseURL: "https://yujuduck-default-rtdb.firebaseio.com/"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    let isDragging = false;

    try {
        await gameEngine.initialize();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }

    // UI 업데이트 함수들
    function updateCoinDisplay() {
        coinDisplay.textContent = `💰 ${gameEngine.getCoins()}원`;
    }

    function updateResultDisplay(message, isSuccess = false) {
        resultDisplay.textContent = message;
        resultDisplay.style.color = isSuccess ? '#4CAF50' : '#D32F2F';
        resultDisplay.style.backgroundColor = isSuccess ? '#E8F5E9' : '#FFEBEE';
    }

    function clearResultDisplay() {
        setTimeout(() => {
            updateResultDisplay('');
        }, 3000);
    }

    function updateCollection() {
        collectionContainer.innerHTML = '';
        const collectedDolls = gameEngine.getCollectedDolls();
        
        collectedDolls.forEach(dollId => {
            const dollData = gameEngine.dollManager.getDollById(dollId);
            if (dollData) {
                const item = document.createElement('div');
                item.className = 'collection-item';
                
                const img = document.createElement('img');
                img.src = dollData.src;
                img.alt = dollData.name;
                
                const name = document.createElement('p');
                name.textContent = dollData.name;
                
                item.appendChild(img);
                item.appendChild(name);
                collectionContainer.appendChild(item);
            }
        });
    }

    // 이벤트 리스너들
    function setupEventListeners() {
        // 버튼 이벤트
        dropButton.addEventListener('click', startPlay);
        leftButton.addEventListener('click', () => gameEngine.moveClawLeft());
        rightButton.addEventListener('click', () => gameEngine.moveClawRight());
        
        // 키보드 이벤트
        document.addEventListener('keydown', handleKeyDown);
        
        // 마우스/터치 이벤트
        canvas.addEventListener('mousedown', handleDragStart);
        canvas.addEventListener('mousemove', handleDragging);
        canvas.addEventListener('mouseup', handleDragEnd);
        canvas.addEventListener('touchstart', handleDragStart);
        canvas.addEventListener('touchmove', handleDragging);
        canvas.addEventListener('touchend', handleDragEnd);

        // 모달 이벤트
        restartGameBtn.addEventListener('click', restartGame);
        saveScoreBtn.addEventListener('click', saveScore);
        
        // 엄마에게 조르기 이벤트
        const confirmBegButton = document.getElementById('confirm-beg-button');
        const declineBegButton = document.getElementById('decline-beg-button');
        if (confirmBegButton) confirmBegButton.addEventListener('click', handleBegConfirm);
        if (declineBegButton) declineBegButton.addEventListener('click', handleBegDecline);
    }

    function handleKeyDown(e) {
        if (gameEngine.getGameState() !== GAME_STATES.READY) return;

        if (e.key === 'ArrowLeft') {
            gameEngine.moveClawLeft();
        } else if (e.key === 'ArrowRight') {
            gameEngine.moveClawRight();
        } else if (e.key === ' ' && gameEngine.getGameState() === GAME_STATES.READY) {
            e.preventDefault();
            startPlay();
        }
    }

    function handleDragStart(e) {
        if (gameEngine.getGameState() !== GAME_STATES.READY) return;
        if (e.touches) e.preventDefault();
        
        const pos = getMousePos(e);
        const claw = gameEngine.getClaw();
        
        if (pos.x >= claw.x && pos.x <= claw.x + claw.width &&
            pos.y >= claw.y && pos.y <= claw.y + claw.height) {
            isDragging = true;
        }
    }

    function handleDragging(e) {
        if (!isDragging || gameEngine.getGameState() !== GAME_STATES.READY) return;
        if (e.touches) e.preventDefault();
        
        const pos = getMousePos(e);
        const claw = gameEngine.getClaw();
        claw.x = Math.max(0, Math.min(canvas.width - claw.width, pos.x - claw.width / 2));
    }

    function handleDragEnd(e) {
        isDragging = false;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // 게임 로직
    function startPlay() {
        if (gameEngine.getGameState() !== GAME_STATES.READY) return;

        if (!gameEngine.canPlay()) {
            if (!gameEngine.hasBegged()) {
                begConfirmationButtons.style.display = 'block';
                gameEngine.setGameState(GAME_STATES.AWAITING_BEG_CONFIRMATION);
                updateResultDisplay('돈이 부족합니다! 💰', false);
            } else {
                showGameOverModal();
            }
            return;
        }

        gameEngine.deductCoins();
        updateCoinDisplay();
        updateResultDisplay('');
        
        const claw = gameEngine.getClaw();
        claw.isClosed = false;
        claw.grabbedDoll = null;
        
        gameEngine.setGameState(GAME_STATES.DROPPING);
    }


    function checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }



    // 게임 상태 업데이트
    function update() {
        const claw = gameEngine.getClaw();
        const dolls = gameEngine.getDolls();
        const gameState = gameEngine.getGameState();
        
        // 떨어지는 인형 처리
        dolls.forEach(doll => {
            if (doll.isFalling) {
                doll.y += claw.speed * 1.5;
                if (doll.y >= canvas.height - doll.height) {
                    doll.y = canvas.height - doll.height;
                    doll.isFalling = false;
                }
            }
        });
        
        if (gameState === GAME_STATES.DROPPING) {
            claw.y += claw.speed;
            
            let hitDoll = null;
            for (const doll of dolls) {
                if (!doll.isGrabbed && checkCollision(claw, doll)) {
                    hitDoll = doll;
                    break;
                }
            }
            
            if (hitDoll) {
                if (Math.random() < 0.7) { // 70% 확률
                    claw.grabbedDoll = hitDoll;
                    hitDoll.isGrabbed = true;
                } else {
                    updateResultDisplay(gameEngine.getRandomTauntMessage(), false);
                }
                claw.isClosed = true;
                gameEngine.setGameState(GAME_STATES.RAISING);
                
                // 흔들림 이벤트 (25% 확률)
                if (claw.grabbedDoll && Math.random() < 0.25) {
                    claw.isShaking = true;
                    updateResultDisplay('집게가 심하게 흔들립니다!', false);
                }
            } else if (claw.y >= canvas.height - claw.height) {
                claw.isClosed = true;
                gameEngine.setGameState(GAME_STATES.RAISING);
                updateResultDisplay(gameEngine.getRandomTauntMessage(), false);
            }
        } else if (gameState === GAME_STATES.RAISING) {
            claw.y -= claw.speed;
            if (claw.grabbedDoll) {
                const dropChance = claw.isShaking ? 0.025 : 0.007;
                if (Math.random() < dropChance) {
                    updateResultDisplay(gameEngine.getRandomTauntMessage(), false);
                    claw.grabbedDoll.isGrabbed = false;
                    claw.grabbedDoll.isFalling = true;
                    claw.grabbedDoll = null;
                    claw.isShaking = false;
                } else {
                    claw.grabbedDoll.x = claw.x;
                    claw.grabbedDoll.y = claw.y + claw.height - 20;
                }
            }
            if (claw.y <= 50) {
                claw.isShaking = false;
                gameEngine.setGameState(GAME_STATES.RETURNING);
            }
        } else if (gameState === GAME_STATES.RETURNING) {
            const targetX = 50;
            if (claw.x > targetX) {
                claw.x = Math.max(targetX, claw.x - claw.speed);
            } else if (claw.x < targetX) {
                claw.x = Math.min(targetX, claw.x + claw.speed);
            } else {
                gameEngine.setGameState(GAME_STATES.RELEASING_DOLL);
                claw.isClosed = false;
            }
            
            if (claw.grabbedDoll) {
                claw.grabbedDoll.x = claw.x;
            }
        } else if (gameState === GAME_STATES.RELEASING_DOLL) {
            if (claw.grabbedDoll) {
                claw.grabbedDoll.y += claw.speed * 2;
                if (claw.grabbedDoll.y > canvas.height) {
                    const dollName = claw.grabbedDoll.name;
                    
                    switch (claw.grabbedDoll.type) {
                        case 'bomb':
                            updateResultDisplay('펑! 폭탄이었습니다...', false);
                            break;
                        case 'coin':
                            gameEngine.addCoins(500);
                            updateResultDisplay(`돈 인형! +500원!`, true);
                            if (!gameEngine.getCollectedDolls().has(claw.grabbedDoll.id)) {
                                gameEngine.collectDoll(claw.grabbedDoll.id);
                                updateCollection();
                            }
                            break;
                        default:
                            if (!gameEngine.getCollectedDolls().has(claw.grabbedDoll.id)) {
                                gameEngine.collectDoll(claw.grabbedDoll.id);
                                updateCollection();
                                updateResultDisplay(gameEngine.getRandomCelebrationMessage(dollName), true);
                            } else {
                                updateResultDisplay(`이미 가지고 있는 ${dollName}`, false);
                            }
                    }
                    
                    const dollIndex = dolls.indexOf(claw.grabbedDoll);
                    if (dollIndex > -1) {
                        dolls.splice(dollIndex, 1);
                    }
                    
                    claw.grabbedDoll = null;
                    updateCoinDisplay();
                    clearResultDisplay();
                    gameEngine.setGameState(GAME_STATES.READY);
                }
            } else {
                gameEngine.setGameState(GAME_STATES.READY);
                clearResultDisplay();
            }
        }
    }

    function handleBegConfirm() {
        gameEngine.addCoins(500);
        gameEngine.setBeggedForMoney();
        begConfirmationButtons.style.display = 'none';
        updateCoinDisplay();
        updateResultDisplay('엄마가 용돈을 주셨어요! +500원 💝', true);
        clearResultDisplay();
        gameEngine.setGameState(GAME_STATES.READY);
    }

    function handleBegDecline() {
        begConfirmationButtons.style.display = 'none';
        showGameOverModal();
    }

    function showGameOverModal() {
        collectedCountSpan.textContent = gameEngine.getCollectedDolls().size;
        gameOverModal.style.display = 'flex';
    }

    function restartGame() {
        gameEngine.reset();
        updateCoinDisplay();
        updateCollection();
        updateResultDisplay('');
        begConfirmationButtons.style.display = 'none';
        gameOverModal.style.display = 'none';
        playerNameInput.value = '';
    }

    function saveScore() {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('이름을 입력해주세요!');
            return;
        }

        const score = gameEngine.getCollectedDolls().size;
        database.ref('rankings').push({
            name: playerName,
            score: score,
            timestamp: Date.now()
        }).then(() => {
            alert('점수가 저장되었습니다!');
            loadRankings();
            restartGame();
        }).catch((error) => {
            console.error('Error saving score:', error);
            alert('점수 저장에 실패했습니다.');
        });
    }

    function loadRankings() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (일) - 6 (토)
        // 월요일을 주의 시작으로 간주 (월요일: 1, 일요일: 0)
        const daysSinceMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysSinceMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfWeekTimestamp = startOfWeek.getTime();

        database.ref('rankings').orderByChild('timestamp').startAt(startOfWeekTimestamp).once('value', (snapshot) => {
            const rankings = [];
            snapshot.forEach((childSnapshot) => {
                rankings.push(childSnapshot.val());
            });

            // 점수 순으로 정렬
            rankings.sort((a, b) => b.score - a.score);

            // 상위 10개만 선택
            const top10Rankings = rankings.slice(0, 10);

            updateRankingDisplay(top10Rankings);
        });
    }

    function updateRankingDisplay(rankings) {
        const tableBody = document.querySelector('#ranking-table tbody');
        tableBody.innerHTML = '';
        
        rankings.forEach((ranking, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${ranking.name}</td>
                <td>${ranking.score}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 게임 루프
    function gameLoop() {
        update();
        renderer.render();
        requestAnimationFrame(gameLoop);
    }

    // 초기화
    setupEventListeners();
    updateCoinDisplay();
    updateCollection();
    loadRankings();
    
    // 게임 루프 시작
    gameLoop();
});