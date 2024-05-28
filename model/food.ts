import {Model, Schema,Document, ObjectId } from "mongoose"
const mongoose = require('mongoose')

export interface FoodDocument extends Document{
  foodName: string,
  kcal: number,
  protein: number,
  carbs: number,
  fats: number,
  image: File
}

const foodSchema:Schema<FoodDocument>= new Schema({
  foodName:{type: String,required: true},
  kcal:{type: Number,required: true},
  protein:{type: Number,required:true},
  carbs:{type: Number,required: true},
  fats:{type: Number,required: true},
  image:{type: File,required: true}
})

export const foodCollection = mongoose.model('food',foodSchema) as Model<FoodDocument>