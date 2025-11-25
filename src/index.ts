#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import CryptoJS from "crypto-js";

// OTC Configuration from environment
const OTC_ACCESS_KEY = process.env.OTC_ACCESS_KEY || "";
const OTC_SECRET_KEY = process.env.OTC_SECRET_KEY || "";
const OTC_PROJECT_ID = process.env.OTC_PROJECT_ID || "";
const OTC_REGION = process.env.OTC_REGION || "eu-de";

// OTC API Endpoints
const IAM_ENDPOINT = `https://iam.${OTC_REGION}.otc.t-systems.com`;
const ECS_ENDPOINT = `https://ecs.${OTC_REGION}.otc.t-systems.com`;

let authToken: string | null = null;
let tokenExpiry: Date | null = null;

// Get IAM Token
async function getToken(): Promise<string> {
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }
  
  const response = await axios.post(
    `${IAM_ENDPOINT}/v3/auth/tokens`,
    {
      auth: {
        identity: {
          methods: ["hw_ak_sk"],
          hw_ak_sk: {
            access: { key: OTC_ACCESS_KEY },
            secret: { key: OTC_SECRET_KEY }
          }
        },
        scope: { project: { id: OTC_PROJECT_ID } }
      }
    },
    { headers: { "Content-Type": "application/json" } }
  );
  
  authToken = response.headers["x-subject-token"];
  tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
  return authToken!;
}

// Create MCP Server
const server = new McpServer({
  name: "otc-mcp-server",
  version: "0.1.0"
});

// Tool: List ECS Servers
server.tool(
  "list_ecs_servers",
  "List all Elastic Cloud Servers in your OTC project",
  {},
  async () => {
    const token = await getToken();
    const response = await axios.get(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/detail`,
      { headers: { "X-Auth-Token": token } }
    );
    return { content: [{ type: "text", text: JSON.stringify(response.data.servers, null, 2) }] };
  }
);

// Tool: Get ECS Details
server.tool(
  "get_ecs_details",
  "Get details of a specific ECS server",
  { server_id: z.string().describe("The ECS server ID") },
  async ({ server_id }) => {
    const token = await getToken();
    const response = await axios.get(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/${server_id}`,
      { headers: { "X-Auth-Token": token } }
    );
    return { content: [{ type: "text", text: JSON.stringify(response.data.server, null, 2) }] };
  }
);

// Tool: Start ECS Server
server.tool(
  "start_ecs_server",
  "Start a stopped ECS server",
  { server_id: z.string().describe("The ECS server ID to start") },
  async ({ server_id }) => {
    const token = await getToken();
    await axios.post(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/action`,
      { "os-start": { servers: [{ id: server_id }] } },
      { headers: { "X-Auth-Token": token, "Content-Type": "application/json" } }
    );
    return { content: [{ type: "text", text: `Server ${server_id} start initiated` }] };
  }
);

// Tool: Stop ECS Server
server.tool(
  "stop_ecs_server",
  "Stop a running ECS server",
  { server_id: z.string().describe("The ECS server ID to stop") },
  async ({ server_id }) => {
    const token = await getToken();
    await axios.post(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/action`,
      { "os-stop": { servers: [{ id: server_id }] } },
      { headers: { "X-Auth-Token": token, "Content-Type": "application/json" } }
    );
    return { content: [{ type: "text", text: `Server ${server_id} stop initiated` }] };
  }
);

// Tool: Reboot ECS Server  
server.tool(
  "reboot_ecs_server",
  "Reboot an ECS server",
  { 
    server_id: z.string().describe("The ECS server ID"),
    type: z.enum(["SOFT", "HARD"]).default("SOFT").describe("Reboot type")
  },
  async ({ server_id, type }) => {
    const token = await getToken();
    await axios.post(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/action`,
      { reboot: { type, servers: [{ id: server_id }] } },
      { headers: { "X-Auth-Token": token, "Content-Type": "application/json" } }
    );
    return { content: [{ type: "text", text: `Server ${server_id} ${type} reboot initiated` }] };
  }
);

// Tool: List Flavors
server.tool(
  "list_flavors",
  "List available ECS flavors (instance types)",
  {},
  async () => {
    const token = await getToken();
    const response = await axios.get(
      `${ECS_ENDPOINT}/v1/${OTC_PROJECT_ID}/cloudservers/flavors`,
      { headers: { "X-Auth-Token": token } }
    );
    return { content: [{ type: "text", text: JSON.stringify(response.data.flavors, null, 2) }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OTC MCP Server running on stdio");
}

main().catch(console.error);
