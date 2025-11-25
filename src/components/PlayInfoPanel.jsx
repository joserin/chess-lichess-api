import React, { useState, useEffect, useRef, useCallback } from 'react';
import GetMovements from './GetMovements';
import GetAnalysis from './GetAnalysis';

/**
 * Componente que muestra el historial de movimientos y un campo de entrada para la jugada.
 *
 * @param {object} props
 * @param {boolean} props.partidaTerminada Indica si el juego ha finalizado.
 * @param {boolean} props.isGameActive Indica si el juego ha iniciado.
 * @param {boolean} props.shouldStartChat Indica si el chat ha iniciado.
 */

const PlayInfoPanel = ({ 
    partidaTerminada, iniciarPartidaContraBot, isGameActive, 
    esMovimientoValidoLocal,
    tiempoRestanteReinicio,
    shouldStartChat,
    proposedMoves, 
    setProposedMoves,
    userVotesMapRef,
    userScores,
    fen,
    }) => {

    //const userVotesRef = useRef(new Map());

    // 💡 FUNCIÓN PARA AGREGAR VOTOS
    const verificarMove = useCallback ((moveUCI, currentFen) => {
        if (moveUCI.length < 4 || moveUCI.length > 5) {
            console.error("Formato de movimiento UCI inválido. Use, por ejemplo, e2e4.");
            return false;
        }
        if (!esMovimientoValidoLocal(moveUCI, currentFen)) {
            console.warn(`Movimiento propuesto ilegal: ${moveUCI}`);
            return false;
        }
        console.log(`Voto valido: ${moveUCI}`);
        return true;

    }, [esMovimientoValidoLocal]);

    const updateUserVotes = useCallback((authorName, newMoveUCI) => {
    
        const previousMove = userVotesMapRef.current.get(authorName) || null;
        
        userVotesMapRef.current.set(authorName, newMoveUCI);
        return previousMove; 
    }, [userVotesMapRef]);

    //FUNCIÓN PARA CONTAR Y ORDENAR LOS VOTOS
    const updateAndSortVotes = (prevProposedMoves, moveDelta) => {

        // moveDelta es un objeto con la forma: { add: 'e2e4', subtract: 'd2d4' } o { add: 'e2e4', subtract: null }
        let updatedMoves = [...prevProposedMoves];

        // --- Lógica de Resta (si el usuario reemplazó su voto) ---
        if (moveDelta.subtract) {
            const subtractIndex = updatedMoves.findIndex(item => item.move === moveDelta.subtract);
            if (subtractIndex > -1) {
                updatedMoves[subtractIndex].votes -= 1;
                // Eliminar si los votos llegan a cero
                if (updatedMoves[subtractIndex].votes === 0) {
                    updatedMoves.splice(subtractIndex, 1);
                }
            }
        }

        // --- Lógica de Suma (el nuevo voto) ---
        const addIndex = updatedMoves.findIndex(item => item.move === moveDelta.add);
        
        if (addIndex > -1) {
            // El movimiento ya existe, solo suma
            updatedMoves[addIndex].votes += 1;
        } else {
            // Es un movimiento nuevo, añádelo
            updatedMoves.push({
                move: moveDelta.add,
                votes: 1,
            });
        }

        // Ordenar de mayor a menor
        updatedMoves.sort((a, b) => b.votes - a.votes);

        return updatedMoves;
    };

    // ---------------------------------------------------------------------
    // FUNCIÓN: Procesar un nuevo mensaje del chat
    // ---------------------------------------------------------------------
    const handleNewChatMessage = useCallback((simplifiedVote) => {
        if (!shouldStartChat){
            userVotesMapRef.current.clear();
            return;
        }
        console.log('simplifiedVote', simplifiedVote)
        const { move, author } = simplifiedVote;
        const authorName = author.name;
    
        // A. Verifica la validez del movimiento (Sigue siendo necesario el acceso al estado del juego)
        if (!verificarMove(move, fen)) { 
            return; 
        }
        // B. Actualiza el Map de votos del usuario y obtiene el voto anterior (si existe)
        const previousMove = updateUserVotes(authorName, move);
        
    
        // B. Lógica de voto duplicado (Gestión de estado central)
        setProposedMoves((prevProposedMoves) => {
            // Creamos el objeto delta para sumar y restar
            const moveDelta = {
                add: move,         // Siempre se suma el nuevo voto
                subtract: previousMove // Si es null, no se resta nada
            };

            return updateAndSortVotes(prevProposedMoves, moveDelta);

        });
                
    }, [shouldStartChat, verificarMove, updateUserVotes, fen, userVotesMapRef]);

    return (
        <div style={containerStyle}>
            <header>
                <h2>Control y Votos</h2>
            </header>
            <GetAnalysis
                partidaTerminada={partidaTerminada}
                iniciarPartidaContraBot={iniciarPartidaContraBot}
                isGameActive={isGameActive}
                proposedMoves={proposedMoves}
                tiempoRestanteReinicio={tiempoRestanteReinicio}
                shouldStartChat={shouldStartChat}
                handleNewChatMessage={handleNewChatMessage}
            />
            
            <GetMovements
                partidaTerminada={partidaTerminada}
                isGameActive={isGameActive}
                userScores={userScores}
            />
        </div>
    );
};

export default PlayInfoPanel;

// --- ESTILOS EN LÍNEA ---
const containerStyle = {
  width: '100%',
  padding: '15px',
  backgroundColor: 'rgb(31 41 55)',
  border: '1px solid #ccc',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};
