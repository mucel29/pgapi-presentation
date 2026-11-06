// A late async result may only commit while its request is still current.
export class RequestGeneration {
 private generation=0;
 begin(){const generation=++this.generation;return ()=>generation===this.generation;}
 invalidate(){this.generation++;}
}
