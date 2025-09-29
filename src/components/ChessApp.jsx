// src/components/ChessApp.jsx (El Estado Central/Padre)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import MatchViewer from './MatchViewer';
import Chessboard from './Chessboard';
import GameInformation from './GameInformation';
import { Chess } from 'chess.js';
//import { mockSendMove, mockGetBotResponse, mockStartGame } from '../utils/api-mock'; 
import { SendMove, InitialStreamGame, StartGame } from '../utils/api-lichess';

export default function ChessApp() {
    // 💡 Aquí se centraliza el estado de la partida
    const inicialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const [fen, setFen] = useState(inicialFen);
    const [gameState, setGameState] = useState({
        gameId: null,
        turno: 'white',
        historial: [],
        partidaTerminada: false,
    });
    const jugadorColor = 'white';
    const chess = useRef(new Chess());

    //----------------------------------API LICHESS--------------------------------
    const fetchSendMove = SendMove;
    const fetchInitialStream = InitialStreamGame; 
    const fetchStartGame  = StartGame ; 
    
    
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
                        break;
                    }
                    
                    // Procesar el stream línea por línea
                    buffer += value;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ""; // La última parte incompleta se guarda en buffer

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const event = JSON.parse(line);
                                console.log("Nuevo evento recibido:", event);
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
    }, []);

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
                console.log(fenState)
                // 2. ACTUALIZAR ESTADO DEL JUEGO
                setGameState(prevState => ({
                    ...prevState,
                    historial: event.state.moves ? event.state.moves.split(' ') : [],
                    turno: currentFen.split(' ')[1] === 'w' ? 'white' : 'black',
                    partidaTerminada: event.state.status !== 'started',
                }));
                break;

            case 'gameState':
                
                console.log("Nuevo estado de juego:", event);

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

    const iniciarPartidaContraBot = useCallback(async () => {

        try {
            const response = await fetchStartGame(1, jugadorColor);
            const data = await response.json();

            if (response.ok && data.id) {
                console.log(`Partida [${data.id}] iniciada. ¡Listo para el stream!`);
                setGameState(prevState => ({
                    ...prevState,
                    gameId: data.id,
                }));
                
                // **PASO 2: INICIAR EL GAME STREAM**
                iniciarGameStream(data.id);
                
            } else {
                console.error("Error al crear la partida:", data);
            }
        } catch (error) {
            console.error("Fallo de conexión:", error);
        }


    }, [jugadorColor, fetchStartGame, iniciarGameStream ]);

    useEffect(() => {
        // Llamar a la función al montar el componente (una sola vez)
        iniciarPartidaContraBot();
    }, [iniciarPartidaContraBot]);

    const handleMove = useCallback(async (moveUCI) => {
        
        const gameId = gameState.gameId;
        if (!gameId) {
            console.error('Error: La partida no ha sido iniciada o no se encontró la ID de Lichess.');
            return;
        }
        console.log(`Jugada del usuario recibida: ${moveUCI}`);
        
        // 1. Validar el movimiento (usando chess.js)

        let newFen = fen;
        let moveResult = null;
        try {
            // 💡 PASO 1: VALIDAR Y APLICAR EL MOVIMIENTO LOCALMENTE
            const tempGame = new Chess(fen);
            // El movimiento se intenta y, si es legal, actualiza tempGame.
            moveResult = tempGame.move(moveUCI, { sloppy: true }); 
            
            if (!moveResult) {
                console.warn(`Movimiento ilegal: ${moveUCI}`);
                return;
            }
            
            newFen = tempGame.fen();

        } catch (error) {
            console.error("Error al validar el movimiento localmente:", error);
            return; 
        }
        
        try {
            const response = await fetchSendMove(gameState.gameId, moveUCI);

            console.log('respuesta de movimiento -- ', response)
            const tempGame = new Chess(fen);
            moveResult = tempGame.move(moveUCI, { sloppy: true });

            if (response.ok) {
                console.log(`Movimiento ${moveUCI} enviado exitosamente a Lichess.`);
                
                // 2. Actualizar el FEN y el estado
                setFen(newFen);
                setGameState(prevState => ({
                    ...prevState,
                    historial: [...prevState.historial, moveUCI],
                    turno: (prevState.turno === "white" ? "black" : "white"),
                }));
                /*
                if (gameState.gameId) {
                    //actualizar el estado cuando el bot responde.
                    //getBotMove(gameState.gameId, moveUCI);
                    console.log(gameState.gameId)
                }*/
            } else {
                // Manejar errores de Lichess (ej: movimiento ilegal, token expirado)
                const errorData = await response.json();
                console.error('Error al enviar el movimiento a Lichess:', errorData.error || response.statusText);
            }
        } catch (error) {
            console.error('Error de red al comunicarse con Lichess:', error);
        }

    }, [fen, gameState.gameId, fetchSendMove, iniciarGameStream, /*fetchGetBotResponse*/]);

    const handleTimeout = (() => {

        if (gameState.partidaTerminada) return;
        console.log("¡Tiempo agotado! Realizando movimiento ");

        // 1. Lógica para obtener un movimiento aleatorio

        //2. Actualizar el estado y pasar el turno al Bot
        setFen(newFenAfterForcedMove);

        // 3. Actualizar el estado y pasar el turno al Bot
        setGameState(prevState => ({
            ...prevState,
            turno: (prevState.turno === "white" ? "black" : "white"),
            historial: [...prevState.historial, movimientoForzado],
        }));

    }, [gameState]);

    return (
        <div style={ appContainerStyle }>
            {/* IZQUIERDA: Pasa el historial y la función para mover */}
            <MatchViewer 
                historial={gameState.historial} 
                turno={gameState.turno} 
                onMove={handleMove} // Recibe la jugada del usuario (UCI/PGN)
                partidaTerminada={gameState.partidaTerminada}
            />

            {/* CENTRO: Pasa la posición actual del tablero y la función para mover }*/}
            <Chessboard
                fen={fen} 
                onMove={handleMove}
                orientation="white" // o "black"
            />

            {/* DERECHA: Pasa el turno y el tiempo */}
            <GameInformation 
                turno={gameState.turno}
                jugadorColor={jugadorColor}
                onTimeout={handleTimeout}
            />
        </div>
    );
}

const appContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '20px auto',
    alignItems: 'flex-start', // Alinea los elementos en la parte superior
};