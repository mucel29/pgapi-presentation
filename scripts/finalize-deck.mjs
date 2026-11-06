import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
export async function finalizeDeck(){
 const workspace=process.cwd(),runtime=process.env.PRESENTATION_RUNTIME??'/home/mucel/.cache/codex-runtimes/codex-primary-runtime/dependencies';
 const skill=process.env.PRESENTATION_SKILL??'/home/mucel/.codex/plugins/cache/openai-primary-runtime/presentations/26.1030.10813/skills/presentations';
 process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
 process.env.RUNTIME_NODE=path.join(runtime,'node/bin/node');
 const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
 const exists=p=>fs.stat(p).then(()=>true,()=>false);
 const revision=`raytracing-${randomUUID()}`;
 const validatedDir=path.join(workspace,'.build/validated');await fs.mkdir(validatedDir,{recursive:true});
 const validatedPath=path.join(validatedDir,`${revision}.pptx`);
 const result=await finalizePresentation({workspaceDir:workspace,candidatePath:path.join(workspace,'.build/candidate.pptx'),finalPath:validatedPath,explicitTotalSlideCount:17,pythonExecutable:path.join(runtime,'python/bin/python3'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:['DejaVu Sans','DejaVu Sans Mono']},verifyArtifactToolImport:true,receiptPath:path.join(workspace,'.build/qa',`${revision}.validation.json`)});
 const finalPath=path.join(workspace,'output/raytracing.pptx');
 if(await exists(finalPath)){const archive=path.join(workspace,'.build/revisions',revision);await fs.mkdir(archive,{recursive:true});await fs.copyFile(finalPath,path.join(archive,'raytracing.pptx'));}
 const pending=path.join(workspace,'output',`.${revision}.pending`);await fs.copyFile(validatedPath,pending);
 const sha=createHash('sha256').update(await fs.readFile(pending)).digest('hex');if(sha!==result.finalSha256)throw Error('Canonical copy differs from validated PPTX');
 await fs.rename(pending,finalPath);
 const current={...result,finalPath,validatedPath,canonicalCopyVerified:true};
 await fs.writeFile(path.join(workspace,'.build/qa/raytracing-current.validation.json'),JSON.stringify(current,null,2));
 console.log(JSON.stringify({finalPath,validatedPath,sha256:sha,slides:17,package:result.packageIntegrity.status,layoutFindings:result.presentationLayout.findingCount,import:result.firstPartyImport}));return current;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await finalizeDeck();
