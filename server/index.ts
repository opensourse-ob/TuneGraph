import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.js';
import spotifyRoutes from './routes/spotify.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function logger (req,res, next) {
  console.log(req.originalUrl)
  next();
}
app.use(logger);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spotify', spotifyRoutes);

// Example routes
authRoutes.get('/', (req: Request, res: Response) => {
  console.log('in middleware from index')
  res.json({ message: 'Welcome to TuneGraph API' });
});

app.get('/authorize')

// Global error handler
app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
  const defaultErr = {
    log: "Express error handler caught middleware error",
    status: 500,
    message: { err: "An error occurred" },
  };
  const errorObj = Object.assign({}, defaultErr, err);
  console.log(errorObj.log);
  return res.status(errorObj.status).json(errorObj.message);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

