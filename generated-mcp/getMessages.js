const fetch = require('node-fetch');
module.exports = async function getMessages(args, env = process.env) {
  // Build path with path params
  let pathTmpl = "/messages/list";
  for (const p of []){
    const val = args[p.name];
    if (val === undefined || val === null) throw new Error('Missing path param: ' + p.name);
    pathTmpl = pathTmpl.replace('{'+p.name+'}', encodeURIComponent(String(val)));
  }

  // Query string
  const queryPairs = [];
  for (const q of [{"name":"count","type":"number","required":false,"default":100,"description":"Count of objects to return"},{"name":"offset","type":"number","required":false,"description":"Offset of objects to return"},{"name":"time_from","type":"number","required":false,"description":"Timestamp from which to get objects"},{"name":"time_to","type":"number","required":false,"description":"Timestamp up to which to get objects"},{"name":"normal_types","type":"boolean","required":false,"description":"If false, include system messages"},{"name":"author","type":"string","required":false,"description":"To filter by author (Contact ID)"},{"name":"from_me","type":"boolean","required":false,"description":"If true, only return messages sent by the authenticated user. If false, only return messages sent by other users."},{"name":"sort","type":"string","required":false,"enum":["asc","desc"],"description":"Order for items in request"}]){
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
