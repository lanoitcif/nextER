# TRIPOD MCP Server

A Model Context Protocol (MCP) server for multi-AI collaboration. Built to fulfill Gemma's task requirements for real-time session management and messaging between AI participants.

## 🎯 Features

- **Session Management**: Create and manage collaboration sessions
- **Multi-AI Support**: Multiple AI participants can join sessions
- **Real-time Messaging**: Send and receive messages between participants
- **Persistent Storage**: JSON file-based session persistence
- **Simple API**: Clean MCP tool interface for easy integration

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

### Development

For development with auto-reload:
```bash
npm run dev
```

## 📡 MCP Tools

The server provides 5 core MCP tools:

### 1. `tripod_create_session`
Create a new collaboration session.

**Parameters:**
- `name` (string): Name of the session

**Example:**
```json
{
  "name": "AI Strategy Discussion"
}
```

### 2. `tripod_join_session`
Join an existing session.

**Parameters:**
- `sessionId` (string): ID of the session to join
- `participantName` (string): Name of the participant

**Example:**
```json
{
  "sessionId": "abc123",
  "participantName": "Claude"
}
```

### 3. `tripod_send_message`
Send a message to a session.

**Parameters:**
- `sessionId` (string): Target session ID
- `from` (string): Sender name
- `content` (string): Message content

**Example:**
```json
{
  "sessionId": "abc123",
  "from": "Claude",
  "content": "I think we should approach this systematically..."
}
```

### 4. `tripod_get_messages`
Retrieve message history from a session.

**Parameters:**
- `sessionId` (string): Session ID
- `limit` (number, optional): Max messages to retrieve (default: 50)

**Example:**
```json
{
  "sessionId": "abc123",
  "limit": 20
}
```

### 5. `tripod_list_sessions`
List all active sessions.

**Parameters:** None

## 🗄️ Storage

Sessions are stored as JSON files in the `./tripod-sessions/` directory:
- Each session = one JSON file
- Filename format: `{sessionId}.json`
- Automatic directory creation
- Date objects properly serialized/deserialized

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The test suite covers:
- Session creation
- Session listing
- Participant joining
- Message sending
- Message retrieval

## 🏗️ Architecture

```
tripod-mcp-server/
├── tripod-mcp-server.ts    # Main server implementation
├── tripod-package.json     # Dependencies and scripts
├── test-tripod.js          # Test suite
├── TRIPOD-README.md        # This file
└── tripod-sessions/        # Session storage directory
    ├── session1.json
    ├── session2.json
    └── ...
```

## 📋 Data Structures

### TripodSession
```typescript
interface TripodSession {
  id: string;
  name: string;
  participants: string[];
  messages: Message[];
  created: Date;
  lastActivity: Date;
}
```

### Message
```typescript
interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
}
```

## 🔧 Configuration

The server uses standard MCP configuration:
- **Transport**: STDIO (standard input/output)
- **Protocol**: JSON-RPC 2.0
- **Capabilities**: Tools only (no resources or prompts)

## 🚨 Error Handling

The server includes comprehensive error handling:
- Invalid session IDs return appropriate error codes
- File system errors are caught and logged
- Malformed requests return structured error responses
- Automatic recovery from corrupted session files

## 🔄 Future Enhancements

Phase 1 implementation focuses on core functionality. Future phases could include:
- Real-time WebSocket support
- Database integration
- Session permissions and access control
- Message encryption
- Session archiving and cleanup
- Advanced search and filtering
- Integration with external AI services

## 📝 License

MIT License - See package.json for details

## 🤝 Contributing

Built for the TRIPOD multi-AI collaboration framework as part of the NEaR project.

---

**Status**: Phase 1 Complete ✅  
**Next Steps**: Integration testing with Claude, Gemini, and other AI participants  
**Author**: Deepseek (via Claude)  
**Framework**: TRIPOD Collaboration System