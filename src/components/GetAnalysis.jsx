import { useYoutubeLiveChat } from '../hooks/useYoutubeLiveChat';
import { useConfigLoader } from '../hooks/useConfigLoader';
import React, { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Componente que muestra el historial de movimientos y un campo de entrada para la jugada.
 *
 * @param {object} props
 * @param {function} props.handleMove
 * @param {boolean} props.partidaTerminada Indica si el juego ha finalizado.
 * @param {boolean} props.isGameActive Indica si el juego ha iniciado.
 * @param {boolean} props.isAnalyzing Indica si el juego ha iniciado.
 */

const formatTime = (totalSeconds) => {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const GetAnalysis = ({ 
    partidaTerminada, 
    iniciarPartidaContraBot, 
    isGameActive,
    tiempoRestanteReinicio,
    shouldStartChat,
    handleNewChatMessage,
    proposedMoves,
    gamesId
    }) => {

    // 1. OBTENER CONFIGURACION CLAVES
    const { config, isLoading } = useConfigLoader();

    // 3. OBTENER LÓGICA DEL CHAT
    const { isChatActive } = useYoutubeLiveChat(
        shouldStartChat, // 👈 1er parámetro: Bandera para iniciar/detener
        handleNewChatMessage, // 👈 2do parámetro: Callback para procesar mensajes
        config?.youtubeApiKey || null, 
        config?.liveVideoId || null,
        gamesId || null
    );


    const nextMatchTimeDisplay = formatTime(tiempoRestanteReinicio);
  
    return (
        <div className='w-full flex flex-col gap-2'>
            <section>
                {!isGameActive ? (
                    // Opción 1: Juego no iniciado -> Mostrar botón de inicio
                    <button style={buttonStyle} onClick={iniciarPartidaContraBot}>
                        Iniciar Partida
                    </button>
                ) : partidaTerminada ? (
                    // Opción 2: Juego terminado -> Mostrar contador
                    <button style={buttonStyle}>Próxima partida en {nextMatchTimeDisplay}</button>
                ) : (
                    // Opción 3: Juego en curso
                    <button style={buttonStyle}>En Juego</button>
                )}
            </section>
            <section className='w-full flex flex-col gap-3'>
                <h3 className='text-center font-bold'>
                    Top Movimientos Votos: {proposedMoves.reduce((sum, item) => sum + item.votes, 0)}
                </h3>
                <div style={topMovesStyle}>

                    {proposedMoves.slice(0, 5).map((item, index) => (
                        <div 
                            key={item.move}
                            className={`p-1 rounded-lg ${index === 0 ? 'bg-yellow-600 font-bold' : 'bg-gray-700'}`}
                        >
                            {/* M:e2e4 | Votos: 5 */}
                            M: {item.move.toUpperCase()} | Votos: {item.votes}
                        </div>
                    ))}

                    {proposedMoves.length === 0 && (
                        <p className="text-center text-gray-400">
                            Aún no hay movimientos propuestos.
                        </p>
                    )}
                </div>
                
            </section>
        </div>
    );
};

export default GetAnalysis;

// --- ESTILOS EN LÍNEA ---
const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: 'rgb(75 85 99)',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  width: '100%',
};

const topMovesStyle = {
    width: '100%',
    height: '180px',
    display: 'flex',
    flexDirection: 'column',
    padding: '5px',
    backgroundColor: 'rgb(55 65 81)',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}

