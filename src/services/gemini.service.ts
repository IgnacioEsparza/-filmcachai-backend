import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env } from '../types/env';
import { Movie } from '../types';
import { TMDBService } from './tmdb.service';
import { MOOD_DESCRIPTIONS, Mood, Action } from '../config/constants';

interface AIMovieResponse {
    title: string;
    overview: string;
    release_date: string;
    vote_average: number;
}

export class GeminiService {
    private readonly env: Env;
    private readonly tmdbService: TMDBService;

    constructor(env: Env) {
        this.env = env;
        this.tmdbService = new TMDBService(env);
    }

    async getRecommendations(mood: Mood, action: Action, excludeMovies: string[] = []): Promise<Movie[]> {
        const { GEMINI_API_KEY } = this.env;

        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }

        const description = MOOD_DESCRIPTIONS[mood]?.[action];
        if (!description) {
            throw new Error(`Invalid mood or action: ${mood}/${action}`);
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const excludeList = excludeMovies.length > 0
            ? `No incluyas estas películas: ${excludeMovies.join(', ')}.`
            : '';

        const prompt = `Eres un experto en cine. Recomienda exactamente 5 películas que sean ${description}.

${excludeList}

Responde SOLO con un JSON array válido con este formato exacto, sin texto adicional ni markdown:
[
  {
    "title": "Nombre de la película",
    "overview": "Breve descripción de la película en español",
    "release_date": "YYYY",
    "vote_average": 7.5
  }
]

Las películas deben ser reales, populares y bien valoradas. La descripción debe ser en español y atractiva.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleanedText = text
            .replaceAll(/```json\n?/g, '')
            .replaceAll(/```\n?/g, '')
            .trim();

        const aiMovies: AIMovieResponse[] = JSON.parse(cleanedText);

        const enrichedMovies = await Promise.all(
            aiMovies.map(async (aiMovie, index) => {
                const tmdbMovie = await this.tmdbService.searchByTitle(aiMovie.title);

                if (tmdbMovie) {
                    return {
                        ...tmdbMovie,
                        overview: aiMovie.overview || tmdbMovie.overview,
                    };
                }

                return {
                    id: -(index + 1),
                    title: aiMovie.title,
                    overview: aiMovie.overview,
                    poster_path: null,
                    release_date: aiMovie.release_date,
                    vote_average: aiMovie.vote_average,
                };
            })
        );

        return enrichedMovies.slice(0, 5);
    }
}
