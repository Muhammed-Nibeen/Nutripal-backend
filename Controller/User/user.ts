import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { userCollection } from '../../Model/userSchema';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { Otp } from '../../model/otpUser';
import bcrypt from 'bcrypt';

import { bmiCollection } from '../../model/bmi';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv'
import { generateToken } from '../../utils/jwtToken';
import mongoose from 'mongoose';
dotenv.config()

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
            res.status(400).json({error: 'Email already registered' });
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
            res.status(200).json({message:'Otp send to mail'})
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
                    res.status(200).json({message:'Signup successfull'})
                }).catch(error=>{
                    console.log('fail',error)
                })
            }else{
                res.status(400).json({error:'Incorrect OTP'})
            }
        }else{
            
            res.status(400).json({message:'OTP is expired'})
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
                    res.status(200).json({message:'Login successfull',token,user})
                    }else{
                        res.status(400).json({error:'Account is blocked'})
                    }
                }else{
                    res.status(400).json({error:'Incorrrect password'})
                }
            }else{
                res.status(400).json({error:'Incorrect email and password'})
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

                res.status(200).json({message:'Otp send to mail'})
            }else{
                res.status(400).json({error:'Invalid user'})
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
                    res.status(200).json({message:'Otp verification success'})
                }else{
                    res.status(400).json({error:'Incorrect OTP'})
                }
            }else{
                res.status(400).json({message:'OTP is expired'})
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
            res.status(200).json({message:'Password changed successfully'})
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
            res.status(200).json({ message: 'New OTP sent to mail.', email });
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
                res.status(200).json({message:'Bmi calculated'})
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
            res.status(200).json({message:'Bmi Count',bmiValues,result})
        }catch(error){
            console.error(error)
            res.status(500).json({error:'Error'})
        }
      })

//home
//     test:asyncHandler(async(req:Request,res:Response)=>{
//         try{
//             console.log('Request user_id: ',req.user_id)
//             const user = await userCollection.findById(req.user_id)
//             console.log(user)
//         }catch(error){
//             res.status(500).json({error:'Internal server error'})
//         }
//     })

}