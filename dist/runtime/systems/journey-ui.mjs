let box;
export function showJourney(getRoom){
 if(box)return;
 box=document.createElement('aside');box.id='independent-tools';
 box.innerHTML=`<style>#independent-tools{position:fixed;right:10px;top:105px;z-index:10000;color:#382a1b;font:13px Philosopher,serif;width:min(278px,86vw);pointer-events:none}#independent-tools details{pointer-events:auto;width:fit-content;margin-left:auto}#independent-tools details[open]{width:auto;background:#f5e8c8;border:1px solid #8e7045;border-radius:8px;padding:10px;box-shadow:0 6px 25px #0006}#independent-tools summary{cursor:pointer;background:#eedbb0;border:1px solid #8e7045;border-radius:6px;padding:8px 11px;list-style:none}#independent-tools button,#independent-tools select{font:inherit;background:#fff7e4;color:#382a1b;border:1px solid #a38b63;border-radius:5px;padding:7px;margin:3px 2px;cursor:pointer;max-width:245px}#independent-tools button:disabled{opacity:.45;cursor:default}#independent-tools p{line-height:1.55;margin:8px 0;white-space:pre-line}#independent-tools small{display:block;line-height:1.5;color:#6b5940}#independent-tools a{color:#745b2e}#independent-tools nav{display:flex;flex-wrap:wrap}@media(max-height:500px){#independent-tools{top:80px;font-size:12px}#independent-tools details[open]{max-height:65vh;overflow:auto}}</style><details><summary>☯ Hành trình</summary><p data-stats></p><p data-quest></p><nav><button data-act="journal">Sổ nhiệm vụ</button><button data-act="jobs">Nghề</button><button data-act="meditate">Ngồi / đứng</button><button data-act="breakthrough">Điều kiện đột phá</button><button data-act="assist">Tiếp hướng dẫn</button></nav><p><label>Trạm đã ghé <select aria-label="Trạm đã ghé"></select></label><button data-act="travel">Đi xe · 5 NT</button></p><nav><button data-act="save">Lưu ngay</button><button data-act="export">Tải bản lưu</button><button data-act="replay">Xem lại giấc mơ</button></nav><small data-save></small><small>WASD đi · Space lướt · F tương tác · V cổ · B túi · C nhân vật · J sổ · M bản đồ.</small><a href="/reconstruction/" target="_blank" rel="noopener">Ghi chú bản cập nhật</a></details>`;
 document.body.append(box);
 box.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act,r=getRoom();if(!a||!r)return;
  if(a==='assist'){r.intro?.assist();return}
  if(a==='save'){if(r.save())r.notify('Đã lưu tiến trình.');return}
  if(a==='export'){r.save();const u=URL.createObjectURL(new Blob([localStorage.getItem(r.key)],{type:'application/json'})),link=document.createElement('a');link.href=u;link.download='co-tien-lo-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return}
  if(r.intro?.active||r.story?.activeScene)return;
  if(a==='journal')window.CTL.store.getState().set({panel:'ky_uc',soJThe:'so'});
  if(a==='jobs')window.CTL.store.getState().set({bang2:'nghe'});
  if(a==='meditate')r.send('ngoi');
  if(a==='breakthrough')r.send('dot_pha',{hd:'xem'});
  if(a==='replay'){r.progress.intro={step:'opening',done:false};r.save();r.travel('inst_mo_dau');}
  if(a==='travel'){
   const target=box.querySelector('select').value;
   const tram=(r.data.zones[r.zoneId].noi||[]).some(n=>n.loai==='tram'&&Math.hypot(n.x-r.player.x,n.y-r.player.y)<7);
   if(!tram){r.notify('Đến gần trạm để đi xe.');return}
   if(!target||target===r.zoneId||!r.story?.state.visited.includes(target))return;
   if(r.profile.nguyenThach<5){r.notify('Cần 5 nguyên thạch đi xe.');return}
   const at=r.data.zones[target].noi.find(n=>n.loai==='tram')||r.data.zones[target].spawn;
   r.profile.nguyenThach-=5;r.progress.pendingSpawn={zone:target,x:at.x,y:at.y};r.travel(target);box.querySelector('details').open=false;
  }
 });
 updateJourney(getRoom());
}
export function updateJourney(r){
 if(!box||!r)return;
 const dream=!!r.intro?.active,scene=!!r.story?.activeScene;
 box.hidden=scene;
 box.querySelector('summary').textContent=dream?'☯ Giấc mơ':'☯ Hành trình';
 box.querySelector('[data-stats]').textContent=dream?'Làm theo lời Tri Thu và ô cổ đang sáng.':r.player.ten+' · '+(r.profile.chuyen===0?'Phàm nhân':'Chuyển '+r.profile.chuyen)+'\n'+Math.floor(r.profile.nguyenThach||0)+' nguyên thạch · Tu vi '+Math.floor(r.profile.tv.diem||0)+' / '+(r.profile.tv.can||0);
 const q=r.story?.currentQuest;box.querySelector('[data-quest]').textContent=q?q.ten+'\n'+q.muc:'';
 const select=box.querySelector('select'),selected=select.value,visited=(r.story?.state.visited||[]).filter(id=>id.startsWith('zone_'));
 if(select.dataset.keys!==visited.join(',')){select.replaceChildren(...visited.map(id=>{const o=document.createElement('option');o.value=id;o.textContent=r.label(r.data.zones[id].ten_key);return o}));select.dataset.keys=visited.join(',');if(visited.includes(selected))select.value=selected;}
 select.disabled=dream;
 for(const b of box.querySelectorAll('[data-act]')){b.hidden=(b.dataset.act==='assist'&&!dream)||(b.dataset.act==='replay'&&dream);b.disabled=dream&&!['assist','save','export'].includes(b.dataset.act);}
 box.querySelector('[data-save]').textContent=r.lastSave?'✓ Đã lưu '+new Date(r.lastSave).toLocaleTimeString('vi-VN'):'';
}
