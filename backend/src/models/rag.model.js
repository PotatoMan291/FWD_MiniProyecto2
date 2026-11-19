import {db} from '../config/db.js';
export const docs=async()=> (await db.query('SELECT * FROM rag_documents'))[0];
export const rows=async()=> (await db.query('SELECT c.*, d.nombre,d.version,d.url FROM rag_chunks c JOIN rag_documents d USING(drive_id)'))[0];
export const remove=async id=>db.execute('DELETE FROM rag_documents WHERE drive_id=?',[id]);
export async function replace(doc,chunks){const c=await db.getConnection();try{await c.beginTransaction();await c.execute('INSERT INTO rag_documents(drive_id,nombre,version,url,revision) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),version=VALUES(version),url=VALUES(url),revision=VALUES(revision)',[doc.id,doc.name,doc.version,doc.url,doc.revision]);await c.execute('DELETE FROM rag_chunks WHERE drive_id=?',[doc.id]);for(const x of chunks)await c.execute('INSERT INTO rag_chunks(drive_id,seccion,contenido,embedding) VALUES(?,?,?,?)',[doc.id,x.seccion,x.contenido,JSON.stringify(x.embedding)]);await c.commit();}catch(e){await c.rollback();throw e;}finally{c.release();}}
export const token=async()=> (await db.query('SELECT page_token FROM rag_sync_state WHERE id=1'))[0][0]?.page_token;
export const setToken=async t=>db.execute('INSERT INTO rag_sync_state VALUES(1,?) ON DUPLICATE KEY UPDATE page_token=VALUES(page_token)',[t]);
export const log=async(user,q,result,ms,ids)=>db.execute('INSERT INTO rag_logs(colaborador_id,pregunta,agente,fragmentos,latencia_ms,escalada,resuelta) VALUES(?,?,?,?,?,?,?)',[user??null,q,result.agente,JSON.stringify(ids),ms,result.escalada,!result.escalada]);
