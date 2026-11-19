import {answerPolicy} from '../agents/policies.agent.js';
import * as model from '../models/rag.model.js';
export async function chat(req,res,next){try{const q=req.body?.pregunta;if(typeof q!=='string'||!q.trim()||q.length>2000)return res.status(400).json({error:'Pregunta inválida (1–2000 caracteres)'});
 // Clasificación provisional: reemplazar con el orquestador compartido.
 const start=Date.now();const clean=q.trim();let respuesta;const n=clean.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 if(/\b(mi jefe|mi companer[oa]|gerente general|de otra persona|de juan)\b/.test(n))respuesta='No puedo proporcionar información personal de otra persona.';
 else if(/\b(me quedan|mi saldo|mi proximo pago|mi solicitud|mi evaluacion)\b/.test(n))respuesta='Esta consulta requiere el agente de datos del colaborador, pendiente de integración.';
 else if(/\b(pelicula|receta|futbol)\b/.test(n))respuesta='Solo puedo ayudarte con consultas de Recursos Humanos.';
 if(respuesta){const result={respuesta,agente:'orquestador_demo',escalada:true,citas:[]};await model.log(req.user?.id,clean,result,Date.now()-start,[]);return res.json(result);}
 return res.json(await answerPolicy(clean,req.user?.id));}catch(e){next(e);}}
