import {test,expect} from 'vitest';
import worker from './index';
import {secureDeal} from './random';
import {shuffledDeck} from '../../../packages/engine/src/index';
import type {Env} from './types';
const env={ASSETS:{} as Fetcher} as Env;
test('rechaza origen ajeno y operaciones sin identidad',async()=>{
 const other=await worker.fetch(new Request('https://boliche.example/api/rooms',{method:'POST',headers:{Origin:'https://otro.example','Content-Type':'application/json'},body:'{}'}),env);expect(other.status).toBe(403);
 const unauth=await worker.fetch(new Request('http://localhost/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env);expect(unauth.status).toBe(401);
 const invalid=await worker.fetch(new Request('http://localhost/api/auth/guest',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'}),env);expect(invalid.status).toBe(400);
});
test('JSON acotado y datos personales validados antes de tocar almacenamiento',async()=>{
 for(const body of ['{','x'.repeat(5000),JSON.stringify({nickname:'<script>'}),JSON.stringify({nickname:'a',wallet:100000})]){const response=await worker.fetch(new Request('http://localhost/api/auth/guest',{method:'POST',headers:{'Content-Type':'application/json'},body}),env);expect(response.status).toBe(400);}
});
test('el reparto criptográfico se reproduce exactamente con su semilla privada',()=>{
 const audit=secureDeal();let index=0;const reproduced=shuffledDeck(()=>audit.seed[index++]/4294967296);expect(reproduced).toEqual(audit.order);expect(audit.order).toHaveLength(40);expect(new Set(audit.order).size).toBe(40);expect(index).toBe(audit.seed.length);
});
