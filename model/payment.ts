import {Model, Schema,Document, ObjectId, DateUnit } from "mongoose"
const mongoose = require('mongoose')
import { Types } from "mongoose";


export interface PaymentDocument extends Document{
  payment_id: String;
  user_id: Types.ObjectId;
  amount: number;
  appointment_id: Types.ObjectId
  date: Date
}

const paymentSchema:Schema<PaymentDocument> = new Schema({
  payment_id: {type:String,required: true},
  user_id: {type:Schema.Types.ObjectId,required: true},
  amount: {type: Number,required: true},
  appointment_id: {type:Schema.Types.ObjectId,required: true},
  date:{type:Date,default:Date.now},
}) 

export const paymentCollection = mongoose.model('payment',paymentSchema) as Model<PaymentDocument>