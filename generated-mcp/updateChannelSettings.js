const fetch = require('node-fetch');
module.exports = async function updateChannelSettings(args, env = process.env) {
  // Build path with path params
  let pathTmpl = "/settings";
  for (const p of []){
    const val = args[p.name];
    if (val === undefined || val === null) throw new Error('Missing path param: ' + p.name);
    pathTmpl = pathTmpl.replace('{'+p.name+'}', encodeURIComponent(String(val)));
  }

  // Query string
  const queryPairs = [];
  for (const q of []){
    const v = args[q.name];
    if (v === undefined || v === null) continue;
    queryPairs.push(encodeURIComponent(q.name) + '=' + encodeURIComponent(String(v)));
  }
  const qs = queryPairs.length ? '?' + queryPairs.join('&') : '';

  // Headers
  const headers = {};
  headers['Authorization'] = 'Bearer ' + (env.API_TOKEN || '');

  const url = "https://gate.whapi.cloud" + pathTmpl + qs;
  const method = "PATCH";

  const init = { method, headers };
  
  if (method !== 'GET'){
    init.headers['Content-Type'] = 'application/json';
    const bodyObj = {};
    if (args.hasOwnProperty('callback_backoff_delay_ms')) bodyObj['callback_backoff_delay_ms'] = args['callback_backoff_delay_ms'];
    if (args.hasOwnProperty('max_callback_backoff_delay_ms')) bodyObj['max_callback_backoff_delay_ms'] = args['max_callback_backoff_delay_ms'];
    if (args.hasOwnProperty('callback_persist')) bodyObj['callback_persist'] = args['callback_persist'];
    if (args.hasOwnProperty('media')) bodyObj['media'] = args['media'];
    if (args.hasOwnProperty('webhooks')) bodyObj['webhooks'] = args['webhooks'];
    if (args.hasOwnProperty('proxy')) bodyObj['proxy'] = args['proxy'];
    if (args.hasOwnProperty('mobile_proxy')) bodyObj['mobile_proxy'] = args['mobile_proxy'];
    if (args.hasOwnProperty('offline_mode')) bodyObj['offline_mode'] = args['offline_mode'];
    if (args.hasOwnProperty('full_history')) bodyObj['full_history'] = args['full_history'];
    init.body = JSON.stringify(bodyObj);
  }
  
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';
  let content;
  if (contentType.includes('application/json')) content = await res.json(); else content = await res.text();
  return { status: res.status, content };
};
