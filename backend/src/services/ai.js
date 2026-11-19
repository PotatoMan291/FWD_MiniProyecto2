import 'dotenv/config';
async function request(url,headers,body){
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 if(!r.ok) throw new Error(`Proveedor IA: HTTP ${r.status}`); return r.json();
}
export async function embed(text,query=false){
 const model=process.env.EMBEDDING_MODEL||'gemini-embedding-001';
 const x=await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,{'x-goog-api-key':process.env.GEMINI_API_KEY},{content:{parts:[{text}]},taskType:query?'RETRIEVAL_QUERY':'RETRIEVAL_DOCUMENT',outputDimensionality:768});
 const v=x.embedding?.values;if(!Array.isArray(v)||!v.length||v.some(n=>!Number.isFinite(n))) throw Error('Embedding inválido');return v;
}
export async function complete(messages){
 const x=await request(`${(process.env.DEEPSEEK_BASE_URL||'https://api.deepseek.com').replace(/\/$/,'')}/chat/completions`,{Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY}`},{model:process.env.DEEPSEEK_MODEL||'deepseek-flash',messages,temperature:0,response_format:{type:'json_object'}});
 return JSON.parse(x.choices[0].message.content);
}
