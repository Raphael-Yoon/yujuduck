const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    const rankingsFilePath = path.resolve(__dirname, 'rankings.json');

    try {
        const data = fs.readFileSync(rankingsFilePath, 'utf8');
        const rankings = JSON.parse(data);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // CORS 허용
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(rankings)
        };
    } catch (error) {
        console.error('Error reading rankings:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'Failed to retrieve rankings', error: error.message })
        };
    }
};
