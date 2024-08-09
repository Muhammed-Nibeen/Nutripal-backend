import {Model, Schema,Document, ObjectId, DateUnit } from "mongoose"
const mongoose = require('mongoose')
import { Types } from "mongoose";


export interface PrescriptionDocument extends Document{
  appointmentId: string;
  userId: string;
  nutriId: Types.ObjectId;
  nutriName: string;
  date: Date;
  medication: string;
  dosage: string;
  frequency: string
  details: string
}

const prescriptionSchema:Schema<PrescriptionDocument> = new Schema({
  appointmentId: {type:String,required: true},
  userId: {type:String,required: true},
  nutriId: {type:Schema.Types.ObjectId,required: true},
  nutriName: {type: String,required:true},
  date:{type:Date,default:Date.now},
  medication: {type:String, required: true},
  dosage: {type:String, required: true},
  frequency: {type:String, required: true},
  details: {type:String, required: true},
}) 

export const prescriptionCollection = mongoose.model('prescription',prescriptionSchema) as Model<PrescriptionDocument>