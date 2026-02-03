import { Hono } from 'hono';
import { Env } from '../types/env';
import { RecommendationRequest, RecommendationResponse } from '../types';
import { TMDBService } from '../services/tmdb.service';
import { GeminiService } from '../services/gemini.service';
import { VALID_MOODS, VALID_ACTIONS, Mood, Action } from '../config/constants';

const movies = new Hono<{ Bindings: Env }>();

movies.get('/health', async (c) => {
    const tmdbService = new TMDBService(c.env);
    const tmdbAvailable = await tmdbService.validateConnection();

    return c.json({
        status: 'ok',
        tmdbAvailable,
        timestamp: new Date().toISOString(),
    });
});

movies.post('/recommendations', async (c) => {
    try {
        const body = await c.req.json<RecommendationRequest>();
        const { mood, action, source, excludeMovies = [] } = body;

        if (!VALID_MOODS.includes(mood as Mood)) {
            return c.json({ error: `Mood inválido. Opciones: ${VALID_MOODS.join(', ')}` }, 400);
        }

        if (!VALID_ACTIONS.includes(action as Action)) {
            return c.json({ error: `Acción inválida. Opciones: ${VALID_ACTIONS.join(', ')}` }, 400);
        }

        const tmdbService = new TMDBService(c.env);
        const geminiService = new GeminiService(c.env);

        let response: RecommendationResponse;

        if (source === 'tmdb') {
            try {
                const tmdbAvailable = await tmdbService.validateConnection();

                if (tmdbAvailable) {
                    const movies = await tmdbService.getMoviesByMood(
                        mood as Mood,
                        action as Action,
                        excludeMovies as number[]
                    );
                    response = { movies, source: 'tmdb', fallback: false };
                } else {
                    const movies = await geminiService.getRecommendations(mood as Mood, action as Action, []);
                    response = { movies, source: 'ai', fallback: true };
                }
            } catch (error) {
                console.error('TMDB failed, falling back to AI:', error);
                const movies = await geminiService.getRecommendations(mood as Mood, action as Action, []);
                response = { movies, source: 'ai', fallback: true };
            }
        } else {
            const movies = await geminiService.getRecommendations(mood as Mood, action as Action, []);
            response = { movies, source: 'ai', fallback: false };
        }

        return c.json(response);
    } catch (error) {
        console.error('Recommendation error:', error);
        return c.json(
            {
                error: 'Error al obtener recomendaciones',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        );
    }
});

export default movies;
