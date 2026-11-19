export function cosine(a,b){if(a.length!==b.length||!a.length)return -1;let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]**2;bb+=b[i]**2;}return aa&&bb?dot/Math.sqrt(aa*bb):-1;}
export function chunk(text){
 let section='General', buf='', out=[]; const flush=()=>{if(buf.trim())out.push({seccion:section,contenido:buf.trim()});buf='';};
 for(const line of text.replace(/\r/g,'').split('\n')){if(/^(SECCIÓN\s*:|\s*\d+\.\s+)/i.test(line)){flush();section=line.replace(/^(SECCIÓN\s*:|\s*\d+\.\s+)/i,'').trim().slice(0,255);continue;} for(const part of line.match(/.{1,1800}/g)||[]){if(buf.length+part.length>2400){const tail=buf.slice(-250);flush();buf=tail+'\n';}buf+=part+'\n';}}flush();return out;
}
export function rank(rows,v,threshold=.45,k=5){return rows.map(r=>({...r,score:cosine(v,typeof r.embedding==='string'?JSON.parse(r.embedding):r.embedding)})).filter(r=>r.score>=threshold).sort((a,b)=>b.score-a.score).slice(0,k);}
