// src/components/ChessApp.jsx (El Estado Central/Padre)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useStockfishAnalysis } from '../hooks/useStockfishAnalysis';
import MatchViewer from './MatchViewer';
import Chessboard from './Chessboard';
import GameInformation from './GameInformation';
import PlayInfoPanel from './PlayInfoPanel';
import MoveHelpBar from './MoveHelpBar';

export default function ChessApp({level , color }) {

    const [jugadorColor, setJugadorColor] = useState(color);
    //TURNO DEL JUGADOR
    const TIEMPO_MAXIMO_TURNO = 60;
    const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_MAXIMO_TURNO);
    const intervalRef = useRef(null);
    const votesRef = useRef([]);
    const [proposedMoves, setProposedMoves] = useState([]); // 💡 NUEVO ESTADO: Almacena los movimientos propuestos (votos)
    //SIGUIENTE PARTIDA
    const TIEMPO_ESPERA_REINICIO = 180; 
    const [tiempoRestanteReinicio, setTiempoRestanteReinicio] = useState(TIEMPO_ESPERA_REINICIO);
    const [botLevel, setBotLevel] = useState(level);
    const intervalReinicioRef = useRef(null);
    const nivelAjustadoRef = useRef(false);
    const [shouldStartChat, setShouldStartChat] = useState(false);

    const [userScores, setUserScores] = useState({});
    const userVotesMapRef = useRef(new Map());
    
    // 1. OBTENER LÓGICA DEL JUEGO
    const { 
        fen,
        gameState,
        isGameActive,
        esMovimientoValidoLocal,
        handleMove,
        handleTimeout,
        iniciarPartidaContraBot,
     } = useChessGame(jugadorColor);

    // 2. OBTENER LÓGICA DE ANÁLISIS
    const { topMovesRef } = useStockfishAnalysis(
        fen,
        gameState,
        isGameActive,
        jugadorColor,
        botLevel,
    );

    // --------------------------
    // Wrapper para setProposedMoves
    // --------------------------
    const updateProposedMoves = useCallback((newMoves) => {
        setProposedMoves(newMoves);
        votesRef.current = newMoves;
    }, []);

    useEffect(() => {
        votesRef.current = proposedMoves;
    }, [proposedMoves]);

    //----------------------------------------------------------------------
    //FUNCION PARA CAMBIAR COLOR Y REINICIAR JUEGO
    //----------------------------------------------------------------------

    const iniciarProximaPartida = useCallback(() => {

        const { partidaTerminada, ganador } = gameState;

        clearInterval(intervalReinicioRef.current);

        const nextColor = (jugadorColor === 'white' ? 'black' : 'white');
        const resultadoPartida = (ganador === jugadorColor) ? 'jugador' : ganador !== 'draw' ? 'bot' : 'empate';

        const resultado = ( () =>{
            const MIN_LEVEL = 1;
            const MAX_LEVEL = 8;
            let newLevel;

            if (resultadoPartida === 'jugador') {
                newLevel = Math.min(botLevel + 1, MAX_LEVEL);
            } else if (resultadoPartida === 'bot') {
                newLevel = Math.max(botLevel - 1, MIN_LEVEL);
            } else {
                newLevel = botLevel;
            }
            return newLevel;
        })();

        iniciarPartidaContraBot(resultado, nextColor);
        setJugadorColor(nextColor);
        setBotLevel(resultado);
        setTiempoRestanteReinicio(TIEMPO_ESPERA_REINICIO);

        nivelAjustadoRef.current = false;

    }, [iniciarPartidaContraBot, jugadorColor, botLevel, gameState.ganador, /*ajustarNivel*/]);

    // 💡 FUNCIÓN 1: Para el inicio de la PRIMERA partida (color: 'white')
    const iniciarPrimeraPartida = useCallback(() => {
        iniciarPartidaContraBot(1, jugadorColor); 
    }, [iniciarPartidaContraBot, jugadorColor, botLevel]);

    // ---------------------------------------------------------------------
    // FUNCIÓN CENTRAL DE PUNTUACIÓN (awardScores)
    // ---------------------------------------------------------------------
    const awardScores = useCallback((winningMove) => {
        // Puntos base según la posición en el análisis de Stockfish
        const scoreMap = {
            0: 5,
            1: 3,
            2: 1,
        };

        // Obtenemos los 3 mejores movimientos UCI de Stockfish
        const stockfishMoves = topMovesRef.current.slice(0, 3).map(move => move.move);
        
        // Buscamos si el movimiento ganador está en el Top 3 y obtenemos el índice
        const winningRank = stockfishMoves.indexOf(winningMove);
        const points = scoreMap[winningRank] || 0; // 0 puntos si no está en el Top 3

        if (points === 0) {
            console.log(`Movimiento ganador (${winningMove}) no está entre el Top 3 de Stockfish. Puntos: 0.`);
            return; 
        }

        const votesMap = userVotesMapRef.current; // Mapa de Autor -> Voto

        setUserScores(prevScores => {
            const newScores = { ...prevScores };
            
            votesMap.forEach((move, author) => {
                //const authorName = author.name;
                // Si el voto del usuario coincide con el movimiento ganador
                if (move === winningMove) {
                    newScores[author] = (newScores[author] || 0) + points;
                }
            });
            
            return newScores;
        });

    }, [topMovesRef]);

    // ---------------------------------------------------------------------
    //  LÓGICA DEL EFECTO (El Reloj) TURNO JUGADOR
    // ---------------------------------------------------------------------

    useEffect(() => {
        clearInterval(intervalRef.current);
        if (!isGameActive || gameState.partidaTerminada) {
            setShouldStartChat(false);
            return; 
        }
        const esMiTurno = gameState.turno === jugadorColor;

        // 2. INICIAR/REINICIAR: Si es el turno del usuario, reiniciamos el tiempo
        if (esMiTurno) {
            setTiempoRestante(TIEMPO_MAXIMO_TURNO);
            setShouldStartChat(true);

            intervalRef.current = setInterval(() => {
                setTiempoRestante((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(intervalRef.current);
                    setShouldStartChat(false);

                    const currentVotes = votesRef.current;
                    let legalMoveFound = false;
                    let winningMove = null;

                    //EJECUTAR MOVIMIENTO POR TIEMPO ACABADO
                    if(currentVotes.length > 0){
                        
                        for (const vote of currentVotes) {
                            if (esMovimientoValidoLocal(vote.move, fen)) {
                                winningMove = vote.move;
                                handleMove(winningMove);
                                legalMoveFound = true;
                                break;
                            }
                        }
                        if (!legalMoveFound) {
                            winningMove = topMovesRef.current[0]?.move || null;
                            handleTimeout(topMovesRef);
                        }
                        updateProposedMoves([]);

                        // 🚨 OTORGAR PUNTOS 🚨
                        if (winningMove) {
                            awardScores(winningMove);
                        }

                    }else{
                        winningMove = topMovesRef.current[0]?.move || null;
                        handleTimeout(topMovesRef);
                    }

                    
                    
                    setProposedMoves([]);
                    return 0;
                }
                return prevTime - 1;
                });
            }, 1000);
        } else {
            setTiempoRestante(TIEMPO_MAXIMO_TURNO);
            setProposedMoves([]);
            setShouldStartChat(false);
            userVotesMapRef.current.clear();
        }
        return () => clearInterval(intervalRef.current);
        
    }, [gameState.turno, jugadorColor, gameState.partidaTerminada, handleTimeout, topMovesRef, awardScores]);

    // ---------------------------------------------------------------------
    //  LÓGICA DEL EFECTO (El Reloj) PROXIMA PARTIDA
    // ---------------------------------------------------------------------
    useEffect(() => {
        clearInterval(intervalReinicioRef.current);
        
        const { partidaTerminada } = gameState;

        if (partidaTerminada) {

            setTiempoRestanteReinicio(TIEMPO_ESPERA_REINICIO); 

            intervalReinicioRef.current = setInterval(() => {
                setTiempoRestanteReinicio((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(intervalReinicioRef.current);
                        console.log('nivel bot',botLevel)
                        iniciarProximaPartida();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            
        } 
        return () => clearInterval(intervalReinicioRef.current);
        
    }, [gameState.partidaTerminada, iniciarProximaPartida, jugadorColor]);

    return (
        <div style={ appContainerStyle }>
            {/* IZQUIERDA: Votos, unicio del juego, top votos */}
            <section>
                <PlayInfoPanel
                    fen={fen}
                    isGameActive={isGameActive}
                    proposedMoves={proposedMoves}
                    shouldStartChat={shouldStartChat}
                    partidaTerminada={gameState.partidaTerminada}
                    tiempoRestanteReinicio={tiempoRestanteReinicio}
                    iniciarPartidaContraBot={iniciarPrimeraPartida}
                    esMovimientoValidoLocal={esMovimientoValidoLocal}
                    setProposedMoves={setProposedMoves}
                    userVotesMapRef={userVotesMapRef}
                    userScores={userScores}
                    gamesId={gameState.gameId}
                />                
            </section>
             {/* CENTRO: Pasa la posición actual del tablero y la función para mover }*/}
            <section>
               
                {isGameActive && (
                    <Chessboard
                        fen={fen} 
                        onMove={handleMove}
                        orientation="white"
                    />
                )}
                
                {!isGameActive && (
                    <div style={initialMessageStyle}>
                        <h2>Pulsa "Iniciar Partida" para comenzar a jugar.</h2>
                    </div>
                )}
            </section>

            {/* DERECHA: Pasa el turno y el tiempo */}
            <section className="flex flex-col gap-2 text-center">
                <GameInformation
                    botLevel={botLevel}
                    tiempoRestante={tiempoRestante}
                    jugadorColor={jugadorColor}
                />
                {/*Pasa el historial y la función para mover */}
                <MatchViewer 
                    historial={gameState.historial} 
                    turno={gameState.turno} 
                    onMove={handleMove}
                    partidaTerminada={gameState.partidaTerminada}
                />
            </section>

            {/* ABAJO: Informacion Basica */}
            <section style={containerInformationStyle}>
                <MoveHelpBar />
            </section>
        </div>
    );
}

const appContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: '10px',
    padding: '10px',
    maxWidth: '100%',
    alignItems: 'flex-start',
};

const initialMessageStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'min(90vw, 600px)',
    height: 'min(90vw, 600px)',
    margin: 'auto',
    backgroundColor: 'rgb(55 65 81)',
    borderRadius: '8px',
    textAlign: 'center',
    color: 'white',
};

const containerInformationStyle = {
    gridColumn: '1 / 4',
    width: '100%',
}