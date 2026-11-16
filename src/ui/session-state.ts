/** A queued close event must not release the pause owned by a replacement dialog. */
export class ModalPause {
 private owned=false;
 private prior=false;
 open(paused:boolean){if(!this.owned){this.prior=paused;this.owned=true;}return true;}
 sync(anyOpen:boolean){if(anyOpen)return true;if(!this.owned)return undefined;this.owned=false;return this.prior;}
}
export function traversalSummary(triangle:number,closest:number,complete:boolean){
 const t=Number.isFinite(closest)?closest.toFixed(3):'∞';
 return `${complete?'Final':'În curs'} · ${triangle>=0?`triunghi #${triangle}`:complete?'MISS':'niciun hit de triunghi încă'} · tClosest ${t}`;
}
export function graphicsFeedback(available:boolean,tracing=false){return available?(tracing?'PATH TRACING':'WEBGL 2 · RASTER'):'GRAFICĂ 3D INDISPONIBILĂ · lecția text rămâne accesibilă';}
export function routeHash(chapter:string,beat:string){return `#chapter=${encodeURIComponent(chapter)}&beat=${encodeURIComponent(beat)}`;}
