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

dotenv.config()




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

export const UserController = {
    // getUserPost
    registerUser: asyncHandler(async (req: Request, res: Response) => {
        
        try {
            console.log(req.body)
            const newUser={
               fullName: req.body.fullName,
                email: req.body.email,
                password: req.body.password
            }
        const emailExists = await userCollection.findOne({email:newUser.email})   
        if(emailExists){
            res.status(ResponseStatus.BadRequest).json({error: 'Email already registered' });
        }else{
            //Generate Otp
            const otp = generateOTP(4)
            console.log(otp)
            await sendOtpEmail(newUser.email,otp)

            //Saving otp to database
            const otpRecord = await Otp.findOne({email:newUser.email})
            try{
                if(otpRecord){
                    otpRecord.otp = otp;
                    await otpRecord.save();
                }else{
                    const newOtpRecord = new Otp({otp:otp,email:newUser.email})
                    await Otp.create(newOtpRecord);
                }
            }catch(error){
                console.error('Failed to save Otp',error)
            }
            res.status(ResponseStatus.OK).json({message:'Otp send to mail'})
        }
    }   catch(error){
        console.error(error)
        res.status(500).json({error:'Internel server error'})
    }    
    }),

    //Verifing otp
    verifyOtp: asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log('This is sucess',req.body)
            const{userData,enteredOtp} = req.body
            const{fullName,email,password} = JSON.parse(userData)
            const otpRecord = await Otp.findOne({email:email})

            if(otpRecord){
                
                if(otpRecord.otp===enteredOtp){
                    const hashedPassword = await bcrypt.hash(password,10);

                const newUser={
                    fullName,
                    email,
                    password:hashedPassword
                }
                await userCollection.create(newUser)
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
        console.log(error);
        res.status(500).json({error:'Failed to register'})
    }
    }),
            
//login
    login: asyncHandler(async (req: Request, res: Response) => {
        try{
            const {email,password} = req.body
            const user = await userCollection.findOne({email:email})
            if(user){
                const hashedPasswordDb = user.password
                const passwordCheck = await bcrypt.compare(password, hashedPasswordDb)

                if(passwordCheck){
                    if(!user.isblocked){
                    //generate jwt token
                    const token = generateToken( user._id,user.role,process.env.JWT_SECRET as string);
                    const refreshToken = generaterefreshToken( user._id,user.role,process.env.JWT_SECRET as string);
                    res.status(ResponseStatus.OK).json({message:'Login successfull',token,user,refreshToken})
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
            console.error(error)
            res.status(500).json({error:'Internal server error'})
        }
}),

    //Forgot password

    forgotpass:asyncHandler (async (req: Request,res: Response) => {
        try{
            console.log('Entered')
            console.log("EmAIL",req.body)
            const email = req.body.email
            const valid = await userCollection.findOne({email:email})
            if(valid){
                //Generate Otp
                const otp = generateOTP(4)
                console.log(otp)
                await sendOtpEmail(email,otp)

                //Saving to db
                const otpRecord = await Otp.findOne({email:email})
                try{
                    if(otpRecord){
                        otpRecord.otp = otp;
                        await otpRecord.save();
                    }else{
                        const newOtpRecord = new Otp({otp:otp,email:email})
                        await Otp.create(newOtpRecord);
                    }
                }catch(error){
                    console.error('Failed to save Otp',error)
                }

                res.status(ResponseStatus.OK).json({message:'Otp send to mail'})
            }else{
                res.status(ResponseStatus.BadRequest).json({error:'Invalid user'})
            }
        }catch(error){
            res.status(500).json({error:'Internal server error'})
        }
    }),

    forgotverifyOtp:asyncHandler(async(req:Request,res:Response) => {
        try{
            console.log(req.body)
            const enteredOtp = req.body.otp
            const email = JSON.parse(req.body.email).email;
            console.log('email is ',email)
            console.log('otp',enteredOtp)
            const otpRecord = await Otp.findOne({email:email})

            if(otpRecord){
                if(otpRecord.otp === enteredOtp){
                    res.status(ResponseStatus.OK).json({message:'Otp verification success'})
                }else{
                    res.status(ResponseStatus.BadRequest).json({error:'Incorrect OTP'})
                }
            }else{
                res.status(ResponseStatus.BadRequest).json({message:'OTP is expired'})
            }

        }catch(error){
            console.log(error);
            res.status(500).json({error:'Failed to Change Password'})
        }


    }),

    changePassword:asyncHandler(async(req: Request,res: Response)=>{
        try{
            const newPassword = req.body.newPassword
            const email = JSON.parse(req.body.email).email;
            const hashedPasswordNew = await bcrypt.hash(newPassword,10);
            console.log(newPassword)
            const result = await userCollection.updateOne(
                {email:email},
                {$set:{password:hashedPasswordNew}}
            )
            res.status(ResponseStatus.OK).json({message:'Password changed successfully'})
        }catch(error){
            console.log(error);
            res.status(500).json({error:'Failed to Change Password'})
        }
    }),

    resendOtp:asyncHandler(async(req:Request,res:Response)=>{
        try{
          console.log("This is final",req.body.email)
          const {email} = req.body
          const otp = generateOTP(4)
          console.log(otp)
          await sendOtpEmail(email,otp)

            // Saving OTP to database
            const otpRecord = await Otp.findOne({ email:email });
            try {
                if (otpRecord) {
                    console.log('OTP record not saved in MongoDB');
                    await Otp.deleteOne({  email:email  });
                }else{
                    const newOtpRecord = new Otp({ otp:otp, email:email });
                    await Otp.create(newOtpRecord);
                    console.log('New OTP saved in MongoDB');
                }
            } catch (error) {
                console.error('Failed to save OTP:', error);
            }
            res.status(ResponseStatus.OK).json({ message: 'New OTP sent to mail.', email });
        }catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
      }),
    

      bmiCalculation:asyncHandler(async(req:Request,res:Response, next:NextFunction)=>{
        try{
            console.log("This is Userbody",req.body)

            const userIdString = req.body.userData.id;
            const user_id = new mongoose.Types.ObjectId(userIdString)
            console.log('This is data',userIdString)
            console.log('This is data',user_id)
            const desweight = req.body.bmiDetails.desweight
            const weight = req.body.bmiDetails.weight
            const height = req.body.bmiDetails.height
            const heightsqrt = height*height
            const age = req.body.bmiDetails.age
            let bmi = weight/heightsqrt
            bmi = parseFloat(bmi.toFixed(2));
            console.log("bmi is",bmi)
            const newBmi={
                user_id,
                age,
                height,
                weight,
                bmi,
                desweight
            }
            await bmiCollection.create(newBmi)
            .then(success=>{
                res.status(ResponseStatus.OK).json({message:'Bmi calculated'})
            }).catch(error=>{
                console.log('fail',error)
            })
        }catch(error){
            res.status(500).json({ error: 'Internal server error' });
        }
      }),

      showBmi:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userId = new mongoose.Types.ObjectId(req.body.id)

            console.log('This is the data',req.body)
            console.log('This is the id',userId)
            const bmiRecords = await bmiCollection.find({ user_id: userId }).select('bmi');
            console.log('bmi is ', bmiRecords);
            const bmiValues = bmiRecords.map(record => record.bmi);
        
            const desweight = await bmiCollection.find({user_id: userId}).select('desweight')
            const desweightValues = desweight.map(record => record.desweight)
            const weight = await bmiCollection.find({user_id: userId}).select('weight')
            const weightValues = weight.map(record => record.weight)
            let result = bmiValues
            if (weightValues.length > 0 && desweightValues.length > 0) {
                const weight = weightValues[0];
                const desweight = desweightValues[0];
    
                if (weight > desweight) {
                    result = [18.5];
                } else if (weight < desweight) {
                    result = [25.5];
                }
            }
            res.status(ResponseStatus.OK).json({message:'Bmi Count',bmiValues,result})
        }catch(error){
            console.error(error)
            res.status(500).json({error:'Error'})
        }
      }),

      displayFood:asyncHandler(async(req:Request,res:Response)=>{
        console.log(req.body)
        const bmiCount = req.body[0]
        console.log("This is the bmi count ",bmiCount)
        let food:FoodDocument[]
        if(bmiCount<=18.5){
            food = await foodCollection.find({category:"breakfast",portion:"light"}).limit(3)
            
        }else if(bmiCount>=18.5){
            food = await foodCollection.find({category:"breakfast",portion:"heavy"}).limit(3) 
        }else{
            food = await foodCollection.find({category:"breakfast",portion:"moderate"}).limit(3) 
        }
        res.status(ResponseStatus.OK).json({message:'Food items ',food})
      }),

      displayLunch:asyncHandler(async(req:Request,res:Response)=>{
        console.log(req.body)
        const bmiCount = req.body[0]
        console.log("This is the bmi count ",bmiCount)
        let food:FoodDocument[]
        if(bmiCount<=18.5){
            food = await foodCollection.find({category:"lunch",portion:"light"}).limit(3)
            
        }else if(bmiCount>=18.5){
            food = await foodCollection.find({category:"lunch",portion:"heavy"}).limit(3) 
        }else{
            food = await foodCollection.find({category:"lunch",portion:"moderate"}).limit(3) 
        }
        res.status(ResponseStatus.OK).json({message:'Food items ',food})
      }),

      displayDinner:asyncHandler(async(req:Request,res:Response)=>{
        console.log(req.body)
        const bmiCount = req.body[0]
        console.log("This is the bmi count ",bmiCount)
        let food:FoodDocument[]
        if(bmiCount<=18.5){
            food = await foodCollection.find({category:"dinner",portion:"light"}).limit(3)
            
        }else if(bmiCount>=18.5){
            food = await foodCollection.find({category:"dinner",portion:"heavy"}).limit(3) 
        }else{
            food = await foodCollection.find({category:"dinner",portion:"moderate"}).limit(3) 
        }
        res.status(ResponseStatus.OK).json({message:'Food items ',food})
      }),

      getNutris: asyncHandler(async(req:Request,res:Response)=>{
        try{
            const appointments = await appointmentCollection.find()
            const nutritionistPromises = appointments.map(async (appointment) => {
                const nutritionistId = appointment.nutri_id;
                const nutritionist = await nutriCollection.findOne({ _id: new ObjectId(nutritionistId) });
                return {...appointment, nutritionist };
            });
            const combinedData = await Promise.all(nutritionistPromises);
            console.log(combinedData);
            // const nutriIds = appointment.map(appointment => appointment.nutri_id.toString());
            // console.log(nutriIds)
            // const nutritionist = await nutriCollection.find()
            res.status(ResponseStatus.OK).json({message:'List of nutris',combinedData})
            console.log(appointments)
        }catch(error){
            console.error(error)
            res.status(ResponseStatus.BadRequest).json({error:'Error fetching details'})
        }
      }),

      bookAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log(req.body)
            const appoinmentS=req.body.id
            const userIdS = req.body.userId.id
            const appointmentId = new mongoose.Types.ObjectId(appoinmentS)
            const userId = new mongoose.Types.ObjectId(userIdS)
            const updatedAppointment = await appointmentCollection.findOneAndUpdate(
                {_id:appointmentId},
                {
                    user_id:userId,
                    status: 'booked'
                }
            )
            if(!updatedAppointment){
                res.status(ResponseStatus.OK).json({message:'Appointment not booked'})
            }
            res.status(ResponseStatus.OK).json({message:'Appointment booked'})
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
      }),

      refreshToken:asyncHandler(async (req: Request, res: Response) => {
        try {
            const  refreshToken  = req.body;
            if (!refreshToken) {
                res.status(ResponseStatus.BadRequest).json({ error: 'Refresh token is missing' }); 
            }
    
            const isTokenValid = await verifyRefreshToken(refreshToken);
    
            if (!isTokenValid) {
                res.status(ResponseStatus.BadRequest).json({ error: "Invalid refresh token" });
            }
    
            const newAccessToken = await generatenewtoken(refreshToken);
            if (!newAccessToken) {
                res.status(ResponseStatus.BadRequest).json({ error: "Error generating token" });
            }
            console.log('New token created:', newAccessToken);
            res.status(ResponseStatus.OK).json({
                accessToken: newAccessToken,
                message: "Token refreshed",
            });
        }catch(error) {
            console.error(error);
           
        }
    }),

    getUser:asyncHandler(async(req:Request,res:Response)=>{
    try{
        const userid = req.params.userid
        const user = await userCollection.findById(userid)
        console.log("This is the guard",user)
        res.status(ResponseStatus.OK).json({message:'Succcessfully fetched data',user})
    }catch(error){
        console.error(error)
        res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
      }),
      
      //Payment routes

        
}
