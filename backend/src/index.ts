import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { videoRouter } from './routes/videoRoutes';

dotenv.config();

const app = express();

app.use(cors());

const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get('/health', (request, response) => {
  response.json({ status: 'ok' });
});
app.use('/api/videos', videoRouter);

app.use((request, response, next) => {
  console.log('404 for path:', request.method, request.url);
  response.status(404).json({ error: 'Not found', path: request.url });
});

app.listen(port, () => {
  console.log('Listening on port:', port);
});
