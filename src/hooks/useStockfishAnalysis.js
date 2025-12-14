import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeStockfish, analyzePosition, stopAnalysis } from '../utils/stockfish-engine';

export const useStockfishAnalysis = (fen, gameState, isGameActive, jugadorColor, botLevel) => {
    // ESTADOS DE ANÁLISIS
    //const [topMovesAnalysis, setTopMovesAnalysis] = useState([]); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Para mostrar los Top X
    const topMovesRef = useRef([]); // Para almacenar temporalmente los movimientos MultiPV
    const currentDepthRef = useRef(0);
    
    //const MAX_DEPTH = 15;
    // -----------------------------------------------------------
    //  💡 LÓGICA PARA CALCULAR MAX_DEPTH (Usando useMemo)
    // -----------------------------------------------------------
    const MAX_DEPTH = useMemo(() => {
        if (botLevel < 3) {
            return 15;
        } else if(botLevel < 5){
            return 20
        }
        else if (botLevel <= 8) {
            return 24;
        }
        return 15;
    }, [botLevel]);

    const MAX_MOVES_TO_SHOW = useMemo(() => {
        if (botLevel === 1 || botLevel === 3 || botLevel === 5) {
            return 5;
        } else if (botLevel === 2 || botLevel === 4 || botLevel === 6 || botLevel === 7) {
            return 3;
        } else if (botLevel === 8) {
            return 2;
        }
        return 5;
    }, [botLevel]);

    // FUNCIÓN DEL LISTENER DEL MOTOR
    const handleEngineInfo = useCallback((message) => {
    
        const tokens = message.split(' ');
    
        // Almacén temporal para los valores que buscamos
        let multiPVNumber = null;
        let scoreType = null;
        let scoreValue = null;
        let pvIndex = -1;
        let depth = null;
        // 2. Iterar sobre los tokens para extraer los valores
    
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
    
            if (token === 'multipv' && i + 1 < tokens.length) {
                multiPVNumber = parseInt(tokens[i + 1]);
            } else if (token === 'score' && i + 2 < tokens.length) {
                // El tipo de puntuación (cp o mate) está en tokens[i + 1]
                scoreType = tokens[i + 1]; 
                // El valor de la puntuación (el número) está en tokens[i + 2]
                scoreValue = parseInt(tokens[i + 2]);
            } else if (token === 'pv') {
                // Guardamos el índice donde comienza la lista de movimientos (la PV)
                pvIndex = i + 1;
            } else if (tokens[i] === 'depth' && i + 1 < tokens.length) {
                depth = parseInt(tokens[i + 1]);
            }
        }
    
        // 3. Verificar si encontramos todos los datos necesarios (especialmente multipv y pv)
        if (multiPVNumber !== null && pvIndex !== -1 && scoreType !== null && scoreValue !== null && depth !== null) {

            // 4. Capturar la PV completa
            const movePV = tokens.slice(pvIndex).join(' ');
            const firstMoveUCI = movePV.split(' ')[0];

            // 5. Actualiza el array temporal (topMovesRef)
            topMovesRef.current[multiPVNumber - 1] = { 
                move: firstMoveUCI, 
                score: `${scoreType === 'cp' ? scoreValue / 100 : scoreValue}`, 
                multipv: multiPVNumber,
                pv: movePV,
                depth: depth,
            };
    
            // 6. LÓGICA DE OPTIMIZACIÓN DEL RENDERIZADO
            //const newTopMoves = topMovesRef.current.filter(m => m.multipv >= 1 && m.multipv <= MAX_MOVES_TO_SHOW);

            if (depth > currentDepthRef.current || (depth === MAX_DEPTH && currentDepthRef.current < MAX_DEPTH) ) {
                
                currentDepthRef.current = depth;
                //setTopMovesAnalysis(newTopMoves);
            }

            // 7. Detener análisis si se alcanza la profundidad máxima
            if (depth >= MAX_DEPTH) {
                 stopAnalysis();
                 setIsAnalyzing(false); 
            }

        }
    }, [MAX_DEPTH]);

    // EFECTO DE INICIO/PARADA DE ANÁLISIS
    useEffect(() => {
        if (isGameActive && !gameState.partidaTerminada) {

            const esTurnoHumano = gameState.turno === jugadorColor;
            
            if (esTurnoHumano) {

                topMovesRef.current = [];
                currentDepthRef.current = 0;
                //setTopMovesAnalysis([]);
                setIsAnalyzing(true);
                analyzePosition(fen, MAX_MOVES_TO_SHOW, MAX_DEPTH);

            } else {
                stopAnalysis();
                topMovesRef.current = []; 
                //setTopMovesAnalysis([]);
            }
                
        }
    }, [fen, gameState.turno, isGameActive, gameState.partidaTerminada, jugadorColor]);

    // Inicializar Stockfish al cargar la aplicación
    useEffect(() => {
        initializeStockfish(handleEngineInfo,/*handleEngineBestMove*/);
        return () => stopAnalysis();
    }, []);

    return {
        topMovesRef,
    };
};