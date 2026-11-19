// Writes docs/note-prezentare.md from src/content/chapters.ts.
// Run: node --experimental-strip-types scripts/export-notes.mjs
import fs from 'node:fs';
const {chapters,beats}=await import('../src/content/chapters.ts');
const seconds=d=>{const [m,s]=d.split(':').map(Number);return m*60+s;};
const total=chapters.reduce((t,c)=>t+seconds(c.duration),0);
const lines=['# Note de prezentare','',`Generat din \`src/content/chapters.ts\` cu \`node --experimental-strip-types scripts/export-notes.mjs\`. Nu edita acest fișier manual. Editează câmpul \`notes\` din capitol, apoi rulează scriptul din nou.`,'',`Durată estimată: ${Math.round(total/60)} minute, fără întrebări. ${chapters.length} capitole, ${beats.length} pași. Space trece la pasul următor. N deschide aceste note în site.`,''];
lines.push('| # | Capitol | Durată | Pași |','| --- | --- | --- | --- |');
chapters.forEach((c,i)=>lines.push(`| ${i+1} | ${c.title} | ${c.duration} | ${beats.filter(b=>b.chapter===c.id).map(b=>`\`${b.id}\``).join(', ')} |`));
lines.push('');
chapters.forEach((c,i)=>{
 lines.push(`## ${i+1}. ${c.title} (${c.duration})`,'');
 const own=beats.filter(b=>b.chapter===c.id&&b.travel);
 if(own.length)lines.push(`Înainte: deplasare ${own.map(b=>`„${b.title}”`).join(', ')}. Apasă Space o dată ca să sari peste animație.`,'');
 lines.push(`**Pe ecran:** ${c.slide.formula||c.formula}`,'');
 lines.push(...c.notes.split('\n\n').flatMap(p=>[p,'']));
});
fs.writeFileSync('docs/note-prezentare.md',lines.join('\n'));
console.log('docs/note-prezentare.md',lines.length,'lines',Math.round(total/60),'min');
