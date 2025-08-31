const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    const rankingsFilePath = path.resolve(__dirname, 'rankings.json');

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { "Allow": "POST, OPTIONS" },
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const newScore = JSON.parse(event.body);

        // 현재 랭킹 읽기
        let rankings = [];
        try {
            const data = fs.readFileSync(rankingsFilePath, 'utf8');
            rankings = JSON.parse(data);
        } catch (readError) {
            // 파일이 없거나 읽을 수 없는 경우 (초기 상태)
            console.warn('Rankings file not found or unreadable, starting with empty array.', readError.message);
        }

        // 새 점수 추가
        rankings.push(newScore);

        // 정렬 (점수 내림차순, 타임스탬프 오름차순)
        rankings.sort((a, b) => {
            if (b.dollCount !== a.dollCount) {
                return b.dollCount - a.dollCount;
            }
            return a.timestamp - b.timestamp;
        });

        // 상위 50개만 유지
        rankings = rankings.slice(0, 50);

        // 랭킹 파일에 다시 쓰기
        fs.writeFileSync(rankingsFilePath, JSON.stringify(rankings, null, 2), 'utf8');

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // CORS 허용
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'Score submitted successfully!' })
        };
    } catch (error) {
        console.error('Error submitting score:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'Failed to submit score', error: error.message })
        };
    }
};
