import userRoutes from "./router/routes";
import adminRoutes from './router/adminRoutes'
import nutriRoutes from './router/nutriRoutes'
import paymentRoutes from "./router/payment";
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const port = 3000;
import dotenv from 'dotenv'
import { connectDatabase } from "./mongo";
import { configureSocket } from "./websocket/websockerIO";

//Websocket code 


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  // orgin:'http://localhost:4200',
  orgin:'https://nutripal-pi.vercel.app',
  methods:['GET','POST','PUT','DELETE'],
  allowedHeaders:['Content-Type','Authorization'],
  credentials: true
}
app.use(express.static(path.join(__dirname,'public')))
dotenv.config()
connectDatabase()

app.use(cors(corsOptions))

app.use('/user', userRoutes)

app.use('/admin', adminRoutes)

app.use('/nutri',nutriRoutes)

app.use('/payment', paymentRoutes);


const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  
});

configureSocket(server)