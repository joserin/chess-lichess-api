import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Componente que muestra el historial de movimientos y un campo de entrada para la jugada.
 *
 * @param {object} props
 * @param {boolean} props.partidaTerminada Indica si el juego ha finalizado.
 * @param {boolean} props.isGameActive Indica si el juego ha iniciado.
 */

const GetMovements = ({
    partidaTerminada,
    isGameActive,
    userScores,
}) =>{

    // Convertir el objeto de scores en un array y ordenarlo
    const sortedScores = Object.entries(userScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Ordenar de mayor a menor score
        .slice(0, 5); // Mostrar solo el Top 5
    
    return(
        <div className='flex flex-col gap-2'>
            <header>Top Usuarios</header>
            <section style={box}>
                <div style={topMovesStyle}>
                    {sortedScores.length > 0 ? (
                        sortedScores.map(([name, score], index) => (
                            <div 
                                key={name}
                                className={`p-1 rounded-lg flex justify-between items-center ${index === 0 ? 'bg-yellow-600 text-black font-bold' : 'bg-gray-700'}`}
                            >
                                <span className='truncate'>{name}</span>
                                <span>{score} pts</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400">Aún no hay usuarios con votos.</p>
                    )}
                </div>
            </section>
            <section>
                <div style={box}>
                    <p className='text-sm'>Envía tus movimientos (ej: m-e2e4) al chat de YouTube para votar.</p>
                </div>
            </section>
        </div>
    )
}

export default GetMovements;

// --- ESTILOS EN LÍNEA ---
const box = {
  width: '100%',
  backgroundColor: 'rgb(31 41 55)',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const topMovesStyle = {
    width: '100%',
    padding: '5px',
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgb(55 65 81)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}

