import {  Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { Otp } from '../../model/otpUser';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv'
import { generateToken } from '../../utils/jwtToken';
import { nutriCollection } from '../../model/nutriSchema';
import { ResponseStatus } from '../../constants/statusCodeEnums';
import mongoose from 'mongoose';
import { appointmentCollection } from '../../model/appoinments';
import { userCollection } from '../../model/userSchema';
import { Message } from '../../model/message';
import { prescriptionCollection } from '../../model/prescription';
import { paymentCollection, PaymentDocument } from '../../model/payment';

interface PaymentWithTotalBookings extends PaymentDocument {
    totalBookings?: number;
}

//Otp generator function
const generateOTP = (length: number): string => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes(1)[0] % digits.length;
      OTP += digits[randomIndex];
  }

  return OTP;
};

const sendOtpEmail = async (email:string,otp:string): Promise<void> =>{
  const transporter = nodemailer.createTransport({
      service:"gmail",
      auth:{
          user: "nibiniz339@gmail.com",
          pass:"vfgtouqbqemqffpk"
      }
  })

  const mailOptions = {
      from:process.env.Email_User || '',
      to: email,
      subject: "One-Time Password (Otp) From your health app nurtripal",
      text:`Your Authentication OTP is ${otp}`
  };

  try{
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:',info.response)
  }catch(error){
      console.error('Error sending email:',error);
  }
}

export const NutriController = {
  registerNutri:asyncHandler(async(req: Request,res: Response)=>{
    try{
      console.log(req.body)
      const newNutri={
         fullName: req.body.fullName,
          email: req.body.email,
          specialization: req.body.specialization,
          experience: req.body.experience,
          password: req.body.password
      }
      const emailExists = await nutriCollection.findOne({email:newNutri.email})   
      if(emailExists){
        res.status(ResponseStatus.BadRequest).json({message: 'Email already registered' });
    }else{
        //Generate Otp
        const otp = generateOTP(4)
        console.log(otp)
        await sendOtpEmail(newNutri.email,otp)

        //Saving otp to database
        const otpRecord = await Otp.findOne({email:newNutri.email})
        try{
            if(otpRecord){
                otpRecord.otp = otp;
                await otpRecord.save();
            }else{
                const newOtpRecord = new Otp({otp:otp,email:newNutri.email})
                await Otp.create(newOtpRecord);
            }
        }catch(error){
            console.error('Failed to save Otp',error)
        }
        res.status(ResponseStatus.OK).json({message:'Otp send to mail'})
    }
}   catch(error){
    res.status(500).json({error:'Internel server error'})
} 
  }),

      //Verifing otp
      verifyOtp: asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('This is ',req.body)
            const{userData,enteredOtp} = req.body
            const{fullName,email,specialization,experience,password} = JSON.parse(userData)
            const otpRecord = await Otp.findOne({email:email})

            if(otpRecord){
                
                if(otpRecord.otp===enteredOtp){
                    const hashedPassword = await bcrypt.hash(password,10);

                const newNutri={
                    fullName,
                    email,
                    specialization,
                    experience,
                    password:hashedPassword
                }
                await nutriCollection.create(newNutri)
                .then(success=>{
                    res.status(ResponseStatus.OK).json({message:'Signup successfull'})
                }).catch(error=>{
                    console.log('fail',error)
                })
            }else{
                res.status(ResponseStatus.BadRequest).json({error:'Incorrect OTP'})
            }
        }else{            
            res.status(ResponseStatus.BadRequest).json({message:'OTP is expired'})
        }
    }catch(error){
        res.status(500).json({error:'Failed to register'})
    }
    }),

    //login
    login: asyncHandler(async (req: Request, res: Response) => {
      try{
          const {email,password} = req.body
          const user = await nutriCollection.findOne({email:email})
          if(user){
              const hashedPasswordDb = user.password
              const passwordCheck = await bcrypt.compare(password, hashedPasswordDb)

              if(passwordCheck){
                  if(!user.isblocked){
                  //generate jwt token
                  const token = generateToken( user._id,user.role,process.env.JWT_SECRET as string);
                  res.status(ResponseStatus.OK).json({message:'Login successfull',token,user})
                  }else{
                      res.status(ResponseStatus.BadRequest).json({error:'Account is blocked'})
                  }
              }else{
                  res.status(ResponseStatus.BadRequest).json({error:'Incorrrect password'})
              }
          }else{
              res.status(ResponseStatus.BadRequest).json({error:'Incorrect email and password'})
          }
      }catch(error){
          res.status(500).json({error:'Internal server error'})
      }
}),

    scheduleAppointment: asyncHandler(async (req: Request, res: Response)=>{
        try{
            console.log(req.body.slots);
            
            if(req.body.slots.length > 0){
                const date = req.body.data.date;
                const nutri_idString = req.body.nutri_id.id;
                const nutriId = new mongoose.Types.ObjectId(nutri_idString);
                const slots = req.body.slots; 
                const appointments = slots.map((slot: string) => {
                    const [startTime, endTime] = slot.split(' - ');
                    return {
                        nutri_id: nutriId,
                        date,
                        time: startTime,
                        end_time: endTime,
                        status: 'pending'
                    };
                });
                await appointmentCollection.insertMany(appointments);
                res.status(ResponseStatus.OK).json({message:'Appointment Scheduled'});
            }else{
                res.status(ResponseStatus.BadRequest).json({error:'No slots selected'}) 
            }
        }catch(error){
        res.status(ResponseStatus.BadRequest).json({error:'Internal server error'}) 
        }
    }),

    getAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('Pagination start',req.body);
            const idString = req.body.nutriData.id
            const page = parseInt(req.body.page);
            const limit = parseInt(req.body.limit);
            const skip = (page -1) * limit;
            console.log('pagination 1',idString,page,limit);
            const id = new mongoose.Types.ObjectId(idString)
            const query = {nutri_id:id, status:'booked'}
            const appoinments = await appointmentCollection.find(query).skip(skip).limit(limit)
            const totalcount = await appointmentCollection.countDocuments(query);
        
            console.log('This is appointments',appoinments,totalcount)
            if (!appoinments.length) {
                res.status(ResponseStatus.OK).json({ message: 'No slots booked' });
            } else {
                res.status(ResponseStatus.OK).json({ message: 'Appointments', appoinments, totalcount });
            }
        }
        catch(error){
            res.status(ResponseStatus.OK).json({message:'Appointments fetched'})
        }
    }),

    getUnbookedAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('Pagination start',req.body);
            const idString = req.body.nutriData.id
            const page = parseInt(req.body.page);
            const limit = parseInt(req.body.limit);
            const skip = (page -1) * limit;
            console.log('pagination 1',idString,page,limit);
            const id = new mongoose.Types.ObjectId(idString)
            const query = {nutri_id:id}
            const appoinments = await appointmentCollection.find(query).sort({ _id: -1 }).skip(skip).limit(limit)
            const totalcount = await appointmentCollection.countDocuments(query);
        
            console.log('This is appointments',appoinments,totalcount)
            if (!appoinments.length) {
                res.status(ResponseStatus.OK).json({ message: 'No slots scheduled' });
            } else {
                res.status(ResponseStatus.OK).json({ message: 'Appointments', appoinments, totalcount });
            }
        }
        catch(error){
            res.status(ResponseStatus.OK).json({message:'Appointments fetched'})
        }
    }),

    showuserApp:asyncHandler(async(req:Request,res:Response)=>{
        try{            
        const idS = req.body
        const id = new mongoose.Types.ObjectId(idS)
        console.log('This is the apointid',id);
        const useridS = await appointmentCollection.findById(id).select('user_id')
        const userId = useridS?.user_id
        const user = await userCollection.findById(userId)
        console.log(user);
        res.status(ResponseStatus.OK).json({message:'User',user})
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    getCount:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userId = req.body.user_id
            const nutriId = req.body.nutri_id
            const unreadMessage = await Message.find({
                receiverId: nutriId,
                messagestatus: 'unread'
              });
              
              if (unreadMessage && unreadMessage.length > 0) {
                // Define the type of unreadMessageCounts
                const unreadMessageCounts: { [key: string]: number } = {};
              
                // Iterate over all unread messages
                unreadMessage.forEach(message => {
                  const senderId = message.senderId;
                  if (!unreadMessageCounts[senderId]) {
                    unreadMessageCounts[senderId] = 0;
                  }
                  unreadMessageCounts[senderId]++;
                });
              
                console.log("Unread message counts by userId:", unreadMessageCounts);
                res.status(ResponseStatus.OK).json({message:'List of unread messages',unreadMessageCounts})
            }else{
                console.log("No unread messages found.");
            }
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    deleteAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('This is the req body',req.body)
            const nutriIdS = req.body.nutriData.id
            const appointmentIdS = req.body.appointmentId
            const nutriId = new mongoose.Types.ObjectId(nutriIdS)
            const appointmentId = new mongoose.Types.ObjectId(appointmentIdS)
            await appointmentCollection.findByIdAndDelete(appointmentId);
            const appointment = await appointmentCollection.find({nutri_id:nutriId})

            res.status(ResponseStatus.OK).json({ message: 'Appointment deleted successfully',appointment});
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    updateAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('This is the req body',req.body)
            const { _id: _idS,nutri_id:nutriId,date: dateString, time:time } = req.body.appointment;
            const _id = new mongoose.Types.ObjectId(_idS)
            const date = new Date(dateString);

            const [hours,minutes] = time.split(':').map(Number)
            const endMinutes = (minutes + 30) % 60;
            const endHours = hours + Math.floor((minutes + 30) / 60)
            const end_time = `${endHours.toString().padStart(2,'0')}:${endMinutes.toString().padStart(2,'0')}`

            const updatedAppointment = await appointmentCollection.findByIdAndUpdate(
                _id,
                { date, time,end_time },
                { new: true, runValidators: true }
              );
              console.log('This is the updated body', updatedAppointment);
            const Appointment = await appointmentCollection.find({nutri_id:nutriId})
            res.status(ResponseStatus.OK).json({ message: 'Appointment Edited successfully',Appointment});
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    savePrescription:asyncHandler(async(req:Request,res:Response)=>{
        try {
            const { appointmentId, userId, nutriIdS, medications, details } = req.body;
        
            // Validate if medications is an array and has at least one entry
            if (!Array.isArray(medications) || medications.length === 0) {
               res.status(ResponseStatus.BadRequest).json({ error: 'Medications must be a non-empty array' });
               return
            }
        
            const nutriId = new mongoose.Types.ObjectId(nutriIdS);
            const nutri = await nutriCollection.findOne({ _id: nutriId }, 'fullName');
            const nutriName = nutri ? nutri.fullName : null;
        
            const newPrescription = new prescriptionCollection({
              appointmentId,
              userId,
              nutriId,
              nutriName,
              medications, // Storing the array of medications
              details
            });
            await newPrescription.save();

            const appointmentIdObj = new mongoose.Types.ObjectId(appointmentId)
            const updateStatus = await appointmentCollection.findByIdAndUpdate(appointmentIdObj,{status:'Completed'})
            
            res.status(ResponseStatus.OK).json({ message: 'Prescription sent to user' });
          } catch (error) {
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
          }
        
    }),

    getNameNutri:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const nutriIdS = req.body.nutriId
            console.log('This is the nutriids',nutriIdS);
            
            const nutriId = new mongoose.Types.ObjectId(nutriIdS)
            const nutriNameB = await nutriCollection.findOne({ _id: nutriId }, { _id: 0, fullName: 1 })
            if (nutriNameB) {
                console.log('nutriName:', nutriNameB);
                res.status(ResponseStatus.OK).json({ fullName: nutriNameB.fullName });
              }else{
                res.status(ResponseStatus.BadRequest).json({error:'Nutritionist not found'})
              } 
        }catch(error){
           res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    getNameUser:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userIdS = req.body.userId
            console.log('This is the userids',userIdS);
            const userId = new mongoose.Types.ObjectId(userIdS)
            const userNameB = await userCollection.findOne({ _id: userId }, { _id: 0, fullName: 1 })
            if (userNameB) {
                console.log('nutriName:', userNameB);
                res.status(ResponseStatus.OK).json({ fullName: userNameB.fullName });
              }else{
                res.status(ResponseStatus.BadRequest).json({error:'Nutritionist not found'})
              } 
        }catch(error){
           res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    getRevenue:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log(req.body,'request');
            
            const page = parseInt(req.body.page);
            const limit = parseInt(req.body.limit);
            const skip = (page - 1) * limit;
            const nutriIdS = req.body.nutriData.id
            const nutriId = new mongoose.Types.ObjectId(nutriIdS)
        // Step 1: Calculate total bookings per user
             const totalBookingsPerUser = await paymentCollection.aggregate([
            { $match: { nutri_id: nutriId } },
            {
                $group: {
                    _id: '$user_id',
                    totalBookings: { $sum: 1 },
                },
            },
            ]);

        // Convert totalBookingsPerUser to a dictionary for quick lookup
        const bookingsMap: Record<string, number> = {};
        totalBookingsPerUser.forEach((user) => {
            bookingsMap[user._id.toString()] = user.totalBookings;
        });

        // Step 2: Get the detailed transaction data with pagination
        const revenue = await paymentCollection
            .find({ nutri_id: nutriId })
            .populate({
                path: 'user_id',
                select: 'fullName',
            })
            .skip(skip)
            .limit(limit)
            .lean() as PaymentWithTotalBookings[] // Use lean() to get plain JavaScript objects

        // Step 3: Add totalBookings to each transaction
        revenue.forEach((transaction) => {
            const userIdStr = transaction.user_id._id.toString();
            transaction.totalBookings = bookingsMap[userIdStr] || 0;
        });
            const totalcount = await paymentCollection.countDocuments({nutri_id: nutriId });
          
          console.log('THis is the result',revenue);
          
          res.status(ResponseStatus.OK).json({ revenue,totalcount });
        }catch(error){
           res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    getProfile:asyncHandler(async(req:Request,res:Response)=>{
        try{
            
            const nutriIds = req.body.nutriData.id
            const nutriId = new mongoose.Types.ObjectId(nutriIds)
            const nutritionist = await nutriCollection.findById(nutriId)
            res.status(ResponseStatus.OK).json({ nutritionist })
        }catch(error){
           res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
    }),

    saveProfile:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log(req.body);
            const nuriIdS = req.body.nutriData.id
            const nutriId = new mongoose.Types.ObjectId(nuriIdS)
            const updatedName = req.body.nutriProfile.fullName
            const updatedUser = await nutriCollection.findByIdAndUpdate(nutriId,{fullName:updatedName })
            if(updatedUser){
                res.status(ResponseStatus.OK).json({ message: 'Updated the profile' });
            }else{
                res.status(ResponseStatus.OK).json({ message: 'Failed to update the user' });
            }
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error: 'Internal server error'})
        }
      }),
}   
