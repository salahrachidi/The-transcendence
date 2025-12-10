# Game Database API Documentation

## Overview
This document describes the backend API routes for fetching game match history and player statistics.

**Base URL:** `https://localhost:5555` (or your backend URL)

All routes require authentication. Include the auth token in cookies.

---

## 📊 Match History Routes

### 1. Get Match by ID
Fetch details of a specific match.

**Endpoint:** `GET /match/:match_id`

**Parameters:**
- `match_id` (integer, required) - The match ID

**Response:**
```json
{
  "success": true,
  "result": {
    "id": 123,
    "created_at": "2024-12-08T10:30:00.000Z",
    "finished_at": "2024-12-08T10:35:00.000Z",
    "player1_id": 5,
    "player2_id": 8,
    "player1_score": 7,
    "player2_score": 5,
    "winner_id": 5,
    "bestOf": 7,
    "delta": 20,
    "mode": "1v1"
  }
}
```

**Frontend Usage:**
```typescript
async function getMatch(matchId: number) {
  const response = await fetch(`/match/${matchId}`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.result;
}
```

---

### 2. Get User Match History
Fetch all matches for a specific user.

**Endpoint:** `GET /match/user/:user_id`

**Parameters:**
- `user_id` (integer, required) - The user ID
- `limit` (integer, optional, default: 10) - Number of matches to return

**Response:**
```json
{
  "success": true,
  "result": [
    {
      "id": 125,
      "created_at": "2024-12-08T11:00:00.000Z",
      "finished_at": "2024-12-08T11:05:00.000Z",
      "player1_id": 5,
      "player2_id": 12,
      "player1_score": 7,
      "player2_score": 3,
      "winner_id": 5,
      "bestOf": 7,
      "delta": 40,
      "mode": "1v1"
    },
    // ... more matches
  ]
}
```

**Frontend Usage:**
```typescript
async function getUserMatches(userId: number, limit: number = 10) {
  const response = await fetch(`/match/user/${userId}?limit=${limit}`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.result;
}

// Example: Display in UI
const matches = await getUserMatches(5, 20);
matches.forEach(match => {
  console.log(`Match ${match.id}: ${match.player1_score} - ${match.player2_score}`);
});
```

---

## 📈 Game Statistics Routes

### 3. Get User Game Stats
Fetch game statistics for a specific user.

**Endpoint:** `GET /gameState/:user_id`

**Parameters:**
- `user_id` (integer, required) - The user ID

**Response:**
```json
{
  "success": true,
  "result": {
    "user_id": 5,
    "total_games": 42,
    "n_wins": 28,
    "n_loses": 14,
    "total_delta": 140
  }
}
```

**Frontend Usage:**
```typescript
async function getUserStats(userId: number) {
  const response = await fetch(`/gameState/${userId}`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.result;
}

// Example: Display win rate
const stats = await getUserStats(5);
const winRate = ((stats.n_wins / stats.total_games) * 100).toFixed(1);
console.log(`Win Rate: ${winRate}%`);
```

---

### 4. Get My Game Stats
Fetch game statistics for the authenticated user.

**Endpoint:** `GET /gameState/`

**Response:**
```json
{
  "success": true,
  "result": {
    "user_id": 5,
    "total_games": 42,
    "n_wins": 28,
    "n_loses": 14,
    "total_delta": 140
  }
}
```

**Frontend Usage:**
```typescript
async function getMyStats() {
  const response = await fetch('/gameState/', {
    credentials: 'include'
  });
  const data = await response.json();
  return data.result;
}
```

---

### 5. Get Leaderboard
Fetch top players ranked by delta (rating).

**Endpoint:** `GET /gameState/leaderboard`

**Parameters:**
- `limit` (integer, optional, default: 10) - Number of players to return

**Response:**
```json
{
  "success": true,
  "result": [
    {
      "id": 5,
      "nickname": "ProPlayer",
      "avatar": "/uploads/avatar123.jpg",
      "n_wins": 28,
      "total_delta": 280
    },
    {
      "id": 8,
      "nickname": "GamerX",
      "avatar": "/uploads/avatar456.jpg",
      "n_wins": 25,
      "total_delta": 250
    },
    // ... more players
  ]
}
```

**Frontend Usage:**
```typescript
async function getLeaderboard(limit: number = 10) {
  const response = await fetch(`/gameState/leaderboard?limit=${limit}`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.result;
}

// Example: Display leaderboard
const leaderboard = await getLeaderboard(50);
leaderboard.forEach((player, index) => {
  console.log(`#${index + 1}: ${player.nickname} - ${player.total_delta} pts`);
});
```

---

## 🎮 How Match Data is Saved

When a remote game finishes, the backend **automatically**:

1. **Saves match record** to `match` table with:
   - Player IDs
   - Final scores
   - Winner
   - Best-of value
   - Delta (score difference × 10)
   - Mode (1v1)
   - Timestamps

2. **Updates player statistics** in `gameStates` table:
   - Winner gets: `n_wins +1`, `total_games +1`, `total_delta +10`
   - Loser gets: `n_loses +1`, `total_games +1`, `total_delta -10`

**No frontend action required** - it happens automatically when the game ends.

---

## 🚀 Frontend Integration Examples

### Example 1: Match History Component
```typescript
import { useEffect, useState } from 'react';

function MatchHistory({ userId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch(`/match/user/${userId}?limit=20`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMatches(data.result));
  }, [userId]);

  return (
    <div>
      <h2>Match History</h2>
      {matches.map(match => (
        <div key={match.id}>
          <p>Score: {match.player1_score} - {match.player2_score}</p>
          <p>Winner: {match.winner_id === userId ? 'You' : 'Opponent'}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Player Stats Card
```typescript
function StatsCard({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`/gameState/${userId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStats(data.result));
  }, [userId]);

  if (!stats) return <p>Loading...</p>;

  const winRate = ((stats.n_wins / stats.total_games) * 100).toFixed(1);

  return (
    <div className="stats-card">
      <h3>Game Statistics</h3>
      <p>Total Games: {stats.total_games}</p>
      <p>Wins: {stats.n_wins}</p>
      <p>Losses: {stats.n_loses}</p>
      <p>Win Rate: {winRate}%</p>
      <p>Rating: {stats.total_delta}</p>
    </div>
  );
}
```

### Example 3: Leaderboard Component
```typescript
function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch('/gameState/leaderboard?limit=50', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPlayers(data.result));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Wins</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => (
          <tr key={player.id}>
            <td>#{index + 1}</td>
            <td>
              <img src={player.avatar} alt={player.nickname} />
              {player.nickname}
            </td>
            <td>{player.n_wins}</td>
            <td>{player.total_delta}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 📝 Notes for Frontend Developer

1. **Authentication Required**: All routes need the user to be logged in. The auth token is handled via cookies.

2. **User IDs**: When sending `userId` in WebSocket `JOIN_GAME` message, include it from authenticated user context.

3. **Match Data**: Matches are saved automatically when games finish - no manual API call needed.

4. **Delta Points**: 
   - Win: +10 points
   - Loss: -10 points
   - Used for ranking in leaderboard

5. **Error Handling**: Always check `success` field in response:
```typescript
const response = await fetch('/match/user/5', { credentials: 'include' });
const data = await response.json();
if (!data.success) {
  console.error('Error:', data.result);
}
```

6. **CORS**: Backend runs on port 5555, ensure proper CORS configuration if frontend is on different port.

---

## ✅ Testing the API

Use these curl commands to test (replace with actual token):

```bash
# Get match by ID
curl -X GET http://localhost:5555/match/1 \
  -H "Cookie: token=YOUR_TOKEN"

# Get user matches
curl -X GET "http://localhost:5555/match/user/5?limit=20" \
  -H "Cookie: token=YOUR_TOKEN"

# Get user stats
curl -X GET http://localhost:5555/gameState/5 \
  -H "Cookie: token=YOUR_TOKEN"

# Get my stats
curl -X GET http://localhost:5555/gameState/ \
  -H "Cookie: token=YOUR_TOKEN"

# Get leaderboard
curl -X GET "http://localhost:5555/gameState/leaderboard?limit=50" \
  -H "Cookie: token=YOUR_TOKEN"
```

---

## 🔧 Database Schema Reference

### `match` table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| created_at | DATETIME | When match started |
| finished_at | DATETIME | When match ended |
| player1_id | INTEGER | First player's user ID |
| player2_id | INTEGER | Second player's user ID |
| player1_score | INTEGER | First player's final score |
| player2_score | INTEGER | Second player's final score |
| winner_id | INTEGER | Winner's user ID |
| bestOf | INTEGER | Maximum score (e.g., 7) |
| delta | INTEGER | Score difference × 10 |
| mode | TEXT | Game mode ("1v1") |

### `gameStates` table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Player's user ID |
| total_games | INTEGER | Total matches played |
| n_wins | INTEGER | Number of wins |
| n_loses | INTEGER | Number of losses |
| total_delta | INTEGER | Rating points |
| created_at | DATETIME | Account creation |

---

**Last Updated:** December 8, 2024
**Backend Version:** 1.0
**Contact:** Backend Team
