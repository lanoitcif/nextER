#!/usr/bin/env node

/**
 * TRIPOD MCP Server - Multi-AI Collaboration Framework
 * Built for Gemma's task requirements
 * 
 * A basic MCP server for real-time multi-AI collaboration
 * Supporting session management and messaging between AI participants
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Types
interface TripodSession {
  id: string;
  name: string;
  participants: string[];
  messages: Message[];
  created: Date;
  lastActivity: Date;
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
}

// Storage management
class TripodStorage {
  private sessionsDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.sessionsDir = path.join(__dirname, "tripod-sessions");
  }

  async ensureSessionsDir(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      console.error("Error creating sessions directory:", error);
    }
  }

  async saveSession(session: TripodSession): Promise<void> {
    await this.ensureSessionsDir();
    const filePath = path.join(this.sessionsDir, `${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  }

  async loadSession(sessionId: string): Promise<TripodSession | null> {
    try {
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      const data = await fs.readFile(filePath, "utf8");
      const session = JSON.parse(data);
      // Convert date strings back to Date objects
      session.created = new Date(session.created);
      session.lastActivity = new Date(session.lastActivity);
      session.messages = session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      return session;
    } catch (error) {
      return null;
    }
  }

  async listSessions(): Promise<TripodSession[]> {
    try {
      await this.ensureSessionsDir();
      const files = await fs.readdir(this.sessionsDir);
      const sessions: TripodSession[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.replace('.json', '');
          const session = await this.loadSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        }
      }
      
      return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      console.error("Error listing sessions:", error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize storage
const storage = new TripodStorage();

// Initialize server
const server = new Server(
  {
    name: "tripod-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "tripod_create_session",
        description: "Create a new TRIPOD collaboration session",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the session",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "tripod_join_session",
        description: "Join an existing TRIPOD session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the session to join",
            },
            participantName: {
              type: "string",
              description: "Name of the participant joining",
            },
          },
          required: ["sessionId", "participantName"],
        },
      },
      {
        name: "tripod_send_message",
        description: "Send a message to a TRIPOD session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the session",
            },
            from: {
              type: "string",
              description: "Name of the message sender",
            },
            content: {
              type: "string",
              description: "Message content",
            },
          },
          required: ["sessionId", "from", "content"],
        },
      },
      {
        name: "tripod_get_messages",
        description: "Get message history from a TRIPOD session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the session",
            },
            limit: {
              type: "number",
              description: "Maximum number of messages to retrieve (default: 50)",
            },
          },
          required: ["sessionId"],
        },
      },
      {
        name: "tripod_list_sessions",
        description: "List all active TRIPOD sessions",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "tripod_create_session": {
        const { name: sessionName } = args as { name: string };
        
        const session: TripodSession = {
          id: generateId(),
          name: sessionName,
          participants: [],
          messages: [],
          created: new Date(),
          lastActivity: new Date(),
        };
        
        await storage.saveSession(session);
        
        return {
          content: [
            {
              type: "text",
              text: `Session created successfully!\n\nSession ID: ${session.id}\nName: ${session.name}\nCreated: ${session.created.toISOString()}\n\nUse this session ID to join the session or send messages.`,
            },
          ],
        };
      }

      case "tripod_join_session": {
        const { sessionId, participantName } = args as { sessionId: string; participantName: string };
        
        const session = await storage.loadSession(sessionId);
        if (!session) {
          throw new McpError(ErrorCode.InvalidRequest, `Session ${sessionId} not found`);
        }
        
        if (!session.participants.includes(participantName)) {
          session.participants.push(participantName);
          session.lastActivity = new Date();
          await storage.saveSession(session);
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully joined session "${session.name}"!\n\nParticipants: ${session.participants.join(", ")}\nMessage count: ${session.messages.length}\nLast activity: ${session.lastActivity.toISOString()}`,
            },
          ],
        };
      }

      case "tripod_send_message": {
        const { sessionId, from, content } = args as { sessionId: string; from: string; content: string };
        
        const session = await storage.loadSession(sessionId);
        if (!session) {
          throw new McpError(ErrorCode.InvalidRequest, `Session ${sessionId} not found`);
        }
        
        const message: Message = {
          id: generateId(),
          from,
          content,
          timestamp: new Date(),
        };
        
        session.messages.push(message);
        session.lastActivity = new Date();
        
        // Add sender to participants if not already present
        if (!session.participants.includes(from)) {
          session.participants.push(from);
        }
        
        await storage.saveSession(session);
        
        return {
          content: [
            {
              type: "text",
              text: `Message sent successfully!\n\nFrom: ${from}\nContent: ${content}\nTimestamp: ${message.timestamp.toISOString()}\nMessage ID: ${message.id}`,
            },
          ],
        };
      }

      case "tripod_get_messages": {
        const { sessionId, limit = 50 } = args as { sessionId: string; limit?: number };
        
        const session = await storage.loadSession(sessionId);
        if (!session) {
          throw new McpError(ErrorCode.InvalidRequest, `Session ${sessionId} not found`);
        }
        
        const messages = session.messages
          .slice(-limit)
          .map(msg => `[${msg.timestamp.toISOString()}] ${msg.from}: ${msg.content}`)
          .join('\n');
        
        return {
          content: [
            {
              type: "text",
              text: `Session: ${session.name}\nParticipants: ${session.participants.join(", ")}\nTotal messages: ${session.messages.length}\n\n--- Messages ---\n${messages || "No messages yet"}`,
            },
          ],
        };
      }

      case "tripod_list_sessions": {
        const sessions = await storage.listSessions();
        
        if (sessions.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No active sessions found.",
              },
            ],
          };
        }
        
        const sessionList = sessions
          .map(session => `• ${session.name} (${session.id})\n  Participants: ${session.participants.join(", ") || "None"}\n  Messages: ${session.messages.length}\n  Last activity: ${session.lastActivity.toISOString()}`)
          .join('\n\n');
        
        return {
          content: [
            {
              type: "text",
              text: `Active TRIPOD Sessions (${sessions.length}):\n\n${sessionList}`,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Error executing tool: ${error}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TRIPOD MCP Server running on stdio");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}