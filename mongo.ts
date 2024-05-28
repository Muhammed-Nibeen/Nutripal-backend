import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
const MONGO_STR = process.env.MONGO_STR;
const dbName = 'Nutripal'

export async function connectDatabase(){
  try{
    await mongoose.connect(MONGO_STR as string,{
      dbName,
    })
    console.log(`MongoDB connected: ${dbName}`)
  }catch(error){
    console.error('Error connecting to MongoDb:',error)
  }
}
