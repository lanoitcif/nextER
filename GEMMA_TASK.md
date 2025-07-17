# GEMMA MCP SERVER TASK BRIEF

## 🎯 **Mission**
Build the first version of a TRIPOD MCP server for real-time multi-AI collaboration.

## 📋 **Key Requirements**
- **Context Limit**: Work within 10k tokens
- **Target**: Basic functional MCP server
- **Focus**: Core session management and messaging
- **Tech Stack**: TypeScript/Node.js MCP server

## 🏗️ **Phase 1 Implementation** (Start Here)

### **1. Basic MCP Server Structure**
```typescript
// File: tripod-mcp-server.ts
interface TripodSession {
  id: string
  name: string
  participants: string[]
  messages: Message[]
  created: Date
}

interface Message {
  id: string
  from: string
  content: string
  timestamp: Date
}
```

### **2. Core MCP Tools to Implement**
- `tripod_create_session(name: string)` - Create new session
- `tripod_join_session(sessionId: string, participantName: string)` - Join session
- `tripod_send_message(sessionId: string, from: string, content: string)` - Send message
- `tripod_get_messages(sessionId: string)` - Get message history
- `tripod_list_sessions()` - List active sessions

### **3. Simple Storage**
- Use JSON file storage for sessions
- Store in `./tripod-sessions/` directory
- Each session = one JSON file

## 🎯 **Deliverables**

1. **Basic MCP server file** (`tripod-mcp-server.ts`)
2. **Package.json** with MCP dependencies
3. **Simple test cases** to verify functionality
4. **README** with setup instructions

## 🔧 **Technical Notes**

- Keep it simple and functional
- Focus on core messaging between AIs
- No UI needed for Phase 1
- Use MCP TypeScript SDK
- File-based persistence is fine

## 🚀 **Success Criteria**

- [ ] MCP server starts successfully
- [ ] Can create sessions
- [ ] Can send/receive messages
- [ ] Multiple participants can join
- [ ] Basic persistence works

## 💡 **Tips for Gemma**

- Start with minimal viable implementation
- Test each function individually
- Use console.log for debugging
- Keep functions small and focused
- Ask for help if you get stuck!

## 📁 **File Structure**
```
tripod-mcp/
├── package.json
├── tripod-mcp-server.ts
├── types.ts
├── storage.ts
├── README.md
└── tripod-sessions/
    └── (session files)
```
