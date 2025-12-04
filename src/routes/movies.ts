import { Router, Request, Response } from 'express';
import { RecommendationRequest, RecommendationResponse } from '../types';
import { getMoviesFromTMDB, validateTMDBConnection } from '../services/tmdbService';
import { getMoviesFromAI } from '../services/geminiService';

const router = Router();

// GET /api/movies/health - Health check
router.get('/health', async (_req: Request, res: Response) => {
    const tmdbAvailable = await validateTMDBConnection();
    res.json({
        status: 'ok',
        tmdbAvailable,
        timestamp: new Date().toISOString(),
    });
});

// POST /api/movies/recommendations - Get movie recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
    try {
        const { mood, action, source, excludeMovies = [] } = req.body as RecommendationRequest;

        // Validación
        const validMoods = ['alegria', 'tristeza', 'miedo', 'enojo', 'asco'];
        const validActions = ['potenciar', 'contrarrestar'];

        if (!validMoods.includes(mood)) {
            res.status(400).json({ error: `Mood inválido. Opciones: ${validMoods.join(', ')}` });
            return;
        }

        if (!validActions.includes(action)) {
            res.status(400).json({ error: `Acción inválida. Opciones: ${validActions.join(', ')}` });
            return;
        }

        let response: RecommendationResponse;

        if (source === 'tmdb') {
            try {
                // Intentar con TMDB primero
                const tmdbAvailable = await validateTMDBConnection();

                if (tmdbAvailable) {
                    const movies = await getMoviesFromTMDB(mood, action, excludeMovies);
                    response = {
                        movies,
                        source: 'tmdb',
                        fallback: false,
                    };
                } else {
                    // Fallback a AI
                    const movies = await getMoviesFromAI(mood, action, []);
                    response = {
                        movies,
                        source: 'ai',
                        fallback: true,
                    };
                }
            } catch (error) {
                console.error('TMDB failed, falling back to AI:', error);
                // Fallback a AI si TMDB falla
                const movies = await getMoviesFromAI(mood, action, []);
                response = {
                    movies,
                    source: 'ai',
                    fallback: true,
                };
            }
        } else {
            // Usar AI directamente
            const movies = await getMoviesFromAI(mood, action, []);
            response = {
                movies,
                source: 'ai',
                fallback: false,
            };
        }

        res.json(response);
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            error: 'Error al obtener recomendaciones',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
