import {test,expect} from 'vitest';
import {actionSchema,intentSchema,nicknameSchema,roomCode,codeSchema,roomSchema} from './index';
test('frontera estricta de mensajes y salas',()=>{
 expect(actionSchema.safeParse({type:'PLAY_CARD',cardId:'8E'}).success).toBe(false);expect(actionSchema.safeParse({type:'MAZO',score:99}).success).toBe(false);
 expect(intentSchema.safeParse({type:'ACTION',id:crypto.randomUUID(),seq:0,action:{type:'TRUCO'}}).success).toBe(true);expect(intentSchema.safeParse({type:'CHAT',phrase:6}).success).toBe(false);expect(intentSchema.safeParse({type:'SENA',gesture:'custom'}).success).toBe(false);
 for(let i=0;i<100;i++)expect(codeSchema.safeParse(roomCode()).success).toBe(true);expect(roomSchema.parse({seats:4}).targetScore).toBe(30);expect(nicknameSchema.safeParse('Cacho_7').success).toBe(true);expect(nicknameSchema.safeParse('<script>').success).toBe(false);expect(nicknameSchema.safeParse('nazi').success).toBe(false);
});
