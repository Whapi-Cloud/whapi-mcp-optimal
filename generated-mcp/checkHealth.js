const fetch = require('node-fetch');
module.exports = async function checkHealth(args, env = process.env) {
  // Build path with path params
  let pathTmpl = "/health";
  for (const p of []){
    const val = args[p.name];
    if (val === undefined || val === null) throw new Error('Missing path param: ' + p.name);
    pathTmpl = pathTmpl.replace('{'+p.name+'}', encodeURIComponent(String(val)));
  }

  // Query string
  const queryPairs = [];
  for (const q of [{"name":"wakeup","type":"boolean","required":false,"default":true,"description":"If set to false, the channel will not launch"},{"name":"platform","type":"string","required":false,"description":"Browser name, OS name, OS version separated by commas. Example: 'Safari,Windows,10.0.19044' or 'Desktop,Mac OS,11.6.3'"},{"name":"channel_type","type":"string","required":false,"enum":["web","mobile"],"default":"web","description":"Channel type. Web - for linking existing WA account via WA Web, Mobile - for creating new WA account"}]){
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
