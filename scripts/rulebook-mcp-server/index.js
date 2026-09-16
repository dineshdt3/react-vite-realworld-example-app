import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";

const server = new Server(
  { name: "central-rulebook-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const RULES_PATH = process.env.RULEBOOK_PATH || "./central-rulebook/rules";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_code_review_rules",
        description: "Returns company code review standards and guidelines from Central-Rulebook",
        annotations: { readOnlyHint: true },
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_code_review_rules") {
    try {
      const files = fs.readdirSync(RULES_PATH);
      let combinedRules = "";

      for (const file of files) {
        if (file.endsWith(".md")) {
          const filePath = path.join(RULES_PATH, file);
          const content = fs.readFileSync(filePath, "utf-8");
          combinedRules += `\n--- Rules from ${file} ---\n` + content + "\n";
        }
      }

      return { content: [{ type: "text", text: combinedRules }] };
    } catch (error) {
      return { content: [{ type: "text", text: "Error reading rulebook files: " + error.message }] };
    }
  }

  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);