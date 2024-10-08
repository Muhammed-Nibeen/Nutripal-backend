import {Model, Schema,Document } from "mongoose"
const mongoose = require('mongoose')

 export interface UserDocument extends Document{
  fullName:string,
  email:string,
  age:number,
  phoneNumber:number,
  sex:string
  password:string
  role:string,
  isblocked:boolean
 }

 const userSchema:Schema<UserDocument>=new Schema({
  fullName:{type:String,required:true},
  email:{type:String,required:true},
  age:{type:Number,required:true},
  phoneNumber:{type:Number,required:true},
  sex:{type:String,required:true},
  password:{type:String,required:true},
  role:{type:String,required:true,default:'User'},
  isblocked:{type:Boolean, default:false}
 })

export const userCollection = mongoose.model('user', userSchema) as Model<UserDocument>;

