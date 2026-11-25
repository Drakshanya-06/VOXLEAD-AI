import mongoose from 'mongoose';
export async function connectDB(){
  if(!process.env.MONGODB_URI){ throw new Error('MONGODB_URI is required. Configure backend/.env before starting the API.'); }
  try { await mongoose.connect(process.env.MONGODB_URI); console.log('MongoDB connected'); }
  catch(err){ console.error('MongoDB connection failed:',err.message); throw err; }
}
