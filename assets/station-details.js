/* Local classic script: photo-derived fittings, shared floor/collision layout.
 * Coordinates are approximate metres. Local +Z runs from the ring toward exits 6–11.
 * Source/uncertainty index: docs/素材与设施索引.md. No remote textures required. */
(function (global) {
  'use strict';
  const layout = {
    eyeHeight: 1.65, radius: .28,
    shop: {x: 11, z: 13.2, w: 15.4, d: 8.6},
    entry: {x: 7.4, z: 21, w: 8.2, d: 7.4},
    cross: {x: -.5, z: 30, w: 38, d: 6.2},
    toilet: {x: 19, z: 21.2, w: 8, d: 7},
    exits: {'6': [-15.5,31.5], '7': [-5,36], '8': [-5,43], '9': [-4,50], '10': [4,49], '11A': [24.5,34.5], '11B': [24.5,26]},
    focus: {ring: [0,6.3], corridor: [0,18], toilet: [19,24]},
    floors: [
      {id:'主廊',x:0,z:29.75,w:6.6,d:45.5},
      {id:'十字廊',x:-.5,z:30,w:38,d:6.2},
      {id:'11共同前厅',x:7.9,z:30,w:9.2,d:6.2},
      {id:'11A左分支',x:18.6,z:34.5,w:17.2,d:3.4},
      {id:'11B右分支',x:18.6,z:26,w:17.2,d:3.4},
      {id:'超市深岔路',x:11,z:13.2,w:15.4,d:8.6},
      {id:'进站前区',x:7.4,z:21,w:8.2,d:7.4},
      {id:'卫生间对侧前厅',x:19,z:21.2,w:8,d:7},
      {id:'卫生间接廊',x:19,z:25.15,w:4.2,d:1.5},
      {id:'6楼梯门厅',x:-15.5,z:31.5,w:4.1,d:5.6},
      {id:'11A楼梯门厅',x:26.5,z:34.5,w:5.7,d:4.1},
      {id:'11B楼梯门厅',x:26.5,z:26,w:5.7,d:4.1},
      {id:'7支路',x:-5.3,z:36,w:4.6,d:2.8},
      {id:'8支路',x:-5.3,z:43,w:4.6,d:2.8},
      {id:'9支路',x:-4.9,z:50,w:3.8,d:2.8},
      {id:'10支路',x:5.2,z:49,w:4.6,d:2.8}
    ]
  };

  function build({THREE:T, parent, outerRing, pierSpecs, facades}) {
    const root = new T.Group(); root.name='照片细节与6–11通道'; parent.add(root);
    const ceilings = new T.Group(); ceilings.name='吊顶与剖切上墙'; root.add(ceilings);
    const materials=new Map(), textures=new Map(), colliders=[], signs=[], floors=layout.floors.slice();
    const cube=new T.BoxGeometry(1,1,1), cylinder=new T.CylinderGeometry(1,1,1,24);
    const glass=new T.MeshStandardMaterial({color:'#bbd7d5',transparent:true,opacity:.26,roughness:.17,metalness:.2,depthWrite:false});
    function material(color, metal=0, glow=false) {
      const key=color+':'+metal+':'+glow;
      if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.27:.62,metalness:metal,emissive:glow?color:'#000000',emissiveIntensity:glow?.45:0}));
      return materials.get(key);
    }
    function group(name,x=0,z=0,angle=0,owner=root) {const g=new T.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=angle;owner.add(g);return g;}
    function obstacle(g,x,z,w,d) {
      g.updateWorldMatrix(true,false);const p=new T.Vector3(x,0,z).applyMatrix4(g.matrixWorld);
      // All fittings have yaw-only transforms; atan2 avoids Euler's folded angles.
      const e=g.matrixWorld.elements, yaw=Math.atan2(e[8],e[10]);
      colliders.push({x:p.x,z:p.z,w,d,angle:yaw,name:g.name});
    }
    function b(g,x,y,z,w,h,d,color='#ecebe3',solid=false,metal=0) {
      const m=new T.Mesh(cube,typeof color==='string'?material(color,metal):color);m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;m.castShadow=solid&&!m.material.transparent;g.add(m);
      if(solid)obstacle(g,x,z,w,d);return m;
    }
    function cyl(g,x,y,z,r,h,color,solid=false) {const m=new T.Mesh(cylinder,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.scale.set(r,h,r);g.add(m);if(solid)obstacle(g,x,z,r*2,r*2);return m;}
    function torus(g,x,y,z,r,t,color) {const m=new T.Mesh(new T.TorusGeometry(r,t,8,48),typeof color==='string'?material(color,0,true):color);m.rotation.x=Math.PI/2;m.position.set(x,y,z);g.add(m);return m;}
    function wall(g,x,z,w,d,color='#e7e6dc') {
      const cladding=global.StationSurfaces.finish(T,color,'panel',.5);
      b(g,x,.64,z,w,1.08,d,cladding,true);
      const upper=b(g,x,2.24,z,w,2.12,d,cladding);upper.userData.cutaway=true;
      b(g,x,.18,z,w+.015,.18,d+.015,'#343939');
      for(let h=1.12;h<3.2;h+=.7)b(g,x,h,z,w+.009,.011,d+.009,'#c3c5c0');
    }
    function texture(text,bg='#172126',fg='#ffdc4d',theme='sign') {
      const key=[text,bg,fg,theme].join('|');if(textures.has(key))return textures.get(key);
      const c=document.createElement('canvas');c.width=1024;c.height=theme==='sign'?192:640;
      const q=c.getContext('2d'),H=c.height;q.fillStyle=bg;q.fillRect(0,0,1024,H);
      if(theme!=='sign') {
        q.fillStyle=fg+'22';for(let i=0;i<8;i++){q.beginPath();q.arc(i*177-70,H*.9,180,0,Math.PI*2);q.fill();}
        q.strokeStyle=fg+'66';q.lineWidth=6;q.beginPath();q.moveTo(0,H*.75);q.bezierCurveTo(200,0,660,H,1024,100);q.stroke();
        if(theme==='map'){q.strokeStyle='#a8b9ba';q.lineWidth=5;for(let i=0;i<9;i++){q.beginPath();q.moveTo(i*130,80);q.lineTo(i*110+30,H-25);q.stroke();q.beginPath();q.moveTo(20,i*60+90);q.lineTo(1000,i*60+90);q.stroke();}q.fillStyle='#c83543';q.fillRect(483,120,25,420);q.fillRect(180,310,690,25);}
      }
      const lines=text.split('\n');q.fillStyle=fg;q.textAlign='center';q.textBaseline='middle';
      lines.forEach((line,i)=>{q.font=`600 ${theme==='sign'?(lines.length>1?54:76):(i===0?80:48)}px "Microsoft YaHei", sans-serif`;q.fillText(line,512,theme==='sign'?(H/2+(i-(lines.length-1)/2)*70):(100+i*105),970);});
      const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.anisotropy=4;textures.set(key,tx);return tx;
    }
    function sign(g,text,x,y,z,w,h,bg='#172126',fg='#ffdc4d',yaw=0,theme='sign') {
      const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture(text,bg,fg,theme)}));m.position.set(x,y,z);m.rotation.y=yaw;g.add(m);signs.push({text,object:m});return m;
    }
    function board(g,front,back,x,z,w=5,yaw=0) {
      const s=group('双面导向 '+front,x,z,yaw,g);b(s,0,2.9,0,w,.62,.12,'#161e23');
      sign(s,front,0,2.9,.067,w-.1,.52);sign(s,back,0,2.9,-.067,w-.1,.52,undefined,undefined,Math.PI);
      for(const xx of [-w*.36,w*.36])b(s,xx,3.43,0,.025,.48,.025,'#a7b0b0',false,.7);return s;
    }
    function screen(g,text,x,y,z,w,h,bg='#08679b',fg='#ffffff',yaw=0,theme='poster') {
      const s=group('灯箱 '+text,x,z,yaw,g);b(s,0,y,-.035,w+.1,h+.1,.12,'#293236');sign(s,text,0,y,.035,w,h,bg,fg,0,theme);return s;
    }
    function map(g,x,z,yaw=0,w=2.4) {return screen(g,'三阳广场站街区图\n出口导向',x,1.7,z,w,1.55,'#eef0e9','#263c44',yaw,'map');}
    function floor(g,x,z,w,d,color='#bfc3bc') {b(g,x,.06,z,w,.12,d,global.StationSurfaces.finish(T,color,'stone',.46));}
    function tactile(g,x,z,w,d) {b(g,x,.128,z,w,.028,d,'#c5bca1');const vertical=d>w;for(let i=-1;i<=1;i++)b(g,x+(vertical?i*.06:0),.147,z+(vertical?0:i*.06),vertical?.025:w,.012,vertical?d:.025,'#eee4c9',false,.2);}
    function ceiling(x,z,w,d,height=3.57) {
      b(ceilings,x,height,z,w,.09,d,'#242b2e');
      for(let xx=Math.ceil((x-w/2+.04)/.24)*.24;xx<x+w/2-.04;xx+=.24)b(ceilings,xx,height-.11,z,.055,.18,d,'#8d9694',false,.3);
      for(let zz=Math.ceil((z-d/2+.07)/3.1)*3.1;zz<z+d/2-.07;zz+=3.1)b(ceilings,x,height-.22,zz,Math.max(.04,w-.06),.055,.12,material('#fff8df',0,true));
    }
    function safety(g,x,z) {
      b(g,x,.54,z,.55,.95,.2,'#b82935',true);sign(g,'消火栓',x,.68,z+.11,.48,.23,'#b82935','#ffffff');
      sign(g,'← 安全出口',x,.3,z+.12,.46,.12,'#163b31','#83ffb3');
      b(g,x,3.12,z,.06,.35,.07,'#b6bfbc');b(g,x,2.98,z+.13,.13,.1,.3,'#e9ebe6');b(g,x,2.98,z+.295,.09,.07,.01,'#172229');
    }
    function bin(g,x,z){cyl(g,x,.45,z,.21,.72,'#9ca5a5',true);cyl(g,x,.81,z,.23,.08,'#293334');}
    function barriers(g,x,z) {for(let i=0;i<5;i++){b(g,x+i*.085,.56,z,.055,.9,.65,'#cb2630',true);b(g,x+i*.085,1.05,z,.065,.08,.4,'#e23736');}for(let i=0;i<5;i++)b(g,x+.7,.2+i*.1,z,.7,.16,.5,'#4c5b37',true);}
    function umbrella(g,x,z) {b(g,x,.52,z,.32,.87,.35,'#b69259',true);b(g,x,.98,z,.37,.04,.4,'#313336');sign(g,'伞袋',x,.7,z+.181,.25,.28,'#b69259','#433222');}
    function vending(g,x,z,color='#bc2430',title='自助售卖') {
      const s=group(title,x,z,0,g);b(s,0,1.1,0,.82,2,.65,color,true);b(s,-.1,1.35,.34,.57,1.2,.025,'#e4eef0');
      for(let row=0;row<4;row++)for(let k=0;k<4;k++)b(s,-.3+k*.13,.92+row*.23,.37,.08,.17,.06,['#cf6043','#4eaa88','#e5b741','#eee6d0'][k]);
      b(s,.31,1.37,.355,.14,.24,.035,'#113c53');b(s,0,.38,.34,.5,.16,.03,'#273235');sign(s,title,0,2,.34,.72,.19,color,'#ffffff');return s;
    }
    function ticket(g,x,z) {
      b(g,x,1.05,z,.77,1.85,.55,'#a9b0ac',true,.55);b(g,x,1.4,z+.29,.56,.65,.04,'#773b47');
      screen(g,'购票',x,1.47,z+.32,.37,.27,'#397eb6');b(g,x,.92,z+.32,.39,.07,.08,'#222b30');b(g,x,.45,z+.29,.45,.16,.04,'#485052');
    }
    function gate(g,x,z) {b(g,x,.63,z,.33,1.0,1.5,'#a7b2b1',true,.65);b(g,x,1.16,z,.33,.07,1.42,'#252e31');b(g,x,1.21,z+.4,.2,.05,.28,'#268ba8');b(g,x+.37,.77,z,.38,.58,.045,glass,true);}
    function stairs(g,x,z,w=1.5,run=4,rise=1.6,yaw=0,mechanical=false,colored=false) {
      const s=group(mechanical?'扶梯':'楼梯',x,z,yaw,g);const n=16;
      for(let i=0;i<n;i++){const h=.12+(i+1)*rise/n,zz=-run/2+(i+.5)*run/n;b(s,0,h/2+.12,zz,w,h,run/n,mechanical?'#3b4548':'#bfc4bb');b(s,0,h+.13,zz-run/n*.46,w,.02,.025,'#e1c15c');if(colored)b(s,0,h+.06,zz-run/n*.49,w,.085,.012,i%2?'#247ca0':'#34865d');}
      for(const xx of [-w/2-.09,w/2+.09]){const rail=b(s,xx,rise/2+.95,0,.09,.09,Math.hypot(run,rise),'#747e7e',false,.7);rail.rotation.x=-Math.atan2(rise,run);for(let j=0;j<5;j++)b(s,xx,.5+rise*j/4,-run/2+j*run/4,.04,.8,.05,'#9faeae');}
      // Upper circulation is outside this B1 walk prototype; stop before the risers.
      obstacle(s,0,0,w+.4,run);return s;
    }
    function portal(g,n,x,z,yaw=0,dual=false) {
      const p=group('出口 '+n,x,z,yaw,g);
      if(n!=='6'&&!n.startsWith('11')){wall(p,-2.15,1.4,.28,5);wall(p,2.15,1.4,.28,5);}
      b(p,-1.84,1.7,-.3,.45,3.2,.25,'#d89320');sign(p,n,-1.83,1.85,-.45,.4,.65,'#d89320','#ffeb56',Math.PI);
      stairs(p,-.7,2.4,1.45,3.8,1.7,0,false,n==='2');stairs(p,.95,2.4,.95,3.8,1.7,0,true);
      board(p,'站厅 / 返回 ↓','↑ '+n+' 出口',0,-.15,3.9);sign(p,'安全出口',0,3.27,-.07,1,.2,'#1a5744','#9effbd',Math.PI);
      b(p,0,.139,-.8,3.5,.025,.7,'#5b6058');tactile(p,0,-1.5,3.6,.22);map(p,-1.87,-.7,Math.PI/2,1.2);barriers(p,-2.65,-.65);umbrella(p,2.45,-.6);return p;
    }

    // The floor rectangles are also the only walkable union in the north wing.
    // Render a disjoint union: overlapping navigation rectangles must not produce
    // coplanar floor/ceiling faces at the cross-junction or restroom threshold.
    const rows=[...new Set(floors.flatMap(f=>[f.z-f.d/2,f.z+f.d/2]))].sort((a,b)=>a-b);
    const stairBays=floors.filter(f=>f.id.includes('楼梯门厅'));
    const inStairBay=(x,z)=>stairBays.some(f=>Math.abs(x-f.x)<=f.w/2+.2&&Math.abs(z-f.z)<=f.d/2+.2);
    for(let i=1;i<rows.length;i++){
      const lo=rows[i-1],hi=rows[i],mid=(lo+hi)/2;
      const spans=floors.filter(f=>mid>f.z-f.d/2&&mid<f.z+f.d/2).map(f=>[f.x-f.w/2,f.x+f.w/2]).sort((a,b)=>a[0]-b[0]);
      const merged=[];for(const span of spans){const last=merged[merged.length-1];if(last&&span[0]<=last[1])last[1]=Math.max(last[1],span[1]);else merged.push(span.slice());}
      for(const [left,right] of merged){
        floor(root,(left+right)/2,mid,right-left,hi-lo);
        const cuts=[left,right,...stairBays.flatMap(f=>[f.x-f.w/2,f.x+f.w/2]).filter(x=>x>left&&x<right)].sort((a,b)=>a-b);
        for(let k=1;k<cuts.length;k++){const x=(cuts[k-1]+cuts[k])/2,w=cuts[k]-cuts[k-1];if(w>.001)ceiling(x,mid,w,hi-lo,inStairBay(x,mid)?5.25:3.57);}
      }
    }
    for(let z=8;z<52;z+=1.5)b(root,0,.126,z,6.4,.006,.012,'#89948f');
    for(let x=-3;x<=3;x+=1.5)b(root,x,.126,29.5,.012,.006,44,'#89948f');
    tactile(root,-.5,29.2,.24,43.5);tactile(root,-.5,30,35,.24);
    // Derive the exterior shell from the exact floor union. Shared room edges
    // stay open; only exposed edges receive a wall, outside the clear floor.
    const boundary=[];
    const xs=[...new Set(floors.flatMap(f=>[f.x-f.w/2,f.x+f.w/2]))].sort((a,b)=>a-b);
    function inside(x,z){return floors.some(f=>Math.abs(x-f.x)<f.w/2&&Math.abs(z-f.z)<f.d/2);}
    for(const z of rows)for(let i=1;i<xs.length;i++){
      const x=(xs[i-1]+xs[i])/2,a=inside(x,z-.001),beyond=inside(x,z+.001);
      if(a!==beyond&&!(Math.abs(z-7)<.001&&Math.abs(x)<3.31))boundary.push({x,z:z+(a?.09:-.09),w:xs[i]-xs[i-1],d:.18});
    }
    for(const x of xs)for(let i=1;i<rows.length;i++){
      const z=(rows[i-1]+rows[i])/2,a=inside(x-.001,z),beyond=inside(x+.001,z);
      if(a!==beyond)boundary.push({x:x+(a?.09:-.09),z,w:.18,d:rows[i]-rows[i-1]});
    }
    boundary.forEach(e=>{wall(root,e.x,e.z,e.w,e.d);if(inStairBay(e.x,e.z)){const upper=b(root,e.x,4.2,e.z,e.w,1.86,e.d,'#e7e6dc');upper.userData.cutaway=true;}});
    // Vertical soffit returns close the step between the low corridor ceiling
    // and the taller stairwell so neither opens into the scene background.
    for(const f of stairBays){
      for(const side of [-1,1]){
        b(ceilings,f.x+side*f.w/2,4.39,f.z,.1,1.76,f.d,'#dadbd2');
        b(ceilings,f.x,4.39,f.z+side*f.d/2,f.w,1.76,.1,'#dadbd2');
      }
    }
    // Blue advertisements along the left approach; no board is placed across an opening.
    for(const z of [10.5,15.5,20.5,24.5]){
      const a=group('蓝色广告墙',-3.28,z,Math.PI/2);b(a,0,1.8,0,3.8,3.25,.04,'#008db7');screen(a,'无锡 · 城市生活\n文明出行  一路相伴',0,1.85,.055,2.7,1.55,'#127eb1');
    }
    // The west arm ends at 6; a continuous wall separates it from the 7 spur.
    // 11 first crosses a glazed common vestibule, then turns into separate
    // north/left (A) and south/right (B) corridors. No cross-wall shortcut.
    for(const v of [28.1,31.9]){
      b(root,5.4,1.6,v,.065,2.9,2.1,glass,true);
      b(root,5.4,3.08,v,.09,.08,2.2,'#899b9b',false,.7);
    }
    b(root,5.4,3.1,30,.09,.08,2.1,'#899b9b',false,.7);
    board(root,'↑ 11 出口  /  前厅','↓ 圆环站厅',4.85,30,3.3,Math.PI/2);
    for(const [n,[x,z]] of Object.entries(layout.exits)){
      if(n==='6'||n.startsWith('11'))continue;
      const side=x<0?-1:1;
      board(root,`出口 ${n} ${side<0?'←':'→'}`,`${side<0?'→':'←'} 出口 ${n}`,0,z,3.2);
      const end=group('出口 '+n,side*6.7,z,side<0?Math.PI/2:-Math.PI/2);sign(end,n,0,1.8,0,1.1,.9,'#d28d21','#fff266');b(end,0,1.65,-.13,2.4,3.1,.2,'#d28d21',true);
    }
    portal(root,'6',-15.5,29.5,0);
    const exit6=group('6号口上行楼梯侧墙广告',-18.5,31.4,Math.PI/2);
    screen(exit6,'6 出口  ↑\n中山路 · 百货',0,1.7,.08,2.4,1.4,'#e8a45d','#5b4b43');
    portal(root,'11A',24.5,34.5,Math.PI/2);
    portal(root,'11B',24.5,26,Math.PI/2);
    board(root,'11A ← 左侧出口     11B → 右侧出口','返回圆环 ←',10.3,30,5.4,Math.PI/2);
    const coffee=group('11出口左侧咖啡店',7.5,33.04,Math.PI);
    b(coffee,0,1.55,0,4.8,2.9,.08,glass,true);
    b(coffee,0,3.14,-.07,5.1,.43,.2,'#6b6251');
    sign(coffee,'星巴克咖啡',0,3.14,.045,4.8,.34,'#6b6251','#f5f2e8');
    for(const x of [-2.35,2.35])b(coffee,x,1.55,.08,.08,2.9,.1,'#9a9283');
    board(root,'← 6 出口     11A / 11B →','← 11A / 11B     6 出口 →',0,28,5.8,Math.PI);
    board(root,'↑ 7–10 出口','↓ 圆环站厅 / 1、2号线',0,33.9,4.2,Math.PI);
    board(root,'↑ 6–11 出口     卫生间','↓ 圆环 / 14–27 出口',0,8.2,5,Math.PI);

    // The supermarket sits at the far end of a deep side passage; the first
    // metres remain an open spur with a glass rail and a recessed dark bay.
    const shop=group('右侧外展超市及纵深岔路',3.4,13.2,Math.PI/2);
    for(let s=0.9;s<7.2;s+=1.55){
      b(shop,-3.66,1.0,s,.045,1.8,1.45,glass,true);
      b(shop,-3.66,1.93,s,.07,.05,1.48,'#a7b6b6',false,.7);
    }
    b(shop,-3.66,.22,4.2,.08,.28,6.8,'#527f65');
    b(shop,3.65,1.55,4.7,.16,2.8,3.2,'#4a5657',true);
    b(shop,3.5,1.5,4.5,.08,2.6,1.7,'#222b2c');
    b(shop,2.3,.72,5.2,.9,1.1,1.15,'#a1aeb0',true,.5);
    for(const x of [-3.25,3.25])b(shop,x,1.47,8.15,2.0,2.7,.06,glass,true);
    b(shop,0,3.08,8.15,8.1,.42,.22,'#326051');
    sign(shop,'便利超市',0,3.08,8.02,5.7,.32,'#326051','#fff0d2',Math.PI);
    board(shop,'便利超市 →','← 返回站厅',0,1.0,3.6,Math.PI);
    for(const xx of [-2.55,0,2.55])for(const zz of [10.1,12.7]){
      b(shop,xx,.9,zz,.72,1.6,1.15,'#bfb9a7',true);
      for(let row=0;row<4;row++)for(let k=0;k<4;k++)b(shop,xx-.27+k*.18,.4+row*.31,zz+.59,.12,.22,.12,['#d15d42','#ddb747','#5d9d8a','#77aaca'][k]);
    }
    b(shop,-3.1,.66,9.3,1.2,1.1,.7,'#b1a68f',true);screen(shop,'收银',-3.1,1.42,9.7,.55,.3,'#215762','#ffffff',Math.PI);
    // The entry mouth faces back toward the ring, along the main passage.
    const entry=group('面向圆环的安检与进站口',7.4,17.3);
    wall(entry,-4.1,1.1,.18,2.2);wall(entry,-4.1,6.3,.18,2.2);
    b(entry,0,3.08,.04,7.9,.38,.18,'#b8a580');
    sign(entry,'安检进站  1号线 / 2号线',0,3.08,-.07,7.5,.31,'#172126','#ffdc4d',Math.PI);
    for(const x of [-1.05,1.05]){
      for(const side of [-.48,.48])b(entry,x+side,1.43,2.0,.12,2.6,.45,'#bcc7c6',true,.55);
      b(entry,x,2.78,2.0,1.14,.2,.45,'#b8c8c9');
      sign(entry,'安检',x,2.78,1.75,.72,.15,'#197aa2','#fffcee',Math.PI);
    }
    b(entry,2.9,.8,3.2,1.0,1.35,1.45,'#8e9b9e',true);
    b(entry,2.9,.63,4.15,.85,.12,.9,'#333b3c',true);
    screen(entry,'行李安检',2.9,1.73,2.3,.75,.33,'#1689ad','#ffffff',Math.PI);
    for(const x of [-2.4,-1.15,.1,1.35,2.6])gate(entry,x,5.6);
    sign(entry,'请先安检  再刷卡进站',0,2.3,7.27,4.7,.33,'#e6ebe6','#354b51',Math.PI);

    // Opposite the 11 exits, the WC opens south from the B-side passage.
    // Its public front is layered glass, warm perforated panels and a lit cove.
    const wc=group('11出口对侧卫生间前厅与洗手区',19,21.2);
    // Exterior is a bright, layered portal: white stone surround, red accent,
    // warm perforated side panels, and paired sliding glass leaves.
    b(wc,0,3.12,3.61,4.72,.2,.3,'#f4f0e7');
    b(wc,0,2.94,3.78,4.88,.055,.045,material('#c83a36',0,true));
    for(const x of [-2.39,2.39]){
      b(wc,x,1.52,3.61,.2,2.92,.3,'#f4f0e7');
      b(wc,x,1.49,3.79,.055,2.84,.045,material('#c83a36',0,true));
      b(wc,x,1.5,3.53,.045,2.78,.13,glass,false,.2);
      b(wc,x,2.98,3.53,.12,.11,.17,'#8f9c99',false,.65);
    }
    // The golden dotted cladding is a single textured panel on each side,
    // giving the entrance its photographed glow without hundreds of meshes.
    const perforated=document.createElement('canvas');perforated.width=512;perforated.height=512;
    const pg=perforated.getContext('2d');pg.fillStyle='#b99757';pg.fillRect(0,0,512,512);
    for(let y=10;y<512;y+=24)for(let x=10;x<512;x+=24){pg.beginPath();pg.arc(x,y,4.4,0,Math.PI*2);pg.fillStyle=(x+y)%48?'#f1d18b':'#8e713f';pg.fill();}
    const perforatedMap=new T.CanvasTexture(perforated);perforatedMap.encoding=T.sRGBEncoding;perforatedMap.anisotropy=4;
    const perforatedMat=new T.MeshStandardMaterial({map:perforatedMap,color:'#fff3d4',roughness:.46,metalness:.18,emissive:'#6b4b1d',emissiveIntensity:.22});
    for(const x of [-3.2,3.2]){
      const panel=new T.Mesh(new T.PlaneGeometry(1.52,2.72),perforatedMat);panel.position.set(x,1.55,3.72);wc.add(panel);
      b(wc,x-.8,1.55,3.73,.07,2.88,.08,'#d5c5a2');b(wc,x+.8,1.55,3.73,.07,2.88,.08,'#d5c5a2');
    }
    b(wc,0,3.17,3.52,7.9,.37,.24,'#e3dacb');
    sign(wc,'卫生间  TOILET',0,3.18,3.66,4.8,.31,'#e3dacb','#54472b');
    sign(wc,'男 MEN       女 WOMEN',0,2.61,3.61,4.1,.27,'#c1a66f','#fff8df');
    // Door glazing, slim mullions, pull bars and the illuminated threshold.
    for(const x of [-1.5,1.5]){
      b(wc,x,1.42,3.59,1.15,2.58,.045,glass,true,.15);
      b(wc,x-.575,1.42,3.625,.035,2.58,.045,'#a9b5b2',false,.7);
      b(wc,x+.575,1.42,3.625,.035,2.58,.045,'#a9b5b2',false,.7);
      b(wc,x+(x<0?.42:-.42),1.25,3.66,.035,.68,.045,'#d8e3e0',false,.8);
    }
    b(wc,0,.123,3.7,4.2,.006,.46,'#969c99');
    b(wc,0,.132,3.7,4.1,.012,.34,'#c3b57e');
    // Three stacked sign bands make the frontage legible from the passage.
    sign(wc,'男厕  MEN',3.2,2.84,3.82,1.28,.28,'#304f67','#fff4d8');
    sign(wc,'女厕  WOMEN',-3.2,2.84,3.82,1.46,.28,'#8c4057','#fff4d8');
    torus(wc,0,3.27,1.5,1.48,.1,'#eaf5ff');
    cyl(wc,0,3.39,1.5,1.78,.055,'#e4d8bd');
    for(let i=0;i<=30;i++){
      const a=Math.PI+i*Math.PI/30,xx=Math.cos(a)*1.43,zz=.7+Math.sin(a)*1.43;
      b(wc,xx,1.49,zz,.072,2.8,.12,i%4?'#bd9e63':material('#ffe0a1',0,true),true);
    }
    b(wc,0,1.5,-.7,.21,2.8,.18,'#b5beb9',true,.65);
    for(const [x,title,col] of [[2.75,'男 MEN','#325a73'],[-2.75,'女 WOMEN','#b04972']]){
      sign(wc,title,x,2.58,-1.58,1.7,.45,'#a79270','#ffeed0');
      screen(wc,'空闲\nVACANT',x,1.8,-1.56,.65,.45,'#1279be');
      wall(wc,x,-2.05,1.8,.18);sign(wc,title,x,1.8,-1.94,1.4,.55,'#d9ccb5',col);
    }
    // The unphotographed rear of both rooms is screened; only the public sinks are modeled.
    b(wc,0,.86,-2.36,3.6,.16,.83,'#ded7c9',true);b(wc,0,.43,-2.42,3.3,.78,.62,'#9c8c72',true);
    for(const x of [-1.15,0,1.15]){
      cyl(wc,x,.97,-2.25,.31,.09,'#f7f4e9');cyl(wc,x,.99,-2.25,.21,.025,'#8dabad');
      b(wc,x,1.13,-2.58,.055,.25,.06,'#a6bcbd',false,.8);
    }
    b(wc,0,1.99,-3.39,3.65,1.45,.06,'#748d98',false,.8);
    b(wc,0,2.74,-3.36,3.75,.065,.09,material('#fff8e2',0,true));
    sign(wc,'洗手区',0,2.9,-3.34,1.4,.24,'#e6dfce','#645944');
    const decal=sign(wc,'← 男    洗手间    女 →',0,.143,2.95,2.8,.65,'#bfc3bc','#497e9e');decal.rotation.x=-Math.PI/2;
    b(wc,-3.25,.4,1.2,.38,.55,.1,'#e1bd32',true);sign(wc,'小心地滑',-3.25,.44,1.265,.34,.31,'#e1bd32','#353b33');
    safety(root,-3.2,17);barriers(root,12.3,27.3);map(root,-3.2,23.4,Math.PI/2);bin(root,3,24.5);

    // Inner ring: photographed flared crowns and red/orange cylindrical LED wraps.
    for(const [x,z,i] of pierSpecs){
      const p=group('喇叭柱 '+i,x,z);const profile=[new T.Vector2(.55,0),new T.Vector2(.56,.45),new T.Vector2(.64,.7),new T.Vector2(.85,.93),new T.Vector2(1.22,1.13)];
      const cap=new T.Mesh(new T.LatheGeometry(profile,32),material('#f0eee5',.12));cap.position.y=2.92;p.add(cap);cap.userData.cutaway=true;
      torus(p,0,4.07,0,1.17,.045,'#e9f5ed');
      if(i%2===0){const tx=texture('无锡杉杉奥莱\n09.24 盛大开业\n没有什么比开业更划算','#c73e26','#fff8dc','poster');const led=new T.Mesh(new T.CylinderGeometry(.623,.623,1.68,40,1,true),new T.MeshBasicMaterial({map:tx}));led.position.y=2.23;p.add(led);torus(p,0,1.37,0,.63,.025,'#d2ecf4');}
    }
    const hub=group('内环服务设施');
    for(const x of [-1.7,-.7,.3,1.3])gate(hub,x,3);
    for(const x of [-3.4,3.4]){b(hub,x,.9,1,.055,1.45,3.1,glass,true);b(hub,x,1.65,1,.07,.07,3.2,'#a5b6b4',false,.7);}
    const desk=group('客服中心',-2.7,-1.2,.6);b(desk,0,.68,0,2.0,1.1,.75,'#dddccf',true);b(desk,0,.2,.39,2,.15,.03,'#227798');screen(desk,'客服中心',0,1.27,-.1,.5,.3,'#195a76');board(desk,'客服中心  Service','客服中心',0,-.35,2.4);
    const lift=group('内圈无障碍电梯',2.1,-1.8);for(const x of [-.75,.75])b(lift,x,1.67,0,.055,3.1,1.55,'#a9b8b5',false,.8);b(lift,0,1.66,0,1.45,3,1.5,glass,true);b(lift,0,1.28,.79,1.18,2.4,.05,'#788e94');sign(lift,'无障碍电梯',0,2.8,.83,1.4,.3,'#26343c','#ffffff');
    screen(hub,'欢度国庆\n三阳广场站',0,1.9,-4.75,3.1,2.5,'#ab2131','#ffe5a1');

    // Extend existing facade anchors with separate windows, interiors and fittings.
    for(const f of facades){
      const {group:g,name,w}=f;
      // Existing facade is retained as backing; new pieces stand proud of its surface.
      for(const x of [-w/2+.08,w/2-.08])b(g,x,1.5,.22,.08,2.8,.16,'#798788',false,.6);
      b(g,0,.18,.25,w,.16,.14,'#889292',false,.6);
      if(/瑞幸|7-ELEVEN|茶颜/.test(name)){
        // Remove opaque lower backing to reveal a shallow, furnished shop interior.
        for(const m of [...g.children])if(m.isMesh&&m.geometry.type==='BoxGeometry'&&m.position.y>1&&m.position.y<1.7&&m.scale.x>w*.6){g.remove(m);}
        floor(g,0,-.85,w,2);wall(g,0,-1.8,w,.14);
        for(const x of [-w*.34,w*.34])b(g,x,1.32,.21,w*.28,2.35,.035,glass,true);
        b(g,0,.62,-1.2,w*.7,1,.5,'#a99a7c',true);screen(g,'MENU',0,1.9,-1.7,w*.6,.5,'#18518c');
        if(/瑞幸/.test(name))for(const x of [-w*.3,w*.3]){cyl(g,x,.78,-.35,.27,.07,'#a78d69');cyl(g,x,.45,-.35,.045,.7,'#41494b');b(g,x,.4,-.85,.38,.12,.38,'#55616a',true);b(g,x,.7,-1,.38,.55,.055,'#55616a');}
      } else {
        const color=/麦当劳/.test(name)?'#ed941a':/EviDenS/.test(name)?'#175bba':/LANC/.test(name)?'#91c6df':'#d9c7a0';
        screen(g,name,0,1.47,.24,w-.35,1.85,color,/麦当劳/.test(name)?'#fff347':'#ffffff');
        if(/EviDenS/.test(name))for(let i=0;i<12;i++)cyl(g,(i%2?1:-1)*w*.38,.5+i*.14,.31,.085,.035,i%3?'#dce5c6':'#a4bd6b');
      }
    }
    // Compact anchored vignettes fill the gaps between existing frontage landmarks.
    function arc(name,deg,w){const a=deg*Math.PI/180,g=group(name,10.8*Math.cos(a),8.3*Math.sin(a),-Math.PI/2-a);g.userData.source=name;return g;}
    const lottery=arc('252 福利彩票 / 电梯相邻',218);wall(lottery,0,-.12,2.35,.2);b(lottery,0,1.35,.025,2.1,2.35,.05,'#dedcd2',true);for(let y=.3;y<2.5;y+=.075)b(lottery,0,y,.06,2.05,.015,.025,'#a5aba6');screen(lottery,'中国福利彩票',0,2.88,.08,2.3,.38,'#bc2838');barriers(lottery,-1.3,.5);bin(lottery,1.4,.4);
    const event=arc('234–235 体育活动与自拍亭',71);
    for(const x of [-1.1,1.1])b(event,x,1.45,0,.22,2.7,.35,'#187cb5',true);screen(event,'梦想苏超  锡望登场',0,2.72,.19,2.6,.5,'#1479b6','#e8f8c3');
    for(const x of [-.8,.15,.9]){b(event,x,.6,-.45,.65,1,.6,'#d9d8df',true);b(event,x,1.4,-.7,.04,.65,.05,'#afbac1');}
    b(event,2.3,1.35,-.05,1.3,2.5,.8,'#e8e5df',true);screen(event,'WUXI\nDIY 大头贴',2.3,1.65,.37,1.02,1.25,'#8bd6da','#283c65');
    const metro=arc('236 自助服务区',45);screen(metro,'地铁城  METRO CITY',0,2.95,.12,3.3,.42,'#eee9e4','#cb4050');vending(metro,-1.3,0,'#637b54','饮品');
    for(let i=0;i<5;i++){const x=-.4+i*.48,col=['#9964b8','#e8c333','#e892af','#32b6be','#846dc0'][i];cyl(metro,x,.48,.35,.2,.7,col,true);const dome=new T.Mesh(new T.SphereGeometry(.22,16,12,0,Math.PI*2,0,Math.PI/2),glass);dome.position.set(x,1,.35);metro.add(dome);cyl(metro,x,.93,.35,.21,.2,glass);screen(metro,'扭蛋',x,.7,.565,.22,.16,'#c7e8ed','#334959');torus(metro,x,.17,.35,.2,.02,col);}
    vending(metro,2.6,0,'#dedfd8','自助鲜饮');
    const office=arc('245 地铁服务与展墙',276);wall(office,0,-.25,3.3,.2);b(office,0,1.7,-.1,2.25,1.0,.06,glass);screen(office,'三阳广场站\n身边的地铁  幸福的选择',0,2.8,.13,3.2,.48,'#eceee6','#b82b3b');
    for(const x of [-1.57,1.57])b(office,x,1.6,.03,.12,2.8,.09,'#c42d37');b(office,0,1.1,.05,2.5,.11,.5,'#bfc8c4',true,.6);b(office,0,.31,.06,3.1,.11,.05,material('#e1fff0',0,true));
    const street=arc('247 三阳商业街入口',260);for(const x of [-1.65,1.65])wall(street,x,-.4,.28,1.7);screen(street,'三阳商业街',0,3,.14,3.5,.4,'#e4e0d8','#b96b36');board(street,'←21–23   ↑24–27   1–11→','返回站厅',0,.4,3.5);for(const x of [-.8,0,.8])b(street,x,2.75,-.7,.3,.5,.035,'#cb3535');
    const tvm=arc('239 售票与地图',355);for(const x of [-.85,0,.85])ticket(tvm,x,0);screen(tvm,'无锡地铁  自动售票',0,2.45,.31,2.6,.36,'#eef0e8','#37575a');screen(tvm,'乘车资讯',.8,3.02,.32,.9,.48,'#237fa3');map(tvm,1.8,0,0,1.0);
    const led=arc('240 城市LED大屏',343);screen(led,'文明出行\n无锡地铁',0,1.65,.1,1.5,2.5,'#4879aa');
    const autumn=arc('246 中秋主题灯箱',266);screen(autumn,'月满中秋\n同庆华诞',0,1.7,.1,1.1,2.4,'#e8cc8a','#367ea0');
    const charity=arc('241 爱心加油站',324);screen(charity,'爱心加油站',0,2.5,.1,1.2,.35,'#b72835','#ffe38c');b(charity,0,.68,0,1.2,1.1,.65,'#c43339',true);
    const fraud=arc('251 反诈及设备门',232);wall(fraud,0,-.1,2.3,.2);screen(fraud,'遭遇诈骗不要慌\n冷静报警止损失',0,2.65,.03,2.2,.55,'#bf3136','#ffe9d3');b(fraud,.5,1.2,.08,.82,2.2,.04,'#adb4b0',true,.45);sign(fraud,'非请勿入',.5,2.34,.12,.8,.2,'#e3b733','#3c3932');safety(fraud,-.65,.13);
    const curtain=arc('232 红幕展台',105);b(curtain,0,.16,0,2,.22,1.2,'#2a3337',true);for(let x=-1;x<1;x+=.08)b(curtain,x,1.35,-.15,.06,2.3,.12,'#9a233c',true);for(const x of [-1,1]){cyl(curtain,x,.7,.65,.035,1.05,'#b4bdbc');cyl(curtain,x,.18,.65,.13,.05,'#a7b1b0');}b(curtain,0,.95,.65,2,.025,.035,'#c83747');
    // Additional source-anchored portals and small service elements; existing exit positions stay fixed.
    portal(root,'14',11,4,-Math.PI/2);portal(root,'24',-6,-13,Math.PI);portal(root,'2',-20,5,0);
    const vestibule=group('242–243 玻璃出入口',7.2,-6.1,-.87);
    for(const [x,txt] of [[-1.35,'21'],[0,'22'],[1.35,'23']])sign(vestibule,'↑ '+txt+' 出口',x,2.75,.09,1.2,.31);
    sign(vestibule,'集合会合点',0,1.9,.1,.6,.45,'#eeeae0','#b84655');
    for(const [x,z] of [[-7,-5],[7,-5],[-7,4],[7,4]]){const g=group('公共设施',x,z,Math.atan2(-x,-z));bin(g,0,0);umbrella(g,.6,0);sign(g,'安全出口 →',0,3.08,0,1.1,.2,'#16583c','#8effae');}
    for(let i=0;i<8;i++){const a=i*Math.PI/4,g=group('地面逃生箭头',7*Math.cos(a),5.4*Math.sin(a),-a);cyl(g,0,.14,0,.16,.015,'#355a42');const arrow=sign(g,'→',0,.153,0,.25,.15,'#355a42','#d4ecb1');arrow.rotation.x=-Math.PI/2;}

    // Batch static boxes by shared material and cutaway class. Collider records remain independent.
    function batchBoxes(){root.updateMatrixWorld(true);const buckets=new Map(),remove=[];
      root.traverse(o=>{if(!o.isMesh||(o.geometry!==cube&&o.geometry!==cylinder))return;let roof=false;for(let p=o;p&&p!==root;p=p.parent)if(p===ceilings||p.userData.cutaway)roof=true;const key=o.geometry.uuid+':'+o.material.uuid+':'+roof;if(!buckets.has(key))buckets.set(key,{geometry:o.geometry,mat:o.material,roof,shadow:false,items:[]});const bucket=buckets.get(key);bucket.shadow=bucket.shadow||o.castShadow;bucket.items.push(o.matrixWorld.clone());remove.push(o);});
      for(const o of remove)o.parent.remove(o);
      for(const {geometry,mat,roof,shadow,items} of buckets.values()){const m=new T.InstancedMesh(geometry,mat,items.length);items.forEach((q,i)=>m.setMatrixAt(i,q));m.receiveShadow=true;m.castShadow=shadow;m.userData.cutaway=roof;m.frustumCulled=false;root.add(m);}
    }
    batchBoxes();
    function inFloor(x,z){return floors.some(f=>Math.abs(x-f.x)<=f.w/2&&Math.abs(z-f.z)<=f.d/2);}
    function blocked(x,z,r=layout.radius){return colliders.some(c=>{const dx=x-c.x,dz=z-c.z,co=Math.cos(c.angle),si=Math.sin(c.angle);const u=co*dx-si*dz,v=si*dx+co*dz;return Math.abs(u)<c.w/2+r&&Math.abs(v)<c.d/2+r;});}
    function northWalkable(x,z){if(!inFloor(x,z)||blocked(x,z))return false;for(let i=0;i<12;i++){const a=i*Math.PI/6,dx=layout.radius*Math.cos(a),dz=layout.radius*Math.sin(a);if(z+dz>=7.5&&!inFloor(x+dx,z+dz))return false;}return true;}
    function setWalkMode(walk,cut=true){root.traverse(o=>{if(o.userData.cutaway)o.visible=walk||!cut;});}
    setWalkMode(false);
    return {root,layout,colliders,signs,textures,floors,boundary,northWalkable,blocked,setWalkMode};
  }
  global.StationDetails={layout,build};
})(typeof window!=='undefined'?window:globalThis);
