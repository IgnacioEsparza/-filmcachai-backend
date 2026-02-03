export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const VALID_MOODS = ['alegria', 'tristeza', 'miedo', 'enojo', 'asco'] as const;
export const VALID_ACTIONS = ['potenciar', 'contrarrestar'] as const;

export type Mood = (typeof VALID_MOODS)[number];
export type Action = (typeof VALID_ACTIONS)[number];

export const MOOD_TO_GENRES: Record<Mood, Record<Action, number[]>> = {
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

export const MOOD_DESCRIPTIONS: Record<Mood, Record<Action, string>> = {
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
