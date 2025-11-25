import React, { useState, useEffect, useRef } from 'react';

/**
 * Función auxiliar para formatear segundos a MM:SS
 * @param {number} totalSeconds El tiempo total en segundos.
 * @returns {string} El tiempo formateado (ej: "00:30").
 */
const formatTime = (totalSeconds) => {
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Componente que muestra el reloj y gestiona el tiempo de turno del jugador.
 * @param {object} props
 * @param {string} props.jugadorColor El color que está usando el usuario ("Blanco" o "Negro").
 * @param {function} props.onTimeout Función que se llama cuando el tiempo llega a cero.
 */
const GameInformation = ({ tiempoRestante, jugadorColor, botLevel}) => {
  

  // ---------------------------------------------------------------------
  // 💡 RENDERING
  // ---------------------------------------------------------------------

  return (
    <div style={containerStyle}>
      <h2>
        Información de Partida
        Nivel: {botLevel}
      </h2>
      <hr style={separatorStyle} />
      
      <section style={cardStyle}>
        <span>Lado:</span>
        <p style={timerStyle}>{(jugadorColor === "white" ? "Blancas" : "Negras")}</p>
      </section>

      <section style={cardStyle}>
        <span>Tiempo:</span>
        <div style={timerStyle}>
          {formatTime(tiempoRestante)}
        </div>
      </section>
      <section>
        
      </section>
    </div>
  );
};

export default GameInformation;

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
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const cardStyle = {
  backgroundColor: 'rgb(75 85 99)',
  padding: '8px',
  width: '100%',
  borderRadius: '6px',
  marginBottom: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const playerInfoStyle = (isTurn) => ({
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  backgroundColor: isTurn ? '#e0ffe0' : '#fff',
  border: isTurn ? '2px solid #008000' : '1px solid #ddd',
  borderRadius: '6px',
  textAlign: 'center',
});

const labelStyle = {
  marginBottom: '5px',
  fontSize: '14px',
  color: '#555',
};

const timerStyle = {
  fontSize: '25px',
  fontWeight: '400',
  color: '#ffffff',
  backgroundColor: 'rgb(31 41 55)',
  width: '100px',
  textAlign: 'center',
  borderRadius: '10px',
};

const separatorStyle = {
  width: '80%',
  margin: '10px 0',
  border: '0',
  borderTop: '1px solid #aaa',
};