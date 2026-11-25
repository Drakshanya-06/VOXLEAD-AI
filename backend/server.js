import 'dotenv/config';
import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import rateLimit from 'express-rate-limit';
import {connectDB} from './config/db.js'; import api from './routes/api.js';
const app=express(); app.use(helmet()); app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'})); app.use(express.json({limit:'1mb'})); app.get('/api/health',(req,res)=>res.json({status:'ok',service:'VOXLEAD AI API'}));
app.use('/api',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}),api);
const port=process.env.PORT||7000; connectDB().then(()=>app.listen(port,()=>console.log(`VOXLEAD API running on http://localhost:${port}`))).catch(()=>process.exit(1));
