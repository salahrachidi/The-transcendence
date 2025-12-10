**what exactly happens when you click “Start tournament”**
---
## 1. UML picture (conceptual)

Conceptually, you still want:

```plantuml
Tournament "1" -- "0..*" Match : matches
Match "1" -- "2" Player : players

' Derived association
Tournament "1" .. "4..8" Player : participants
note on link
  participants = all distinct players from matches
end note
```

* `Tournament – Match`: 1–many
* `Match – Player`: exactly 2 players
* `Tournament – Player`: “participants” = derived, not a physical table 

---

## 2. Your UI flow for a 4-player tournament

You described:

1. User clicks **Start tournament** button.
2. A modal appears with inputs:

   * Tournament name
   * Bracket size (4 or 8)
   * Player nicknames (4 or 8 inputs)
3. User clicks **Start tournament** (in modal).
4. App navigates to a **Tournament page** with:

   * Tournament podium / players list.
   * First matches ready (each two players).

We’ll map each step to backend actions.

---

## 3. End-to-end example: 4-player tournament

Say user fills modal with:

* **Tournament name**: `"Midnight Cup"`
* **Bracket size**: `4`
* **Nicknames**:

  * `PLAYER_A`
  * `PLAYER_B`
  * `PLAYER_C`
  * `PLAYER_D`

### 3.1. Frontend → Backend request

When they click **Start tournament**, frontend sends something like:

```json
POST /tournaments/start

{
  "name": "Midnight Cup",
  "bracketSize": 4,
  "nicknames": ["PLAYER_A", "PLAYER_B", "PLAYER_C", "PLAYER_D"]
}
```

> We only send this when they confirm.
> Until then, nothing is persisted.

---

### 3.2. Backend step 1 – Resolve players

Backend receives nicknames and turns them into `Player` rows/IDs:

Pseudo-code:

```ts
const players = await resolvePlayersByNicknames(nicknames);
// e.g. players: [{id: 1, nickname: "PLAYER_A"}, ..., {id: 4, nickname: "PLAYER_D"}]

if (players.length !== 4) throw Error("Need exactly 4 players");
if (hasDuplicates(players)) throw Error("Nicknames must be unique");
```

* Either:

  * `resolvePlayersByNicknames` **only finds existing players** and errors if not found, or
  * it **creates missing players** on the fly.
* You now have 4 **Player IDs** in memory: say `[1, 2, 3, 4]`.

Still no pivot table. Just a local `players` array.

---

### 3.3. Backend step 2 – Create tournament row

```ts
const tournament = await createTournament({
  name: "Midnight Cup",
  bracketSize: 4,
  status: "RUNNING"
});
// e.g. tournament.id = 10
```

In DB, `tournaments` row:

| id | name         | bracketSize | status  |
| -- | ------------ | ----------- | ------- |
| 10 | Midnight Cup | 4           | RUNNING |

---

### 3.4. Backend step 3 – Generate first-round matches

Now generate a **simple 4-player bracket**.

Example pairing:

* Match 1: `PLAYER_A` vs `PLAYER_D`
* Match 2: `PLAYER_B` vs `PLAYER_C`

We create 2 rows in `matches` table:

```ts
const [p1, p2, p3, p4] = players;

const match1 = await createMatch({
  tournamentId: tournament.id, // 10
  player1Id: p1.id,            // PLAYER_A
  player2Id: p4.id,            // PLAYER_D
  status: "SCHEDULED"
});

const match2 = await createMatch({
  tournamentId: tournament.id, // 10
  player1Id: p2.id,            // PLAYER_B
  player2Id: p3.id,            // PLAYER_C
  status: "SCHEDULED"
});
```

DB `matches`:

| id  | tournament_id | player1_id | player2_id | status    |
| --- | ------------- | ---------: | ---------: | --------- |
| 100 | 10            |          1 |          4 | SCHEDULED |
| 101 | 10            |          2 |          3 | SCHEDULED |

At this point:

* Tournament 10 exists.
* Its first matches exist, and they **contain the tournament participants**.

---

### 3.5. Backend step 4 – Response for the Tournament page

Backend simply **returns everything the UI needs**:

```json
{
  "tournament": {
    "id": 10,
    "name": "Midnight Cup",
    "bracketSize": 4,
    "status": "RUNNING"
  },
  "participants": [
    { "id": 1, "nickname": "PLAYER_A" },
    { "id": 2, "nickname": "PLAYER_B" },
    { "id": 3, "nickname": "PLAYER_C" },
    { "id": 4, "nickname": "PLAYER_D" }
  ],
  "matches": [
    {
      "id": 100,
      "tournamentId": 10,
      "player1": { "id": 1, "nickname": "PLAYER_A" },
      "player2": { "id": 4, "nickname": "PLAYER_D" },
      "status": "SCHEDULED"
    },
    {
      "id": 101,
      "tournamentId": 10,
      "player1": { "id": 2, "nickname": "PLAYER_B" },
      "player2": { "id": 3, "nickname": "PLAYER_C" },
      "status": "SCHEDULED"
    }
  ]
}
```

> Note: `participants` is **just an array in the response**, not a separate DB table.

---

## 4. How the Tournament page uses this

On the **tournament page**:

* **Podium / players list**
  → Use `participants` array to render all nicknames.

* **Bracket or “Start match” buttons**
  → Use `matches` array:

  * For each match, show `player1.nickname` vs `player2.nickname`.
  * A button `Start` calls `POST /matches/100/start`, etc.

So in the UI, it *looks* like Tournament “owns”:

* `tournament.name`
* `participants[]`
* `matches[]`

Under the hood, in the DB:

* `tournaments` table
* `players` table
* `matches` table with FKs
* No `tournament_players` table.

---

## 5. How this maps back to UML

In UML, you can model it like this:

```plantuml
class Tournament {
  id: UUID
  name: string
  bracketSize: int
  status: TournamentStatus
  {readOnly} participants: List<Player> <<derived>>
}

class Match {
  id: UUID
  status: MatchStatus
}

class Player {
  id: UUID
  nickname: string
}

Tournament "1" -- "0..*" Match : matches
Match "1" -- "2" Player : players
Tournament "1" .. "4..8" Player : participants
note on link
  derived from matches' player1/player2
end note
```

* The `{readOnly} participants: List<Player> <<derived>>` means:

  * not a column / table,
  * just something your code computes from matches (or from the initial request).

---