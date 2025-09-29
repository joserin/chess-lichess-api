import React, { useState } from 'react';

/**
 * Componente que muestra el historial de movimientos y un campo de entrada para la jugada.
 *
 * @param {object} props
 * @param {string[]} props.historial Un array de movimientos en notación PGN (ej: ["1. e4 e5", "2. Nf3 Nc6"]).
 * @param {string} props.turno El color del jugador al que le toca mover ("Blanco" o "Negro").
 * @param {function} props.onMove Función que se llama en el componente padre con el movimiento (en formato UCI o PGN).
 * @param {boolean} props.partidaTerminada Indica si el juego ha finalizado.
 */
const MatchViewer = ({ historial = [], turno, onMove, partidaTerminada = false }) => {
  // Estado local para almacenar el valor del input del movimiento
  const [inputValue, setInputValue] = useState('');

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const movimiento = inputValue.trim();

    if (movimiento && onMove && !partidaTerminada) {
      // Notificar al componente padre el movimiento ingresado.
      // El padre se encargará de la validación y de enviar a la API de Lichess.
      onMove(movimiento); 
      setInputValue(''); // Limpiar el input después de enviar
    }
  };

  // Función para renderizar el historial en un formato de lista
  const renderHistorial = () => {
    // El historial se asume que viene en formato de jugadas PGN completas (ej: "e4", "e5", "Nf3", "Nc6")
    // Se agrupan los movimientos de blancas y negras para mostrarlos en formato PGN (1. e4 e5)
    
    // Si el historial viene plano (ej: ["e4", "e5", "Nf3"]), lo agrupamos
    const movimientosAgrupados = [];
    for (let i = 0; i < historial.length; i += 2) {
      const numMovimiento = Math.floor(i / 2) + 1;
      const movimientoBlanco = historial[i];
      const movimientoNegro = historial[i + 1] || '...';
      movimientosAgrupados.push(
        <p key={numMovimiento} style={moveItemStyle}>
          <span style={moveNumStyle}>{numMovimiento}.</span> 
          <span style={moveStyle(turno === 'Blanco' && i === historial.length - 1)}>{movimientoBlanco}</span>
          {movimientoNegro !== '...' && 
            <span style={moveStyle(turno === 'Negro' && i + 1 === historial.length - 1)}>{movimientoNegro}</span>
          }
        </p>
      );
    }
    return movimientosAgrupados;
  };
  
  const placeholderText = partidaTerminada ? 
    'Partida terminada' : 
    (turno === 'Blanco' ? 'Ej: e4, e2e4' : 'Ej: e5, e7e5');

  return (
    <div style={containerStyle}>
      <h2>Historial de Movimientos</h2>

      {/* Área del Historial */}
      <div style={historyBoxStyle}>
        {historial.length === 0 ? (
          <p style={{ color: '#888' }}>La partida aún no ha comenzado...</p>
        ) : (
          <div style={movesListStyle}>
            {renderHistorial()}
          </div>
        )}
      </div>

      {/* Formulario de Entrada de Movimiento */}
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholderText}
          disabled={!partidaTerminada && (turno === 'Negro' && !historial.length % 2 === 0)}
          style={inputStyle}
        />
        <button type="submit" disabled={partidaTerminada || turno === 'Negro'} style={buttonStyle(turno === 'Blanco' && !partidaTerminada)}>
          {turno === 'Blanco' && !partidaTerminada ? 'Hacer Jugada' : 'Esperando...'}
        </button>
        
        {partidaTerminada && <p style={finalMessageStyle}>Fin de la Partida.</p>}
      </form>
    </div>
  );
};

export default MatchViewer;

// --- ESTILOS EN LÍNEA ---

const containerStyle = {
  width: '250px',
  padding: '15px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const historyBoxStyle = {
  flexGrow: 1,
  height: '350px',
  maxHeight: '350px',
  overflowY: 'auto', // Permite scroll si hay muchos movimientos
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '10px',
  marginBottom: '15px',
};

const movesListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '5px',
};

const moveItemStyle = {
  margin: '0 5px 0 0',
  padding: '2px 0',
  fontSize: '14px',
  minWidth: '100px', // Asegura que cada par de movimientos ocupe un espacio decente
};

const moveNumStyle = {
  fontWeight: 'bold',
  color: '#333',
  marginRight: '3px',
};

const moveStyle = (isLast) => ({
    // Destacar el último movimiento si es necesario
    fontWeight: isLast ? 'bold' : 'normal',
    backgroundColor: isLast ? '#ccf' : 'transparent',
    borderRadius: '3px',
    padding: isLast ? '1px 3px' : '0',
});

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle = {
  padding: '10px',
  fontSize: '16px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  textAlign: 'center',
};

const buttonStyle = (isEnabled) => ({
  padding: '10px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#fff',
  backgroundColor: isEnabled ? '#007bff' : '#6c757d',
  border: 'none',
  borderRadius: '4px',
  cursor: isEnabled ? 'pointer' : 'default',
  transition: 'background-color 0.3s',
});

const finalMessageStyle = {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0',
};