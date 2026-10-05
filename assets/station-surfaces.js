/* Meter-scale procedural finishes. No image downloads or framework required. */
(function(global){
  'use strict';
  const cache=new Map();
  function finish(T,color,kind='stone',roughness=.48,metalness=0){
    const key=[color,kind,roughness,metalness].join(':');
    if(cache.has(key))return cache.get(key);
    const m=new T.MeshStandardMaterial({color,roughness,metalness});
    m.customProgramCacheKey=()=>kind;
    m.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vFinishPosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
        vec4 finishPosition=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          finishPosition=instanceMatrix*finishPosition;
        #endif
        vFinishPosition=(modelMatrix*finishPosition).xyz;`);
      shader.fragmentShader='varying vec3 vFinishPosition;\n'+shader.fragmentShader;
      const effect=kind==='stone'?`
        vec2 tile=abs(fract(vFinishPosition.xz/1.2+.5)-.5);
        float seam=smoothstep(.491,.498,max(tile.x,tile.y));
        float grain=fract(sin(dot(floor(vFinishPosition.xz*170.0),vec2(127.1,311.7)))*43758.5453);
        diffuseColor.rgb*=mix(.96+grain*.08,.70,seam);`:`
        float seam=smoothstep(.488,.498,abs(fract(vFinishPosition.y/.72+.5)-.5));
        diffuseColor.rgb*=mix(1.0,.86,seam);`;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+effect);
    };
    cache.set(key,m);return m;
  }
  global.StationSurfaces={finish};
})(typeof window!=='undefined'?window:globalThis);
