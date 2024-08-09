import {Model, Schema,Document, ObjectId } from "mongoose"
const mongoose = require('mongoose')

export interface FoodDocument extends Document{
  _id: ObjectId,
  foodName: string,
  kcal: number,
  protein: number,
  carbs: number,
  fats: number,
  category: string,
  portion: string,
  imageUrl: string,
  description: string,
}

const foodSchema:Schema<FoodDocument>= new Schema({
  foodName:{type: String,required: true},
  kcal:{type: Number,required: true},
  protein:{type: Number,required:true},
  carbs:{type: Number,required: true},
  fats:{type: Number,required: true},
  category:{type: String,required: true},
  portion:{type: String,required: true},
  imageUrl:{type: String,required: true},
  description:{type: String,required: true}
})

export const foodCollection = mongoose.model('food',foodSchema) as Model<FoodDocument>