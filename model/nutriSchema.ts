import {Model, Schema,Document } from "mongoose"
const mongoose = require('mongoose')

export interface NutriDocument extends Document{
  fullName:string,
  email:string,
  specialization: string,
  experience: string,
  password:string
  role:string,
  isblocked:boolean
 }

 const nutriSchema:Schema<NutriDocument>=new Schema({
  fullName:{type:String,required:true},
  email:{type:String,required:true},
  specialization:{type:String,required:true},
  experience:{type:String,required:true},
  password:{type:String,required:true},
  role:{type:String,required:true,default:'Nutritionist'},
  isblocked:{type:Boolean, default:false}
 })

 export const nutriCollection = mongoose.model('nutri', nutriSchema) as Model<NutriDocument>;