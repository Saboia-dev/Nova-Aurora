const paths = {
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', back:'<path d="M20 12H4m6-6-6 6 6 6"/>', play:'<path d="m9 5 11 7-11 7Z"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>', book:'<path d="M12 6c-3-3-7-3-10-2v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
  sound:'<path d="M11 4 6 8H3v8h3l5 4ZM15 8c3 2 3 6 0 8m3-12c6 4 6 12 0 16"/>', mute:'<path d="M11 4 6 8H3v8h3l5 4Zm5 5 6 6m0-6-6 6"/>',
  gear:'<path d="m9 3-1 3-3 1-2 4 2 2v3l3 1 1 4h6l1-4 3-1v-3l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  water:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15c0 3 2 4 4 4"/>',
  recycle:'<path d="m8 4 4-2 4 7m0-5v5h-5m8 3 3 5-4 4H9m12-4-3 4-2-4M5 18l-3-5 4-7m-4 7 4-1 1 4"/>',
  leaf:'<path d="M20 3C8 1 2 9 5 17c7 5 17-1 15-14ZM4 21 16 9"/>', solar:'<path d="m5 9-3 11h20L19 9ZM7 9l-1 11m6-11v11m5-11 1 11M4 14h16M12 1v3m-6-1 2 2m10-2-2 2"/>',
  bridge:'<path d="M2 19h20M4 19V7m16 12V7M4 9c5 7 11 7 16 0m-12 5v5m4-3v3m4-5v5"/>',
  check:'<path d="m5 12 4 4L19 6"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>', lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>', bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>',
  ruler:'<path d="m3 16 13-13 5 5L8 21ZM7 12l3 3m0-6 3 3m0-6 3 3"/>', cube:'<path d="m12 2 10 5v10l-10 5-10-5V7Zm0 10v10M2 7l10 5 10-5M7 4l10 5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>', flag:'<path d="M5 22V3h14l-3 5 3 5H5"/>', help:'<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 3 4v2m0 3h.01"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 3"/>', trophy:'<path d="M7 3h10v8a5 5 0 0 1-10 0ZM7 5H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4m-5 3v5m-5 0h10"/>',
  download:'<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>', plus:'<path d="M12 4v16M4 12h16"/>', minus:'<path d="M4 12h16"/>', reset:'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>', moon:'<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>',
  move:'<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3"/>', eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  plant:'<path d="M12 22V10M12 14C2 14 3 4 3 4s10-1 9 10Zm0-4c0-8 9-8 9-8s2 8-9 8Z"/>', building:'<path d="M4 22V4h10v18M14 10h6v12M8 8h2m-2 4h2m-2 4h2m-2 4h2m7-6h1m-1 4h1M2 22h20"/>', calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 5h10v4H7ZM7 13h1m4 0h1m4 0h1M7 17h1m4 0h1m4 0h1"/>',
  home:'<path d="m2 10 10-8 10 8M5 8v14h14V8M9 22v-8h6v8"/>', chevron:'<path d="m9 5 7 7-7 7"/>', compass:'<circle cx="12" cy="12" r="10"/><path d="m8 16 2-6 6-2-2 6Z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>', fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', arrowUp:'<path d="M12 20V4m-6 6 6-6 6 6"/>'
};
export const icon=(name,cls='')=>`<svg class="icon ${cls}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.cube}</svg>`;
export const crest=()=>`<img class="crest" src="./crest.svg" alt="" width="44" height="50">`;
export const escapeHTML=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
