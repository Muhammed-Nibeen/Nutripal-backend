import express, { Router, Request, Response } from 'express';
import { NutriController } from '../Controller/Nutri/nutri';

const router: Router = express.Router();

router.post('/signup', NutriController.registerNutri);
router.post('/signup/verify-otp', NutriController.verifyOtp)
router.post('/login',NutriController.login)
export const nutriRoute = router