import React, { useState, useRef, useEffect } from 'react';

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
  const historyBoxRef = useRef(null);

  useEffect(() => {
        const historyBox = historyBoxRef.current;
        if (historyBox) {
            historyBox.scrollTop = historyBox.scrollHeight;
        }
    }, [historial]);

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
    const movimientosAgrupados = [];
    for (let i = 0; i < historial.length; i += 2) {
      const numMovimiento = Math.floor(i / 2) + 1;
      const movimientoBlanco = historial[i];
      const movimientoNegro = historial[i + 1] || '...';
      movimientosAgrupados.push(
        <p key={numMovimiento} style={moveItemStyle}>
          <span style={moveNumStyle}>{numMovimiento}.</span> 
          <span style={moveStyle(turno === 'Blanco' && i === historial.length - 1)}>{movimientoBlanco}</span>
          <span>  </span>
          {movimientoNegro !== '...' && 
            <span style={moveStyle(turno === 'Negro' && i + 1 === historial.length - 1)}>{movimientoNegro}</span>
          }
        </p>
      );
    }
    return movimientosAgrupados;
  };
  
  return (
    <div style={containerStyle}>
      <h2>Historial de Movimientos</h2>

      {/* Área del Historial */}
      <div style={historyBoxStyle} ref={historyBoxRef}>
        {historial.length === 0 ? (
          <p style={{ color: '#888' }}>La partida aún no ha comenzado...</p>
        ) : partidaTerminada ? (
          <p style={finalMessageStyle}>Fin de la Partida.</p>
        ) : (
          <div style={movesListStyle}>
            {renderHistorial()}
          </div>
        )}
      </div>

      
    </div>
  );
};

export default MatchViewer;

// --- ESTILOS EN LÍNEA ---

const containerStyle = {
  width: '100%',
  padding: '5px',
  backgroundColor: 'rgb(31 41 55)',
  border: '1px solid #ccc',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const historyBoxStyle = {
  flexGrow: 1,
  height: '340px',
  maxHeight: '350px',
  overflowY: 'auto',
  backgroundColor: 'rgb(55 65 81)',
  borderRadius: '4px',
  padding: '3px',
};

const movesListStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  alignItems: 'center',
  justifyItems: 'start',
  gap: '5px',
};

const moveItemStyle = {
  margin: '0 1px 0 0',
  padding: '2px 0',
  fontSize: '14px',
  minWidth: '72px',
};

const moveNumStyle = {
  fontWeight: 'bold',
  color: 'white',
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