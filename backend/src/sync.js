import {sync} from './agents/ingestion.agent.js';import {db} from './config/db.js';try{console.log(await sync());}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.end();}
