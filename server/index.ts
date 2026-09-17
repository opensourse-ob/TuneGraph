import 'dotenv/config'
import app from './app'

const PORT = process.env.PORT || 3001

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
