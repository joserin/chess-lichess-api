import React, { useState, useEffect } from 'react';

export const useConfigLoader = () => {
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch('./config.json'); 
                const data = await res.json();
                setConfig(data);
            } catch (error) {
                console.error("Error al cargar config.json. ¿Está en la carpeta public/ y accesible?", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    return { config, isLoading };
};