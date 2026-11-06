document.querySelector('#footer-year').textContent=new Date().getFullYear();
try {
const response=await fetch(new URL('./preview-content.json',import.meta.url));
if(response.ok){
const content=await response.json();
for(const [key,value] of Object.entries(content.fields||{})){
 const link=document.querySelector(`[data-cms-link="${key}"]`);if(link){const safe=/^(https:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9 ()-]+)$/.test(value);link.hidden=!safe;if(safe){link.href=value;link.rel='noopener noreferrer'}continue}
 if(key==='hero-image'){document.querySelector('.hero-image').style.backgroundImage=`url("${value}")`;continue}
 if(key==='motion-video'){const v=document.querySelector('#shirt-video');v.querySelector('source').src=value;v.load();continue}
 const el=document.querySelector(`[data-cms="${key}"]`);if(!el)continue;
 if(el.tagName==='IMG')el.src=value;else{el.replaceChildren();value.split('\n').forEach((line,i)=>{if(i)el.append(document.createElement('br'));const t=document.createElement(i&&/^H[12]$/.test(el.tagName)?'em':'span');t.textContent=line;el.append(t)})}
}
const posts=(content.posts||[]).filter(p=>p.published);const grid=document.querySelector('#post-grid');document.querySelector('#journal').hidden=!posts.length;
for(const post of posts){const card=document.createElement('article');card.className='journal-card';if(post.media){const video=/\.(mp4|webm)$/.test(post.media);const media=document.createElement(video?'video':'img');media.src=post.media;if(video){media.controls=true;media.preload='metadata';media.playsInline=true;media.setAttribute('aria-label',post.alt||post.title)}else{media.alt=post.alt||post.title;media.loading='lazy'}card.append(media)}const copy=document.createElement('div');const h=document.createElement('h3');h.textContent=post.title;const p=document.createElement('p');p.textContent=post.body;copy.append(h,p);card.append(copy);grid.append(card)}
}

} catch (error) { console.warn('Content updates could not be loaded. Showing the original page.'); }

const socialPlaceholder=document.querySelector('.footer-placeholder');if(socialPlaceholder)socialPlaceholder.hidden=Boolean(document.querySelector('.footer-socials a:not([hidden])'));
