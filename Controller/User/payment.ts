// import { NextFunction, Request, Response } from 'express';
// import asyncHandler from 'express-async-handler';
// import { userCollection } from '../../Model/userSchema';
// import nodemailer from 'nodemailer';
// import { Otp } from '../../model/otpUser';
// import bcrypt from 'bcrypt';

// import { bmiCollection } from '../../model/bmi';
// import { ObjectId } from 'mongodb';
// import dotenv from 'dotenv'
// import { generaterefreshToken, generateToken } from '../../utils/jwtToken';
// import mongoose from 'mongoose';
// import { foodCollection, FoodDocument } from '../../model/food';
// import { nutriCollection } from '../../model/nutriSchema';
// import { appointmentCollection } from '../../model/appoinments';
// import { ResponseStatus } from '../../constants/statusCodeEnums';
// import { generateOTP } from '../../utils/genOtp';
// import { verifyRefreshToken } from '../../utils/refreshtokenVerify';
// import { generatenewtoken } from '../../utils/newAccessToken';

// dotenv.config()

// // import paypal from  '../../utils/paypal'
// import paypal from '../../utils/paypal'


// interface PayPalError {
//     response: any;
//   }

// interface PayPalPayment {
//     [key: string]: any;
//   }

// export const PaymentController = {

    
//   payPaypal:asyncHandler(async(req:Request,res:Response)=>{
//     const create_payment_json = {
//         "intent": "sale",
//         "payer": {
//           "payment_method": "paypal"
//         },
//         "redirect_urls": {
//           "return_url": "http://localhost:4200/success",  
//           "cancel_url": "http://localhost:4200/cancel"
//         },
//         "transactions": [{
//           "item_list": {
//             "items": [{
//               "name": "item",
//               "sku": "item",
//               "price": "1.00",
//               "currency": "USD",
//               "quantity": 1
//             }]
//           },
//           "amount": {
//             "currency": "USD",
//             "total": "1.00"
//           },
//           "description": "This is the payment description."
//         }]
//     }
//     paypal.payment.create(create_payment_json, (error: PayPalError, payment: PayPalPayment) => {
//         if (error) {
//           console.error(error);
//           res.status(500).json({ error: 'Error creating payment' });
//         } else {
//           for (let i = 0; i < payment.links.length; i++) {
//             if (payment.links[i].rel === 'approval_url') {
//               res.redirect(payment.links[i].href);
//             }
//           }
//         }
//       });
//     }),

//     success: asyncHandler(async (req, res) => {
//         const payerId = req.query.PayerID;
//         const paymentId = req.query.paymentId;
    
//         const execute_payment_json = {
//           "payer_id": payerId,
//           "transactions": [{
//             "amount": {
//               "currency": "USD",
//               "total": "1.00"
//             }
//           }]
//         };
    
//         paypal.payment.execute(paymentId as any, execute_payment_json as any, (error: PayPalError, payment: PayPalPayment) => {
//           if (error) {
//             console.error(error.response);
//             res.status(500).send(error);
//           } else {
//             console.log("Get Payment Response");
//             console.log(JSON.stringify(payment));
//             res.send('Success');
//           }
//         });
//       }),

//       cancel: asyncHandler(async (req, res) => {
//         res.send('Cancelled');
//       })

// }