const lichessToken = import.meta.env.TOKEN_API_LICHESS

export async function SendMove(gameId, moveUCI){

    // lichessAPIKey = import.meta.env.lichessAPIKey;
    const endpoint = `https://lichess.org/api/board/game/${gameId}/move/${moveUCI}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            // La autenticación es necesaria para realizar cualquier acción en el tablero
            'Authorization': `Bearer ${lichessAPIKey}`,
        },
    });
    return response;
}

export async function InitialStreamGame(gameId){
    const url = `https://lichess.org/api/board/game/stream/${gameId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${lichessAPIKey}`,
        },
    });
    return response;
}

export async function StartGame(nivel, color){

    const response = await fetch('https://lichess.org/api/challenge/ai', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${lichessAPIKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            level: nivel,
            timeControl:'unlimited',
            color: color.toLowerCase(), // Blanco o Negro
        }),
    });
    return response;
}
