import {z} from 'zod';
export const cardSchema=z.string().regex(/^(?:[1-7]|10|11|12)[EBOC]$/);
export const actionSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('PLAY_CARD'),cardId:cardSchema}).strict(),
 z.object({type:z.literal('ENVIDO'),bid:z.enum(['E','R','F'])}).strict(),
 ...(['TRUCO','QUIERO','NO_QUIERO','MAZO','FLOR','RESTO','NEXT_HAND'] as const).map(type=>z.object({type:z.literal(type)}).strict())
]);
export const intentSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('ACTION'),id:z.uuid(),seq:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),action:actionSchema}).strict(),
 z.object({type:z.literal('CHAT'),phrase:z.number().int().min(0).max(5)}).strict(),
 z.object({type:z.literal('SENA'),gesture:z.enum(['cejas','beso','nariz','guinoDerecho','guinoIzquierdo','labiosDerecha','menton','labiosIzquierda','cejaIzquierda','morderLabio','bocaAbierta','lengua','ojosCerrados','lamerLabio','cachetes'])}).strict()
]);
export const nicknameSchema=z.string().trim().min(2).max(24).regex(/^[\p{L}\p{N} _-]+$/u).refine(name=>!/(?:put[oa]|mierda|carajo|concha|pija|poronga|culo|nazi|hitler)/i.test(name));
export const roomSchema=z.object({seats:z.union([z.literal(2),z.literal(4)]),targetScore:z.union([z.literal(30),z.literal(40)]).default(30),florEnabled:z.boolean().default(true),environment:z.enum(['galpon','boliche']).optional()}).strict();
export const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const codeSchema=z.string().regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
export function roomCode():string{const a=new Uint8Array(6);crypto.getRandomValues(a);return Array.from(a,n=>alphabet[n%alphabet.length]).join('');}
export const MAX_MESSAGE_BYTES=4096;
export const CHAT_COOLDOWN_MS=1500;
