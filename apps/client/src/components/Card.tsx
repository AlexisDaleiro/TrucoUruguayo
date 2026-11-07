import {numberOf,suitOf,pieceOf,type Card as CardId} from '../../../../packages/engine/src/index';
import {t} from '../i18n';
import s from './Card.module.css';
import {CardArt} from './CardArt';
export {CardArt} from './CardArt';
export function Card({card,sample,disabled,onPlay,index=0}:{card:CardId;sample:CardId;disabled?:boolean;onPlay:()=>void;index?:number}){
 return <button className={`${s.card} ${pieceOf(card,sample)!==null?s.piece:''}`} style={{'--angle':`${(index-1)*9}deg`} as React.CSSProperties} disabled={disabled} onClick={onPlay} aria-label={`${numberOf(card)} de ${t.suits[suitOf(card)]}`} data-card={card}><CardArt card={card}/></button>;
}
