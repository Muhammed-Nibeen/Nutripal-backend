import { userRoute } from "./router/routes";
import { adminRoute } from './router/adminRoutes'
import { nutriRoute } from './router/nutriRoutes'
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const port = 3000;
import dotenv from 'dotenv'
import { connectDatabase } from "./mongo";

app.use(express.json())
const corsOptions = {
  orgin:'http://localhost:4200',
  methods:['GET','POST','PUT','DELETE'],
  allowedHeaders:['Content-Type','Authorization'],
  credentials: true
}
app.use(express.static(path.join(__dirname,'public')))
dotenv.config()
connectDatabase()

app.use(cors(corsOptions))

app.use('/user', userRoute)

app.use('/admin', adminRoute)

app.use('/nutri',nutriRoute)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});