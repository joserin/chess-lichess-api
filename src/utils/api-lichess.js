const VITE_PUBLIC_TOKEN_API_LICHESS = import.meta.env.VITE_PUBLIC_TOKEN_API_LICHESS

export async function SendMove(gameId, moveUCI){

    const endpoint = `https://lichess.org/api/board/game/${gameId}/move/${moveUCI}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            // La autenticación es necesaria para realizar cualquier acción en el tablero
            'Authorization': `Bearer ${VITE_PUBLIC_TOKEN_API_LICHESS}`,
        },
    });
    return response;
}

export async function InitialStreamGame(gameId){
    const url = `https://lichess.org/api/board/game/stream/${gameId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${VITE_PUBLIC_TOKEN_API_LICHESS}`,
        },
    });
    return response;
}

export async function StartGame(nivel, color){

    console.log(nivel, color)

    const response = await fetch('https://lichess.org/api/challenge/ai', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VITE_PUBLIC_TOKEN_API_LICHESS}`,
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

export async function FetchGameById(gameId){
    const url = `https://lichess.org/api/game/${gameId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${VITE_PUBLIC_TOKEN_API_LICHESS}`,
        },
    });
    return response;
}

export async function ResignGame(gameId) {
    const endpoint = `https://lichess.org/api/bot/game/${gameId}/resign`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VITE_PUBLIC_TOKEN_API_LICHESS}`,
        },
    });
    return response;
}