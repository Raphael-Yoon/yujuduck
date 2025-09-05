export const GAME_CONSTANTS = {
    CANVAS: {
        WIDTH: 500,
        HEIGHT: 400
    },
    GAME_COST: 100,
    INITIAL_COINS: 1000,
    PRIZE_CHUTE: {
        X: -80,
        WIDTH: 80
    },
    CLAW: {
        WIDTH: 60,
        HEIGHT: 60,
        SPEED: 3,
        INITIAL_Y: 50
    },
    DOLL: {
        COUNT: 15,
        WIDTH: 60,
        HEIGHT: 60
    }
};

export const GAME_STATES = {
    LOADING: 'LOADING',
    READY: 'READY',
    MOVING: 'MOVING',
    DROPPING: 'DROPPING',
    RAISING: 'RAISING',
    RETURNING: 'RETURNING',
    RELEASING_DOLL: 'RELEASING_DOLL',
    AWAITING_BEG_CONFIRMATION: 'AWAITING_BEG_CONFIRMATION',
    COUNTDOWN: 'COUNTDOWN'
};

export const MESSAGES = {
    TAUNT: [
        '바보! 인형이 도망갔잖아!',
        '에휴, 그것도 못 잡니?',
        '다음 생에 잡으렴!',
        '돈만 날렸네!',
        '엄마한테 일러바칠 거야!',
        '넌 인형 뽑기 소질 없어!',
        '다음에 또 도전해봐! (과연 잡을 수 있을까?)',
        '실력이 부족하네!',
        '야 이 똥멍청이야!!'
    ],
    CELEBRATION: [
        '와! ${dollName} 획득!',
        '대단해요! ${dollName}을(를) 잡았어요!',
        '컬렉션에 ${dollName} 추가!',
        '나이스 캐치! ${dollName}!'
    ]
};