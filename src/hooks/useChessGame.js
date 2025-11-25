import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { SendMove, InitialStreamGame, StartGame, FetchGameById } from '../utils/api-lichess';

export const useChessGame = (jugadorColor) => {

    // ESTADOS CENTRALES
    const inicialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const [fen, setFen] = useState(inicialFen);
    const [isGameActive, setIsGameActive] = useState(false);
    const [gameState, setGameState] = useState({
        gameId: null,
        turno: 'white',
        historial: [],
        partidaTerminada: false,
        ganador: null,
        motivoFinPartida: null,
    });

    const gameIdRef = useRef(gameState.gameId);

    //----------------------------------API LICHESS--------------------------------
    const fetchSendMove = SendMove;
    const fetchInitialStream = InitialStreamGame; 
    const fetchStartGame  = StartGame;
    const fetchGameById = FetchGameById;
    //-----------------------------------------------------------------------------

    // EFECTO PARA MANTENER LA REFERENCIA ACTUALIZADA
    useEffect(() => {
        gameIdRef.current = gameState.gameId;
    }, [gameState.gameId]);

        // Función para procesar los datos de cada evento
    const procesarEvento = (event) => {
        switch (event.type) {
            case 'gameFull':

                const fullState = event.state;
                let fenState = event.initialFen === 'startpos' 
                    ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : event.initialFen

                const tempGame = new Chess(fenState);
    
                // 1c. Aplicar todos los movimientos de la partida.
                const allMoves = fullState.moves ? fullState.moves.split(' ') : [];
                for (const move of allMoves) {
                    if (move) {
                        tempGame.move(move, { sloppy: true }); 
                    }
                }
                
                const currentFen = tempGame.fen();

                // 1. CAPTURAR FEN (Tablero)
                setFen(currentFen);
                // 2. ACTUALIZAR ESTADO DEL JUEGO
                setGameState(prevState => ({
                    ...prevState,
                    historial: event.state.moves ? event.state.moves.split(' ') : [],
                    turno: currentFen.split(' ')[1] === 'w' ? 'white' : 'black',
                    partidaTerminada: event.state.status !== 'started',
                }));
                break;

            case 'gameState':

                const currentMoves = event.moves ? event.moves.split(' ') : [];
                const tempGameState = new Chess(); 

                for (const move of currentMoves) {
                    if (move) {
                        tempGameState.move(move, { sloppy: true }); 
                    }
                }

                const currentFenState = tempGameState.fen();

                // 1. CAPTURAR FEN (Tablero)
                setFen(event.fen || currentFenState);
                // 2. ACTUALIZAR ESTADO DEL JUEGO
                setGameState(prevState => ({
                    ...prevState,
                    historial: currentMoves,
                    turno: currentFenState.split(' ')[1] === 'w' ? 'white' : 'black',
                    partidaTerminada: event.status !== 'started',
                }));
                break;
                
            case 'chatLine':
                // Opcional: Manejar mensajes de chat.
                console.log(`Chat: ${event.username}: ${event.text}`);
                break;

            case 'gameFinish':
                // La partida ha terminado.
                console.log("Partida terminada. Resultado:", event.status);
                setGameState(prevState => ({
                    ...prevState,
                    partidaTerminada: true,
                }));
                break;
                
            // Otros posibles eventos: 'error', 'challenge', etc.
            default:
                console.log(`Evento desconocido: ${event.type}`, event);
                break;
        }
    }

        // 💡 NUEVA FUNCIÓN: Llama a la API para verificar el resultado final
    const verificarResultadoFinal = useCallback(async (gameId) => {
        if (!gameId) return;

        try {
            const response = await fetchGameById(gameId);
            const data = await response.json();

            // data.status puede ser 'mate', 'draw', 'timeout', etc.
            if (data.status && data.status !== 'started' && data.status !== 'created') {
                const ganadorColor = data.winner || 'draw'; // Lichess usa 'white' o 'black'
                
                setGameState(prevState => ({
                    ...prevState,
                    partidaTerminada: true,
                    ganador: ganadorColor, // 'white', 'black', o 'draw'
                    motivoFinPartida: data.status,
                }));
                console.log(`[VERIFICACIÓN] Resultado oficial de la partida: ${data.status}, Ganador: ${ganadorColor}`);
            }
        } catch (error) {
            console.error("Error al verificar el resultado final de la partida:", error);
        }
    }, []);

    // LÓGICA DE LEGALIDAD
    const esMovimientoValidoLocal = useCallback((moveUCI, currentFen) => {
        try {
            const tempGame = new Chess(currentFen);
            const moveResult = tempGame.move(moveUCI, { sloppy: true }); 
                
            if (!moveResult) {
                console.warn(`[Validación] Movimiento ilegal detectado: ${moveUCI}`);
                return false;
            }
    
            return true;
    
        } catch (error) {
            console.error("Error al validar el movimiento:", error);
            return false;
        }
    }, []);

    const iniciarGameStream = useCallback(async (gameId) => {
            
            try {
                //LLAMAR A API LICHESS InitialStreamGame
                const response = await fetchInitialStream(gameId);
    
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
    
                // Usamos el lector de stream para procesar los datos línea por línea
                const reader = response.body
                    .pipeThrough(new TextDecoderStream())
                    .getReader();
                
                // Función auxiliar para leer el stream línea por línea
                const readStream = async () => {
                    let buffer = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            console.log("Stream de partida finalizado.");
                            verificarResultadoFinal(gameId);
                            break;
                        }
                        
                        // Procesar el stream línea por línea
                        buffer += value;
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || "";
    
                        for (const line of lines) {
                            if (line.trim()) {
                                try {
                                    const event = JSON.parse(line);
                                    procesarEvento(event);
                                } catch (e) {
                                    console.error("Error al parsear JSON del stream:", e, line);
                                }
                            }
                        }
                    }
                };
    
                readStream();
    
            } catch (error) {
                console.error("Fallo al conectar al stream de la partida:", error);
            }
    }, [verificarResultadoFinal]);

    // FUNCIÓN DE ACCIÓN CENTRAL
    const handleMove = useCallback(async (moveUCI) => {
        
        const gameId = gameIdRef.current;
        if (!gameId) {
            console.error('Error: La partida no ha sido iniciada o no se encontró la ID de Lichess.');
            return;
        }
        console.log(`Jugada del usuario recibida: ${moveUCI}`);

        if(!esMovimientoValidoLocal(moveUCI, fen)){
            console.warn(`Movimiento ilegal: ${moveUCI}`);
            return;
        }
        
        const tempGame = new Chess(fen);
        tempGame.move(moveUCI, { sloppy: true }); 
        const newFen = tempGame.fen();
            
        try {
            const response = await fetchSendMove(gameState.gameId, moveUCI);

            if (response.ok) {
                console.log(`Movimiento ${moveUCI} enviado exitosamente a Lichess.`);
                
                // 2. Actualizar el FEN y el estado
                setFen(newFen);
            } else {
                // Manejar errores de Lichess (ej: movimiento ilegal, token expirado)
                const errorData = await response.json();
                console.error('Error al enviar el movimiento a Lichess:', errorData.error || response.statusText);
            }
        } catch (error) {
            console.error('Error de red al comunicarse con Lichess:', error);
        }

    }, [fen, gameState.gameId, fetchSendMove, iniciarGameStream]);

    //Llama a la API para crear la partida (StartGame) y luego llama a iniciarGameStream.
    const iniciarPartidaContraBot = useCallback(async (nivel, jugadorColor) => {
            setIsGameActive(true);
            try {
                const response = await fetchStartGame(nivel, jugadorColor);
                const data = await response.json();
    
                if (response.ok && data.id) {
                    console.log(`Partida [${data.id}] iniciada. ¡Listo para el stream!`);
                    setGameState(prevState => ({
                        ...prevState,
                        gameId: data.id,
                        partidaTerminada: false, 
                        ganador: null,
                    }));
                    
                    // **PASO 2: INICIAR EL GAME STREAM**
                    iniciarGameStream(data.id);
                    
                } else {
                    console.error("Error al crear la partida:", data);
                    setIsGameActive(false);
                }
            } catch (error) {
                console.error("Fallo de conexión:", error);
                setIsGameActive(false);
            }
    }, [fetchStartGame, iniciarGameStream ]);



    //Elige una jugada de la lista de Stockfish (topMovesRef) y la ejecuta a través de handleMove.
    const handleTimeout = useCallback(async (topMovesRef) => {

        if (gameState.turno === jugadorColor && !gameState.partidaTerminada) {
            const currentGameId = gameIdRef.current; 
        
            if (!currentGameId) {
                console.error('Error: No se puede enviar la jugada por timeout. gameId es NULL.');
                return;
            }

            //const movesToChoose = topMovesRef.current.filter(m => m.multipv <= 5);
            const movesToChoose = topMovesRef.current;
            
            if (movesToChoose.length === 0) {
                console.warn("No se encontraron movimientos MultiPV para el timeout. No se envía jugada.");
                return; 
            }
            let validMoveFound = false;
            const maxAttempts = movesToChoose.length * 2;

            const randomIndex = Math.floor(Math.random() * movesToChoose.length);
            const moveUCI = movesToChoose[randomIndex].move;

            console.warn(`[TIMEOUT] Jugada automática elegida: ${moveUCI}`);

            if(esMovimientoValidoLocal(moveUCI, fen)){
                await handleMove(moveUCI);
            }else{
                console.warn('--invalido--',moveUCI)
            }
        }
        
    }, [gameState.turno, gameState.partidaTerminada, jugadorColor, handleMove, fen]);

    return {
        fen,
        gameState,
        isGameActive,
        esMovimientoValidoLocal,
        handleMove,
        handleTimeout,
        iniciarPartidaContraBot,
    };
};