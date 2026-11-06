export interface Rect{left:number;top:number;width:number;height:number;}
export type PresentationMode='lesson'|'travel'|'explorer'|'capture';
export function rasterSize(rect:Pick<Rect,'width'|'height'>,limit=960){
 const width=Math.min(limit,Math.max(1,Math.round(rect.width))),aspect=rect.width/Math.max(1,rect.height);
 return {width,height:Math.max(1,Math.round(width/aspect))};
}
export function projectedPosition(point:{x:number;y:number;z:number},rect:Rect){
 return {x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2,
  visible:Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.z> -1&&point.z<1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1};
}
/** The world never changes aspect when a teaching card appears or disappears. */
export function presentationLayout(width:number,height:number,mode:PresentationMode='lesson'){
 const compact=width<760,full=mode==='explorer'||mode==='capture';
 const headerHeight=full?0:compact?58:68,footerHeight=full?0:compact?64:72;
 const margin=compact?12:24,cardWidth=Math.min(compact?410:370,width-margin*2);
 const cardHeight=Math.min(compact?340:510,Math.max(140,height-headerHeight-footerHeight-margin*2));
 return {compact,headerHeight,footerHeight,scene:{left:0,top:0,width,height},
  rail:mode==='lesson'?{left:margin,top:height-footerHeight-margin-cardHeight,width:cardWidth,height:cardHeight}:null as Rect|null};
}
