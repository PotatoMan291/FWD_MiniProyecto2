import {Router} from 'express';import jwt from 'jsonwebtoken';import {chat} from '../controllers/chat.controller.js';
export const router=Router();
export function auth(req,res,next){if(process.env.DEMO_MODE==='true'){req.user={id:'demo',rol:'colaborador'};return next();}try{if(!process.env.JWT_SECRET)throw Error();const token=req.headers.authorization?.split(' ')[1];const user=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});if(!user.id||!['colaborador','rrhh','RRHH'].includes(user.rol))throw Error();req.user=user;next();}catch{return res.status(401).json({error:'Sesión inválida'});}}
router.post('/chat',auth,chat);
