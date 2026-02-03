import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './types/env';
import movies from './routes/movies.route';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors());

app.route('/api/movies', movies);

app.get('/', (c) => {
    return c.json({
        name: 'Filmcáchai API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/movies/health',
            recommendations: 'POST /api/movies/recommendations',
        },
    });
});

export default app;
