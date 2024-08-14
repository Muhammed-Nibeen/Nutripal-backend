import { Model, Schema, Document, Types } from "mongoose";
const mongoose = require('mongoose');

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface PrescriptionDocument extends Document {
  appointmentId: string;
  userId: string;
  nutriId: Types.ObjectId;
  nutriName: string;
  date: Date;
  medications: Medication[];
  details: string;
}

const medicationSchema: Schema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
});

const prescriptionSchema: Schema<PrescriptionDocument> = new Schema({
  appointmentId: { type: String, required: true },
  userId: { type: String, required: true },
  nutriId: { type: Schema.Types.ObjectId, required: true },
  nutriName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  medications: { type: [medicationSchema], required: true },
  details: { type: String, required: true },
});

export const prescriptionCollection = mongoose.model('Prescription', prescriptionSchema) as Model<PrescriptionDocument>;
