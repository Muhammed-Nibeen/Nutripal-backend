import express, { Router, Request, Response } from 'express';
import { PaymentController } from '../Controller/User/payment';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = express.Router();

router.post('/paymentsuccess',PaymentController.paymentSuccess)

export default router;