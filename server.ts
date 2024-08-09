import { userRoute } from "./router/routes";
import { adminRoute } from './router/adminRoutes'
import { nutriRoute } from './router/nutriRoutes'
import { paymentRoute } from "./router/payment";
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
import http from 'http';
const port = 3000;
import dotenv from 'dotenv'
import { connectDatabase } from "./mongo";
import { configureSocket } from "./websocket/websockerIO";

//Websocket code 


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
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

app.use('/payment', paymentRoute);


const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  
});

configureSocket(server)