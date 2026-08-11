const $=id=>document.getElementById(id);
const corpus=["01_boundary_max.png","02_integer_overflow_candidate.png","03_invalid_ihdr_crc.png","04_bad_signature.png","05_truncated_giant_text.png","06_zero_width.png","07_zero_height.png","08_invalid_color_type.png"];
const descriptions={
"01_boundary_max.png":"Maximum PNG width boundary; header-only fixture.",
"02_integer_overflow_candidate.png":"Arithmetic stress case for width × height × RGB byte calculations.",
"03_invalid_ihdr_crc.png":"IHDR CRC intentionally corrupted.",
"04_bad_signature.png":"PNG signature intentionally corrupted.",
"05_truncated_giant_text.png":"Chunk declares a huge length but the input is truncated.",
"06_zero_width.png":"Zero-width dimension boundary.",
"07_zero_height.png":"Zero-height dimension boundary.",
"08_invalid_color_type.png":"Invalid IHDR color type boundary."
};
const map={0:"accepted",1:"bad signature",2:"too short",3:"invalid IHDR",4:"CRC mismatch",5:"truncated chunk",6:"invalid dimensions/color",'-1':"runtime error"};
let wasm=null,deferred=null,last=[],selectedBytes=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hexByte=n=>n.toString(16).padStart(2,'0').toUpperCase();
const hex32=n=>n.toString(16).padStart(8,'0').toUpperCase();

function hexDump(bytes,max=512){const n=Math.min(bytes.length,max),lines=[];for(let i=0;i<n;i+=16){const row=bytes.slice(i,Math.min(i+16,n));const h=[...row].map(hexByte).join(' ').padEnd(47,' ');const a=[...row].map(x=>(x>=32&&x<127)?String.fromCharCode(x):'.').join('');lines.push(i.toString(16).padStart(8,'0').toUpperCase()+'  '+h+'  '+a)}if(bytes.length>max)lines.push(`… ${bytes.length-max} more bytes`);return lines.join('\n')}

function crc32(bytes){let table=crc32.table;if(!table){table=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0}crc32.table=table}let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function read32(b,p){return ((b[p]<<24)|(b[p+1]<<16)|(b[p+2]<<8)|b[p+3])>>>0}
function inspectPNG(bytes){
 const rows=[];let validSig=bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>bytes[i]===v);let pos=8;
 if(!validSig){rows.push({offset:0,type:'SIGNATURE',length:8,crc:'—',state:'BAD'});return {validSig,rows}};
 while(pos+12<=bytes.length){const len=read32(bytes,pos),typeBytes=bytes.slice(pos+4,pos+8),type=new TextDecoder().decode(typeBytes);const dataStart=pos+8,dataEnd=dataStart+len,crcPos=dataEnd,stored=crcPos+4<=bytes.length?read32(bytes,crcPos):null;let state='OK';if(dataEnd+4>bytes.length)state='TRUNCATED';else{const calc=crc32(bytes.slice(pos+4,dataEnd));if(calc!==stored)state='CRC BAD'}rows.push({offset:pos,type,length:len,crc:stored===null?'—':hex32(stored),state});if(type==='IEND'||dataEnd+4>bytes.length)break;pos=dataEnd+4}
 return {validSig,rows}
}

async function sha256(bytes){if(!crypto?.subtle)return 'WebCrypto unavailable';const h=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(h)].map(hexByte).join('').toLowerCase()}

async function scan(name,b){const t=performance.now();try{const mem=wasm.instance.exports.memory,ptr=4096;if(ptr+b.length>mem.buffer.byteLength)throw new Error('Input exceeds WASM memory window');new Uint8Array(mem.buffer,ptr,b.length).set(b);const c=wasm.instance.exports.png_scan(ptr,b.length);const analysis=inspectPNG(b);const digest=await sha256(b);return{file:name,status:c===0?'accepted':'rejected',code:c,width:wasm.instance.exports.png_width()||null,height:wasm.instance.exports.png_height()||null,detail:map[c]||'unknown',chunks:analysis.rows.length,signature:analysis.validSig,sha256:digest,bytes:b.length,ms:performance.now()-t}}catch(e){return{file:name,status:'runtime-error',code:-1,detail:e.message,ms:performance.now()-t}}}

function render(){
 $('fileCount').textContent=last.length;$('accepted').textContent=last.filter(x=>x.status==='accepted').length;$('rejected').textContent=last.filter(x=>x.status==='rejected').length;$('errors').textContent=last.filter(x=>x.status==='runtime-error').length;
 $('rows').innerHTML=last.map(r=>{const cls=r.status==='accepted'?'accepted':r.status==='rejected'?'rejected':'error';return `<tr><td>${esc(r.file)}</td><td><span class="status ${cls}">${r.status.toUpperCase()}</span></td><td>${r.width&&r.height?r.width+' × '+r.height:'—'}</td><td>${r.code}: ${esc(r.detail)}</td><td>${r.signature?'signature OK':'signature BAD'} · ${r.sha256?r.sha256.slice(0,12)+'…':'—'}</td><td>${Number(r.ms||0).toFixed(2)} ms</td></tr>`}).join('');
}

async function inspectFile(name,b){selectedBytes=b;$('selectedName').textContent=`${name} · ${b.length} B`;$('hex').textContent=hexDump(b);const a=inspectPNG(b);$('chunkSummary').textContent=`${a.rows.length} chunk record(s)`;$('chunks').innerHTML=a.rows.map(r=>`<tr><td>0x${r.offset.toString(16).padStart(8,'0').toUpperCase()}</td><td><b>${esc(r.type)}</b></td><td>${r.length}</td><td>${r.crc}</td><td class="${r.state==='OK'?'ok':r.state==='CRC BAD'?'bad':'warn'}">${r.state}</td></tr>`).join('')}

async function runFiles(list){const files=[...list].filter(x=>x.name.toLowerCase().endsWith('.png'));if(!files.length)return;$('dropStatus').textContent=`Processing ${files.length} PNG file(s)…`;last=[];for(const f of files){const b=new Uint8Array(await f.arrayBuffer());const r=await scan(f.name,b);last.push(r);await inspectFile(f.name,b)}render();$('dropStatus').textContent=`Processed ${files.length} PNG file(s) locally.`;$('status').textContent=`Completed ${last.length} file(s) · no upload endpoint`}
async function runCorpus(){if(!wasm)return;$('status').textContent='Running built-in corpus…';last=[];for(const n of corpus){const b=new Uint8Array(await(await fetch('../corpus/'+n)).arrayBuffer());last.push(await scan(n,b));if(!selectedBytes)await inspectFile(n,b)}render();$('status').textContent=`Corpus complete · ${last.length} fixture(s)`}

function nav(){document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(b.dataset.view+'View').classList.add('active')})}
function pwa(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').classList.remove('hidden')});$('install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').classList.add('hidden')}}
function inputs(){const d=$('drop'),fi=$('files'),fo=$('folder');$('pick').onclick=()=>fi.click();$('pickFolder').onclick=()=>fo.click();fi.onchange=()=>runFiles(fi.files);fo.onchange=()=>runFiles(fo.files);['dragenter','dragover'].forEach(t=>d.addEventListener(t,e=>{e.preventDefault();d.classList.add('drag')}));['dragleave','drop'].forEach(t=>d.addEventListener(t,e=>{e.preventDefault();d.classList.remove('drag')}));d.ondrop=e=>runFiles(e.dataTransfer.files)}
function corpusCards(){$('corpusCards').innerHTML=corpus.map(n=>`<article class="fixture"><b>${n}</b><p>${esc(descriptions[n])}</p></article>`).join('')}
$('run').onclick=runCorpus;$('clear').onclick=()=>{last=[];render();$('status').textContent='Cleared'};$('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='png-security-lab-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};

(async()=>{nav();pwa();inputs();corpusCards();try{const b=await(await fetch('wasm/pnglab.wasm')).arrayBuffer();wasm=await WebAssembly.instantiate(b,{});$('status').textContent=`WebAssembly ready · module v${wasm.instance.exports.version()}`;}catch(e){$('status').textContent='WASM load failed: '+e.message}})();