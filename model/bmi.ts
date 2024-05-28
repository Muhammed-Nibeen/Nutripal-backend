import {Model, Schema,Document, ObjectId } from "mongoose"
const mongoose = require('mongoose')
import { Types } from "mongoose";

export interface BmiDocument extends Document{
  user_id: Types.ObjectId;
  age: number,
  height: number,
  weight: number,
  bmi: number,
  desweight: number
}

const bmiSchema:Schema<BmiDocument>= new Schema({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  age: {type:Number,required:true},
  height: {type:Number,required:true},
  weight: {type:Number,required:true},
  bmi: {type:Number,required: true},
  desweight: {type:Number,required:true}
})

export const bmiCollection = mongoose.model('bmi',bmiSchema) as Model<BmiDocument>