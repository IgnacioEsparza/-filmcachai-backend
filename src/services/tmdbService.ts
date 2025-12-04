import axios from 'axios';
import { Movie, TMDBSearchResponse } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Mapping de estados de ánimo a géneros de TMDB
const moodToGenres: Record<string, Record<string, number[]>> = {
    alegria: {
        potenciar: [35, 10402, 16], // Comedy, Music, Animation
        contrarrestar: [18, 10749], // Drama, Romance
    },
    tristeza: {
        potenciar: [18, 10749], // Drama, Romance
        contrarrestar: [35, 10402, 12], // Comedy, Music, Adventure
    },
    miedo: {
        potenciar: [27, 53], // Horror, Thriller
        contrarrestar: [35, 10751, 16], // Comedy, Family, Animation
    },
    enojo: {
        potenciar: [28, 80], // Action, Crime
        contrarrestar: [35, 10751, 10749], // Comedy, Family, Romance
    },
    asco: {
        potenciar: [27, 878], // Horror, Sci-Fi
        contrarrestar: [10751, 14, 16], // Family, Fantasy, Animation
    },
};

export async function getMoviesFromTMDB(
    mood: string,
    action: string,
    excludeMovies: number[] = []
): Promise<Movie[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const accessToken = process.env.TMDB_ACCESS_TOKEN;

    if (!apiKey || !accessToken) {
        throw new Error('TMDB API credentials not configured');
    }

    const genres = moodToGenres[mood]?.[action];
    if (!genres) {
        throw new Error(`Invalid mood or action: ${mood}/${action}`);
    }

    try {
        const response = await axios.get<TMDBSearchResponse>(
            `${TMDB_BASE_URL}/discover/movie`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    api_key: apiKey,
                    with_genres: genres.join(','),
                    sort_by: 'popularity.desc',
                    'vote_average.gte': 6,
                    page: 1,
                    language: 'es-ES',
                },
            }
        );

        // Filtrar películas excluidas y tomar 5
        const filteredMovies = response.data.results
            .filter((movie) => !excludeMovies.includes(movie.id))
            .slice(0, 5);

        return filteredMovies;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('TMDB API Error:', error.response?.data || error.message);
        }
        throw error;
    }
}

export async function searchMovieByTitle(title: string): Promise<Movie | null> {
    const apiKey = process.env.TMDB_API_KEY;
    const accessToken = process.env.TMDB_ACCESS_TOKEN;

    if (!apiKey || !accessToken) {
        throw new Error('TMDB API credentials not configured');
    }

    try {
        const response = await axios.get<TMDBSearchResponse>(
            `${TMDB_BASE_URL}/search/movie`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    api_key: apiKey,
                    query: title,
                    language: 'es-ES',
                },
            }
        );

        return response.data.results[0] || null;
    } catch (error) {
        console.error('TMDB search error:', error);
        return null;
    }
}

export async function validateTMDBConnection(): Promise<boolean> {
    const apiKey = process.env.TMDB_API_KEY;
    const accessToken = process.env.TMDB_ACCESS_TOKEN;

    if (!apiKey || !accessToken) {
        return false;
    }

    try {
        await axios.get(`${TMDB_BASE_URL}/configuration`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                api_key: apiKey,
            },
        });
        return true;
    } catch {
        return false;
    }
}
