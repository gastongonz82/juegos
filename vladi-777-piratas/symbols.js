const names={cherry:"coin",lemon:"compass",orange:"anchor",plum:"spyglass",bell:"skull",bar:"ship",seven:"chest"};
export const uri=s=>"./symbols/"+(names[s]||"chest")+".webp";
if(typeof Image!=="undefined")Object.keys(names).forEach(s=>{const img=new Image();img.decoding="async";img.src=uri(s)});
