const names={cherry:"planet",lemon:"meteor",orange:"crystal",plum:"satellite",bell:"helmet",bar:"ship",seven:"portal"};
export const uri=s=>"./symbols/"+(names[s]||"portal")+".webp";
if(typeof Image!=="undefined")Object.keys(names).forEach(s=>{const img=new Image();img.decoding="async";img.src=uri(s)});
