# PROJECT TRIPOD MCP Server Design

## 🎯 **Vision**
Real-time multi-AI collaboration platform enabling Claude, Gemini, local Gemma, and humans to work together simultaneously on complex problems.

## 🏗️ **Architecture Overview**

### **Core Components**

#### 1. **TRIPOD Session Manager**
```typescript
interface TripodSession {
  id: string
  name: string
  participants: Participant[]
  context: ProjectContext
  messageHistory: Message[]
  activeTask: Task | null
  createdAt: Date
  updatedAt: Date
}

interface Participant {
  id: string
  name: string
  type: 'human' | 'claude' | 'gemini' | 'gemma' | 'custom'
  endpoint?: string  // For AI participants
  capabilities: string[]
  status: 'active' | 'idle' | 'offline'
}
```

#### 2. **Message Routing & Broadcasting**
```typescript
interface Message {
  id: string
  sessionId: string
  from: string
  to?: string | string[]  // Broadcast if undefined
  content: string
  messageType: 'chat' | 'task' | 'code' | 'analysis' | 'decision'
  metadata: {
    timestamp: Date
    threadId?: string
    replyTo?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }
}
```

#### 3. **Task Coordination System**
```typescript
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  assignedTo: string[]
  requiredCapabilities: string[]
  subtasks: SubTask[]
  dependencies: string[]
  deadline?: Date
}
```

## 🔧 **MCP Server Implementation**

### **Primary Tools**

#### 1. **Session Management**
- `tripod_create_session` - Start new collaboration session
- `tripod_join_session` - Add participant to session
- `tripod_leave_session` - Remove participant
- `tripod_list_sessions` - Show active sessions
- `tripod_get_session_info` - Get session details

#### 2. **Communication**
- `tripod_send_message` - Send message to session
- `tripod_broadcast` - Broadcast to all participants
- `tripod_direct_message` - Send private message
- `tripod_get_messages` - Retrieve message history
- `tripod_set_status` - Update participant status

#### 3. **Task Management**
- `tripod_create_task` - Create new collaborative task
- `tripod_assign_task` - Assign task to participants
- `tripod_update_task_status` - Update task progress
- `tripod_get_tasks` - List session tasks
- `tripod_add_subtask` - Break down complex tasks

#### 4. **Context Sharing**
- `tripod_share_context` - Share project context
- `tripod_update_context` - Update shared context
- `tripod_get_context` - Retrieve current context
- `tripod_add_artifact` - Share files/code/analysis

#### 5. **AI Coordination**
- `tripod_request_analysis` - Request specific AI analysis
- `tripod_vote_decision` - Collaborative decision making
- `tripod_consensus_check` - Check agreement status
- `tripod_capability_match` - Find best AI for task

## 🔌 **Integration Points**

### **1. NEaR Platform Integration**
```typescript
interface NEaRIntegration {
  // Inherit project context from NEaR
  importProjectContext(): ProjectContext
  
  // Share analysis results back to NEaR
  exportAnalysisResults(results: AnalysisResult[]): void
  
  // Use NEaR's company/analysis type data
  getCompanyData(): Company[]
  getAnalysisTypes(): CompanyType[]
}
```

### **2. AI Provider Endpoints**
```typescript
interface AIProvider {
  name: string
  endpoint: string
  apiKey?: string
  capabilities: string[]
  maxTokens: number
  rateLimits: RateLimit
}

// Supported providers
const providers = {
  claude: { endpoint: 'anthropic-api', capabilities: ['analysis', 'coding', 'reasoning'] },
  gemini: { endpoint: 'google-api', capabilities: ['analysis', 'coding', 'search'] },
  gemma: { endpoint: 'http://192.168.50.157:1234', capabilities: ['analysis', 'reasoning'] },
  // Future: More local models, OpenAI, etc.
}
```

### **3. File System Bridge**
```typescript
// Bridge current TRIPOD file system with real-time chat
interface FileSystemBridge {
  // Auto-import existing TRIPOD files
  importTripodFiles(sessionId: string): void
  
  // Export session to TRIPOD format
  exportToFiles(sessionId: string): void
  
  // Sync changes bidirectionally
  syncWithFiles(sessionId: string): void
}
```

## 🚀 **Usage Scenarios**

### **Scenario 1: Debugging Session**
```
Human: "The dropdown isn't working, let's debug this together"
TRIPOD: Creates session, invites Claude, Gemini, Gemma
Claude: "I'll analyze the current code structure"
Gemini: "I'll check browser console logs and network requests"
Gemma: "I'll review the state management patterns"
Human: "Here's what I'm seeing in the UI..."
[Real-time collaborative debugging]
```

### **Scenario 2: Architecture Decision**
```
Human: "Should we use GraphQL or REST for the new API?"
TRIPOD: Routes question to all AI participants
Claude: "Here are the pros/cons based on your project..."
Gemini: "I found these performance benchmarks..."
Gemma: "Consider these implementation complexities..."
TRIPOD: Facilitates voting/consensus building
```

### **Scenario 3: Code Review**
```
Human: Shares code via TRIPOD
Claude: Reviews for best practices
Gemini: Checks for security issues
Gemma: Analyzes performance implications
TRIPOD: Aggregates feedback into actionable items
```

## 📋 **Implementation Plan**

### **Phase 1: Core Infrastructure**
- [x] Design architecture
- [ ] Set up TypeScript MCP server
- [ ] Implement session management
- [ ] Basic message routing
- [ ] WebSocket real-time communication

### **Phase 2: AI Integration**
- [ ] Claude integration (direct)
- [ ] Gemini API integration
- [ ] Local Gemma integration (192.168.50.157:1234)
- [ ] Message translation between AI formats

### **Phase 3: Advanced Features**
- [ ] Task assignment & tracking
- [ ] Consensus building algorithms
- [ ] Context sharing & persistence
- [ ] NEaR platform integration

### **Phase 4: UI & Experience**
- [ ] Web-based TRIPOD interface
- [ ] Real-time collaboration view
- [ ] Integration with existing TRIPOD files
- [ ] Mobile-friendly responsive design

## 🔒 **Security & Privacy**

- **Local-first**: Session data stored locally
- **Encrypted communication**: All AI communications encrypted
- **Access control**: Session-based permissions
- **Data isolation**: Each session isolated
- **API key management**: Secure credential storage

## 📊 **Benefits**

### **For Development**
- **Faster debugging**: Multiple AI perspectives simultaneously
- **Better decisions**: Consensus-based architecture choices
- **Knowledge sharing**: Each AI contributes unique expertise
- **Reduced context switching**: One conversation, multiple experts

### **For NEaR Project**
- **Enhanced analysis**: Multiple AI models analyzing transcripts
- **Better error resolution**: Collaborative debugging
- **Feature planning**: Multi-AI input on roadmap
- **Quality assurance**: Multiple review perspectives

## 🎯 **Next Steps**

1. **Create MCP server foundation**
2. **Implement basic session management**
3. **Add Claude integration first** (since you're using Claude now)
4. **Test with simple scenarios**
5. **Gradually add other AI participants**
6. **Integrate with NEaR platform**

This would be a groundbreaking real-time multi-AI collaboration platform! Want me to start building the MCP server foundation?