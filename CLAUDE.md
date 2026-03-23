# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MojiChat is a real-time chat application built with a modern full-stack architecture. The application supports direct messaging, group chats, friend requests, online status tracking, and real-time message delivery using WebSockets.

**Tech Stack:**
- Backend: Node.js + Express + MongoDB + Socket.IO
- Frontend: React + TypeScript + Vite + Zustand + TailwindCSS
- Real-time: Socket.IO for bidirectional communication
- Auth: JWT-based authentication with access tokens

## Development Commands

### Backend (from `/backend` directory)
- **Dev mode with hot reload:** `npm run dev`
- **Production start:** `npm start`
- **Main entry point:** `src/server.js`

### Frontend (from `/frontend` directory)
- **Dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Lint:** `npm run lint`
- **Preview production build:** `npm run preview`

## Environment Setup

### Backend Environment Variables
Create a `.env` file in `/backend` based on `env.example`:
```
PORT=5001
MONGODB_CONNECTION_STRING=mongodb://admin:password123@localhost:27017/mojichat?authSource=admin
ACCESS_TOKEN_SECRET=<your-secret-key>
CLIENT_URL=http://localhost:5173
```

### Frontend Environment Variables
Create a `.env` file in `/frontend`:
```
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

## Architecture

### Backend Architecture

**Entry Point Flow:**
1. `server.js` → imports Express app and HTTP server from `socket/index.js`
2. `socket/index.js` → creates Express app, HTTP server, and Socket.IO server
3. `server.js` → mounts middleware, routes, and starts server after DB connection

**Authentication Flow:**
- JWT-based with access tokens stored in frontend
- `authMiddleware.js` validates Bearer tokens for protected HTTP routes
- `socketAuthMiddleware.js` validates tokens for Socket.IO connections
- Tokens are verified using `ACCESS_TOKEN_SECRET` from environment

**Data Models (Mongoose Schemas):**
- **User**: username, hashedPassword, email, displayName, avatarUrl, bio, phone
- **Conversation**: supports both 'direct' and 'group' types, tracks participants, lastMessage, seenBy, unreadCounts
- **Message**: belongs to a conversation, has senderId, content, imgUrl
- **FriendRequest**: tracks friend request status
- **Friend**: represents established friendships
- **Session**: stores refresh token information (not currently used for JWT refresh)

**Socket.IO Real-time Events:**
- `connection`: User connects, joins their conversation rooms, onlineUsers map updated
- `disconnect`: User removed from onlineUsers map
- `new-message`: Broadcast new messages to conversation participants
- `read-message`: Notify when messages are marked as seen
- `online-users`: Broadcast list of currently online user IDs

**Routes:**
- `/api/auth` - Public: sign up, sign in, sign out
- `/api/users` - Protected: user profile operations
- `/api/friends` - Protected: friend requests and friend management
- `/api/messages` - Protected: send messages, fetch message history
- `/api/conversations` - Protected: create/fetch conversations

**Key Backend Patterns:**
- All protected routes use `protectedRoute` middleware which adds `req.user`
- Socket connections are authenticated via `socketAuthMiddleware` which adds `socket.user`
- Controllers handle business logic and interact with models
- The `onlineUsers` Map in `socket/index.js` tracks userId → socketId mappings

### Frontend Architecture

**State Management (Zustand):**
- **useAuthStore**: Manages authentication state (accessToken, user), handles sign in/out/up, refresh tokens
- **useChatStore**: Manages conversations, messages (keyed by conversationId), active conversation
- **useSocketStore**: Manages Socket.IO connection, online users, real-time event handlers
- **useFriendStore**: Manages friend requests and friend list
- **useThemeStore**: Manages dark/light theme

**State Persistence:**
- `useAuthStore` persists `user` to localStorage
- `useChatStore` persists `conversations` to localStorage
- Access tokens are stored in memory only (security best practice)

**Component Structure:**
- `/pages`: Top-level page components (SignInPage, SignUpPage, ChatAppPage)
- `/components/auth`: Authentication forms and protected routes
- `/components/chat`: Chat interface components (ChatWindow, MessageItem, ChatCard, etc.)
- `/components/sidebar`: App navigation sidebar
- `/components/ui`: Reusable UI components (shadcn/ui components)
- `/components/AddFriendModel`: Friend request UI
- `/components/FriendRequest`: Friend request management UI

**Real-time Integration:**
- Socket connects when user signs in (via `useSocketStore.connectSocket()`)
- Socket handlers in `useSocketStore` update `useChatStore` on new messages
- "new-message" event adds message to store and updates conversation
- "read-message" event updates conversation's seenBy/unreadCounts
- "online-users" event updates list of online user IDs

**Message Pagination:**
- Messages are fetched with cursor-based pagination
- `useChatStore.messages` structure: `{ [conversationId]: { items: [], hasMore: boolean, nextCursor: string|null } }`
- `fetchMessages()` appends older messages to the beginning of the array

**API Communication:**
- Axios instance configured in `lib/axios.ts` with baseURL and credentials
- Access token sent in Authorization header: `Bearer <token>`
- Services (authService, chatService, friendService) encapsulate API calls

### Key Integration Points

**Authentication Integration:**
1. User signs in → `useAuthStore.signIn()` stores accessToken in memory
2. `App.tsx` useEffect detects accessToken → calls `useSocketStore.connectSocket()`
3. Socket connects with token in auth payload → backend authenticates via `socketAuthMiddleware`
4. Protected API routes use `protectedRoute` middleware to validate Bearer token

**Message Flow:**
1. User sends message via `useChatStore.sendDirectMessage()` or `sendGroupMessage()`
2. Backend saves to DB, emits "new-message" via Socket.IO to conversation room
3. All participants' clients receive "new-message" event
4. `useSocketStore` handler calls `useChatStore.addMessage()` and updates conversation
5. If recipient has conversation open, `markAsSeen()` is called automatically

**Friend System:**
- Friend requests are sent/accepted/rejected via `friendService`
- When accepted, a direct conversation may be created automatically
- Friend list determines who can send direct messages

## Important Architectural Decisions

**Session Management:**
- Currently uses JWT access tokens without refresh token rotation
- Session model exists but refresh flow is not fully implemented
- Access tokens are stored in memory only (not persisted), so page refresh loses auth state unless you implement refresh token flow

**Conversation Types:**
- "direct": 1-on-1 chat between two users
- "group": Multi-participant group chat with name and createdBy fields
- Both types share the same Message and Conversation models

**Unread Count Tracking:**
- Stored as a Map in Conversation: `{ [userId]: count }`
- Reset to 0 when user marks conversation as seen
- Updated by backend when new messages arrive

**Socket Room Strategy:**
- Each conversation has a room (room ID = conversationId)
- When user connects, they join all their conversation rooms
- Messages are emitted to the conversation room, reaching all participants

## Common Development Patterns

**Adding a New API Endpoint:**
1. Define route in appropriate route file (`backend/src/routes/`)
2. Create controller function in corresponding controller file (`backend/src/controllers/`)
3. Add to server.js if new route file
4. Create service function in frontend (`frontend/src/services/`)
5. Update relevant Zustand store if state management needed

**Adding a New Socket Event:**
1. Emit event from backend controller or socket handler
2. Add socket.on() listener in `useSocketStore.connectSocket()`
3. Update relevant store state (typically `useChatStore`)

**Adding a New Mongoose Model:**
1. Create schema in `backend/src/models/`
2. Define indexes for common queries
3. Export model with `mongoose.model()`

**State Updates from Socket Events:**
- Socket events should update Zustand stores, not trigger API calls
- Stores should optimistically update UI, backend is source of truth
- Use `updateConversation()` pattern to merge updates into existing state

## Testing and Debugging

- Backend logs are printed to console via `console.log`
- Frontend uses browser DevTools for debugging
- Check Socket.IO connection in Network tab (WebSocket)
- Swagger API documentation available at `/api-docs` endpoint

## Notes on Module System

- Backend uses ES modules (`"type": "module"` in package.json)
- All imports must use `.js` extension in backend (even for .js files)
- Frontend uses standard Vite TypeScript setup with path aliases (`@/` → `src/`)
