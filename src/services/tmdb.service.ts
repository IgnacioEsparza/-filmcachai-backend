import { Env } from '../types/env';
import { Movie, TMDBSearchResponse } from '../types';
import { TMDB_BASE_URL, MOOD_TO_GENRES, Mood, Action } from '../config/constants';

export class TMDBService {
    private readonly env: Env;

    constructor(env: Env) {
        this.env = env;
    }

    async getMoviesByMood(mood: Mood, action: Action, excludeMovies: number[] = []): Promise<Movie[]> {
        const { TMDB_API_KEY, TMDB_ACCESS_TOKEN } = this.env;

        if (!TMDB_API_KEY || !TMDB_ACCESS_TOKEN) {
            throw new Error('TMDB API credentials not configured');
        }

        const genres = MOOD_TO_GENRES[mood]?.[action];
        if (!genres) {
            throw new Error(`Invalid mood or action: ${mood}/${action}`);
        }

        const params = new URLSearchParams({
            api_key: TMDB_API_KEY,
            with_genres: genres.join(','),
            sort_by: 'popularity.desc',
            'vote_average.gte': '6',
            page: '1',
            language: 'es-ES',
        });

        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`, {
            headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.status}`);
        }

        const data = (await response.json()) as TMDBSearchResponse;

        return data.results
            .filter((movie) => !excludeMovies.includes(movie.id))
            .slice(0, 5);
    }

    async searchByTitle(title: string): Promise<Movie | null> {
        const { TMDB_API_KEY, TMDB_ACCESS_TOKEN } = this.env;

        if (!TMDB_API_KEY || !TMDB_ACCESS_TOKEN) {
            return null;
        }

        const params = new URLSearchParams({
            api_key: TMDB_API_KEY,
            query: title,
            language: 'es-ES',
        });

        try {
            const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`, {
                headers: {
                    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) return null;

            const data = (await response.json()) as TMDBSearchResponse;
            return data.results[0] || null;
        } catch {
            return null;
        }
    }

    async validateConnection(): Promise<boolean> {
        const { TMDB_API_KEY, TMDB_ACCESS_TOKEN } = this.env;

        if (!TMDB_API_KEY || !TMDB_ACCESS_TOKEN) {
            return false;
        }

        try {
            const params = new URLSearchParams({ api_key: TMDB_API_KEY });
            const response = await fetch(`${TMDB_BASE_URL}/configuration?${params}`, {
                headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` },
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
