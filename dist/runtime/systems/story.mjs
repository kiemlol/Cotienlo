import {MAIN_QUESTS,SIDE_QUESTS,TOWN_NPCS,NPC_SAY,makeWakeScene,wakeConversation,afterWakeConversation} from './story-data.mjs?v=20261022-v3';
const line=(text,npc)=>({loai:'thoai',vai:npc?'npc':'ke',...(npc?{npc}:{}),text});
/** Persistent quest/dialogue graph. No reward is granted by opening a panel. */
export function createStory(room){
 if(room.intro?.active)return null;
 const h=room.profile,p=room.player;
 const s=room.progress.story??={version:1,chapter:0,step:'wake',counters:{},sides:{},choices:{},relations:{},rewards:[],visited:[]};
 for(const [k,v]of Object.entries({chapter:0,step:'wake',counters:{},sides:{},choices:{},relations:{},rewards:[],visited:[]}))s[k]??=v;
 let begun=false,activeScene=false,dialogue=null;
 h.flags??=[];h.mo??=[];h.xong??=[];
 const label=id=>room.label('npc.'+id.replace(/^npc_/,'')+'.ten',id);
 const flag=f=>{if(!h.flags.includes(f))h.flags.push(f)};
 const completed=id=>h.xong.includes(id);
 const current=()=>MAIN_QUESTS[s.chapter];
 const point=id=>(room.data.zones.zone_ta_gia_trai.noi||[]).find(n=>n.id===id);
 function npcPoint(id){const a=[...room.state.actors.values()].find(a=>a.def===id);return a?{x:a.x,y:a.y}:null}
 function commit(){room.refresh();room.save();publish()}
 function emitDialogue(){
  if(!dialogue)return;
  s.dialogue=structuredClone(dialogue);
  const n=dialogue.nodes[dialogue.index];
  if(n)room.emit('thoai',{...n,...n.npc?{ten:label(n.npc)}:{}});
 }
 function speak(nodes,action='close'){
  dialogue={nodes,index:0,action};emitDialogue();room.save();
 }
 function choices(cac,title,action='menu'){
  speak([{loai:'lua_chon',tieuDe:title,cac}],action);
 }
 function close(){dialogue=null;delete s.dialogue;room.emit('thoai',null)}
 function payOnce(id,nt=0,items={}){
  if(s.rewards.includes(id))return false;
  const entries=Object.entries(items).filter(([k,v])=>room.data.item[k]&&v>0);
  const distinct=Object.keys(h.tui).filter(k=>h.tui[k]>0).length;
  if(distinct+entries.filter(([k])=>!h.tui[k]).length>(h.tuiToiDa||40)){room.notify('Túi đầy. Hãy cất hoặc bán vật phẩm rồi nhận lại.');return false}
  s.rewards.push(id);h.nguyenThach=(h.nguyenThach||0)+nt;h.nt=h.nguyenThach;
  for(const [k,v]of entries)h.tui[k]=(h.tui[k]||0)+v;
  return true;
 }
 function completeMain(){
  const q=current();if(!q)return;
  if(!payOnce(q.id,q.reward,q.id==='mq_x11'?{item_nguyen_tuyen_lang:1}:{}))return;
  if(!completed(q.id))h.xong.push(q.id);if(!h.mo.includes(q.id))h.mo.push(q.id);
  flag('flag_'+q.id+'_xong');s.quests??={};s.quests[q.id]={done:true,step:99};
  if(q.id==='mq_x05')h.beQuan={...h.beQuan,mo:true};
  room.notify(q.ten+' · +'+q.reward+' nguyên thạch');
  room.emit('xong_nv',{id:q.id,ten:q.ten});s.chapter++;s.step='start';delete s.mainKillsStart;
  room.emit('tiep_theo',{qid:current()?.id||'local_hanh_trinh',ten:current()?.ten||'Hành trình tự do',chinh:true});commit();
 }
 function publish(){
  const q=current(),ds=[];
  if(q){let muc=q.muc,dich=null;
   s.quests??={};s.quests[q.id]={done:false,step:q.id==='mq_x08'?4:s.step==='start'?1:2};
   if(q.id==='mq_x01'&&!s.wakeDone)muc='Tỉnh khỏi giấc mơ.';
   else if(q.id==='mq_x01'){
    muc=s.step==='wine'?'Xuống hầm rượu.':s.step==='carry'?'Khiêng vò rượu cho mẹ.':'Nghe Tri Thu kể đêm qua.';
    dich=s.step==='wine'?point('cua_ham_ruou'):s.step==='carry'?npcPoint('npc_me'):null;
   }
   if(q.id==='mq_x02'&&s.step==='ceremony'){muc='Vào hang nguyên tuyền, vượt biển hoa để khai khiếu.';dich=point('cua_hang_nguyen_tuyen')}
   else if(q.id==='mq_x03'&&s.step==='gu'){muc='Luyện hóa và lắp bản mệnh cổ vừa chọn.'}
   else if(q.id==='mq_x04'&&s.step==='practice'){muc='Dùng cổ trúng mục tiêu 3 lần và lướt né một lần.'}
   else if(q.id==='mq_x07'&&s.step==='hunt'){muc='Hạ thú ngoài trại rồi quay về gặp Tạ Bưu.'}
   else if(q.id!=='mq_x01')dich=point(q.point)||npcPoint(q.npc);
   ds.push({...q,chinh:true,muc,zone:'zone_ta_gia_trai',...dich?{dich:{x:dich.x,y:dich.y}}:{},...(q.id==='mq_x04'&&s.step==='practice'?{dem:[Math.min(3,s.counters.practice||0),3]}:{}),...(q.id==='mq_x07'&&s.step==='hunt'?{dem:[Math.min(5,(s.counters.fieldKills||0)-(s.mainKillsStart||0)),5]}:{})});
  }
  for(const q of SIDE_QUESTS)if(s.sides[q.id]==='active')ds.push({id:q.id,ten:q.ten,chinh:false,muc:`Mang ${q.need} ${room.label(room.data.item[q.item]?.ten_key,q.item)} tới ${label(q.npc)}.`,dem:[Math.min(q.need,h.tui[q.item]||0),q.need],zone:q.npc==='npc_cuu_ba'?'zone_khe_coc':'zone_ta_gia_trai',...(npcPoint(q.npc)?{dich:npcPoint(q.npc)}:{})});
  room.emit('nv',{ds,xong:h.xong.length,kyUc:h.xong.filter(id=>MAIN_QUESTS.some(q=>q.id===id)).map(id=>{const q=MAIN_QUESTS.find(q=>q.id===id);return{id,ten:q.ten,moc:q.moc}})});
 }
 function begin(){
  if(begun)return;begun=true;
  if(!s.visited.includes(room.zoneId))s.visited.push(room.zoneId);
  if(room.zoneId==='zone_ta_gia_trai')for(const [def,x,y]of TOWN_NPCS){const existing=[...room.state.actors.values()].find(a=>a.def===def);if(existing){existing.x=x;existing.y=y;room.changed(existing)}else room.addActor({id:def,def,loai:'npc',hinh:def,ten:label(def),x,y,hp:0,hpMax:0,huong:2,dong:'idle',dongSeq:0,tuongTac:true,co:1,hieuUng:''})}
  publish();
  if(s.dialogue){dialogue=structuredClone(s.dialogue);emitDialogue();return}
  if(room.zoneId==='zone_ta_gia_trai'&&!s.wakeDone){activeScene=true;room.emit('canh_dung',makeWakeScene(p.ten));}
 }
 function finishWake(){activeScene=false;if(!s.wakeDone){s.wakeDone=true;s.step='tri_thu';flag('flag_sang_xuan_tinh_day');speak(wakeConversation(h),'wake_choice');commit()}}
 function menu(npc){
  const cac=[],q=current();
  if(q?.npc===npc)cac.push({i:'story',text:'Tiếp chuyện · '+q.ten});
  for(const side of SIDE_QUESTS.filter(q=>q.npc===npc&&s.sides[q.id]!=='done'))cac.push({i:'side:'+side.id,text:(s.sides[side.id]==='active'?'Giao vật phẩm · ':'Nhận việc · ')+side.ten});
  cac.push({i:'talk',text:'Hỏi chuyện'});
  if(['npc_ta_mac','npc_ta_tram'].includes(npc))cac.push({i:'training',text:'Chân nguyên và đột phá'},{i:'craft',text:'Cổ phương / hợp luyện'});
  if(['npc_ta_buu','npc_ta_buu_con','npc_ta_ninh','npc_ngu_ong','npc_thach_dau','npc_me'].includes(npc))cac.push({i:'profession',text:'Học nghề / công thức nghề'});
  if(['npc_ta_ninh','npc_ta_toan','npc_chu_quan_tro','npc_lao_khuyen','npc_ban_do_deo','npc_thuong_ky'].includes(npc))cac.push({i:'shop',text:'Xem quầy hàng'});
  if(['npc_cuu_ba','npc_hoc_tro_cuu_ba'].includes(npc))cac.push({i:'care',text:'Hỏi cách cứu cổ và chăm cổ'});
  if(npc==='npc_luyen_tap')cac.push({i:'practice',text:'Luyện tập tự do'});
  if(npc==='npc_giu_kho')cac.push({i:'storage',text:'Mở hòm đồ'});
  cac.push({i:'leave',text:'Cáo từ'});s.npc=npc;choices(cac,label(npc),'npc');
 }
 function interact(id){
  if(activeScene)return true;
  if(dialogue)return true;
  if(current()?.id==='mq_x01'&&id==='cua_ham_ruou'&&s.step==='wine'){s.step='carry';flag('local_x01_carry_wine');commit();return true;}
  const a=room.state.actors.get(id),npc=a?.def||id;
  if(!npc.startsWith('npc_'))return false;
  menu(npc);return true;
 }
 function mainDialogue(){
  const q=current();if(!q)return;
  const npc=q.npc;
  if(q.id==='mq_x01'){
   if(s.step==='carry')speak([line('Được rồi, đặt vò xuống đây. Mai khai khiếu, hôm nay đừng đi xa nữa.','npc_me')],'finish_main');
   else if(s.step==='wine')speak([line('Hai đứa xuống hầm khiêng vò rượu lên. Mai khai khiếu rồi, đừng có lêu lổng.','npc_me')]);
   else speak(wakeConversation(h),'wake_choice');return;
  }
  if(q.id==='mq_x02'){
   if(h.chuyen>=1||s.counters.awakening){completeMain();return}
   speak([line('Hôm nay là lễ khai khiếu. Đi vào hang nguyên tuyền, qua biển hoa. Cứ bước tiếp cho tới khi không thể bước nữa.',npc)],'ceremony');return;
  }
  if(q.id==='mq_x03'){
   if(h.co.some(g=>g.banMenh&&g.luyenHoa&&h.o.some(o=>o?.uid===g.uid))){completeMain();return}
   if(h.co.some(g=>g.banMenh)){s.step='gu';speak([line('Mở bảng Cổ, luyện hóa con cổ rồi lắp nó vào ô bản mệnh. Đừng quên chuẩn bị thức ăn.',npc)]);return}
   choices(['gu_nguyet_quang','gu_thu_bi','gu_dan_khieu_hoa_than'].map(id=>({i:id,text:room.label(room.data.gu[id].ten_key)})),'Chọn bản mệnh cổ. Chọn rồi sẽ theo ngươi lâu dài.','first_gu');return;
  }
  if(q.id==='mq_x04'){
   if((s.counters.practice||0)>=3&&s.counters.dodged){completeMain();return}
   s.step='practice';practice();speak([line('Dùng cổ vào cọc Thảo Nhân ba lần. Nhớ lướt né, đừng chỉ đứng một chỗ ra đòn.',npc)]);return;
  }
  if(q.id==='mq_x05'){
   if((s.counters.cultivation||0)>=5){completeMain();return}
   speak([line('Vào phòng tu luyện, giữ R hấp thu nguyên thạch. Mỗi ngày khiếu có giới hạn; quá tải thì hiệu quả giảm. Hấp thu năm viên rồi về đây.',npc)],'training');return;
  }
  if(q.id==='mq_x06'){
   if(s.counters.inst_thi_luyen_ba_cua){completeMain();return}
   speak([line('Ba cửa thử cách dùng cổ và giữ chân nguyên. Vượt hết rồi trở về.',npc)],'three_gates');return;
  }
  if(q.id==='mq_x07'){
   if(s.step==='hunt'&&(s.counters.fieldKills||0)-(s.mainKillsStart||0)>=5){completeMain();return}
   if(s.step!=='hunt'){s.mainKillsStart=s.counters.fieldKills||0;s.step='hunt'}
   speak([line('Ra Khê Cốc săn những con vừa sức. Hạ năm con rồi quay lại, đừng lao vào bãi đông.',npc)]);publish();return;
  }
  if(q.id==='mq_x08'){
   if(s.counters.inst_ham_ruou){completeMain();return}
   speak([line('Trong hầm còn mùi rượu lạ. Muốn xuống thì nhớ cẩn thận, đừng làm vỡ chum.',npc)],'wine_cave');return;
  }
  if(q.id==='mq_x09'){
   choices([{i:'promise',text:'Ta đã hứa sẽ không bỏ muội lại.'},{i:'protect',text:'Nếu nguy hiểm tới, muội phải lùi lại.'},{i:'silent',text:'(Giữ chuyện giấc mơ cho riêng mình.)'}],label(npc),'sister_choice');return;
  }
  if(q.id==='mq_x10'){
   if((s.counters.professionCraft||0)>0&&(h.tui.item_thao_duoc||0)>=3){h.tui.item_thao_duoc-=3;completeMain();return}
   speak([line('Học một nghề, tự làm ra thứ có ích. Chế một món rồi mang ba thảo dược tới đây.',npc)],'profession');return;
  }
  if(q.id==='mq_x11'){
   if(h.chuyen>=2||(h.chuyen===1&&(h.tv.giai||0)>=3)){
    flag('flag_dot_pha_2');flag('flag_nhiem_vu_dot_pha_2');h.dotPha={...h.dotPha,mo:true,choMo:false};completeMain();return;
   }
   speak([line('Hãy tu tới Nhất chuyển đỉnh phong. Nguyên liệu đột phá cần gom dần; khi sẵn sàng, trở lại gặp ta.',npc)]);return;
  }
  if(q.id==='local_y2'){
   if(h.chuyen>=2&&s.visited.includes('zone_ben_thuong')&&(s.counters.dungeons||0)>0){completeMain();return}
   speak([line('Bên ngoài Vụ Lĩnh còn những vùng rộng hơn. Lên Nhị chuyển, tìm Bến Thương và thử sức một thú huyệt.',npc)]);return;
  }
 }
 function practice(){
  if([...room.state.actors.values()].some(a=>a.storyDummy))return;
  const d=Object.entries(room.data.beast).find(([id])=>/thao_nhan/.test(id));
  const def=d?.[0]||'beast_heo_rung';
  room.addActor({id:'story-training-dummy',def,loai:'thu',hinh:d?.[1].visual||'prop_coc_go',ten:'Thảo Nhân · Luyện tập',x:54,y:40,hp:10000,hpMax:10000,sx:54,sy:40,huong:2,dong:'idle',dongSeq:0,co:1,storyDummy:true,introBoss:true,noReward:true,cong:0,hieuUng:''});
 }
 function sideAction(id){
  const q=SIDE_QUESTS.find(q=>q.id===id);if(!q||q.npc!==s.npc)return;
  if(s.sides[id]==='done'){menu(s.npc);return}
  if(!s.sides[id]){s.sides[id]='active';speak([line(`Mang ${q.need} ${room.label(room.data.item[q.item]?.ten_key,q.item)} tới đây. Ta sẽ trả ${q.reward} nguyên thạch.`,q.npc)]);commit();return}
  if((h.tui[q.item]||0)<q.need){speak([line('Chưa đủ vật phẩm. Cứ làm thong thả, đủ rồi quay lại.',q.npc)]);return}
  if(!payOnce(id,q.reward))return;
  h.tui[q.item]-=q.need;h.ch=(h.ch||0)+(q.ch||0);s.sides[id]='done';if(!completed(id))h.xong.push(id);
  if(q.job)room.progression?.handle('nghe',{hd:'hoc',id:q.job});
  s.relations[q.npc]=(s.relations[q.npc]||0)+1;
  speak([line('Đủ rồi. Đây là phần của ngươi. Khi cần cứ ghé lại.',q.npc)]);commit();
 }
 function act(action,choice){
  if(action==='wake_choice'){
   choices([{i:0,text:'Không có gì.'},{i:1,text:'Muội vẫn ở đây.'},{i:2,text:'(Xoa đầu Tri Thu.)'}],undefined,'wake_reply');return;
  }
  if(action==='wake_reply'){
   if(![0,1,2].includes(choice))return;
   s.choices.wake=choice;s.relations.npc_tri_thu=choice===1?2:choice===2?1:0;
   flag('local_wake_choice_'+choice);speak(afterWakeConversation(choice,h),'wine_chore');return;
  }
  if(action==='wine_chore'){s.step='wine';commit();return;}
  if(action==='npc'){
   if(choice==='story')return mainDialogue();
   if(typeof choice==='string'&&choice.startsWith('side:'))return sideAction(choice.slice(5));
   if(choice==='talk')return speak((NPC_SAY[s.npc]||['Đi đường cẩn thận.']).map(t=>line(t,s.npc)));
   if(choice==='leave')return;
   return act(choice);
  }
  if(action==='mother_choice'){
   if(!['tell','quiet'].includes(choice))return;
   s.choices.mother=choice;s.relations.npc_me=choice==='tell'?2:1;flag('local_mother_'+choice);
   speak([line(choice==='tell'?'Tri Thu vẫn bình an. Nếu giấc mơ còn quay lại, cứ kể cho mẹ nghe.':'Ừ. Nhưng đừng giấu mẹ khi trong người có gì không ổn.','npc_me'),line('Hôm nay trong trại có lễ khai khiếu. Con tới từ đường, gặp tộc trưởng rồi hãy vào hang nguyên tuyền.','npc_me')],'finish_main');return;
  }
  if(action==='sister_choice'){
   if(!['promise','protect','silent'].includes(choice))return;
   s.choices.sister=choice;s.relations.npc_tri_thu=choice==='promise'?3:choice==='protect'?2:0;flag('local_sister_'+choice);
   speak([line(choice==='promise'?'Vậy huynh nhớ giữ lời. Muội cũng sẽ không bỏ huynh lại.':choice==='protect'?'Muội sẽ nghe. Nhưng huynh cũng phải biết lùi khi cần.':'Huynh không muốn nói thì thôi. Khi muốn nói, muội sẽ nghe.','npc_tri_thu')],'finish_main');return;
  }
  if(action==='first_gu'){
   if(!['gu_nguyet_quang','gu_thu_bi','gu_dan_khieu_hoa_than'].includes(choice)||h.co.some(g=>g.banMenh))return;
   const uid='quest-first-'+choice;h.co.push({uid,loai:choice,banMenh:true,luyenHoa:false,no:100,xp:0,thuanThuc:0,sao:0,buaToi:Date.now()+86400000});
   s.choices.firstGu=choice;s.step='gu';flag('flag_ban_menh_'+choice.replace('gu_',''));
   payOnce('first-gu-food',0,{item_canh_nguyet_lan:12,item_thit_thu:12,item_than_cui:12});
   speak([line('Con cổ đã thuộc về ngươi. Luyện hóa rồi lắp vào ô bản mệnh. Trong túi có phần thức ăn khởi đầu.','npc_ta_mac')]);commit();return;
  }
  if(action==='finish_main'){completeMain();return}
  if(action==='ceremony'){s.step='ceremony';commit();room.travel('inst_khai_khieu');return}
  if(action==='three_gates'){room.travel('inst_thi_luyen_ba_cua');return}
  if(action==='wine_cave'){room.travel('inst_ham_ruou');return}
  if(action==='training'){room.startCultivation();return}
  if(action==='craft'){room.inventory.handle('che_tao',{});return}
  if(action==='shop'){room.inventory.handle('cua_hang',{npc:s.npc});return}
  if(action==='profession'){
   const jobs={npc_ta_ninh:'duong_co',npc_cuu_ba:'duong_co',npc_ta_buu:'san_thuoc_da',npc_ta_buu_con:'san_thuoc_da',npc_me:'u_ruou',npc_thach_dau:'khai_mo',npc_ngu_ong:'dieu_ngu'};
   if(jobs[s.npc])room.progression?.learn(jobs[s.npc]);
   const places={npc_ta_ninh:['zone_ta_gia_trai','tram_thuoc'],npc_ta_buu:['zone_ta_gia_trai','bang_san'],npc_ta_buu_con:['zone_ta_gia_trai','bang_san'],npc_me:['inst_ham_ruou','ham_ruou'],npc_thach_dau:['zone_mo_cu','lan_tho']};
   const place=places[s.npc];if(place&&place[0]===room.zoneId)return room.progression?.openCrafting({noi:place});
   room.emit('mo_panel',{bang2:'nghe'});try{window.CTL?.store.getState().set({bang2:'nghe'})}catch{}return;
  }
  if(action==='care'){speak([line('Để thức ăn trong kho thức ăn cổ. Bữa đến thì cổ tự ăn, kể cả lúc ngươi rời game. Đói lâu sẽ thành xác cổ tự phong. Hãy mang xác và vật liệu hợp lưu phái tới Cửu bà để cứu.','npc_cuu_ba')]);return}
  if(action==='practice'){practice();commit();return}
  if(action==='storage'){room.services?.openStorage();return}
 }
 function handle(type,args={}){
  if(type==='canh_dung_xong'){
   if(args.id==='canh_x01_tinh_day'&&activeScene){activeScene=false;finishWake()}return true;
  }
  if(type==='nv'){publish();return true}
  if(type==='nv_xong'){room.emit('nv_xong',{ds:MAIN_QUESTS.filter(q=>completed(q.id)).map(q=>({id:q.id,ten:q.ten,moc:q.moc})),kyUc:[]});return true}
  if(type!=='thoai'||!dialogue)return false;
  const n=dialogue.nodes[dialogue.index];
  if(n?.loai==='lua_chon'){
   if(!n.cac.some(c=>c.i===args.chon&&!c.tat))return true;
   const action=dialogue.action;close();act(action,args.chon);commit();return true;
  }
  if(++dialogue.index<dialogue.nodes.length)emitDialogue();else{const action=dialogue.action;close();act(action)}
  room.save();return true;
 }
 function onEvent(kind,event={}){
  if(kind==='awakening'||kind==='khai_khieu'){s.counters.awakening=1;if(current()?.id==='mq_x02')completeMain()}
  if(kind==='cellar-wall'){s.counters.inst_ham_ruou=1;room.notify('Đã tìm thấy vách đá cũ. Trở về báo lại.');}
  if(['complete','completed','instance_complete','dungeon_complete'].includes(kind)){
   const zone=event.zone||event.zoneId||event.id;s.counters[zone]=1;s.counters.dungeons=(s.counters.dungeons||0)+1;
   if(current()?.id==='mq_x06'&&zone==='inst_thi_luyen_ba_cua')completeMain();
  }
  if(/cultivat|tu_luyen|absorb/.test(kind))s.counters.cultivation=(s.counters.cultivation||0)+(event.stones||event.so||1);
  if(/profession.*craft|nghe.*che|job_craft/.test(kind)||(kind==='craft'&&event.profession))s.counters.professionCraft=(s.counters.professionCraft||0)+1;
  if(['equip','refine','luyen_hoa','lap'].includes(kind)&&current()?.id==='mq_x03'&&h.co.some(g=>g.banMenh&&g.luyenHoa&&h.o.some(o=>o?.uid===g.uid)))completeMain();
  publish();
 }
 function onKill(a){if(a.storyDummy||a.noReward||a.encounterNoLoot)return;if(!room.zoneId.startsWith('inst_'))s.counters.fieldKills=(s.counters.fieldKills||0)+1;publish()}
 function onAction(type,args,result){
  if(type==='in'&&current()?.id==='mq_x01'&&s.step==='wine'){const n=point('cua_ham_ruou');if(n&&Math.hypot(n.x-p.x,n.y-p.y)<=3.5){s.step='carry';flag('local_x01_carry_wine');commit();}}
  if(type==='in'&&args.luot)s.counters.dodged=1;
  if(type==='dung'&&result?.ok&&[...room.state.actors.values()].some(a=>a.storyDummy&&Math.hypot(a.x-p.x,a.y-p.y)<15))s.counters.practice=(s.counters.practice||0)+1;
  if(current()?.id==='mq_x04'&&(s.counters.practice||0)>=3&&s.counters.dodged)publish();
 }
 return{begin,handle,interact,onEvent,onKill,onAction,publish,get activeScene(){return activeScene},get inScene(){return activeScene},get state(){return s},finishWake,tick(){},get currentQuest(){return current()},get gates(){return{breakthrough:s.chapter>=11||h.chuyen>=2,occupations:h.chuyen>=1}}};
}
