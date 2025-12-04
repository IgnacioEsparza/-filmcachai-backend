export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    genre_ids?: number[];
}

export interface RecommendationRequest {
    mood: 'alegria' | 'tristeza' | 'miedo' | 'enojo' | 'asco';
    action: 'potenciar' | 'contrarrestar';
    source: 'tmdb' | 'ai';
    excludeMovies?: number[];
}

export interface RecommendationResponse {
    movies: Movie[];
    source: 'tmdb' | 'ai';
    fallback: boolean;
}

export interface TMDBSearchResponse {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
}

export interface TMDBGenre {
    id: number;
    name: string;
}
