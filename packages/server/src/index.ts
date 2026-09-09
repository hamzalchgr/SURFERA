import express from 'express';
import type { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.route.ts';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app: Express = express();

app.use(cors({
   credentials: true
}));
app.use(express.json());

app.use('/auth', authRouter)

app.listen(PORT, () => {
   console.log('Running ...');
});
