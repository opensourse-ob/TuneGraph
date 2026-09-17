import express from 'express'
import cors from 'cors' //allows front use api and send cookies
import cookieParser from 'cookie-parser' //parse cookie in req.cookies
import type { Request, Response, NextFunction } from 'express'
import authRoutes from './routes/authRoutes'
import spotifyRoutes from './routes/spotifyRoutes'
import { requestLogger } from './middlewares/requestLogger'

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true })) //allows to read forms data through req.body
app.use(cookieParser())

app.use(requestLogger)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/spotify', spotifyRoutes)

// Root route - check that server is alive
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to TuneGraph API' })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const defaultErr = {
    log: 'Express error handler caught middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  }
  const errorObj = Object.assign({}, defaultErr, err)
  console.log(errorObj.log)
  return res.status(errorObj.status).json(errorObj.message)
})

export default app
