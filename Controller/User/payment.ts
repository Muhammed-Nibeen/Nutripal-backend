import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { userCollection } from '../../Model/userSchema';
import nodemailer from 'nodemailer';
import { Otp } from '../../model/otpUser';
import bcrypt from 'bcrypt';

import { bmiCollection } from '../../model/bmi';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv'
import { generaterefreshToken, generateToken } from '../../utils/jwtToken';
import mongoose from 'mongoose';
import { foodCollection, FoodDocument } from '../../model/food';
import { nutriCollection } from '../../model/nutriSchema';
import { appointmentCollection } from '../../model/appoinments';
import { ResponseStatus } from '../../constants/statusCodeEnums';
import { generateOTP } from '../../utils/genOtp';
import { verifyRefreshToken } from '../../utils/refreshtokenVerify';
import { generatenewtoken } from '../../utils/newAccessToken';
import { paymentCollection } from '../../model/payment';


export const PaymentController = {

  paymentSuccess: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const paymentId = req.body.paymentId
      const userIdS = req.body.userId.id
      const amount = req.body.amount
      const appointmentidS = req.body.appointmentid
      const appointmentId = new mongoose.Types.ObjectId(appointmentidS)
      const userId = new mongoose.Types.ObjectId(userIdS)
      console.log('Thee',paymentId,appointmentId,amount,userId)
      const updatedAppointment = await appointmentCollection.findOneAndUpdate(
        {_id:appointmentId},
        {
          user_id:userId,
          status: 'booked'
        },
        { new: true } 
      )
      if(updatedAppointment){
        const newAppointment={
          payment_id:paymentId,
          user_id: userId,
          amount: amount,
          appointment_id:appointmentId
        }
        await paymentCollection.create(newAppointment)
        res.status(ResponseStatus.OK).json({message:'Appointment booked'})
        return;
      }
        res.status(ResponseStatus.BadRequest).json({error:'Failed to book appointment'})
    }catch{
      res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
    }
  })
}