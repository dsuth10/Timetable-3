# Timetable-3 AI Agent Interface Specification

**Project**: Timetable-3 Voice AI Agent Integration  
**Status**: Specification  
**Date**: January 2026  
**Version**: 1.0  

---

## Executive Summary

This specification defines the technical architecture for integrating a local AI agent interface into the Timetable-3 application. The system will enable voice-based interaction with the application's underlying database using a locally-deployed Ollama LLM, complementing the existing drag-and-drop interface. The solution prioritizes low-latency processing, local data privacy, and seamless integration with the current web-based architecture.

**Key Objectives:**
- Enable voice-to-text and text-to-voice interaction with Timetable-3
- Maintain zero cloud dependency while supporting LAN accessibility
- Achieve sub-500ms response latency for agent operations
- Extend database manipulation capabilities beyond drag-and-drop interface
- Maintain code quality, documentation, and team expertise alignment

---

## Problem Statement

### Current Constraints

The Timetable-3 application currently supports only drag-and-drop task management. Users cannot:
- Verbally interact with their timetable
- Use voice commands to create, modify, or delete tasks
- Access conversational AI to answer queries about their schedule
- Benefit from natural language processing for complex scheduling requests

### Technical Challenges

1. **Low-latency requirements**: Voice interaction demands < 500ms end-to-end latency
2. **Local-only deployment**: No cloud services; all processing on local machine
3. **LAN accessibility**: Support access from other machines on local network
4. **Real-time response**: Must handle concurrent requests without freezing UI
5. **Data privacy**: Sensitive schedule data never leaves local network
6. **Technology stack alignment**: Must integrate with existing React/Python architecture

---

## Recommended Tech Stack

### **Option 1: FastAPI + LangChain + Ollama + Whisper (RECOMMENDED)**

#### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Web)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Voice Input (Web Audio API)                         │   │
│  │  ↓                                                    │   │
│  │  Whisper Speech-to-Text (via FastAPI WebSocket)     │   │
│  │  ↓                                                    │   │
│  │  LangChain Agent Orchestration (via FastAPI REST)    │   │
│  │  ↓                                                    │   │
│  │  Pyttsx3/gTTS Text-to-Speech (via FastAPI REST)      │   │
│  │  ↓                                                    │   │
│  │  Voice Output (Web Audio API)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               FastAPI Backend (Async Python)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route: /voice/transcribe (WebSocket)               │   │
│  │  Route: /agent/process (REST)                       │   │
│  │  Route: /speech/synthesize (REST)                   │   │
│  │  Route: /health (REST)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LangChain Agent Layer                               │   │
│  │  ├─ Agent Router (Tool selection)                   │   │
│  │  ├─ Memory Management (Conversation context)         │   │
│  │  └─ Tool Binding (Database operations)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ollama LLM Integration                              │   │
│  │  (Running on localhost:11434 via HTTP)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│           Timetable-3 Database & API Layer                  │
│  (Existing Flask/SQLAlchemy application)                    │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Ollama Service                           │
│  (localhost:11434 - Persistent LLM Server)                 │
└─────────────────────────────────────────────────────────────┘
```

#### Component Specifications

**1. Backend API (FastAPI)**
- **Language**: Python 3.10+
- **Framework**: FastAPI (ASGI)
- **Server**: Uvicorn (async HTTP/WebSocket)
- **Port**: 5001 (separate from existing Flask app on 5000)

**Key Features**:
- Native async/await for concurrent request handling
- WebSocket support for real-time speech-to-text streaming
- Built-in request validation via Pydantic
- Automatic OpenAPI documentation
- 15,000-20,000 req/sec throughput vs Flask's 2,000-3,000

**2. AI Agent Framework (LangChain)**
- **Version**: Latest (1.0+, as of Jan 2026)
- **Primary Use**: Tool orchestration and memory management
- **Rationale**: 
  - Flexible agent architecture with ReAct pattern
  - Superior to CrewAI for simple single-agent workflows
  - Better than direct Ollama calls for multi-step reasoning
  - Seamless Ollama integration via LLM class
  - LangSmith integration for debugging (optional)

**Agent Configuration**:
```python
agent = create_react_agent(
    llm=LLM(
        model="ollama/mistral",
        base_url="http://localhost:11434",
        temperature=0.3  # Lower = more deterministic for tasks
    ),
    tools=[
        CreateTaskTool(),
        UpdateTaskTool(),
        DeleteTaskTool(),
        QueryTaskTool(),
        ListTasksForDayTool(),
    ],
    memory=ConversationBufferMemory(max_token_limit=4000),
    prompt=create_agent_prompt_for_scheduling()
)
```

**3. Speech-to-Text (Whisper)**
- **Implementation**: OpenAI Whisper (local, not cloud)
- **Deployment**: 
  - Via `openai-whisper` Python package (ffmpeg-python required)
  - Or Docker container for isolation
  - Or Faster-Whisper (optimized C++ backend for 4x speedup)

**Latency Profile**:
- Base64 audio stream (16-second window) → ~2-3 seconds processing
- Can be reduced to ~500ms with Faster-Whisper on GPU

**4. Text-to-Speech (Synthesis)**
- **Primary Option**: Pyttsx3 (offline, zero-latency)
  - Pure Python, cross-platform
  - Supports SAPI5 (Windows), NSSpeechSynthesizer (macOS), espeak (Linux)
  - ~200-500ms per sentence
  
- **Fallback Option**: gTTS (requires internet, not recommended for local-only)
- **Premium Option**: OpenAI TTS API (requires cloud, violates privacy requirement)

**5. LLM Engine (Ollama)**
- **Service**: Running on localhost:11434
- **Recommended Models**:
  - `mistral:7b` (fast, good reasoning for task planning)
  - `llama2:7b` (balanced, reliable)
  - `neural-chat:7b` (optimized for dialogue)
- **Memory**: 8GB minimum, 16GB recommended
- **GPU Support**: CUDA (NVIDIA), Metal (Apple Silicon), or CPU fallback

---

## Detailed Architecture Specification

### A. Backend Implementation (FastAPI)

#### Project Structure
```
timetable-3-agent/
├── main.py                          # FastAPI app entry
├── config.py                        # Configuration (Ollama URL, etc)
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Containerization (optional)
├── agents/
│   ├── __init__.py
│   ├── scheduler_agent.py          # Main ReAct agent
│   ├── tools.py                    # LangChain Tools
│   └── prompts.py                  # System prompts
├── routes/
│   ├── __init__.py
│   ├── speech.py                   # Speech-to-text endpoints
│   ├── agent.py                    # Agent processing endpoints
│   └── synthesis.py                # Text-to-speech endpoints
├── models/
│   ├── __init__.py
│   ├── request.py                  # Pydantic request models
│   └── response.py                 # Pydantic response models
├── middleware/
│   ├── __init__.py
│   ├── auth.py                     # Optional: LAN-only access
│   └── logging.py                  # Request/response logging
└── utils/
    ├── __init__.py
    ├── ollama_client.py            # Ollama HTTP wrapper
    └── audio.py                    # Audio processing utilities
```

#### Core Dependencies
```
# requirements.txt
fastapi==0.104.0+
uvicorn[standard]==0.24.0+
pydantic==2.0+
langchain==0.1.0+
langchain-community==0.0.10+
openai-whisper==20240314+
faster-whisper==0.10.0+  # Optional: ~4x speedup
pyttsx3==2.90+
python-multipart==0.0.6+
httpx==0.25.0+  # For Ollama API calls
aiofiles==23.2.1+  # For async file operations
python-jose[cryptography]==3.3.0+  # Optional: JWT auth
```

#### Endpoint Specifications

**1. Speech-to-Text Streaming (WebSocket)**
```
WebSocket: ws://localhost:5001/ws/transcribe

Message Format (Client → Server):
{
    "type": "audio_chunk",
    "data": "<base64-encoded PCM audio>",
    "sample_rate": 16000,
    "channels": 1
}

Response (Server → Client):
{
    "type": "transcription",
    "text": "create a task for tomorrow at 2pm",
    "is_final": false,
    "confidence": 0.95
}

When is_final=true, transcript is finalized and ready for agent processing.
```

**Latency Target**: < 300ms per chunk

**2. Agent Processing (REST POST)**
```
POST /api/v1/agent/process
Content-Type: application/json

Request:
{
    "user_input": "create a task for tomorrow at 2pm called meeting with client",
    "context": {
        "current_date": "2026-01-03",
        "user_timezone": "Australia/Brisbane",
        "recent_tasks": ["Task 1", "Task 2"]
    }
}

Response:
{
    "agent_response": "I've created a task called 'meeting with client' scheduled for January 4th, 2026 at 2:00 PM",
    "action_taken": "CREATE_TASK",
    "affected_tasks": [
        {
            "id": 42,
            "title": "meeting with client",
            "date": "2026-01-04",
            "time": "14:00"
        }
    ],
    "confidence": 0.98,
    "processing_time_ms": 245
}
```

**Latency Target**: < 500ms (LLM inference time is primary factor)

**3. Text-to-Speech (REST POST)**
```
POST /api/v1/speech/synthesize
Content-Type: application/json

Request:
{
    "text": "I've created a task called meeting with client scheduled for January 4th at 2pm",
    "voice": "default",
    "speed": 1.0
}

Response:
{
    "audio_data": "<base64-encoded WAV>",
    "duration_seconds": 4.2,
    "format": "wav",
    "sample_rate": 22050
}
```

**Latency Target**: < 200ms for synthesis (Pyttsx3 on CPU)

**4. Health Check (REST GET)**
```
GET /api/v1/health

Response:
{
    "status": "healthy",
    "ollama_status": "connected",
    "ollama_model": "mistral:7b",
    "whisper_status": "ready",
    "timetable_api_status": "connected",
    "uptime_seconds": 3600
}
```

---

### B. Frontend Integration (React)

#### New Components

**1. VoiceInterface Component**
```javascript
// src/components/VoiceInterface.jsx
import React, { useState, useRef } from 'react';

export const VoiceInterface = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const wsRef = useRef(null);

  const startRecording = async () => {
    // Connect to WebSocket
    // Start streaming audio from microphone
    // Handle real-time transcription
  };

  const stopRecording = async () => {
    // Close WebSocket
    // Send transcript to agent
    // Receive agent response
    // Trigger text-to-speech
  };

  return (
    <div className="voice-interface">
      <button onClick={startRecording}>🎤 Start</button>
      <button onClick={stopRecording}>⏹️ Stop</button>
      <div>{transcript}</div>
      <div>{agentResponse}</div>
      {isPlaying && <div>Playing audio response...</div>}
    </div>
  );
};
```

**2. AudioRecorder Hook**
```javascript
// src/hooks/useAudioRecorder.js
import { useState, useRef } from 'react';

export const useAudioRecorder = (onChunk) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      // Convert Blob to PCM, then to base64
      // Send via WebSocket in chunks
      onChunk(event.data);
    };
    
    mediaRecorder.start(100); // Capture chunks every 100ms
    setIsRecording(true);
  };

  return { startRecording, stopRecording: () => mediaRecorderRef.current?.stop() };
};
```

---

### C. LangChain Agent Configuration

#### Agent Definition
```python
# agents/scheduler_agent.py
from langchain.agents import create_react_agent, AgentExecutor
from langchain.llms import LLM
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from agents.tools import (
    CreateTaskTool,
    UpdateTaskTool,
    DeleteTaskTool,
    ListTasksTool,
    QueryTaskTool
)
from agents.prompts import SCHEDULER_SYSTEM_PROMPT

class SchedulerAgent:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.llm = LLM(
            model="ollama/mistral",
            base_url=ollama_url,
            temperature=0.3,  # Lower temp = more deterministic
            top_p=0.95
        )
        
        self.tools = [
            CreateTaskTool(),
            UpdateTaskTool(),
            DeleteTaskTool(),
            ListTasksTool(),
            QueryTaskTool()
        ]
        
        self.memory = ConversationBufferMemory(
            max_token_limit=4000,
            return_messages=True
        )
        
        self.agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=SCHEDULER_SYSTEM_PROMPT
        )
        
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=10,
            handle_parsing_errors=True
        )
    
    async def process_user_input(self, user_input: str, context: dict) -> dict:
        """Process natural language input and return structured response"""
        try:
            result = await asyncio.to_thread(
                self.executor.invoke,
                {"input": user_input, **context}
            )
            return {
                "success": True,
                "agent_response": result.get("output"),
                "processing_time_ms": result.get("processing_time", 0)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "agent_response": "I encountered an error processing your request."
            }
```

#### System Prompt
```python
# agents/prompts.py
from langchain.prompts import PromptTemplate

SCHEDULER_SYSTEM_PROMPT = PromptTemplate.from_template("""
You are a helpful scheduling assistant for a timetable application. Your role is to help users manage their tasks and schedules through natural language conversation.

Current Context:
- Today's Date: {current_date}
- User Timezone: {user_timezone}
- Recent Tasks: {recent_tasks}

Your capabilities:
1. Create new tasks with title, date, and time
2. Update existing tasks
3. Delete tasks
4. Query tasks by date range or keyword
5. List all tasks for a specific day

Guidelines:
- Always confirm actions with the user before executing them
- Use natural, conversational language
- Clarify ambiguous dates (e.g., "next Tuesday" → explicit date)
- Respect the user's timezone for all time references
- If a task already exists with similar title, ask user to confirm before creating duplicate
- Parse times in 24-hour format internally
- Always provide clear confirmation of actions taken

User Input: {input}

Think step-by-step before taking any actions.
{agent_scratchpad}
""")
```

---

### D. Ollama Deployment Specification

#### Installation & Configuration
```bash
# 1. Install Ollama (https://ollama.ai)
# macOS: brew install ollama
# Windows: Download installer from ollama.ai
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull recommended model
ollama pull mistral:7b

# 3. Verify Ollama is running
curl http://localhost:11434/api/tags

# 4. Configure OLLAMA environment (optional)
export OLLAMA_MODELS=~/.ollama/models  # Custom model directory
export OLLAMA_HOST=0.0.0.0:11434       # Allow LAN access
```

#### Model Comparison for Task Scheduling

| Model | Size | Speed | Reasoning | Dialogue | Recommendation |
|-------|------|-------|-----------|----------|-----------------|
| Mistral 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **BEST** |
| Llama2 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Good alternative |
| Neural Chat 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Best dialogue |
| Phi 2.7B | 2.7B | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Lightweight option |
| Llama2 13B | 13B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Better reasoning |

**Selected**: `mistral:7b` for optimal balance of speed and reasoning

---

### E. Integration with Existing Timetable-3 API

#### Tool Implementation Example
```python
# agents/tools.py
from langchain.tools import BaseTool
from langchain.pydantic_v1 import BaseModel, Field
import httpx
from typing import Any

class CreateTaskInput(BaseModel):
    title: str = Field(description="Task title")
    date: str = Field(description="Task date (YYYY-MM-DD)")
    time: str = Field(description="Task time (HH:MM in 24-hour format)")
    description: str = Field(default="", description="Optional task description")

class CreateTaskTool(BaseTool):
    name = "create_task"
    description = "Creates a new task in the timetable"
    args_schema = CreateTaskInput
    
    async def _arun(self, **kwargs: Any) -> str:
        """Async run method (preferred for FastAPI)"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "http://localhost:5000/api/tasks",  # Existing Flask API
                    json={
                        "title": kwargs["title"],
                        "date": kwargs["date"],
                        "time": kwargs["time"],
                        "description": kwargs.get("description", "")
                    },
                    timeout=5.0
                )
                if response.status_code == 201:
                    task = response.json()
                    return f"Successfully created task '{task['title']}' on {task['date']} at {task['time']}"
                else:
                    return f"Error creating task: {response.text}"
            except Exception as e:
                return f"Failed to create task: {str(e)}"
    
    def _run(self, **kwargs: Any) -> str:
        """Fallback synchronous method"""
        import asyncio
        return asyncio.run(self._arun(**kwargs))
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create FastAPI project structure
- [ ] Set up Ollama locally and test Mistral 7B
- [ ] Implement basic speech-to-text endpoint (Whisper)
- [ ] Implement basic text-to-speech endpoint (Pyttsx3)
- [ ] Create health check endpoint
- **Deliverable**: Working FastAPI server with voice I/O

### Phase 2: Agent Logic (Weeks 3-4)
- [ ] Implement LangChain scheduler agent
- [ ] Create database tools (Create, Read, Update, Delete)
- [ ] Test agent with hardcoded inputs
- [ ] Add memory management
- [ ] Implement error handling & validation
- **Deliverable**: Agent passing integration tests

### Phase 3: Frontend Integration (Weeks 5-6)
- [ ] Create VoiceInterface React component
- [ ] Implement WebSocket connection for real-time transcription
- [ ] Add audio recording via Web Audio API
- [ ] Integrate agent response display
- [ ] Add audio playback for synthesis
- **Deliverable**: Full voice interaction in UI

### Phase 4: Optimization & Deployment (Weeks 7-8)
- [ ] Performance profiling and bottleneck identification
- [ ] Optimize Whisper (consider Faster-Whisper)
- [ ] Cache LLM responses for common queries
- [ ] Load testing (100+ concurrent users on LAN)
- [ ] Docker containerization
- [ ] Documentation & team handoff
- **Deliverable**: Production-ready deployment

---

## Technology Stack Summary

### **RECOMMENDED STACK**

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Backend Framework** | FastAPI | 0.104+ | Async ASGI, 15K req/s, native WebSocket |
| **ASGI Server** | Uvicorn | 0.24+ | Production-grade, supports async |
| **AI Agent** | LangChain | 0.1+ | Mature, extensive tooling, debugging via LangSmith |
| **LLM Inference** | Ollama | Latest | Local-only, fast, supports multiple models |
| **LLM Model** | Mistral 7B | Latest | Best speed/reasoning balance |
| **Speech-to-Text** | Whisper | 20240314+ | Free, offline, 97%+ accuracy (or Faster-Whisper for 4x speedup) |
| **Text-to-Speech** | Pyttsx3 | 2.90+ | Offline, cross-platform, instant latency |
| **Frontend** | React + Web Audio API | Latest | Already used, native browser audio |
| **Data Validation** | Pydantic | 2.0+ | Type safety, automatic validation |

---

## Key Quality Criteria

### Code Standards
- **Documentation**: Docstring on every function (Google style)
- **Type Hints**: 100% type coverage (mypy --strict)
- **Testing**: 85%+ code coverage (pytest)
- **Linting**: Black (formatting), Ruff (linting)
- **Async**: All I/O operations must be async (no blocking calls in async context)

### Performance Targets
| Operation | Target Latency | Success Criteria |
|-----------|----------------|------------------|
| Speech-to-text (per 16s chunk) | < 300ms | Real-time transcription feeling |
| Agent processing | < 500ms | Conversational response speed |
| Text-to-speech (per sentence) | < 200ms | Immediate audio playback |
| End-to-end voice request | < 2s | User perceives immediate feedback |

### Documentation Requirements
- README with local installation instructions
- API documentation (auto-generated via FastAPI /docs)
- Agent configuration guide
- Troubleshooting guide for common issues
- Architecture diagrams (Mermaid)
- LAN networking setup guide

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Ollama latency > 500ms | Medium | High | Use Mistral 7B instead of larger models; GPU acceleration |
| Whisper processing too slow | Medium | High | Implement Faster-Whisper; optimize chunk size |
| LangChain breaking changes | Low | Medium | Pin to tested version (0.1.x); monitor releases |
| Out-of-memory on 8GB systems | Medium | Medium | Model quantization; reduce Whisper model size |
| Network latency on LAN | Low | Low | Measure actual LAN latency; optimize WebSocket |
| Audio codec issues | Low | Medium | Support multiple audio formats in Web Audio API |

---

## Success Metrics

1. **Functional**: Voice commands successfully create/modify/delete tasks
2. **Performance**: End-to-end latency < 2 seconds for 95% of requests
3. **Reliability**: 99.5% uptime during local network usage
4. **Adoption**: Team uses voice interface for 20%+ of daily tasks
5. **Quality**: Zero production data loss incidents
6. **Documentation**: Onboarding new team member takes < 2 hours

---

## Conclusion

**Option 1 (FastAPI + LangChain + Ollama + Whisper)** is the recommended technical stack for Timetable-3's AI agent interface. This combination provides:

✅ **Low Latency**: FastAPI async ASGI + Ollama local inference  
✅ **Local Privacy**: Zero cloud dependency, all processing local  
✅ **Team Alignment**: Builds on your Python expertise  
✅ **Production Ready**: Mature frameworks with enterprise backing  
✅ **Future Proof**: Extensible architecture for voice commands beyond scheduling  
✅ **Debuggable**: LangChain/LangSmith integration for monitoring  

The implementation requires 8 weeks from specification to production deployment, with clear phase gates for validation.

---

**Document Version**: 1.0  
**Last Updated**: January 3, 2026  
**Prepared For**: Timetable-3 Development Team  
**Status**: Ready for Implementation
