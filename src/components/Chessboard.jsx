import React, { useState, useMemo } from 'react';
import { defaultPieces } from './pieces.jsx'; // Importa los SVGs de las piezas

// --- LÓGICA DEL TABLERO ---

// Mapeo de caracteres FEN a las claves de las piezas en defaultPieces
const FEN_TO_PIECE_KEY = {
  p: 'bP', n: 'bN', b: 'bB', r: 'bR', q: 'bQ', k: 'bK',
  P: 'wP', N: 'wN', B: 'wB', R: 'wR', Q: 'wQ', K: 'wK',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Función para parsear la parte de las piezas de una cadena FEN
 * y devolver un mapa de la posición de la casilla a la clave de la pieza.
 *
 * @param {string} fen La notación FEN (solo la parte de las piezas, e.g., 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
 * @returns {{[square: string]: string}} Un objeto mapeando 'a1' -> 'wR', 'e7' -> 'bP', etc.
 */
const fenToBoard = (fen) => {
  const [piecesPart] = fen.split(' ');
  const rows = piecesPart.split('/');
  const board = {};

  for (let r = 0; r < 8; r++) {
    let fileIndex = 0;
    const rank = RANKS[r];
    const row = rows[r];

    for (const char of row) {
      if (/[1-8]/.test(char)) {
        // Es un número, saltar casillas vacías
        fileIndex += parseInt(char, 10);
      } else if (/[a-zA-Z]/.test(char)) {
        // Es una pieza
        const file = FILES[fileIndex];
        const square = `${file}${rank}`;
        board[square] = FEN_TO_PIECE_KEY[char];
        fileIndex++;
      }
    }
  }
  return board;
};


// --- COMPONENTE REACT ---

const Chessboard = ({ fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', onMove, orientation = 'white' }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  
  // Memoizar el estado del tablero para evitar re-cálculos innecesarios
  const boardLayout = useMemo(() => fenToBoard(fen), [fen]);

  const handleSquareClick = (square) => {
    // 1. Si la misma casilla es seleccionada, la deseleccionamos
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    // 2. Si hay una casilla seleccionada, intentamos hacer un movimiento
    if (selectedSquare) {
      const source = selectedSquare;
      const target = square;
      
      // Formato UCI (e.g., 'e2e4') para el movimiento
      const uciMove = `${source}${target}`; 
      
      // Llamar a la función onMove proporcionada por el padre
      // El componente padre (e.g., ChessApp.jsx) debería validar y aplicar este movimiento
      if (onMove) {
        onMove(uciMove);
      }
      
      // Resetear la selección
      setSelectedSquare(null);

    } else {
      // 3. Si no hay una casilla seleccionada, y hay una pieza en la casilla clicada, la seleccionamos
      if (boardLayout[square]) {
        setSelectedSquare(square);
      }
    }
  };
  
  // Determinar el orden de renderizado de las casillas según la orientación
  const currentRanks = orientation === 'white' ? RANKS : [...RANKS].reverse();
  const currentFiles = orientation === 'white' ? FILES : [...FILES].reverse();

  // Generación de las casillas del tablero
  const squares = [];
  for (const rank of currentRanks) {
    for (const file of currentFiles) {
      const square = `${file}${rank}`;
      const isLight = (file.charCodeAt(0) - 'a'.charCodeAt(0) + rank) % 2 === 0;
      const pieceKey = boardLayout[square];
      const PieceComponent = pieceKey ? defaultPieces[pieceKey] : null;

      const style = {
        // Colores base de ajedrez
        backgroundColor: isLight ? 'rgb(240, 217, 181)' : 'rgb(181, 136, 99)',
        // Indicador visual para la casilla seleccionada
        boxShadow: selectedSquare === square ? 'inset 0 0 0 4px rgba(6, 127, 247, 0.7)' : 'none',
        // Asegurar que las piezas se vean
        zIndex: 1, 
        cursor: 'pointer',
      };

      squares.push(
        <div
          key={square}
          className="square"
          style={{ ...squareStyles, ...style }}
          onClick={() => handleSquareClick(square)}
        >
          {/* Renderizar la pieza SVG si existe */}
          {PieceComponent && <PieceComponent fill={pieceKey.startsWith('w') ? '#FFFFFF' : '#000000'} svgStyle={{ filter: pieceKey.startsWith('w') ? 'drop-shadow(0 0 1.5px #000000)' : 'drop-shadow(0 0 1.5px #FFFFFF)' }} />}
          
          {/* Etiquetas de archivo y rango (solo en los bordes) */}
          {(orientation === 'white' ? rank === 1 : rank === 8) && file === 'h' && <span style={fileRankStyles(true, isLight)}>{file}</span>}
          {(orientation === 'white' ? rank === 1 : rank === 8) && file !== 'h' && <span style={fileRankStyles(true, isLight)}>{file}</span>}
          
          {(orientation === 'white' ? file === 'a' : file === 'h') && rank === 8 && <span style={fileRankStyles(false, isLight)}>{rank}</span>}
          {(orientation === 'white' ? file === 'a' : file === 'h') && rank !== 8 && <span style={fileRankStyles(false, isLight)}>{rank}</span>}
        </div>
      );
    }
  }

  return (
    <div style={boardContainerStyle}>
      {squares}
    </div>
  );
};

export default Chessboard;

// --- ESTILOS EN LÍNEA PARA EL TABLERO ---

const boardContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gridTemplateRows: 'repeat(8, 1fr)',
  width: 'min(90vw, 500px)', // Tablero responsivo, ajusta si es necesario
  height: 'min(90vw, 500px)',
  border: '4px solid #333',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  margin: '20px auto',
  aspectRatio: '1 / 1',
};

const squareStyles = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  fontSize: '10px',
  fontWeight: 'bold',
  userSelect: 'none',
};

const fileRankStyles = (isFile, isLight) => ({
  position: 'absolute',
  // Color del texto que contrasta con el color de la casilla
  color: isLight ? 'rgb(181, 136, 99)' : 'rgb(240, 217, 181)',
  // Posición para las etiquetas de archivo/rango
  ...(isFile
    ? { bottom: '2px', right: '4px' } // Etiqueta de archivo (a-h)
    : { top: '2px', left: '4px' }      // Etiqueta de rango (1-8)
),
});