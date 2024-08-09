import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { userCollection } from '../../model/userSchema';
import nodemailer from 'nodemailer';
import { Otp } from '../../model/otpUser';
import bcrypt from 'bcrypt';

import { bmiCollection } from '../../model/bmi';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv'
import { generaterefreshToken, generateToken } from '../../utils/jwtToken';
import mongoose from 'mongoose';
import { foodCollection, FoodDocument } from '../../model/food';
import { nutriCollection, NutriDocument } from '../../model/nutriSchema';
import { appointmentCollection } from '../../model/appoinments';
import { ResponseStatus } from '../../constants/statusCodeEnums';
import { generateOTP } from '../../utils/genOtp';
import { verifyRefreshToken } from '../../utils/refreshtokenVerify';
import { generatenewtoken } from '../../utils/newAccessToken';
import { AppointmentDocument } from '../../model/appoinments'
import { Message } from '../../model/message';
import { userProgressCollection } from '../../model/userProgress';
import { dailyIntakeCollection } from '../../model/dailyIntake';
import { paymentCollection } from '../../model/payment';

import PDFDocument from 'pdfkit';
import fs from 'fs';
import { prescriptionCollection } from '../../model/prescription';



dotenv.config()




interface CombinedData {
    appointment: AppointmentDocument
    nutritionist: NutriDocument
}


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
                age: req.body.age,
                sex: req.body.sex,
                phoneNumber: req.body.phoneNumber,
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
            const{fullName,email,password,age,sex,phoneNumber} = JSON.parse(userData)
            const otpRecord = await Otp.findOne({email:email})

            if(otpRecord){
                
                if(otpRecord.otp===enteredOtp){
                    const hashedPassword = await bcrypt.hash(password,10);

                const newUser={
                    fullName,
                    email,
                    age,
                    sex,
                    phoneNumber,
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
            const latestBmiRecord = await bmiCollection.findOne({ user_id: userId }).sort({ created_at: -1 }).select('bmi desweight weight');
            console.log('bmi is ', latestBmiRecord);
            if(latestBmiRecord){
                const bmiValues = latestBmiRecord.bmi
                const desweightValues =latestBmiRecord.desweight
                const weightValues = latestBmiRecord.weight;
                let result
                if (weightValues > desweightValues) {
                    result = 18.5;
                } else if (weightValues < desweightValues) {
                    result = 25.5;
                } else{
                    result = bmiValues
                }
            
            res.status(ResponseStatus.OK).json({message:'Bmi Count',bmiValues,result})
            }else{
            res.status(ResponseStatus.BadRequest).json({error:'Error fetching bmi'})
            }
        }catch(error){
            console.error(error)
            res.status(500).json({error:'Error'})
        }
      }),

      displayFood:asyncHandler(async(req:Request,res:Response)=>{
        console.log(req.body)
        const bmiCount = req.body
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
        const bmiCount = req.body
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
        const bmiCount = req.body
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
            const page = parseInt(req.body.page);
            const limit = parseInt(req.body.limit);
            const skip = (page -1) * limit;
            const nutritionist = await nutriCollection.find().skip(skip).limit(limit);
            const totalcount = await nutriCollection.countDocuments()
            console.log(totalcount,'TC');
            
            res.status(ResponseStatus.OK).json({ message: 'List of nutris', nutritionist,totalcount });
        }catch(error){
            console.error(error)
            res.status(ResponseStatus.BadRequest).json({error:'Error fetching details'})
        }
      }),

      bookAppointment:asyncHandler(async(req:Request,res:Response)=>{
        try{
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
            console.log(req.body);
            
            const isTokenValid = await verifyRefreshToken(refreshToken);
            
            console.log('istokenValid',isTokenValid);
            

            if (!isTokenValid) {
                res.status(ResponseStatus.BadRequest).json({ error: "Invalid refresh token" });
                return
            }
    
            const newAccessToken = await generatenewtoken(refreshToken);
            if (!newAccessToken) {
                res.status(ResponseStatus.BadRequest).json({ error: "Error generating token" });
                return
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
      

    getMessage:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const {userId,nutriId} = req.body
            console.log(req.body)
            const messages = await Message.find({
            $or: [
                {senderId: userId, receiverId:nutriId},
                {senderId: nutriId, receiverId: userId}
            ]
            }).sort({ timestamp:1 })
            // Update message statuses to 'read'
            await Message.updateMany({
                $or: [
                    { senderId: userId, receiverId: nutriId, messagestatus: 'unread' },
                    { senderId: nutriId, receiverId: userId, messagestatus: 'unread' }
                ]
            }, {
                $set: { messagestatus: 'read' }
            });
            console.log('this is fetched',messages);
            res.status(ResponseStatus.OK).json({message:'Successfully fetched the messages',messages})
        }catch(error){
            console.error(error)
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
      }),

      getProfile:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userIdS = req.body.userData.id
            const userId = new mongoose.Types.ObjectId(userIdS)
            const user = await userCollection.findById(userId)
            console.log('This is the userprofile'); 
            res.status(ResponseStatus.OK).json({message:'Successfully fetched the profile',user})
        }catch(error){
            console.error(error)
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
      }),
        
      bookedNutris:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userIdS = req.body.userData.id
            const userId = new mongoose.Types.ObjectId(userIdS)
            const appoinments = await appointmentCollection.find({user_id:userId})
            const combinedData: CombinedData[] = [];
            for(const appointment of appoinments) {
                const nutritionistId = appointment.nutri_id;
                const nutritionist = await nutriCollection.findOne({ _id: new ObjectId(nutritionistId) });
                if(nutritionist){
                    combinedData.push({ appointment, nutritionist });
                }
            }
            res.status(ResponseStatus.OK).json({ message: 'List of nutris', combinedData });
        }catch(error){
            
            res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
        }
      }),


      saveProfile:asyncHandler(async(req:Request,res:Response)=>{
        try{
            const userIdS = req.body.userData.id
            const userId = new mongoose.Types.ObjectId(userIdS)
            const updatedName = req.body.userProfile.fullName
            console.log("User profile updation",req.body)
            const updatedUser = await userCollection.findByIdAndUpdate(userId,{fullName:updatedName })
            if(updatedUser){
                res.status(ResponseStatus.OK).json({ message: 'Updated the UserName' });
            }else{
                res.status(ResponseStatus.OK).json({ message: 'Failed to update the user' });
            }
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({error: 'Internal server error'})
        }
      }),

      startDiet: asyncHandler(async (req: Request, res: Response) => {
        try {
            const userIdS = req.body.userData.id;
            const userId = new mongoose.Types.ObjectId(userIdS);
            const bmiWeight = await bmiCollection.findOne({ user_id: userId }).sort({ created_at: -1 }).select('weight desweight');
            console.log('These are the values', bmiWeight);
    
            const desiredWeight = bmiWeight?.desweight;
            const initialWeight = bmiWeight?.weight;
    
            if (desiredWeight === undefined || initialWeight === undefined) {
                res.status(ResponseStatus.BadRequest).json({ error: 'Weight data is missing' });
                return;
            }
    
            let program = '';
            if (desiredWeight > initialWeight) {
                program = "Weightgain";
            } else if (desiredWeight < initialWeight) {
                program = "Weightloss";
            } else {
                program = "Maintain";
            }
    
            const bmiId = bmiWeight?._id;
            const newProgress = {
                user_id: userIdS,
                bmi_id: bmiId,
                desiredWeight: desiredWeight,
                initialWeight: initialWeight,
                program: program
            };
    
            await userProgressCollection.create(newProgress)
                .then(success => {
                    res.status(ResponseStatus.OK).json({ message: 'Started the diet' });
                })
                .catch(error => {
                    console.log('fail', error);
                    res.status(ResponseStatus.BadRequest).json({ error: 'Failed to create progress' });
                });
        } catch (error) {
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
    }),
    
     userProgress: asyncHandler(async (req: Request, res: Response) => {
        try {
            const userIdS = req.body.userData.id;
            console.log("This is userProgress", userIdS);
            const userId = new mongoose.Types.ObjectId(userIdS);
            const userProgress = await userProgressCollection.findOne({ user_id: userId }).sort({ created_at: -1 });    
            if (!userProgress) {
                res.status(ResponseStatus.BadRequest).json({ error: 'User progress not found' });
                return;
            }
    
            const progressDate = userProgress.date;
            if (!progressDate) {
                res.status(ResponseStatus.BadRequest).json({ error: 'Progress date not found' });
                return;
            }
    
            const currentDate = new Date();
            const daysDifference = calculateDaysDifference(new Date(progressDate), currentDate);
            
            const userProgram = userProgress.program
            console.log("This is the program",userProgram)
            const dailyIntake = await dailyIntakeCollection.findOne({program:userProgram})
            console.log('This is the dailyIntake',dailyIntake)
            res.status(ResponseStatus.OK).json({message:'Number of days',daysDifference,dailyIntake});
        } catch (error) {
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
    }),

    trackProgress: asyncHandler(async(req:Request,res:Response)=>{
        try{
            console.log("enterd",req.body);
            const userIdS = req.body.userData.id;
            const currentDate = new Date(req.body.trackprogress.currentDate);
            const currentWeight = req.body.trackprogress.currentWeight
            console.log("enterd",userIdS,currentDate,currentWeight);
            const updatedProgress = await userProgressCollection.findOneAndUpdate(
                { user_id: userIdS }, 
                {
                    $set: {
                        currentDate: currentDate,
                        currentWeight: currentWeight
                    }
                },
                { new: true, useFindAndModify: false } 
            );
            if (!updatedProgress) {
                res.status(ResponseStatus.BadRequest).json({ message: ' User not updated' });
                return;
            }
    
            const progress = await userProgressCollection.findOne({ user_id: userIdS }).sort({ created_at: -1 });
            console.log("This is the progress collection",progress);
             
            if (!progress) {
                res.status(ResponseStatus.BadRequest).json({ message: 'Progress data not found' });
                return;
            }
            const initialWeight = progress.initialWeight;
            const weightChange = Math.abs(currentWeight - initialWeight);
            console.log("This is the progress collection 2nd",initialWeight,weightChange);
            const initialDate = new Date(progress.date)
            console.log("This is the progress collection 3d",initialDate);
            const numberofDays = calculateDaysDifference(new Date(initialDate), currentDate);
            console.log("This is the progress collection 4th",numberofDays);
            console.log("haya",weightChange,progress,numberofDays);
            
            res.status(ResponseStatus.OK).json({message:'Number of days',weightChange,progress,numberofDays});
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }

    }),

    getBookings: asyncHandler(async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.body.page);
            const limit = parseInt(req.body.limit);
            const skip = (page - 1) * limit;
            const userIdS = req.body.userData?.id;
    
            if (!userIdS) {
                res.status(ResponseStatus.BadRequest).json({ error: 'User ID is required' });
                return
            }
    
            const userId = new mongoose.Types.ObjectId(userIdS);
            const appointments = await paymentCollection.find({ user_id: userId }).skip(skip).limit(limit);
            const totalcount = await paymentCollection.countDocuments({ user_id: userId });
    
            const transformedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const appointmentObjectId = new mongoose.Types.ObjectId(appointment.appointment_id);
                    const prescriptionExists = await prescriptionCollection.exists({ appointmentId: appointmentObjectId });
    
                    const appointmentDetails = await appointmentCollection.findOne({ _id: appointmentObjectId });
                    let date: Date | null = null;
                    let time: string | null = null;
                    let fullName = 'Unknown Nutritionist';
    
                    if (appointmentDetails) {
                        date = appointmentDetails.date;
                        time = appointmentDetails.time.toString();
    
                        const nutritionist = await nutriCollection.findOne({ _id: appointmentDetails.nutri_id });
                        if (nutritionist) {
                            fullName = nutritionist.fullName;
                        }
                    }
                    return {
                        ...appointment.toObject(),
                        displayAppointmentId: `Appt-${appointment.appointment_id.toString().slice(0, 4)}...${appointment.appointment_id.toString().slice(-4)}`,
                        displayPaymentId: `Pay-${appointment.payment_id.slice(0, 4)}...${appointment.payment_id.slice(-4)}`,
                        hasPrescription: !!prescriptionExists,
                        appointmentDate: date,
                        appointmentTime: time,
                        nutritionistName: fullName,
                    };
                })
            );
    
            res.status(ResponseStatus.OK).json({ message: 'Number of days', transformedAppointments, totalcount });
        } catch (error) {
            console.error('Internal server error:', error);
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
    }),
    

    generatePdf: asyncHandler(async(req:Request,res:Response)=>{
        try{
            const appointmentId = req.body.appointmentId
            console.log("body",appointmentId,req.body);
            
            const prescription = await prescriptionCollection.findOne({ appointmentId });
            if (!prescription) {
                res.status(404).json({ message: 'Prescription not found' });
                return
            }
            console.log('this is dwnl',prescription);

            const doc = new PDFDocument();;
            res.setHeader('Content-disposition', `attachment; filename=prescription-${appointmentId}.pdf`);
            res.setHeader('Content-type', 'application/pdf');
    
            doc.pipe(res);
    
            doc.fontSize(18).text('Prescription Details', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Nutritionist: ${prescription.nutriName}`);
            doc.text(`Medication: ${prescription.medication}`);
            doc.text(`Dosage: ${prescription.dosage}`);
            doc.text(`Frequency: ${prescription.frequency}`);
            doc.text(`Details: ${prescription.details}`);
            doc.text(`Date: ${prescription.date.toDateString()}`);
            
            doc.end();

        }catch(error){
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }

    }),

    getavailableslots: asyncHandler(async(req:Request,res:Response)=>{
        try{
            const nutriIdS = req.body.nutritionistId
            const nutriId = new mongoose.Types.ObjectId(nutriIdS)
            console.log('This is the body',nutriId);
            const slots = await appointmentCollection.find({nutri_id:nutriId,status:'pending'})
            if (!slots.length) {
                res.status(ResponseStatus.BadRequest).json({ error: 'There are no slots available' });
                return
            }
            res.status(ResponseStatus.OK).json({ message: 'List of slots', slots });
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
    }),

    getNutriProfile: asyncHandler(async(req:Request,res:Response)=>{
        try{
           const nutriIdS = req.body.nutriId
           const nutriId = new mongoose.Types.ObjectId(nutriIdS)
           const nutri = await nutriCollection.findOne({_id:nutriId})
           
           res.status(ResponseStatus.OK).json({ message: 'List of slots', nutri })
        }catch(error){
            res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error' });
        }
    }),
}

    const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
        const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
        const diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
        return diffDays;
};
