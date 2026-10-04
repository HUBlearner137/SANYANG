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
vm.runInContext(fs.readFileSync('assets/station-details.js','utf8'),context);
const html=fs.readFileSync(process.env.STATION_HTML||'index.html','utf8');const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
vm.runInContext(inline,context,{timeout:20000});
const {details:d,isWalkable:worldWalk,scene}=sandbox.stationViewer;
const walk=(x,v)=>worldWalk(x,-v);
let checks=0;function check(name,condition){checks++;assert(condition,name);console.log('PASS '+name);}
check('ring approach order: shop → entry → cross',d.layout.shop.z<d.layout.entry.z&&d.layout.entry.z<d.layout.cross.z);
function path(points){for(let i=1;i<points.length;i++){const [x,z]=points[i-1],[xx,zz]=points[i];const n=Math.ceil(Math.hypot(xx-x,zz-z)/.08);for(let j=0;j<=n;j++)if(!walk(x+(xx-x)*j/n,z+(zz-z)*j/n))return [x+(xx-x)*j/n,z+(zz-z)*j/n];}return null;}
for(const [name,points] of [
 ['main spine',[[0,7.6],[0,50]]],
 ['shop entrance and deep aisle',[[0,14.5],[3.4,14.5],[8,14.5],[16.5,14.5]]],
 ['entry hall opens from passage',[[0,20],[-4.2,20],[-7.8,20.5],[-10.2,20.5]]],
 ['6 cross arm',[[0,30],[-12,30]]],
 ['7 independent branch',[[0,36],[-5,36]]],
 ['11A left branch',[[0,30],[7.8,30],[9,34],[20.5,34]]],
 ['11B right branch',[[0,30],[7.8,30],[9,26],[20.5,26]]],
 ['restroom opposite the branch',[[0,30],[8,30],[10,26],[10,25.1],[13.2,25.1],[13.2,22]]]
 ]){const fail=path(points);check(name+(!fail?'':' blocked at '+fail),!fail);}
check('no connection across 6 / 7 arms',!walk(-5,33.8));
check('11A and 11B are physically separated after fork',!walk(15,30));
check('supermarket rear wall is solid',!walk(18.7,14.5));
check('restroom counter is solid',!walk(10,19));
check('restroom is opposite/south side of 11 forecourt',d.layout.toilet.z<d.layout.cross.z);
check('no mirrored sign texture',d.signs.every(s=>s.object.material.map.repeat.x>0));
check('MEN and WOMEN separately modeled',d.signs.some(s=>s.text==='男 MEN')&&d.signs.some(s=>s.text==='女 WOMEN'));
check('sign texture cache deduplicates',d.textures.size<d.signs.length);
d.setWalkMode(false);let roofs=[];d.root.traverse(o=>{if(o.userData.cutaway)roofs.push(o);});check('map cutaway',roofs.every(o=>!o.visible));d.setWalkMode(true);check('walk ceiling',roofs.every(o=>o.visible));d.setWalkMode(false);
const position=sandbox.stationViewer.nearestWalkPoint(10,-22);check('map target retained',Math.hypot(position[0]-10,position[1]+22)<.01);
let meshCount=0,triangles=0,bad=0,drawGroups=0;
scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh)return;meshCount++;if(o.matrixWorld.elements.some(n=>!Number.isFinite(n)))bad++;let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(visible){triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);drawGroups+=Array.isArray(o.material)?o.material.length:1;}});
check('finite geometry transforms',bad===0);
check('all signs have finite positive dimensions',d.signs.every(s=>s.object.geometry.parameters.width>0&&s.object.geometry.parameters.height>0));
// Movement must use the camera's screen-right basis; mouse right must reduce yaw.
check('strafe basis matches camera',inline.includes('rightX=-Math.cos(walkYaw),rightZ=Math.sin(walkYaw)'));
check('mouse right turns right',inline.includes('walkYaw-=ev.movementX'));
const vector=new THREE.Vector3();
const shopSign=d.signs.find(s=>s.text==='便利超市').object;
shopSign.getWorldPosition(vector);check('supermarket is on the right with a deep outward spur',vector.x>0&&vector.z<0&&d.layout.shop.x+d.layout.shop.w/2>17);
const men=d.signs.find(s=>s.text==='男 MEN').object.getWorldPosition(new THREE.Vector3());
const women=d.signs.find(s=>s.text==='女 WOMEN').object.getWorldPosition(new THREE.Vector3());
check('restroom MEN left WOMEN right facing toward the ring',men.x>women.x);
check('physical lettering orientation survives plan-axis conversion',d.signs.every(({object:o})=>o.matrixWorld.determinant()>0));
console.log(JSON.stringify({checks,meshCount,mapDrawGroups:drawGroups,mapTriangles:Math.round(triangles),detailTextureCount:d.textures.size,colliders:d.colliders.length,webglMeasured:false},null,2));
