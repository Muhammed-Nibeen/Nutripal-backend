import {Model, Schema,Document, ObjectId } from "mongoose"
const mongoose = require('mongoose')

export interface DailyIntakeDocument extends Document{
  _id: ObjectId,
  program:string
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
}

const dailyIntakeSchema:Schema<DailyIntakeDocument>= new Schema({
  program:{type: String,required: true}, 
  calories:{type: Number,required: true},
  protein:{type: Number,required:true},
  carbs:{type: Number,required: true},
  fats:{type: Number,required: true}
})

export const dailyIntakeCollection = mongoose.model('dailyintake',dailyIntakeSchema) as Model<DailyIntakeDocument>