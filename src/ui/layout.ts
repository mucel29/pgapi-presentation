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
/** CSS-pixel rectangles shared by the DOM and the canvas projection. */
export function presentationLayout(width:number,height:number,mode:PresentationMode='lesson'){
 const compact=width<1050,full=mode==='explorer'||mode==='capture';
 const headerHeight=full?0:Math.min(compact?64:72,Math.floor(height*.16));
 const footerHeight=full?0:Math.min(compact?72:80,Math.floor(height*.18));
 const available=Math.max(1,height-headerHeight-footerHeight);
 if(mode!=='lesson')return {compact,headerHeight,footerHeight,scene:{left:0,top:headerHeight,width,height:available},rail:null as Rect|null};
 if(!compact){const railWidth=Math.round(Math.min(520,Math.max(400,width*.38)));return {compact,headerHeight,footerHeight,rail:{left:0,top:headerHeight,width:railWidth,height:available},scene:{left:railWidth,top:headerHeight,width:width-railWidth,height:available}};}
 const sceneHeight=Math.min(360,Math.max(180,Math.round(height*.38)),Math.floor(available*.55));
 return {compact,headerHeight,footerHeight,scene:{left:0,top:headerHeight,width,height:sceneHeight},rail:{left:0,top:headerHeight+sceneHeight,width,height:available-sceneHeight}};
}
