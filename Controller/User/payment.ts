import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { appointmentCollection, AppointmentDocument } from '../../model/appoinments';
import { ResponseStatus } from '../../constants/statusCodeEnums';
import { paymentCollection } from '../../model/payment';
import { nutriCollection, NutriDocument } from '../../model/nutriSchema';
import { ObjectId } from 'mongodb';

interface CombinedData {
  
  appointment: AppointmentDocument
  nutritionist: NutriDocument
  
}

export const PaymentController = {

  paymentSuccess: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const paymentId = req.body.paymentId
      const userIdS = req.body.userId.id
      const amount = req.body.amount
      const appointmentidS = req.body.appointmentid
      const nutriId = req.body.nutriId
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
      const appointment = await appointmentCollection.findOne({_id:appointmentId})
      console.log("Payment success",appointment)
      if(updatedAppointment){
        const newAppointment={
          payment_id: paymentId,
          nutri_id: nutriId,
          user_id: userId,
          amount: amount,
          appointment_id:appointmentId
        }
        await paymentCollection.create(newAppointment)

        const nutritionist = await nutriCollection.find();
        res.status(ResponseStatus.OK).json({message:'Appointment booked ',nutritionist})
      }
    }catch{
        res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
    }
  })
}