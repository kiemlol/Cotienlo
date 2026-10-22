/** Original hom_do protocol (readable client 159878); capacity/upgrade prices
 * are local policy. Field tu-vi rates/caps follow official tu_luyen.html. */
export function createServices(room){
 const h=room.profile,seen=new WeakSet();
 const notify=t=>{room.notify(t);return true};
 const nearKeeper=()=>[...room.state.actors.values()].some(a=>a.def==='npc_giu_kho'&&Math.hypot(a.x-room.player.x,a.y-room.player.y)<=5);
 const state=()=>h.servicesV3??=( {storage:{items:{},capacity:20,upgrades:0},field:{day:'',earned:0}} );
 function revivePlan(g){
  const d=g&&room.data.gu[g.loai];if(!d||g.nghi?.ly!=='xac')return null;
  const rule=room.data.bal.gu_food.quy_tac,job=h.nghe?.ds?.find(j=>j.id==='duong_co'),discount=(job?.diem||0)>=50?rule.cuu_co_duong_co_tinh_giam||.3:0;
  const rank=d.chuyen,can=[{id:'item_nguyen_thach',so:20*rank*rank},{id:'item_thao_duoc',so:5*rank}];
  const materials=rule.cuu_co_vat_lieu,group=Object.entries(materials?.nhom||{}).find(([,schools])=>schools.includes(d.luu_phai))?.[0];
  if(rank===2||rank===3){const id=materials?.[rank===2?'nhi':'tam']?.[group];if(!id)return{loi:'ui.xac_co.chua_co_phuong',can:[],tuLam:false};can.push({id,so:Math.max(1,rank-1)});}
  for(const row of can){row.so=Math.max(1,Math.ceil(row.so*(1-discount)));row.co=row.id==='item_nguyen_thach'?h.nguyenThach||0:h.tui[row.id]||0;}
  return{can,cho_s:3600*rank,mat:.1,giam:Math.round(discount*100),tuLam:(job?.diem||0)>=(rule.cuu_co_nghe_duong_co_toi_thieu||25),...(rank>3?{loi:'ui.xac_co.chua_co_phuong'}:{})};
 }
 function decorate(){for(const g of h.co||[]){const plan=revivePlan(g);if(plan)g.cuu=plan;else delete g.cuu;}}
 function revive(p){
  const g=h.co?.find(g=>g.uid===p.hoi_sinh),plan=revivePlan(g);
  if(!g||!plan||plan.loi||g.nghi.den<=Date.now())return notify('Chưa có phương cứu con cổ này hoặc xác đã quá hạn.');
  const nearby=[...room.state.actors.values()].some(a=>['npc_cuu_ba','npc_hoc_tro_cuu_ba'].includes(a.def)&&Math.hypot(a.x-room.player.x,a.y-room.player.y)<=5);
  if(!plan.tuLam&&!nearby)return notify('Mang xác cổ đến Cửu bà ở Khê Cốc, hoặc học Dưỡng cổ đến bậc Thạo.');
  if(plan.can.some(row=>row.co<row.so))return notify('Thiếu nguyên liệu cứu cổ. Xem phần nguyên liệu trên xác cổ.');
  for(const row of plan.can)if(row.id==='item_nguyen_thach')h.nguyenThach-=row.so;else h.tui[row.id]-=row.so;
  g.nghi={ly:'hoi_sinh',den:Date.now()+plan.cho_s*1000};g.thuanThuc=Math.max(0,Math.floor((g.thuanThuc||0)*(1-plan.mat)));g.xp=0;
  decorate();room.refresh();room.save();room.notify('Đã bắt đầu cứu cổ. Cổ cần nghỉ '+plan.cho_s/3600+' giờ.');return true;
 }
 const view=()=>{const s=state().storage,hom=Object.entries(s.items).filter(([id,n])=>n>0&&Object.hasOwn(room.data.item,id)).map(([id,so])=>({id,so}));return{hom,dung:hom.length,toiDa:s.capacity,them:5,giaNang:s.capacity>=60?null:50*(s.upgrades+1)}};
 function useRelic(p){
  const slot=Number.isInteger(p.o)&&h.o?.[p.o],g=slot&&h.co?.find(g=>g.uid===slot.uid),d=g&&room.data.gu[g.loai],effect=d?.hu?.find(e=>e.loai==='tang_tieu_canh');
  if(!effect)return false;
  if(!g.luyenHoa||g.nghi||g.banMenh||g.no<=0||room.player.hp<=0||room.player.coChien||h.tv.chuyen!==(effect.chuyen??d.chuyen)||h.tv.giai>=3)return notify('Xá Lợi cần đúng chuyển, cổ đã luyện hóa và chưa ở đỉnh phong.');
  const cost=(d.cn||0)*(d.cn_theo==='ti_le_toi_da'?room.player.cnMax:1);
  if(room.player.cn<cost)return notify('Không đủ chân nguyên.');
  room.player.cn-=cost;h.co=h.co.filter(row=>row.uid!==g.uid);
  for(let i=0;i<h.o.length;i++)if(h.o[i]?.uid===g.uid)h.o[i]={uid:null,loai:null,cd:0,cdMax:0};
  for(const key of ['obd','opt'])if(h[key])h[key]=h[key].map(uid=>uid===g.uid?null:uid);
  h.tv.giai=Math.min(3,h.tv.giai+(effect.so||1));h.tv.diem=0;
  room.refresh();room.save();room.emit('len_canh',{chuyen:h.chuyen,giai:['so','trung','cao','dinh'][h.tv.giai]});room.emit('fx',{k:'xa_loi',id:room.sessionId});
  room.notify('Đã dùng Xá Lợi. Lên một giai; tu vi đang tích trên thanh về 0.');return true;
 }
 function openStorage(){if(!nearKeeper())return notify('Đến gần người giữ kho.');room.emit('hom_do',view());return true}
 function handle(type,p={}){
  if(type==='co'&&p&&typeof p.hoi_sinh==='string')return revive(p);
  if(type==='dung'&&p&&typeof p==='object')return useRelic(p);
  if(type!=='hom_do')return false;
  if(!p||typeof p!=='object'||Array.isArray(p)||!nearKeeper())return notify('Đến gần người giữ kho để gửi hoặc rút đồ.');
  if(p.hd==='xem'||p.hd===undefined)return openStorage();
  const s=state().storage;
  if(p.hd==='nang'){
   const price=view().giaNang;if(price===null||(h.nguyenThach||0)<price)return notify('Không đủ nguyên thạch hoặc kho đã đạt giới hạn.');
   h.nguyenThach-=price;s.capacity+=5;s.upgrades++;
  }else if(['gui','rut'].includes(p.hd)){
   const n=p.so??1;if(!Number.isSafeInteger(n)||n<1||n>999999||typeof p.id!=='string'||!Object.hasOwn(room.data.item,p.id)||p.id==='item_nguyen_thach')return notify('Vật phẩm hoặc số lượng không hợp lệ.');
   const from=p.hd==='gui'?h.tui:s.items,to=p.hd==='gui'?s.items:h.tui,cap=p.hd==='gui'?s.capacity:h.tuiToiDa||40;
   if((from[p.id]||0)<n)return notify('Không đủ vật phẩm.');
   if(!to[p.id]&&Object.values(to).filter(n=>n>0).length>=cap)return notify('Không còn ô chứa.');
   from[p.id]-=n;to[p.id]=(to[p.id]||0)+n;
  }else return notify('Thao tác hòm đồ không hợp lệ.');
  room.refresh();room.save();room.emit('hom_do',view());return true;
 }
 function onKill(actor){
  if(!actor||actor.hp>0||actor.noReward||actor.encounterNoLoot||actor.storyDummy||seen.has(actor)||room.zoneId.startsWith('inst_'))return;
  seen.add(actor);const rank=h.chuyen??0,beastRank=actor.chuyen??0,rules={1:[1,25],2:[2,75],3:[4,170]},rule=rules[rank];
  if(!rule||beastRank<rank)return;
  const day=new Date(Date.now()+7*3600000).toISOString().slice(0,10),f=state().field;
  if(f.day!==day){f.day=day;f.earned=0}
  const multiplier=actor.bac==='tinh_anh'?5:['bach_vuong','thien_vuong','van_vuong'].includes(actor.bac)?20:1;
  const base=rule[0]*multiplier,full=Math.min(base,Math.max(0,rule[1]-f.earned)),gain=full+(base-full)*.25;
  f.earned+=base;room.progression?.addTuVi(gain,'field');room.refresh();room.save();
 }
 return{handle,openStorage,onKill,refresh:decorate};
}
