import React, { useState } from 'react';
import ChessApp from './ChessApp';

const maxLevel = 8;
const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

export default function GameConfig() {
    const [botLevel, setBotLevel] = useState(1);
    const [playerColor, setPlayerColor] = useState('white');
    const [gameStarted, setGameStarted] = useState(false);

    const handleLevelChange = (event) => {
        setBotLevel(Number(event.target.value));
    };
    
    const handleColorChange = (event) => {
        setPlayerColor(event.target.value);
    };

    const handleStartGame = (event) => {
        event.preventDefault();
        setGameStarted(true);
    };

    if (gameStarted) {
        return (
            <ChessApp 
                level={botLevel}
                color={playerColor}
            />
        );
    }

    return (
        <div className="text-center p-6 bg-gray-800 rounded-lg shadow-xl max-w-sm mx-auto mt-10">
            <h2 className="text-3xl font-semibold mb-6 text-white">Configuración de Partida</h2>
            
            <form onSubmit={handleStartGame} className="space-y-4">
                
                {/* Selector de Nivel del Bot */}
                <div className="flex flex-col items-center">
                    <label htmlFor="botLevel" className="text-lg font-medium text-gray-300 mb-2">
                        Nivel del Bot (1 - {maxLevel})
                    </label>
                    <select 
                        id="botLevel" 
                        name="botLevel" 
                        value={botLevel}
                        onChange={handleLevelChange}
                        className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        {levels.map(level => (
                            <option key={level} value={level}>
                                Nivel {level}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selector de Color del Jugador */}
                <div className="flex flex-col items-center pt-2">
                    <label htmlFor="playerColor" className="text-lg font-medium text-gray-300 mb-2">
                        Jugar como
                    </label>
                    <div className="flex space-x-4">
                        <label className="inline-flex items-center text-white">
                            <input 
                                type="radio" 
                                name="playerColor" 
                                value="white" 
                                checked={playerColor === 'white'}
                                onChange={handleColorChange}
                                className="form-radio text-blue-500 h-5 w-5"
                            />
                            <span className="ml-2">Blancas</span>
                        </label>
                        <label className="inline-flex items-center text-white">
                            <input 
                                type="radio" 
                                name="playerColor" 
                                value="black" 
                                checked={playerColor === 'black'}
                                onChange={handleColorChange}
                                className="form-radio text-blue-500 h-5 w-5"
                            />
                            <span className="ml-2">Negras</span>
                        </label>
                    </div>
                </div>
                
                {/* Botón de Inicio */}
                <button 
                    type="submit" 
                    className="w-full mt-8 px-4 py-3 text-lg font-bold text-white
                     bg-blue-600 rounded-md hover:bg-blue-700 transition duration-150">
                    🚀 Guardar Opciones
                </button>
            </form>
        </div>
    );


}