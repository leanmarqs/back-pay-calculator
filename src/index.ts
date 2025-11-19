import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
app.use(express.json())

const PORT = Number(process.env.DEFAULT_SERVER_PORT) || 3000

app.listen(PORT, () => {
  console.log(`Rodando em http://localhost:${PORT}`)
})
