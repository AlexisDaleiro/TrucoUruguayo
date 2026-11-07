import rawCatalog from '../catalog.json';
import {levelForXp} from './economy';
export type Category='character'|'environment'|'cardSkin'|'table'|'quickPhrases'|'voicePack';
export interface CatalogItem{id:string;category:Category;nameKey:string;unlock:{type:'default'|'level'|'iap';level?:number};assets:string;variants:string[];iapProductId:string|null;}
export const catalog=rawCatalog as CatalogItem[];
export function ownsItem(item:CatalogItem,xp:number,inventory:readonly string[]){return item.unlock.type==='default'||item.unlock.type==='level'&&levelForXp(xp).level>=(item.unlock.level??1)||inventory.includes(item.id);}
export function equip(loadout:Record<string,string>,id:string,xp:number,inventory:readonly string[],variant?:string){const item=catalog.find(entry=>entry.id===id);if(!item||!ownsItem(item,xp,inventory)||variant&&!item.variants.includes(variant))throw Error('ITEM_LOCKED');return {...loadout,[item.category]:id,...(variant?{[`${item.category}Variant`]:variant}:{})};}
