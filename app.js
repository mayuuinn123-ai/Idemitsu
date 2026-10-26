const $=id=>document.getElementById(id),DAY=864e5;
const now=new Date(),T0=new Date(now.getFullYear(),now.getMonth(),now.getDate());
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pd=s=>{if(!s)return null;const m=String(s).trim().match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);return m?new Date(+m[1],m[2]-1,+m[3]):null};
const off=n=>iso(new Date(T0.getTime()+n*DAY));
$('today').textContent=iso(T0);$('mon').value=iso(T0).slice(0,7);
function sample(){
 $('t1').value=['booking,cy,qty,etd',
 'BK-24001,PGU CY,20,'+off(-12),'BK-24002,PKG CY,18,'+off(-6),'BK-24003,PGU CY,22,'+off(-3),
 'BK-24004,PKG CY,15,'+off(2),'BK-24005,PGU CY,20,'+off(4),'BK-24006,PKG CY,12,'+off(8),'BK-24007,PGU CY,25,'+off(11)].join('\n');
 $('t2').value=['booking,etd,vessel,location,eta',
 'BK-24001,'+off(-12)+',EVER GLORY,日本近海（東京湾沖）,'+off(1),
 'BK-24002,'+off(-4)+',ONE HARMONY,シンガポール T/S,'+off(9),
 'BK-24003,'+off(-3)+',MSC LINA,南シナ海航行中,'+off(12),
 'BK-24004,'+off(5)+',COSCO STAR,,'+off(18),
 'BK-24005,'+off(4)+',EVER GLORY,,'+off(17),
 'BK-24006,'+off(8)+',ONE HARMONY,,'+off(21),
 'BK-24008,'+off(6)+',MSC LINA,,'+off(19)].join('\n');}
function parse(txt){const L=txt.trim().split(/\r?\n/).filter(x=>x.trim());if(L.length<2)return[];
 const sp=L[0].includes('\t')?'\t':',';const h=L[0].split(sp).map(x=>x.trim().toLowerCase());
 return L.slice(1).map(l=>{const c=l.split(sp),o={};h.forEach((k,i)=>o[k]=(c[i]||'').trim());return o}).filter(o=>o.booking)}
let rows=[],flt='all';
function build(){
 const S=parse($('t1').value),P=parse($('t2').value),m={};
 S.forEach(r=>m[r.booking]={bk:r.booking,cy:r.cy,qty:r.qty,se:pd(r.etd)});
 P.forEach(r=>{const o=m[r.booking]||(m[r.booking]={bk:r.booking});o.pe=pd(r.etd);o.vs=r.vessel;o.loc=r.location;o.eta=pd(r.eta);o.cy=o.cy||r.cy;o.qty=o.qty||r.qty});
 rows=Object.values(m).map(o=>{o.etd=o.pe||o.se;o.diff=(o.pe&&o.se)?Math.round((o.pe-o.se)/DAY):null;
  o.mm=o.diff!==null?o.diff!==0:true;o.shipped=!!o.etd&&o.etd<=T0;return o});
 rows.sort((a,b)=>(a.etd||0)-(b.etd||0));render()}
const f=d=>d?(d.getMonth()+1)+'/'+d.getDate():'—';
function prog(o){if(!o.shipped)return'<span class="mut">—</span>';
 let pct=null;if(o.eta&&o.etd){pct=Math.max(3,Math.min(100,Math.round((T0-o.etd)/(o.eta-o.etd)*100)))}
 const done=o.eta&&o.eta<=T0;
 return '<div class="pr"><div class="pb"><i style="width:'+(done?100:pct??10)+'%"></i></div><div class="pt">'+(done?'到着済':(o.loc||'位置未登録'))+(o.vs?' ／ '+o.vs:'')+(o.eta&&!done?' ／ ETA '+f(o.eta):'')+(pct!==null&&!done?'（'+pct+'%）':'')+'</div></div>'}
function render(){
 const ym=$('mon').value,cur=rows.filter(o=>o.etd&&iso(o.etd).slice(0,7)===ym);
 const sh=cur.filter(o=>o.shipped),ns=cur.filter(o=>!o.shipped),mm=cur.filter(o=>o.mm);
 const q=a=>a.reduce((s,o)=>s+(+o.qty||0),0);
 $('kpis').innerHTML=[['当月 出荷予定',cur.length+'件','',q(cur)],['出荷済',sh.length+'件','ok',q(sh)],['未出荷',ns.length+'件','',q(ns)],['スケジュール不一致',mm.length+'件',mm.length?'bad':'',q(mm)]]
  .map(k=>'<div class="k '+k[2]+'"><span>'+k[0]+'</span><b>'+k[1]+'</b><span>数量計 '+k[3]+'</span></div>').join('');
 $('chips').innerHTML=[['all','すべて'],['sh','出荷済'],['ns','未出荷'],['mm','不一致のみ']].map(c=>'<button class="'+(flt===c[0]?'on':'')+'" data-f="'+c[0]+'">'+c[1]+'</button>').join(' ');
 const list=cur.filter(o=>flt==='all'||(flt==='sh'&&o.shipped)||(flt==='ns'&&!o.shipped)||(flt==='mm'&&o.mm));
 $('tb').innerHTML=list.map(o=>{
  let df='<span class="mut">一致</span>';
  if(!o.pe)df='<span class="d">仕入れ側に無し</span>';else if(!o.se)df='<span class="d">営業側に無し</span>';
  else if(o.diff)df='<span class="d">'+(o.diff>0?'+':'')+o.diff+'日</span>';
  return '<tr class="'+(o.mm?'mm':'')+'"><td><b>'+o.bk+'</b></td><td>'+(o.cy||'—')+'</td><td>'+(o.qty||'—')+'</td><td>'+f(o.se)+'</td><td><b>'+f(o.pe)+'</b></td><td>'+df+'</td><td><span class="tag '+(o.shipped?'t-ok':'t-pl')+'">'+(o.shipped?'出荷済':'未出荷')+'</span></td><td>'+prog(o)+'</td></tr>'}).join('')||'<tr><td colspan="8" class="mut">該当データなし</td></tr>'}
$('chips').onclick=e=>{if(e.target.dataset.f){flt=e.target.dataset.f;render()}};
$('mon').onchange=render;$('go').onclick=build;
$('smp').onclick=()=>{sample();build()};
[['f1','t1'],['f2','t2']].forEach(([a,b])=>$(a).onchange=e=>{const r=new FileReader();r.onload=()=>{$(b).value=r.result;build()};r.readAsText(e.target.files[0])});
sample();build();
