import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moviesRouter from './routes/movies';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', moviesRouter);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Filmcáchai API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/movies/health',
            recommendations: 'POST /api/movies/recommendations',
        },
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎬 Filmcáchai API running on http://localhost:${PORT}`);
});
