import {Model, Schema,Document, ObjectId, DateUnit } from "mongoose"
const mongoose = require('mongoose')
import { Types } from "mongoose";



export interface AppointmentDocument extends Document{
  nutri_id:Types.ObjectId;
  user_id:Types.ObjectId;
  date: Date;
  time: String
  end_time: String
  status: String
}

const appoinmentSchema:Schema<AppointmentDocument>= new Schema({
  nutri_id: {type:Schema.Types.ObjectId,required: true},
  user_id: {type:Schema.Types.ObjectId},
  date: {type:Date,required:true},
  time: { type: String, required: true },
  end_time: {type: String,required:true},
  status: {type: String, default:'pending'}
})

export const appointmentCollection = mongoose.model('appointment',appoinmentSchema)as Model<AppointmentDocument>