import {drive,listFiles,supported,extract} from '../services/drive.js';
import {chunk} from '../services/retrieval.js';import {embed} from '../services/ai.js';import * as model from '../models/rag.model.js';
let running=false;
export async function sync(){if(running)throw Error('Ya hay una sincronización en curso');running=true;try{
 if(!process.env.DRIVE_FOLDER_ID)throw Error('Falta DRIVE_FOLDER_ID');
 let t=await model.token();let changes=0;let next;
 if(t){try{let page=t;do{const {data}=await drive.changes.list({pageToken:page,fields:'nextPageToken,newStartPageToken,changes(fileId,removed)',pageSize:100});changes+=data.changes?.length||0;page=data.nextPageToken;next=data.newStartPageToken||next;}while(page);}catch(e){if(e.code!==410)throw e;}}
 if(!next)next=(await drive.changes.getStartPageToken()).data.startPageToken;
 // Reconciliar toda la carpeta evita perder archivos movidos o borrados.
 const files=(await listFiles()).filter(supported);const old=await model.docs();const ids=new Set(files.map(f=>f.id));let updated=0,deleted=0;
 for(const f of files){const revision=String(f.version||f.modifiedTime);if(old.some(d=>d.drive_id===f.id&&d.revision===revision))continue;const text=await extract(f);const parts=chunk(text);if(!parts.length)throw Error(`Documento sin texto: ${f.name}`);const chunks=[];for(const x of parts)chunks.push({...x,embedding:await embed(x.contenido)});await model.replace({id:f.id,name:f.name,version:text.match(/Versi[oó]n\s*:\s*([\d.]+)/i)?.[1]||'No indicada',url:f.webViewLink||`https://drive.google.com/open?id=${f.id}`,revision},chunks);updated++;}
 for(const d of old)if(!ids.has(d.drive_id)){await model.remove(d.drive_id);deleted++;}await model.setToken(next);return {documentos:files.length,actualizados:updated,eliminados:deleted,cambiosDrive:changes};
 }finally{running=false;}}
