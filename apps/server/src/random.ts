import {shuffledDeck} from '../../../packages/engine/src/index';
/** Private random tape gives a cryptographic, exactly replayable audit seed. */
export function secureDeal(){const seed:number[]=[];const order=shuffledDeck(()=>{const word=new Uint32Array(1);crypto.getRandomValues(word);seed.push(word[0]);return word[0]/4294967296;});return {seed,order,algorithm:'fisher-yates-rejection-u32-v1'};}
