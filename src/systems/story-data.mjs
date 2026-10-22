/** Narrative adapter. Observed opening/wake are attributed in STORY-V3.md.
 * Later quest transitions and NPC branches are independent reconstructions
 * using the official wiki's named places, services and public unlock gates. */
export const MAIN_QUESTS=[
 {id:'mq_x01',ten:'Sáng xuân',moc:{nam:1,thang:1},npc:'npc_me',muc:'Tỉnh khỏi giấc mơ, nghe Tri Thu kể chuyện rồi khiêng vò rượu cho mẹ.',point:'nha_nc',reward:40},
 {id:'mq_x02',ten:'Lễ khai khiếu',moc:{nam:1,thang:1},npc:'npc_ta_tram',muc:'Đến từ đường gặp Tạ Trầm, rồi vượt biển hoa trong hang nguyên tuyền.',point:'tu_duong',reward:80},
 {id:'mq_x03',ten:'Con cổ đầu tiên',moc:{nam:1,thang:1},npc:'npc_ta_mac',muc:'Gặp Tạ Mặc ở học đường. Chọn, luyện hóa và lắp bản mệnh cổ.',point:'hoc_duong',reward:80},
 {id:'mq_x04',ten:'Học cách sống sót',moc:{nam:1,thang:1},npc:'npc_luyen_tap',muc:'Gặp Giáo đầu, luyện dùng cổ và lướt né ở sân luyện tập.',point:'san_luyen_tap',reward:70},
 {id:'mq_x05',ten:'Chân nguyên và khiếu bích',moc:{nam:1,thang:2},npc:'npc_ta_mac',muc:'Hấp thu 5 nguyên thạch trong phòng tu luyện rồi trở về học đường.',point:'phong_tu_luyen',reward:120},
 {id:'mq_x06',ten:'Ba cửa học đường',moc:{nam:1,thang:3},npc:'npc_ta_mac',muc:'Vượt thử luyện ba cửa của học đường.',point:'hoc_duong',reward:120},
 {id:'mq_x07',ten:'Bãi săn đầu tiên',moc:{nam:1,thang:4},npc:'npc_ta_buu',muc:'Gặp Tạ Bưu, hạ 5 thú ngoài trại rồi trở về báo tin.',point:'bang_san',reward:150},
 {id:'mq_x08',ten:'Mùi rượu trong đêm',moc:{nam:1,thang:5},npc:'npc_me',muc:'Khám phá hầm rượu, tìm dấu vết cổ trùng rồi trở lại gặp mẹ.',point:'cua_ham_ruou',reward:120},
 {id:'mq_x09',ten:'Giữ lời với Tri Thu',moc:{nam:1,thang:6},npc:'npc_tri_thu',muc:'Tìm Tri Thu trong trại. Quyết định kể chuyện giấc mơ hay giữ kín.',point:null,reward:80},
 {id:'mq_x10',ten:'Tự mình đứng vững',moc:{nam:1,thang:9},npc:'npc_ta_ninh',muc:'Chế một vật phẩm bằng nghề và mang 3 thảo dược tới trạm thuốc.',point:'tram_thuoc',reward:180},
 {id:'mq_x11',ten:'Cuối năm đầu',moc:{nam:1,thang:12},npc:'npc_ta_tram',muc:'Đạt Nhất chuyển đỉnh phong, gặp tộc trưởng để mở thử thách đột phá.',point:'tu_duong',reward:220},
 {id:'local_y2',ten:'Con đường ngoài Vụ Lĩnh',moc:{nam:2,thang:1},npc:'npc_ta_tram',muc:'Đạt Nhị chuyển, vượt một thú huyệt và ghé Bến Thương.',point:'tu_duong',reward:300},
];
export const SIDE_QUESTS=[
 {id:'local_duoc',npc:'npc_ta_ninh',ten:'Dược thảo cho trạm thuốc',item:'item_thao_duoc',need:5,reward:35,job:'duong_co'},
 {id:'local_san',npc:'npc_ta_buu',ten:'Da thú cho người thợ',item:'item_da_heo',need:3,reward:45,job:'san_thuoc_da'},
 {id:'local_ruou',npc:'npc_me',ten:'Rượu ấm đầu xuân',item:'item_ruou_trang',need:3,reward:35,job:'u_ruou'},
 {id:'local_kho',npc:'npc_giu_kho',ten:'Sắp lại kho tộc',item:'item_thit_thu',need:5,reward:35},
 {id:'local_cuu',npc:'npc_cuu_ba',ten:'Việc trong vườn Cửu bà',item:'item_thao_duoc',need:8,reward:65,job:'duong_co'},
 {id:'local_mo',npc:'npc_thach_dau',ten:'Than cho lò nhỏ',item:'item_than_cui',need:3,reward:70,job:'khai_mo'},
 {id:'local_ca',npc:'npc_ngu_ong',ten:'Bữa cá ven sông',item:'item_ca_chep_bun',need:3,reward:65,job:'dieu_ngu'},
 {id:'local_toc',npc:'npc_ta_toan',ten:'Một phần cho gia tộc',item:'item_da_soi',need:4,reward:100,ch:12},
];
export const TOWN_NPCS=[
 ['npc_me',14.6,38.9],['npc_tri_thu',34.3,28.4],['npc_ta_tram',30.5,15.3],['npc_ta_mac',47,26.4],['npc_ta_hoanh',36,19],['npc_ta_phong',52,41],['npc_ta_buu',6.2,33.2],['npc_giu_kho',21.2,29.2],['npc_luyen_tap',57.3,41.2],['npc_ta_toan',40.5,31.9],['npc_ta_ninh',42,39.2],['npc_thach_dau',8.3,27.8],
];
export const NPC_SAY={
 npc_me:['Đi đâu thì đi, tối nhớ về. Mẹ không ngủ trước đâu.','Con mới tỉnh, đừng vội ra ngoài một mình.'],
 npc_tri_thu:['Huynh lại nhìn muội như vừa gặp một người ở rất xa.','Nếu có chuyện gì, huynh cứ nói. Muội vẫn ở đây.'],
 npc_ta_tram:['Khai khiếu chỉ là bước đầu. Có cổ mà không nuôi nổi, cũng chẳng đi được xa.'],
 npc_ta_mac:['Công, Thủ, Trị, Trinh sát: hãy hiểu vai của từng con cổ trước khi lắp.','Chân nguyên hữu hạn. Đừng đợi cạn sạch mới tìm chỗ hấp thu.'],
 npc_ta_buu:['Da, nanh và thịt đều có chỗ dùng. Săn xong nhớ xem túi.'],
 npc_ta_ninh:['Thuốc không thay được một bước né đúng lúc. Để sẵn cao cầm máu trước khi ra trại.'],
 npc_cuu_ba:['Cổ đói thì ăn. Cổ bị thương thì nghỉ. Người nuôi cổ phải nhớ được cả hai.'],
 npc_luyen_tap:['Đòn lớn báo trước bằng vùng sáng. Né ra rồi hãy phản công.'],
 npc_giu_kho:['Đồ trong kho có thể chờ. Bữa ăn của cổ thì không.'],
 npc_ta_toan:['Nhận việc, làm đủ, rồi hãy lĩnh công.'],
 npc_thach_dau:['Thứ dùng được trong tay còn quý hơn một viên đá chỉ biết ngắm.'],
 npc_chu_quan_tro:['Người đi đường mang theo chuyện. Ngồi lại uống một chén rồi hãy đi.'],
};
// Observed on the original server, guest branch 1. Gender changes only the
// illustration ID; other unobserved response branches are adapter dialogue.
export function wakeConversation(h){const tri=text=>({loai:'thoai',vai:'npc',npc:'npc_tri_thu',ten:'Tri Thu',cd:'cd_tri_thu',text});return[
 {loai:'thoai',vai:'ke',text:'Trán ướt đẫm. Một chiếc khăn lạnh vừa đắp lên; dưới hầm, mùi men rượu bốc lên ngai ngái.'},
 tri('Lại mơ thấy tòa lầu ấy sao? Huynh hét tên muội to lắm, muội ngồi ngay đây mà còn giật mình.'),
 ...(h.flags?.includes('flag_mo_dau_khong_di_mot_minh')?[tri('Còn nói mớ cái gì mà "không đi một mình". Huynh định đi đâu mà phải rủ người?')]:[]),
 {loai:'thoai',vai:'ke',text:'Bảy ngày rồi. Bảy ngày trong thân xác này, đêm nào cũng là cái lầu ấy.',tranh:'tranh_x01_'+(h.gioiTinh==='nu'?'nu':'nam')},
 {...tri('Muội trong mơ có đẹp không?'),cam:'vui'},
 ]}
export function afterWakeConversation(choice,h){const tri=text=>({loai:'thoai',vai:'npc',npc:'npc_tri_thu',ten:'Tri Thu',cd:'cd_tri_thu',text});return[
 tri(choice===1?'Muội còn đi đâu được nữa. Ngủ mê rồi nói bậy.':choice===0?'Không muốn kể thì thôi. Lát nữa xuống hầm cùng muội.':'Tri Thu né tay ngươi, rồi cười: “Muội có phải trẻ con đâu.”'),
 {loai:'thoai',vai:'ke',text:'Ở cửa, một người đàn bà tay còn dính bã men, chống nạnh nhìn vào. Bảy ngày nay ngươi đã tập gọi bà là mẹ.'},
 {loai:'thoai',vai:'npc',npc:'npc_me',ten:'Tạ Hương',cd:'cd_me',cam:'goi',text:'Hai đứa xuống hầm khiêng vò rượu lên. Mai khai khiếu rồi, đừng có lêu lổng.'},
 tri('Mai huynh vào biển hoa sau từ đường. Đi được bao nhiêu bước thì biết có thành cổ sư hay không.'),
 tri('Bảy hôm trước, chú Bưu cõng huynh về đấy. Chú bảo tìm thấy dưới cái khe gần bẫy, người lạnh ngắt.'),
 {loai:'thoai',vai:'nc',ten:h.ten,text:'(Ngã xuống khe. Nhưng trong ký ức vừa rồi, có một bàn tay đẩy.)'},
 {loai:'thoai',vai:'ke',text:'Cả trại tin cú ngã ấy làm ngươi quên hết: tên mình, nhà mình, cả mặt mẹ.'},
 {loai:'thoai',vai:'ke',text:'Thật ra ngươi chưa từng biết những thứ ấy. Ngươi để họ tin vậy.'},
 {loai:'thoai',vai:'nc',ten:h.ten,text:'(Lầu đá ấy ở đâu? Sao trong mơ, con bé này đã lớn?)'},
 ]}
export function makeWakeScene(name){return{id:'canh_x01_tinh_day',vung:'zone_ta_gia_trai',buoc:[
 {lenh:'toi',s:0},{lenh:'the_ten',s:2.6,chu:'Ngày thứ bảy',phu:'Tạ gia trại, đầu xuân'},
 {lenh:'sang',s:1.4},{lenh:'may',ai:'nguoi_choi',zoom:2,s:.8,ten_ai:name},
 {lenh:'noi',kieu:'khung',chu:'Đầu nhói lên. Vết thương trên trán đã khô, mà vẫn nóng.'},
 {lenh:'rung',s:.35,luc:.006},{lenh:'toi',s:.12},
 {lenh:'noi',kieu:'khung',chu:'Một bóng người. Một bàn tay đẩy mạnh. Rồi tiếng đá lăn xuống dốc…'},
 {lenh:'sang',s:.25},
 {lenh:'noi',kieu:'khung',chu:'Ai cũng bảo ngươi ngã trong rừng. Nhưng cảm giác ấy không giống ngã.'},
 {lenh:'may',x:30,y:30,zoom:1.05,s:2.6},{lenh:'cho',s:1.2},{lenh:'may_theo',s:.8},
 ]}}
