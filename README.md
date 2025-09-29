# Chess Astro

Proyecto web de ajedrez construido con [Astro](https://astro.build/), [React](https://react.dev/) y la [API de Lichess](https://lichess.org/api).

## 🚀 Características

- **Tablero de ajedrez interactivo** con piezas SVG personalizadas.
- **Juega contra el bot de Lichess** directamente desde la web.
- Visualización del **historial de movimientos** y control de tiempo por turno.
- Integración con la **API oficial de Lichess** para partidas en tiempo real.
- Interfaz moderna usando **TailwindCSS**.

## 📦 Estructura del Proyecto

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/         # Imágenes y SVGs
│   ├── components/     # Componentes React (tablero, historial, info, etc.)
│   ├── layouts/        # Layouts de Astro
│   ├── pages/          # Páginas Astro
│   ├── styles/         # Estilos globales (Tailwind)
│   └── utils/          # Utilidades y API de Lichess
├── package.json
└── ...
```

## ⚡ Instalación y Uso

1. **Clona el repositorio:**
   ```sh
   git clone <URL-del-repo>
   cd chess-astro
   ```

2. **Instala las dependencias:**
   ```sh
   npm install
   ```

3. **Configura tu token de Lichess:**
   - Crea un archivo `.env` en la raíz y añade tu token:
     ```
     lichessAPIKey=tu_token_de_lichess
     ```
   - O edita directamente en [`src/utils/api-lichess.js`](src/utils/api-lichess.js).

4. **Inicia el servidor de desarrollo:**
   ```sh
   npm run dev
   ```

5. Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

## 🛠️ Scripts útiles

| Comando           | Acción                                    |
|-------------------|-------------------------------------------|
| `npm run dev`     | Inicia el servidor de desarrollo          |
| `npm run build`   | Compila el sitio para producción          |
| `npm run preview` | Previsualiza el sitio compilado           |

## 📚 Tecnologías usadas

- [Astro](https://astro.build/)
- [React](https://react.dev/)
- [chess.js](https://github.com/jhlywa/chess.js)
- [TailwindCSS](https://tailwindcss.com/)
- [Lichess API](https://lichess.org/api)

## ✨ Créditos

- SVGs de piezas de ajedrez: [Wikipedia Chess SVG](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces)
- Inspirado por la comunidad de Lichess y proyectos open source.

---

¡Disfruta jugando ajedrez en tu propio sitio web!