#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const manifestPath = path.join(__dirname, 'B_manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('B_manifest.json not found. Run: npm run generate');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const logPath = path.join(__dirname, 'mcp-debug.log');
function log(msg) {
  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`); } catch {}
}
log('server:start');

// Load generated tool implementations (CommonJS)
const toolsImpl = require('./generated-mcp');
log('tools:module:loaded');

const server = new McpServer({
  name: 'whapi-mcp-optimal',
  version: '1.0.0'
}, {
  capabilities: {
    tools: { listChanged: true },
    resources: {},
    prompts: {},
    logging: {}
  }
});
log('server:created');

// Build a ZodRawShape from a JSON Schema-like object (subset used in B_manifest.json)
function buildZodShapeFromInputSchema(inputSchema) {
  const shape = {};
  if (!inputSchema || typeof inputSchema !== 'object') return shape;
  const properties = inputSchema.properties || {};
  const required = Array.isArray(inputSchema.required) ? new Set(inputSchema.required) : new Set();
  for (const [key, prop] of Object.entries(properties)) {
    let zt;
    const t = prop && prop.type;
    if (t === 'string') {
      zt = z.string();
    } else if (t === 'number' || t === 'integer') {
      zt = z.number();
    } else if (t === 'boolean') {
      zt = z.boolean();
    } else if (t === 'array') {
      const itemType = (prop.items && prop.items.type) || 'any';
      let zi;
      if (itemType === 'string') zi = z.string();
      else if (itemType === 'number' || itemType === 'integer') zi = z.number();
      else if (itemType === 'boolean') zi = z.boolean();
      else zi = z.any();
      zt = z.array(zi);
    } else if (t === 'object') {
      zt = z.record(z.any());
    } else {
      zt = z.any();
    }
    if (prop && typeof prop.description === 'string') {
      zt = zt.describe(prop.description);
    }
    shape[key] = required.has(key) ? zt : zt.optional();
  }
  return shape;
}

for (const tool of manifest) {
  const name = tool.toolName;
  const description = tool.description || tool.summary || `HTTP ${tool.http.method} ${tool.http.path}`;

  const paramsShape = buildZodShapeFromInputSchema(tool.inputSchema);
  const registerWithSchema = paramsShape && Object.keys(paramsShape).length > 0;

  const handler = async (args) => {
    const fn = toolsImpl[name];
    if (typeof fn !== 'function') {
      return {
        content: [{ type: 'text', text: `Tool implementation not found: ${name}` }],
        isError: true
      };
    }
    try {
      const result = await fn(args, process.env);
      return {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }]
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: 'text', text: String(e && e.message ? e.message : e) }]
      };
    }
  };

  if (registerWithSchema) {
    server.tool(name, description, paramsShape, handler);
    log(`tool:registered_with_schema:${name}:${Object.keys(paramsShape).join(',')}`);
  } else {
    server.tool(name, description, handler);
    log(`tool:registered_no_schema:${name}`);
  }
}
log(`tools:registered:${manifest.length}`);

// Useful prompts for common WhatsApp operations
server.prompt('send-text-message', 'Send a text message via WhatsApp', async (args) => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Send a WhatsApp text message to ${args?.to || 'a contact'}. ${args?.body ? `Message: "${args.body}"` : 'Ask the user for the recipient phone number and message text.'}`
    }
  }]
}));

server.prompt('send-media-message', 'Send a media message (image/video/document) via WhatsApp', async (args) => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Send a WhatsApp media message to ${args?.to || 'a contact'}. ${args?.media ? `Media URL: ${args.media}` : 'Ask the user for the recipient phone number, media type (image/video/document), and media URL or file path.'}`
    }
  }]
}));

server.prompt('manage-group', 'Manage WhatsApp group (add members, accept invites)', async (args) => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Help manage a WhatsApp group. ${args?.action ? `Action: ${args.action}` : 'Available actions: add members to a group, accept group invite, get group information. Ask the user what they want to do.'}`
    }
  }]
}));

server.prompt('check-contact', 'Check if a phone number has WhatsApp', async (args) => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Check if ${args?.phone ? `phone number ${args.phone}` : 'a phone number'} has WhatsApp. ${args?.phone ? 'Use the checkPhones tool.' : 'Ask the user for the phone number to check.'}`
    }
  }]
}));

server.prompt('get-chats', 'Get list of WhatsApp chats', async () => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: 'Get the list of WhatsApp chats. Use the getChats tool to retrieve all conversations.'
    }
  }]
}));

await server.connect(new StdioServerTransport());
log('server:connected');

// Add a minimal built-in tool to ensure at least one tool is always present
server.tool('hello', 'Simple health check tool', async () => ({
  content: [{ type: 'text', text: 'hello' }]
}));

// Notify client that tools are available
try { server.sendToolListChanged(); log('notify:tools:list_changed'); } catch {}
// Ensure the process stays alive when launched outside an MCP client
if (process.stdin && typeof process.stdin.resume === 'function') {
  process.stdin.resume();
}
