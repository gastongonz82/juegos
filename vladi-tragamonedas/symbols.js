const symbols=["cherry","lemon","orange","plum","bell","bar","seven"];
export const uri=s=>"./symbols-premium/"+(symbols.includes(s)?s:"seven")+".webp";
if(typeof Image!=="undefined")symbols.forEach(s=>{const img=new Image();img.decoding="async";img.src=uri(s)});
