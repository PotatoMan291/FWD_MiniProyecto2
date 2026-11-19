import 'dotenv/config';
import {google} from 'googleapis';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const pdf=require('pdf-parse/lib/pdf-parse.js');const XLSX=require('xlsx');const mammoth=require('mammoth');
const auth=new google.auth.GoogleAuth({scopes:['https://www.googleapis.com/auth/drive.readonly']});
export const drive=google.drive({version:'v3',auth});
export async function listFiles(){let all=[],pageToken;do{const {data}=await drive.files.list({q:`'${process.env.DRIVE_FOLDER_ID}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType,modifiedTime,version,webViewLink)',pageSize:100,pageToken});all.push(...data.files);pageToken=data.nextPageToken;}while(pageToken);return all;}
export const supported=f=>['application/pdf','application/vnd.google-apps.document','application/vnd.google-apps.spreadsheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','text/csv'].includes(f.mimeType);
export async function extract(f){let b; if(f.mimeType==='application/vnd.google-apps.document'){const r=await drive.files.export({fileId:f.id,mimeType:'text/plain'},{responseType:'arraybuffer'});return Buffer.from(r.data).toString('utf8');}
 if(f.mimeType==='application/vnd.google-apps.spreadsheet'){const r=await drive.files.export({fileId:f.id,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},{responseType:'arraybuffer'});b=Buffer.from(r.data);}else{const r=await drive.files.get({fileId:f.id,alt:'media'},{responseType:'arraybuffer'});b=Buffer.from(r.data);}
 if(f.mimeType==='application/pdf')return (await pdf(b)).text;
 if(f.mimeType.includes('wordprocessingml'))return (await mammoth.extractRawText({buffer:b})).value;
 if(f.mimeType.includes('spreadsheet')||f.mimeType.includes('sheet')){const wb=XLSX.read(b,{type:'buffer'});return wb.SheetNames.map(n=>`SECCIÓN: ${n}\n`+XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''}).map(r=>r.join(' | ')).join('\n')).join('\n');}return b.toString('utf8');}
