// Uso: node render.js <outdir> <start> <end> [step]   (end exclusivo) | node render.js <outdir> list 10,20,30
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const [out,a,b,s]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
  let frames=[];
  if(a==='list')frames=b.split(',').map(Number);else for(let f=+a;f<+b;f+=(+s||1))frames.push(f);
  const br=await chromium.launch({args:['--allow-file-access-from-files','--disable-gpu','--font-render-hinting=none']});
  const pg=await br.newPage({viewport:{width:1080,height:1920}});
  pg.on('console',m=>console.log('[page]',m.text()));pg.on('pageerror',e=>console.log('[err]',e.message));
  await pg.goto('file://'+path.resolve('scene.html'));
  await pg.evaluate(()=>window.init());
  for(const f of frames){const T0=Date.now();
    const d=await pg.evaluate(f=>{window.renderFrame(f);return document.getElementById('c').toDataURL('image/jpeg',.97)},f);
    fs.writeFileSync(path.join(out,String(f).padStart(4,'0')+'.jpg'),Buffer.from(d.split(',')[1],'base64'));console.log(f,Date.now()-T0,"ms");
  }
  await br.close();
})();
