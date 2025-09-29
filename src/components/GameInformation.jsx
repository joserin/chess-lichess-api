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
 * @param {string} props.turno El color del jugador al que le toca mover ("Blanco" o "Negro").
 * @param {string} props.jugadorColor El color que está usando el usuario ("Blanco" o "Negro").
 * @param {function} props.onTimeout Función que se llama cuando el tiempo llega a cero.
 */
const GameInformation = ({ turno, jugadorColor, onTimeout }) => {
  
  const TIEMPO_MAXIMO_TURNO = 990; // tiempo de turno.
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_MAXIMO_TURNO);// Estado para el tiempo que se muestra en pantalla.
  const intervalRef = useRef(null);// Referencia para mantener el ID del intervalo del contador.
  const esMiTurno = turno === jugadorColor;// Variable booleana para saber si es el turno del usuario.
  
  // ---------------------------------------------------------------------
  // 💡 LÓGICA DEL EFECTO (El Reloj)
  // ---------------------------------------------------------------------

  useEffect(() => {
    // 1. LIMPIEZA: Siempre se limpia cualquier intervalo existente al inicio
    // y cuando el componente se desmonta o re-ejecuta.
    clearInterval(intervalRef.current);
    
    // 2. INICIAR/REINICIAR: Si es el turno del usuario, reiniciamos el tiempo
    // y comenzamos la cuenta regresiva.
    if (esMiTurno) {
      setTiempoRestante(TIEMPO_MAXIMO_TURNO);

      intervalRef.current = setInterval(() => {
        setTiempoRestante((prevTime) => {
          if (prevTime <= 1) {
            // Si el tiempo es 1 o menos, se ha acabado.
            clearInterval(intervalRef.current);
            // Notificar al componente padre que se acabó el tiempo.
            if (onTimeout) {
              onTimeout(); 
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000); // Se actualiza cada 1 segundo (1000ms)
      
    } else {
      // 3. DETENER: Si no es mi turno (es el del bot), el reloj se detiene
      // y se muestra un mensaje de espera (o simplemente el tiempo base).
      setTiempoRestante(TIEMPO_MAXIMO_TURNO); // Reinicia visualmente para el próximo turno
    }

    // 4. FUNCIÓN DE LIMPIEZA: Es crucial para evitar pérdidas de memoria.
    return () => clearInterval(intervalRef.current);
    
  }, [turno, jugadorColor, onTimeout]); // Dependencias: se re-ejecuta si el turno o jugadorColor cambian

  // ---------------------------------------------------------------------
  // 💡 RENDERING
  // ---------------------------------------------------------------------
  
  // Determinar el mensaje de estado
  let estadoMensaje = '';
  if (esMiTurno) {
    estadoMensaje = `¡Tu turno (${jugadorColor})! Te quedan:`;
  } else {
    estadoMensaje = `Turno del Bot. Esperando...`;
  }
  
  // Nota: La información del bot (rating, nombre) se asume que se recibe del Padre 
  // tras la llamada a la API de Lichess.

  return (
    <div style={containerStyle}>
      <h2>Información de Partida</h2>
      
      {/* Información del Bot */}
      <div style={playerInfoStyle(false)}>
        <p>👤 **Bot de Lichess**</p>
        <p>Turno: {(jugadorColor === "Blanco" ? "Negro" : "Blanco")}</p>
        <p style={{ visibility: esMiTurno ? 'hidden' : 'visible', fontWeight: 'bold' }}>
          ⏳ <span style={{ color: 'red' }}>PENSANDO...</span>
        </p>
      </div>

      <hr style={separatorStyle} />

      {/* Información y Reloj del Usuario */}
      <div style={playerInfoStyle(esMiTurno)}>
        <p style={labelStyle}>
          {estadoMensaje}
        </p>
        
        {/* El Reloj */}
        <div style={timerStyle}>
          {formatTime(tiempoRestante)}
        </div>
        
        <p style={{ fontWeight: 'bold' }}>
           🎲 **Jugador** ({jugadorColor})
        </p>
      </div>
      
    </div>
  );
};

export default GameInformation;

// --- ESTILOS EN LÍNEA ---

const containerStyle = {
  width: '250px',
  padding: '15px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const playerInfoStyle = (isTurn) => ({
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  backgroundColor: isTurn ? '#e0ffe0' : '#fff', // Fondo verde claro si es su turno
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
  fontSize: '36px',
  fontWeight: '900',
  color: '#333',
  margin: '10px 0',
};

const separatorStyle = {
  width: '80%',
  margin: '15px 0',
  border: '0',
  borderTop: '1px solid #aaa',
};