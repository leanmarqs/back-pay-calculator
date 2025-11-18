import dotenv from 'dotenv'
import express from 'express'

const app = express()
app.use(express.json())

dotenv.config()

const SERVER_PORT =
  Number(process.env.DEFAULT_SERVER_PORT) || Number(process.env.ALTERNATIVE_SERVER_PORT)

app.get('/', (req, res) => {
  res.status(200).send('Hello Weirdo!')
})

app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`)
})
