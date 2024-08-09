import {Model, Schema,Document} from "mongoose"
const mongoose = require('mongoose')

export interface MessageDocument extends Document{
  senderId: string,
  receiverId : string,
  message: string,
  timestamp: Date,
  messagestatus:string
}

const messageSchema:Schema<MessageDocument>=new Schema({
  senderId:{type:String,required: true},
  receiverId:{type:String,required: true},
  message:{type:String,required: true},
  timestamp:{type:Date,default: Date.now},  
  messagestatus:{type:String,default:"unread"}
})

export const Message = mongoose.model('message',messageSchema)as Model<MessageDocument>