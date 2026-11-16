/** Lazy retryable acquisition. Tests inject plain objects; no renderer is loaded. */
export class RetryablePreparation<R extends {dispose():void}>{
 resource:R|null=null;error='';status:'idle'|'preparing'|'ready'|'error'|'cancelled'='idle';
 private pending:Promise<void>|null=null;
 async prepare(load:()=>Promise<()=>R>,configure:(resource:R)=>void,isCurrent:()=>boolean=()=>true):Promise<void>{
  if(this.resource)return;
  if(this.pending){await this.pending;if(isCurrent()&&!this.resource&&this.status==='cancelled')return this.prepare(load,configure,isCurrent);return;}
  this.status='preparing';this.error='';
  const attempt=async()=>{
   let staged:R|null=null;
   try{
    const create=await load();if(!isCurrent()){this.status='cancelled';return;}
    staged=create();configure(staged);
    if(!isCurrent()){this.status='cancelled';return;}
    this.resource=staged;staged=null;this.status='ready';
   }catch(e){this.error=e instanceof Error?e.message:String(e);this.status='error';}
   finally{staged?.dispose();}
  };
  this.pending=attempt();try{await this.pending;}finally{this.pending=null;}
 }
}
