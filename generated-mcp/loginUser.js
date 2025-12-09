const fetch = require('node-fetch');
module.exports = async function loginUser(args, env = process.env) {
  // Build path with path params
  let pathTmpl = "/users/login";
  for (const p of []){
    const val = args[p.name];
    if (val === undefined || val === null) throw new Error('Missing path param: ' + p.name);
    pathTmpl = pathTmpl.replace('{'+p.name+'}', encodeURIComponent(String(val)));
  }

  // Query string
  const queryPairs = [];
  for (const q of [{"name":"wakeup","type":"boolean","required":false,"default":true,"description":"If set to false, the channel will not launch"},{"name":"size","type":"number","required":false,"description":"Size of QR-code"},{"name":"width","type":"number","required":false,"description":"Width of result image"},{"name":"height","type":"number","required":false,"description":"Height of result image"},{"name":"color_light","type":"string","required":false,"description":"Background color"},{"name":"color_dark","type":"string","required":false,"description":"Color of code"}]){
    const v = args[q.name];
    if (v === undefined || v === null) continue;
    queryPairs.push(encodeURIComponent(q.name) + '=' + encodeURIComponent(String(v)));
  }
  const qs = queryPairs.length ? '?' + queryPairs.join('&') : '';

  // Headers
  const headers = {};
  headers['Authorization'] = 'Bearer ' + (env.API_TOKEN || '');

  const url = "https://gate.whapi.cloud" + pathTmpl + qs;
  const method = "GET";

  const init = { method, headers };
  
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';
  let content;
  if (contentType.includes('application/json')) content = await res.json(); else content = await res.text();
  return { status: res.status, content };
};
