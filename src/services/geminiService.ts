import { GoogleGenerativeAI } from '@google/generative-ai';
import { Movie } from '../types';
import { searchMovieByTitle } from './tmdbService';

const moodDescriptions: Record<string, Record<string, string>> = {
    alegria: {
        potenciar: 'películas que aumenten la alegría, felicidad y buen humor',
        contrarrestar: 'películas más serias o reflexivas para equilibrar el estado de alegría',
    },
    tristeza: {
        potenciar: 'películas emotivas y melancólicas que acompañen el momento de tristeza',
        contrarrestar: 'películas alegres, divertidas y optimistas para levantar el ánimo',
    },
    miedo: {
        potenciar: 'películas de terror, suspenso o thrillers intensos',
        contrarrestar: 'películas ligeras, familiares y reconfortantes para aliviar el miedo',
    },
    enojo: {
        potenciar: 'películas de acción intensa o con temáticas de justicia y confrontación',
        contrarrestar: 'películas calmadas, comedias ligeras o historias de paz y reconciliación',
    },
    asco: {
        potenciar: 'películas perturbadoras o con elementos grotescos',
        contrarrestar: 'películas hermosas, inspiradoras y estéticamente agradables',
    },
};

export async function getMoviesFromAI(
    mood: string,
    action: string,
    excludeMovies: string[] = []
): Promise<Movie[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const description = moodDescriptions[mood]?.[action];
    if (!description) {
        throw new Error(`Invalid mood or action: ${mood}/${action}`);
    }

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

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Limpiar la respuesta de posibles caracteres extra
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const aiMovies = JSON.parse(cleanedText);

        // Intentar enriquecer con datos de TMDB
        const enrichedMovies: Movie[] = await Promise.all(
            aiMovies.map(async (aiMovie: { title: string; overview: string; release_date: string; vote_average: number }, index: number) => {
                const tmdbMovie = await searchMovieByTitle(aiMovie.title);

                if (tmdbMovie) {
                    return {
                        ...tmdbMovie,
                        overview: aiMovie.overview || tmdbMovie.overview,
                    };
                }

                // Si no se encuentra en TMDB, crear un objeto básico
                return {
                    id: -(index + 1), // ID negativo para películas sin TMDB
                    title: aiMovie.title,
                    overview: aiMovie.overview,
                    poster_path: null,
                    release_date: aiMovie.release_date,
                    vote_average: aiMovie.vote_average,
                };
            })
        );

        return enrichedMovies.slice(0, 5);
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw error;
    }
}
