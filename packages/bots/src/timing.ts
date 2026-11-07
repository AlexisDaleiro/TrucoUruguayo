export function thinkMs(random:()=>number=Math.random,hard=false):number {
 const normal=Math.sqrt(-2*Math.log(Math.max(random(),.00001)))*Math.cos(2*Math.PI*random());
 return Math.max(1200,Math.min(6000,Math.exp((hard?8.15:7.8)+.42*normal)));
}
