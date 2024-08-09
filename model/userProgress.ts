import {Model, Schema,Document, ObjectId } from "mongoose"
const mongoose = require('mongoose')

export interface userProgressDocument extends Document{
  _id: ObjectId
  user_id: string,
  bmi_id: string,
  date: Date,
  currentDate: Date,
  currentWeight: number,
  desiredWeight: number,
  initialWeight: number,
  program: string
}

const userProgressSchema:Schema<userProgressDocument>= new Schema({
  user_id: {type:String,required: true},
  bmi_id: {type:String, required: true},
  date:{type:Date,default:Date.now},
  currentDate:{type:Date},
  currentWeight:{type:Number},
  desiredWeight:{type:Number,required:true},
  initialWeight:{type:Number,required:true},
  program:{type:String}
})

export const userProgressCollection = mongoose.model('userProgress',userProgressSchema) as Model<userProgressDocument>