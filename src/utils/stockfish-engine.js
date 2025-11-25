let stockfishWorker = null;
const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Función para inicializar el motor Stockfish (el Web Worker).
 * @param {function} onInfoCallback - Función a llamar con cada línea de análisis (para el MultiPV).
 * @param {function} onBestMoveCallback - Función a llamar con el movimiento final (bestmove).
 */
export const initializeStockfish = (onInfoCallback, /*onBestMoveCallback*/) => {

    stockfishWorker = new Worker('/stockfish-17.1-lite-single-03e3232.js'); 
    
    stockfishWorker.onmessage = (event) => {
        const message = event.data;
        
        if (message.startsWith('info')) {
            onInfoCallback(message);
        } /*else if (message.startsWith('bestmove')) {
            onBestMoveCallback(message);
        }*/
    };
    
    stockfishWorker.postMessage('uci');
    stockfishWorker.postMessage('ucinewgame');
};

/**
 * FUNCIÓN AGREGADA: Permite enviar comandos UCI directos (ej: 'stop').
 * @param {string} command El comando UCI a enviar.
 */
/*
export const sendCommand = (command) => {
    if (stockfishWorker) {
        stockfishWorker.postMessage(command);
    }
};*/

/**
 * Función para solicitar el análisis de una posición.
 * @param {string} fen - La posición actual.
 * @param {number} multiPV - Cuántos movimientos principales analizar (ej: 5).
 * @param {number} depth - La profundidad de análisis (ej: 15).
 */
export const analyzePosition = (fen, multiPV = 5, depth = 15) => {
    if (!stockfishWorker) return;

    stockfishWorker.postMessage(`setoption name MultiPV value ${multiPV}`);
    stockfishWorker.postMessage(`position fen ${fen}`);
    stockfishWorker.postMessage(`go depth ${depth}`); 
    // Usa 'go movetime 1000' si quieres un tiempo fijo (1 segundo) en lugar de profundidad
};

export const stopAnalysis = () => {
    if (stockfishWorker) {
        stockfishWorker.postMessage('stop');
        stockfishWorker.postMessage('ucinewgame');
    }
}