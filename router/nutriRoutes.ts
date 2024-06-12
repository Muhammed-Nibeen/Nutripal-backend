import express, { Router, Request, Response } from 'express';
import { NutriController } from '../Controller/Nutri/nutri';

const router: Router = express.Router();

router.post('/signup', NutriController.registerNutri);
router.post('/signup/verify-otp', NutriController.verifyOtp)
router.post('/login',NutriController.login)
router.post('/scheduleappointment',NutriController.scheduleAppointment)
router.post('/getappointment',NutriController.getAppointment)
router.post('/showuserapp',NutriController.showuserApp)

export const nutriRoute = router