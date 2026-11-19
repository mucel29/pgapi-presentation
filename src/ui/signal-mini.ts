/** An illustrative signal, deliberately separate from the captured radiance. */
export function signalMiniSvg(kind:'samples'|'temporal'|'denoise',value:number){
 const noise=[.7,-.8,.5,-.3,1,-.6,.25,-.9,.8,-.45,.4,-.7,.9,-.25,.6,-1,.3,-.5,.75,-.2,.8,-.65,.4,-.8,.3,-.6,.95,-.4,.5,-.75,.2,-.5];
 const strength=kind==='denoise'?Math.pow(.42,value):1/Math.sqrt(Math.max(1,value));
 const path=(scale:number)=>noise.map((n,i)=>`${i?'L':'M'}${(8+i*6.5).toFixed(1)},${(72-(i<15?.32:.69)*58-n*19*scale).toFixed(1)}`).join(' ');
 const label=kind==='denoise'?`raw → ${value?'filtru '+value:'raw'}`:kind==='temporal'?`N = ${value}`:`${value} spp`;
 return `<svg viewBox="0 0 220 96" role="img" aria-label="Schemă de semnal: ${kind==='denoise'?'filtrarea reduce variația păstrând marginea':'media reduce variația odată cu numărul de estimări'}. Nu reprezintă măsurători din captură."><text x="8" y="13" class="signal-caption">schemă · ${label}</text><path d="M8 78H212" class="signal-axis"/><path d="${path(1)}" class="signal-raw"/><path d="${path(strength)}" class="signal-result"/><text x="8" y="92" class="signal-key">raw</text><text x="172" y="92" class="signal-key signal-current">${kind==='denoise'?'filtru':'medie'}</text></svg>`;
}
