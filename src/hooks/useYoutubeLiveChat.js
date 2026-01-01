import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook para gestionar la conexión y captura de mensajes de YouTube Live Chat usando la API oficial.
 * @param {boolean} shouldStart - Bandera para indicar si el chat debe estar activo.
 * @param {function} onNewMessage - Callback que se ejecuta por cada nuevo mensaje (chatItem).
 * @param {string} youtubeApiKey - Clave API de YouTube.
 * @param {string} liveVideoId - ID del video en vivo.
 * @param {string} gameId - ID de la partida de Lichess actual (¡NUEVO PARAM!)
 */

export const useYoutubeLiveChat = (shouldStart, onNewMessage, YOUTUBE_API_KEY, LIVE_VIDEO_ID, GAME_ID) => {
    
    const [isChatActive, setIsChatActive] = useState(false);
    const [liveChatId, setLiveChatId] = useState(null);
    const nextPageTokenRef = useRef(null);
    const intervalRef = useRef(null);
    const defaultInterval = 20000; // 5 segundos (base para el polling)

    // ---------------------------------------------------------------------
    // 1. OBTENER EL liveChatId AL INICIO
    // ---------------------------------------------------------------------
    useEffect(() => {

        // 💡 Detener la ejecución si las claves no están definidas (mientras carga el config.json)
        if (!YOUTUBE_API_KEY || !LIVE_VIDEO_ID || liveChatId) return;
        
        const fetchLiveChatId = async () => {
            try {
                // Paso A: Obtener los detalles del video para encontrar el liveChatId
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${LIVE_VIDEO_ID}&key=${YOUTUBE_API_KEY}`;
                const videoRes = await axios.get(videoUrl);
                
                const details = videoRes.data.items[0]?.liveStreamingDetails;
                const activeId = details?.activeLiveChatId;
                
                if (activeId) {
                    setLiveChatId(activeId);
                    setIsChatActive(true);
                } else {
                    console.error("[API] No se encontró activeLiveChatId. ¿El video está en vivo?");
                    setIsChatActive(false);
                }
            } catch (error) {
                console.error("[API] Error al obtener LiveChat ID:", error);
                setIsChatActive(false);
            }
        };

        fetchLiveChatId();

        // Limpieza: Asegurar que el intervalo se detenga
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [liveChatId, YOUTUBE_API_KEY, LIVE_VIDEO_ID]);


    // ---------------------------------------------------------------------
    // 2. POLLING PARA OBTENER LOS MENSAJES
    // ---------------------------------------------------------------------
    const fetchChatMessages = useCallback(async () => {
        if (!liveChatId) return;
        
        try {
            let chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=id,snippet,authorDetails&key=${YOUTUBE_API_KEY}`;
            
            if (nextPageTokenRef.current) {
                chatUrl += `&pageToken=${nextPageTokenRef.current}`;
            } else {
                 // Si es la primera llamada, se añade maxResults (opcional)
                 chatUrl += `&maxResults=200`; 
            }

            const chatRes = await axios.get(chatUrl);
            const data = chatRes.data;

            // Actualizar el token para la siguiente llamada
            nextPageTokenRef.current = data.nextPageToken;

            // Enviar cada nuevo mensaje al componente padre (ChessApp)
            data.items.forEach(item => {

                const rawMessage = item.snippet.displayMessage.trim().toLowerCase();

                // 💡 USAMOS LA FUNCIÓN AUXILIAR
                const movimientoEncontrado = procesarMensaje(rawMessage);
                console.log('movimiento procesando-->', movimientoEncontrado)

                if (movimientoEncontrado) {
                    const simplifiedVote = {
                        author: { name: item.authorDetails.displayName, channelId: item.authorDetails.channelId },
                        // IMPORTANTE: Asegúrate de que el formato sea el que espera el ChessApp (solo el movimiento)
                        move: movimientoEncontrado.startsWith('m-') ? movimientoEncontrado.substring(2) : movimientoEncontrado, // Si es 'm-e2e4', devuelve solo 'e2e4'
                    };
                    onNewMessage(simplifiedVote);
                }

            });
            
            return data.pollingIntervalMillis || defaultInterval;

        } catch (error) {
            // Manejo de errores (ej: chat finalizado, cuota excedida)

            console.error("[API] Error al obtener mensajes del chat:", error.response ? error.response.data : error.message);
            const statusCode = error.response ? error.response.status : null;
            const isRateLimitError = statusCode === 403 && 
                                    error.response.data.error.message.includes("sent too soon");

            if (isRateLimitError) {
                // 🚨 SI ES EL ERROR DE LÍMITE DE RATA, FORZAMOS UN TIEMPO DE ESPERA ALTO
                console.warn("Error 403 (Rate Limit). Aumentando el intervalo de espera a 20 segundos.");
                return 30000; // 20 segundos
            }

            return defaultInterval;
        }
        /*
        // Re-ejecutar el polling con el nuevo intervalo
        if (intervalRef.current) clearInterval(intervalRef.current);*/

    }, [liveChatId, onNewMessage, defaultInterval, YOUTUBE_API_KEY]);


    // ---------------------------------------------------------------------
    // 3. CONTROL DE INICIO/DETENCIÓN (GATILLADO POR shouldStart)
    // ---------------------------------------------------------------------
    useEffect(() => {

        if (!shouldStart || !liveChatId || !isChatActive) {
            // Detiene el polling
            if (intervalRef.current) {
                //clearInterval(intervalRef.current);
                clearTimeout(intervalRef.current);
                intervalRef.current = null;
                console.log("Polling de chat detenido.");
            }
            return;
        }
        // --- LÓGICA DE POLLING RECURSIVO CON TIMEOUT ---
        const pollChat = async () => {
            // Ejecuta la llamada a la API y obtiene el intervalo recomendado
            const nextInterval = await fetchChatMessages();
            
            // Si hay un intervalo válido, programamos la próxima llamada
            if (nextInterval && nextInterval > 0) {
                // 💡 USAMOS setTimeout para programar la PRÓXIMA llamada
                intervalRef.current = setTimeout(async () => {
                    await pollChat(); // Llama a sí misma para la siguiente iteración
                }, nextInterval);
            } else {
                // En caso de error que devuelva 0 o null, dejamos que el useEffect 
                // o el catch manejen la detención, si es necesario.
                console.warn("Intervalo de polling inválido. Deteniendo temporalmente.");
            }
        };

        // --- LÓGICA DE INICIO DEL POLLING ---
        const startPolling = async () => {
            
            // 🚨 PASO CLAVE: LIMPIAR EL nextPagetoken y OBTENER EL ÚLTIMO 🚨
            nextPageTokenRef.current = null; // Lo limpiamos para asegurar que no hay un token anterior
            
            try {
                // Hacemos una llamada rápida para obtener el token más reciente y forzar el inicio "ahora".
                // No procesamos los items de esta respuesta, solo nos interesa el token.
                const initialRes = await axios.get(
                    `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=id&key=${YOUTUBE_API_KEY}`
                );
                
                // 1. Guardamos el token más reciente. Los mensajes Viejos se ignoran.
                nextPageTokenRef.current = initialRes.data.nextPageToken;

            } catch (error) {
                console.error("Error al forzar el token inicial:", error.message);
                //setIsChatActive(false);
                return;
            }
            
            // 1. Limpia cualquier temporizador pendiente y comienza el bucle recursivo
            if (intervalRef.current) clearTimeout(intervalRef.current);

            intervalRef.current = setTimeout(async () => {
                await pollChat();
            }, 20000);
        };
        startPolling();
    
        // Función de limpieza estándar para useEffect
        return () => {
            if (intervalRef.current) {
                //clearInterval(intervalRef.current);
                clearTimeout(intervalRef.current);
                intervalRef.current = null;
            }
        };

    }, [shouldStart, liveChatId, isChatActive, fetchChatMessages]);

    // ---------------------------------------------------------------------
    // FUNCIÓN AUXILIAR PARA PROCESAR EL TEXTO Y EXTRAER MOVIMIENTOS
    // ---------------------------------------------------------------------
    const procesarMensaje = (rawMessage) => {
        
        // Regex para encontrar movimientos de ajedrez en formato UCI (e.g., e2e4)
        const patron_ajedrez = /m-[a-h][1-8][a-h][1-8]/g;
        
        // La función search() o match() es lo que se usa en JS para encontrar coincidencias.
        const coincidencias = rawMessage.match(patron_ajedrez);

        if (coincidencias && coincidencias.length > 0) {
            return coincidencias[0]; 
        }
        
        return null;
    };
    return { isChatActive };
};