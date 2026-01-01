// src/components/MoveHelpBar.jsx (Ejemplo de estructura)

const MoveHelpBar = () => {
    return (
        <div className="flex flex-col mt-3">
            <h4 className='text-center font-bold text-2xl'>💡 Guía Rápida de Movimientos Especiales</h4>
            <div className="flex gap-1 justify-between items-center">
                <section className='w-1/2 m-1 p-1'>
                    {/* Enroque Corto */}
                    <article className="flex gap-5 items-center text-xl">
                        <h5 className='flex gap-2'>
                            <span role="img" aria-label="castling-short">🏰</span>
                            <p className='underline'>Enroque Corto: </p>
                        </h5>
                        <p>e1g1 (Blancas) / e8g8 (Negras)</p>
                    </article>
                    {/* Enroque Largo */}
                    <article className="flex gap-5 items-center text-xl">
                        <h5 className='flex gap-2'>
                            <span role="img" aria-label="castling-long">🏯</span>
                            <p className='underline'>Enroque Largo: </p>
                        </h5>
                        <span>e1c1 (Blancas) / e8c8 (Negras)</span>
                    </article>
                </section>
                <section className='w-1/2 m-1 p-1'>
                    {/* Coronación */}
                    <article className="flex gap-5 items-center text-xl">
                        <h5 className='flex gap-2'>
                            <span role="img" aria-label="promotion">👑</span>
                            <p className='underline'>Coronación: </p>
                        </h5>
                        <span>(peón avanza) + q (Dama), r (Caballo), b (Alfil), n (Torre)</span>
                    </article>
                    {/* Captura al Paso (Para fines didácticos, aunque se vota normal) */}
                    <article className="flex gap-5 items-center text-xl">
                        <h5 className='flex gap-2'>
                            <span role="img" aria-label="en-passant">♟️</span>
                            <p className='underline'>Captura al Paso: </p>
                        </h5>
                        <span>d5c6 (origen/destino)</span>
                    </article>
                </section>
            </div>
        </div>
    );
};

export default MoveHelpBar;