import {  Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { Otp } from '../../model/otpUser';
import bcrypt from 'bcrypt';



import dotenv from 'dotenv'
import { generateToken } from '../../utils/jwtToken';
import { nutriCollection } from '../../model/nutriSchema';
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
          password: req.body.password
      }
      const emailExists = await nutriCollection.findOne({email:newNutri.email})   
      if(emailExists){
        res.status(400).json({message: 'Email already registered' });
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
            console.log('This is ',req.body)
            const{userData,enteredOtp} = req.body
            const{fullName,email,password} = JSON.parse(userData)
            const otpRecord = await Otp.findOne({email:email})

            if(otpRecord){
                
                if(otpRecord.otp===enteredOtp){
                    const hashedPassword = await bcrypt.hash(password,10);

                const newNutri={
                    fullName,
                    email,
                    password:hashedPassword
                }
                await nutriCollection.create(newNutri)
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
          const user = await nutriCollection.findOne({email:email})
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
}