// Scene and navigation acceptance without a browser/WebGL dependency.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const THREE=require('../assets/three.min.js');
const noop=()=>{};
const ctx=new Proxy({measureText:s=>({width:s.length*30})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const elements=new Map();
function element(){return {style:{},dataset:{},classList:{toggle:noop},addEventListener:noop,appendChild:noop,setAttribute:noop,getContext:()=>ctx,hidden:false,innerHTML:'',textContent:''};}
const document={createElement:()=>element(),querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);},querySelectorAll:()=>[],addEventListener:noop};
class Renderer {constructor(){this.domElement=element();this.shadowMap={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(){}}
class Orbit {constructor(){this.target=new THREE.Vector3();}dispose(){}update(){}}
const T={...THREE,WebGLRenderer:Renderer,OrbitControls:Orbit};
const sandbox={THREE:T,document,innerWidth:1920,innerHeight:1080,devicePixelRatio:1,requestAnimationFrame:noop,addEventListener:noop,console,performance:{now:()=>0}};sandbox.window=sandbox;const context=vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/station-surfaces.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/station-details.js','utf8'),context);
const html=fs.readFileSync(process.env.STATION_HTML||'index.html','utf8');const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
vm.runInContext(inline,context,{timeout:20000});
const {details:d,isWalkable:worldWalk,scene}=sandbox.stationViewer;
const walk=(x,v)=>worldWalk(x,-v);
let checks=0;function check(name,condition){checks++;assert(condition,name);console.log('PASS '+name);}
check('shop → entry → cross',d.layout.shop.z<d.layout.entry.z&&d.layout.entry.z<d.layout.cross.z);
function path(points){for(let i=1;i<points.length;i++){const [x,z]=points[i-1],[xx,zz]=points[i];const n=Math.ceil(Math.hypot(xx-x,zz-z)/.08);for(let j=0;j<=n;j++)if(!walk(x+(xx-x)*j/n,z+(zz-z)*j/n))return [x+(xx-x)*j/n,z+(zz-z)*j/n];}return null;}
for(const [name,points] of [
 ['ring to north corridor',[[0,6.3],[0,8]]],
 ['main spine',[[0,7.6],[0,50]]],
 ['shop spur and rear storefront',[[0,14.5],[3.4,14.5],[8,14.5],[11.8,14.5],[16.5,14.5]]],
 ['entry security front',[[0,20.5],[3.4,20.5],[6.5,20.5]]],
 ['6 cross arm',[[0,30],[-12,30]]],
 ['7 independent branch',[[0,36],[-5,36]]],
 ['11A left branch',[[0,30],[7,30],[9,30],[9,31.5],[10.8,32.4],[10.8,34.5],[20,34.5]]],
 ['11B right branch',[[0,30],[7,30],[9,30],[9,28.5],[10.8,27.6],[10.8,26],[20,26]]],
 ['restroom opposite 11B',[[0,30],[9,30],[9,28.5],[10.8,27.6],[10.8,26],[19,26],[19,24.6],[19,23.5]]],
 ['restroom sink approach',[[19,23.5],[21.2,23],[21.2,21.6],[21.2,20],[19,19.95]]]
 ]){const fail=path(points);check(name+(!fail?'':' blocked at '+fail),!fail);}
check('no connection across 6 / 7 arms',!walk(-5,33.8));
check('11A and 11B separated beyond the shared forecourt',!walk(18.7,30));
check('supermarket rear wall is solid',!walk(18.7,13.2));
check('restroom rear wall is solid',!walk(19,17.7));
check('restroom opposite/south of exit branches',d.layout.toilet.z<d.layout.exits['11B'][1]);
check('no mirrored sign texture',d.signs.every(s=>s.object.material.map.repeat.x>0));
check('MEN and WOMEN separately modeled',d.signs.some(s=>s.text==='男 MEN')&&d.signs.some(s=>s.text==='女 WOMEN'));
check('sign texture cache deduplicates',d.textures.size<d.signs.length);
d.setWalkMode(false);let roofs=[];d.root.traverse(o=>{if(o.userData.cutaway)roofs.push(o);});check('map cutaway',roofs.every(o=>!o.visible));d.setWalkMode(true);check('walk ceiling',roofs.every(o=>o.visible));d.setWalkMode(false);
const position=sandbox.stationViewer.nearestWalkPoint(19,-24);check('map target retained',Math.hypot(position[0]-19,position[1]+24)<.01);
let meshCount=0,triangles=0,bad=0,drawGroups=0;
scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh)return;meshCount++;if(o.matrixWorld.elements.some(n=>!Number.isFinite(n)))bad++;let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(visible){triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);drawGroups+=Array.isArray(o.material)?o.material.length:1;}});
check('finite geometry transforms',bad===0);
check('all signs have finite positive dimensions',d.signs.every(s=>s.object.geometry.parameters.width>0&&s.object.geometry.parameters.height>0));
// Movement must use the camera's screen-right basis; mouse right must reduce yaw.
check('strafe basis matches camera',inline.includes('rightX=-Math.cos(walkYaw),rightZ=Math.sin(walkYaw)'));
check('mouse right turns right',inline.includes('walkYaw-=ev.movementX'));
const vector=new THREE.Vector3();
const shopSign=d.signs.find(s=>s.text==='便利超市').object;
shopSign.getWorldPosition(vector);check('supermarket has a deep right-hand spur',vector.x>11&&vector.z<0&&d.layout.shop.x+d.layout.shop.w/2>18);
const men=d.signs.find(s=>s.text==='男 MEN').object.getWorldPosition(new THREE.Vector3());
const women=d.signs.find(s=>s.text==='女 WOMEN').object.getWorldPosition(new THREE.Vector3());
check('restroom MEN left WOMEN right on entering',men.x>women.x);
const exit6=d.root.getObjectByName('出口 6');
check('6 stair portal ascends along outbound passage',exit6&&Math.abs(exit6.rotation.y)<.01);
const entry=d.root.getObjectByName('面向圆环的安检与进站口');
check('entry faces the ring along the passage',entry&&Math.abs(entry.rotation.y)<.01&&d.signs.some(s=>s.text.includes('安检进站')));
check('physical lettering orientation survives plan-axis conversion',d.signs.every(({object:o})=>o.matrixWorld.determinant()>0));
check('all exposed north floor edges have collision walls',d.boundary.every(e=>d.blocked(e.x,e.z,0)));
check('restroom open center and solid parked glass leaves',walk(19,24.79)&&!walk(20.5,24.79)&&!walk(17.5,24.79));
const externalMen=d.signs.find(s=>s.text==='男厕  MEN').object.getWorldPosition(new THREE.Vector3());
const externalWomen=d.signs.find(s=>s.text==='女厕  WOMEN').object.getWorldPosition(new THREE.Vector3());
check('restroom exterior and interior sides agree',externalMen.x>externalWomen.x);
check('original furniture is included in collision boundaries',sandbox.stationViewer.legacyColliders.length>20&&!walk(0,0));
check('interior light count remains bounded',sandbox.stationViewer.localLights.length===6&&sandbox.stationViewer.localLights.every(l=>!l.castShadow));
const viewer=sandbox.stationViewer,piers=[...viewer.pierSpecs.map(([x,z])=>[x,z,.69]),...viewer.outerPierSpecs.map(([x,z])=>[x,z,.83])];
check('ring escalators do not intersect column plinths',viewer.legacyColliders.filter(c=>c.name==='扶梯占地').every(c=>piers.every(([x,z,r])=>{
  const dx=x-c.x,dz=z-c.z,u=Math.cos(c.angle)*dx-Math.sin(c.angle)*dz,v=Math.sin(c.angle)*dx+Math.cos(c.angle)*dz;
  return Math.hypot(Math.max(0,Math.abs(u)-c.w/2),Math.max(0,Math.abs(v)-c.d/2))>r;
})));
// A small flood fill allows detours around piers and the corrected escalator banks.
const visited=new Set(['0,0']),queue=[[0,0]],reachable=[];
for(let q=0;q<queue.length;q++){
  const [i,j]=queue[q],x=i*.35,z=6.3+j*.35;reachable.push([x,z]);
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ni=i+di,nj=j+dj,key=ni+','+nj,xx=ni*.35,zz=6.3+nj*.35;
    if(visited.has(key)||Math.abs(xx)>10||Math.abs(zz)>8)continue;visited.add(key);
    if(walk(xx,zz)&&walk((x+xx)/2,(z+zz)/2))queue.push([ni,nj]);
  }
}
const quadrantDistances=[[7,0],[-7,0],[0,-6]].map(([x,z])=>Math.min(...reachable.map(([xx,zz])=>Math.hypot(x-xx,z-zz))));
check('ring quadrants remain mutually accessible: '+quadrantDistances.map(x=>x.toFixed(2)).join(', '),quadrantDistances.every(d=>d<.5));
// Downward rays must hit a visible floor under navigable samples in each wing.
const down=new THREE.Raycaster(),surfaceMeshes=[];scene.traverse(o=>{if(o.isMesh)surfaceMeshes.push(o);});let missingFloor=[];
for(const [x,z] of [[0,8],[0,20],[0,30],[-12,30],[16,14.5],[19,26],[19,23.5],[19,19.95],[20,34.5],[6,2],[-15,1],[30,1]]){
  if(!walk(x,z))continue;down.set(new THREE.Vector3(x,.28,-z),new THREE.Vector3(0,-1,0));
  const hits=down.intersectObjects(surfaceMeshes,false).filter(h=>h.point.y>=-.02&&h.point.y<=.22);
  if(!hits.length)missingFloor.push([x,z]);
}
check('walkable sample points have supporting floor geometry: '+JSON.stringify(missingFloor),missingFloor.length===0);
console.log(JSON.stringify({checks,meshCount,mapDrawGroups:drawGroups,mapTriangles:Math.round(triangles),detailTextureCount:d.textures.size,colliders:d.colliders.length,webglMeasured:false},null,2));
