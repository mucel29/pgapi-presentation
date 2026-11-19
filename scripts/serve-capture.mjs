import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Local-only export endpoint: accepts only this capture run's bounded filenames.
const output=resolve('public/assets/pathtraced');
await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'0.0.0.0',port:4173,strictPort:true,allowedHosts:['upsilon'],hmr:false},plugins:[{
 name:'actual-pathtraced-capture-export',
 configureServer(vite){vite.middlewares.use('/__capture',async(req,res)=>{
  const name=new URL(req.url,'http://localhost').searchParams.get('name');
  if(req.method!=='POST'||!name||!/^(raw-\d{3}\.webp|guided-\d-004\.webp|guide-(normal|depth|albedo)\.webp|manifest\.json)$/.test(name)){res.writeHead(400);res.end('Invalid capture request');return;}
  try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)throw Error('Capture too large');chunks.push(chunk);}await writeFile(resolve(output,name),Buffer.concat(chunks));res.writeHead(201);res.end('Saved');}
  catch(error){res.writeHead(500);res.end(String(error));}
 });},
}]});
await server.listen();
server.printUrls();
