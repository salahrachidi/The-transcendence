
---

## 1. Backend overview

* **Framework:** Fastify
* **Port:** `process.env.PORT` or `5555`
* **Base URL (dev):** `http://localhost:5555`
* **Registered route prefixes:**

  * `/auth` → auth & 2FA
  * `/user` → profile & account management
  * `/friends` → friends, requests, blocks
  * `/chat` → conversations + WebSocket chat
  * `/gameState` → game (we’ll ignore)
* **Auth:** anything with `onRequest: [server.auth]` **requires a valid token** (probably JWT, stored in `jwts` table).

Healthcheck:

```http
GET /
→ 200 { "success": true, "result": "healthcheck success" }
```

---

## 2. Data model (user-related tables)

From `model.*.js`:

### `users`

* `id` (PK, integer, autoincrement)
* `nickname` (unique, required)
* `email` (unique, required)
* `password` (hashed, required)
* `avatar` (nullable, text URL/path)
* `two_factor_secret` (nullable)
* `is_two_factor_enabled` (boolean, default false)
* `created_at` (timestamp)

### `jwts`

* `id`, `token`, `expires_at`, `created_at`
  Used to store active JWT tokens (for logout/cleanup).

### `friendships`

* `user_id`, `friend_id` (both FK → users, + timestamps)
  Represents **accepted friendship** (two-directional).

### `requests`

* `sender_id`, `receiver_id`, `created_at`
  Represents **pending friend request**, unique per pair.

### `blocks`

* `blocker_id`, `blocked_id`, `created_at`, `UNIQUE(blocker_id, blocked_id)`
  Represents block relationship.

### `messages` & `conversations` (chat)

* `messages`: `sender_id`, `receiver_id`, `message`, `timestamp`, `is_seen`
* `conversations`: `user1_id`, `user2_id`, `last_message`, `last_timestamp`, `UNIQUE(user1_id, user2_id)`

---

## 3. Auth API (`/auth`)

### 3.1 Sign up

```http
POST /auth/signup
Content-Type: application/json

{
  "nickname": "cool_user",
  "email": "me@example.com",
  "password": "********"
}
```

**Validation:**

* `nickname`: `string`, 8–15 chars, pattern `^[a-zA-Z0-9_-]+$`
* `email`: valid email
* `password`: length 8–30

**Use case:** Create a new user account.
**Controller:** `authController.signup_C`
*Response shape depends on controller (likely user info + token or just user).*

---

### 3.2 Basic login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "me@example.com",
  "password": "********"
}
```

**Validation:**

* `email`: email string
* `password`: 8–30 chars

**Use case:**

* Normal login.
* If user has 2FA disabled → probably returns token directly.
* If user has 2FA enabled → likely tells you to complete `/auth/login/2fa`.

**Controller:** `authController.login_C`

---

### 3.3 2FA login (second step)

```http
POST /auth/login/2fa
Content-Type: application/json

{
  "id": 123,          // user id
  "token_2fa": "123456"
}
```

**Validation:**

* `id`: integer
* `token_2fa`: string

**Use case:**

* Complete login when user has 2FA enabled.
* Probably returns JWT + user data on success.

**Controller:** `authController.login2FA_C`

---

### 3.4 Enable 2FA (for logged-in user)

1. **Generate secret / QR:**

```http
GET /auth/2fa/generate
Authorization: Bearer <JWT>
```

* **Auth required** (`onRequest: [server.auth]`)

**Use case:**

* Backend generates a 2FA secret (and probably an otpauth URL/QR).
* Frontend shows QR to user to scan in Google Auth / Authy etc.

**Controller:** `authController.generate2FA_C`

2. **Verify 2FA token & actually enable it:**

```http
POST /auth/2fa/verify
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "token_2fa": "123456"
}
```

**Validation:**

* `token_2fa`: required string

**Use case:**

* User enters code from their 2FA app; if correct, backend:

  * Stores secret
  * Sets `is_two_factor_enabled = true`

**Controller:** `authController.verify2FA_C`

---

### 3.5 Disable 2FA

```http
GET /auth/2fa/disable
Authorization: Bearer <JWT>
```

**Use case:** Turn off 2FA for the logged-in user.
**Controller:** `authController.disable2FA_C`

### 3.6 Logout

```http
POST /auth/logout
Authorization: Bearer <JWT>
```

**Use case:**

* Invalidate current token (likely removes it from `jwts` table or blacklists it).

**Controller:** `authController.logout_C`

### 3.7 GitHub OAuth callback

```http
GET /auth/github/callback?code=...
```

**Use case:** OAuth callback after redirect from GitHub.
**Controller:** `authController.githubCallback_C`
(The `/github/login` endpoint is probably elsewhere, but only callback is defined here.)

---

## 4. User API (`/user`)

### 4.1 Get user by ID

```http
GET /user/id/:id
Authorization: Bearer <JWT>
```

**Params schema:**

* `id`: integer, required

**Use case:**
Fetch another user or self by DB `id`.

**Controller:** `userControllers.getUserById_C`

---

### 4.2 Get user by nickname

```http
GET /user/nickname/:nickname
Authorization: Bearer <JWT>
```

**Params validation:**

* `nickname`: string, 8–15 chars, pattern `^[a-zA-Z0-9_-]+$`

**Use case:**
Search/resolve a user to an ID using their nickname (useful before sending friend request, opening chat, etc).

**Controller:** `userControllers.getUserByName_C`

---

### 4.3 Update user profile / credentials

```http
POST /user/:id
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "nickname": "new_nick",          // optional
  "new_password": "newPass123",    // optional
  "current_password": "oldPass123",// optional but usually required if changing password
  "email": "new@mail.com"          // optional
}
```

**Params:**

* `id`: integer (user id being updated – likely must match authenticated user)

**Body (all optional in schema but probably validated in controller):**

* `nickname`: same nickname rules as above
* `new_password`: 8–30 chars
* `current_password`: 8–30 chars
* `email`: valid email

**Use cases:**

* Change nickname
* Change email
* Change password (using `current_password` to confirm identity)

**Controller:** `userControllers.updateUser_C`

---

### 4.4 Upload avatar

```http
POST /user/avatar
Authorization: Bearer <JWT>
Content-Type: multipart/form-data

// form-data contains avatar file (field name depends on controller)
```

Schema says it **consumes multipart/form-data**.

**Use case:**
Upload / change user avatar.
Backend probably saves the file and updates `users.avatar`.

**Controller:** `userControllers.uploadAvatar_C`

---

### 4.5 GDPR / privacy endpoints (currently tagged as "not ready yet" in comment)

All require auth.

#### 4.5.1 Expose all my data

```http
GET /user/my_data
Authorization: Bearer <JWT>
```

**Controller:** `userControllers.exposeUserData_C`
**Use case:**
Return all data related to the logged-in user (for GDPR-style “download my data”).

---

#### 4.5.2 Request anonymization

```http
POST /user/anonymize
Authorization: Bearer <JWT>
```

**Use case:**

* User asks to anonymize their data (likely replaces nickname/email with something random and deletes identifiable info across tables).

**Controller:** `userControllers.requestAnonymization_C`

---

#### 4.5.3 Request account deletion

```http
POST /user/delete
Authorization: Bearer <JWT>
```

**Use case:**
User requests to delete their account (probably scheduled or after grace period).

**Controller:** `userControllers.requestAccountDeletion_C`

---

## 5. Friendship API (`/friends`)

All endpoints below require authentication (`onRequest: [server.auth]`).

> ⚠️ `idParamSchema` expects `friend_id`, but the routes use `:id` in the path.
> From the frontend point of view, you just do `/friends/.../<userId>`.

### 5.1 Get my friends

```http
GET /friends/
Authorization: Bearer <JWT>
```

**Use case:**
Get a list of accepted friends (probably with basic profile info).

**Controller:** `friendshipControllers.getFriendships_C`

---

### 5.2 Get my pending incoming friend requests

```http
GET /friends/requests/pending
Authorization: Bearer <JWT>
```

**Use case:**
Show all friend requests sent **to** the logged-in user.

**Controller:** `friendshipControllers.getPendingRequests_C`

---

### 5.3 Get blocked users

```http
GET /friends/blocked
Authorization: Bearer <JWT>
```

**Use case:**
List all users that the current user has blocked.

**Controller:** `friendshipControllers.getBlockedFriends_C`

---

### 5.4 Check friendship status with a user

```http
GET /friends/:id/check
Authorization: Bearer <JWT>
```

**Params:**

* `id` → other user’s id (schema calls it `friend_id`)

**Use case:**
Returns a boolean-like answer: are we friends or not?

**Controller:** `friendshipControllers.checkFriendship_C`

---

### 5.5 Send a friend request

```http
POST /friends/requests/:id/send
Authorization: Bearer <JWT>
```

**Use case:**
Send a friend request to user `id`.
Backed by `requests` table.

**Controller:** `friendshipControllers.sendFriendRequest_C`

---

### 5.6 Accept an incoming request

```http
POST /friends/requests/:id/accept
Authorization: Bearer <JWT>
```

**Use case:**

* Accept a pending friend request **from** user `id`.
* Likely:

  * Remove from `requests`
  * Create entry in `friendships`

**Controller:** `friendshipControllers.acceptFriendship_C`

---

### 5.7 Decline an incoming request

```http
POST /friends/requests/:id/decline
Authorization: Bearer <JWT>
```

**Use case:**
Decline/ignore someone’s friend request.

**Controller:** `friendshipControllers.declineRequest_C`

---

### 5.8 Cancel an outgoing request

```http
POST /friends/requests/:id/cancel
Authorization: Bearer <JWT>
```

**Use case:**
Current user previously sent a request to `id` and wants to cancel it.

**Controller:** `friendshipControllers.cancelRequest_C`

---

### 5.9 Unfriend (remove friend)

```http
DELETE /friends/:id/unfriend
Authorization: Bearer <JWT>
```

(Comment says DELETE is more RESTful; POST would also work.)

**Use case:**
Remove an existing friend. Removes entry in `friendships`.

**Controller:** `friendshipControllers.removeFriendship_C`

---

### 5.10 Block / unblock

```http
POST /friends/block/:id
Authorization: Bearer <JWT>
```

* Use case: Block user `id` (add to `blocks` table).
* Controller: `friendshipControllers.blockUser_C`

```http
POST /friends/unblock/:id
Authorization: Bearer <JWT>
```

* Use case: Unblock user `id`.
* Controller: `friendshipControllers.unblockUser_C`

---

## 6. Chat API (`/chat`)

### 6.1 WebSocket connection

```http
GET /chat/   (WebSocket upgrade)
Authorization: Bearer <JWT>
```

Route:

```js
server.get('/', {
  onRequest: [server.auth],
  websocket: true,
}, async (socket, req) => {
  await chatController.handleWebSocketConnection(socket, req, server);
});
```

**Use case:**

* Real-time messaging between users.
* Exact WebSocket message format is defined in `chatController.handleWebSocketConnection`.

---

### 6.2 List my conversations

```http
GET /chat/conversations
Authorization: Bearer <JWT>
```

**Use case:**

* Show all conversations for current user (with last message, timestamp… from `conversations` table).

**Controller:** `chatController.getConversations`

---

### 6.3 Get messages for a conversation (with pagination)

```http
GET /chat/conversations/:id/messages?limit=20&offset=0
Authorization: Bearer <JWT>
```

Route uses `paginationSchema` from `utils.chat.js`, so expect query params like `limit` & `offset`.

**Use case:**

* Load messages for conversation `id` (between two users), paginated and ordered (probably newest first from model).

**Controller:** `chatController.getMessagesByConversation`

---

## 7. What to send next for *full* documentation

Right now we have a very good view of:

* URL structure
* Methods
* Required params & body schemas
* DB tables and relationships

To document **response shapes**, **error codes**, and **WebSocket payload format**, I’d need (later, if you want):

* `controllers/controller.auth.js`
* `controllers/controller.user.js`
* `controllers/controller.friendship.js`
* `controllers/controller.chat.js`
* `plugins/plugin.register.js` (to confirm how `server.auth` reads the JWT: header vs cookie, name of header, etc.)

---

### TL;DR for you (as frontend dev)

Typical flows:

* **Sign up → login → optional 2FA**
  `/auth/signup` → `/auth/login` → `/auth/login/2fa` if needed.

* **Profile page**

  * Load user: `/user/id/:id` or `/user/my_data`
  * Update profile: `POST /user/:id`
  * Upload avatar: `POST /user/avatar`

* **Friends & social graph**

  * Search user: `/user/nickname/:nickname`
  * Send request: `POST /friends/requests/:id/send`
  * Handle incoming: `GET /friends/requests/pending` then accept/decline
  * List friends: `GET /friends/`
  * Cancel, unfriend, block, unblock using respective `/friends/...` endpoints.

* **Chat**

  * WebSocket: `GET ws://<host>:5555/chat/` with auth
  * List conversations: `GET /chat/conversations`
  * Load messages: `GET /chat/conversations/:id/messages?limit=&offset=`
