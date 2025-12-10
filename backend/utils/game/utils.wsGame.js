import { Player } from "./utils.gameEntities.js";
import { GameRoom } from "./utils.gameRoom.js";

const DEFAULT_CONFIG = {
	canvasWidth: 800,
	canvasHeight: 600,
	paddleWidth: 15,
	paddleHeight: 100,
	paddleSpeed: 8,
	ballRadius: 8,
	ballSpeed: 4,
	maxScore: 7
};

const RECONNECT_WINDOW = 10000; // 10 seconds grace period
const PING_INTERVAL = 30000; // 30 seconds

let waitingPlayer = null;
const gameRooms = new Map();
const socketToPlayer = new Map();
const playerToRoom = new Map();
const userIdToPlayer = new Map(); // Track active players by userId
const disconnectTimeouts = new Map(); // Store timeout IDs for grace period

function sendError(socket, message) {
	const errorMsg = {
		type: "ERROR",
		payload: { message }
	};
	if (socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify(errorMsg));
	}
}

export function registerWebSocketRoutes(server) {
	server.get("/ws", { websocket: true }, (socket, request) => {
		socket.db = server.db;
		socket.isAlive = true;

		socket.on("pong", () => {
			socket.isAlive = true;
		});

		socket.on("message", (rawMessage) => {
			const message = rawMessage.toString();
			try {
				const data = JSON.parse(message);
				handleMessage(socket, data);
			}
			catch (error) {
				sendError(socket, "Invalid JSON format");
			}
		});
		socket.on("close", () => {
			handleDisconnect(socket);
		});
		socket.on("error", (error) => {
			handleDisconnect(socket);
		});
	});

	// Heartbeat interval
	setInterval(() => {
		server.websocketServer.clients.forEach((ws) => {
			if (ws.isAlive === false) return ws.terminate();
			ws.isAlive = false;
			ws.ping();
		});
	}, PING_INTERVAL);

	console.log("Game WebSocket routes registered");
}

function handleMessage(socket, message) {
	switch (message.type) {
		case "JOIN_GAME":
			handleJoinGame(socket, message.payload.playerName, message.payload.userId);
			break;
		case "PLAYER_INPUT":
			handlePlayerInput(socket, message.payload.direction);
			break;
		case "LEAVE_GAME":
			handleDisconnect(socket, true); // True = explicit leave (no grace period)
			break;
		default:
			sendError(socket, "Unknown message type");
	}
}

function handleJoinGame(socket, playerName, userId = null) {
	if (socketToPlayer.has(socket)) {
		sendError(socket, "You have already joined");
		return;
	}

	// 1. Check for Reconnection
	if (userId && userIdToPlayer.has(userId)) {
		const existingPlayer = userIdToPlayer.get(userId);

		// If explicit grace period timeout exists, clear it
		if (disconnectTimeouts.has(existingPlayer.id)) {
			console.log(`[Reconnect] Cancelling disconnect timeout for player ${playerName} (${userId})`);
			clearTimeout(disconnectTimeouts.get(existingPlayer.id));
			disconnectTimeouts.delete(existingPlayer.id);
		}

		// Rebind socket
		console.log(`[Reconnect] Player ${playerName} (${userId}) rejoined session.`);
		existingPlayer.socket = socket;
		socketToPlayer.set(socket, existingPlayer);

		// If in a room, resync
		const room = playerToRoom.get(existingPlayer);
		if (room) {
			console.log(`[Reconnect] Resyncing to room ${room.id}`);
			// Send immediate state update or GAME_START to restore client
			existingPlayer.send({
				type: "GAME_START",
				payload: { side: existingPlayer.side } // Client needs to know side
			});
			// The next game loop tick will send GAME_STATE
			return;
		} else if (waitingPlayer === existingPlayer) {
			console.log(`[Reconnect] Resumed waiting spot.`);
			existingPlayer.send({
				type: "WAITING",
				payload: { message: "Waiting for opponent..." }
			});
			return;
		}
	}

	// 2. New Join
	const player = new Player(socket, playerName, userId);
	socketToPlayer.set(socket, player);
	if (userId) userIdToPlayer.set(userId, player);

	if (waitingPlayer === null) {
		waitingPlayer = player;
		player.send({
			type: "WAITING",
			payload: { message: "Waiting for opponent..." }
		});
	}
	else {
		// Prevent self-match (if same user opens two tabs or quick reload race)
		if (waitingPlayer.userId === userId && userId !== null) {
			// This should be handled by reconnect logic above, but fallback:
			waitingPlayer.socket = socket;
			socketToPlayer.set(socket, waitingPlayer);
			return;
		}

		console.log(`[Match] Starting game: ${waitingPlayer.name} vs ${player.name}`);
		const room = new GameRoom({ ...DEFAULT_CONFIG, mode: 'remote' }, waitingPlayer, player, socket.db);
		gameRooms.set(room.id, room);
		playerToRoom.set(waitingPlayer, room);
		playerToRoom.set(player, room);
		waitingPlayer = null;
		room.start();
	}
}

function handlePlayerInput(socket, direction) {
	const player = socketToPlayer.get(socket);
	if (!player) {
		// Silent fail or error - if reconnected, input should work
		return;
	}
	const room = playerToRoom.get(player);
	if (!room) return;
	player.setInput(direction);
}

function handleDisconnect(socket, explicitLeave = false) {
	const player = socketToPlayer.get(socket);
	if (!player) return;

	socketToPlayer.delete(socket);
	// Do NOT delete from userIdToPlayer yet if implicit disconnect

	if (explicitLeave) {
		finalizeDisconnect(player);
	} else if (player.userId) {
		// Start Grace Period
		console.log(`[Disconnect] Player ${player.name} disconnected. Waiting ${RECONNECT_WINDOW}ms for reconnect...`);
		const timeoutId = setTimeout(() => {
			console.log(`[Disconnect] Timeout reached for ${player.name}. Destroying session.`);
			finalizeDisconnect(player);
		}, RECONNECT_WINDOW);
		disconnectTimeouts.set(player.id, timeoutId);
	} else {
		// Guest / No ID -> No reconnect support
		finalizeDisconnect(player);
	}
}

function finalizeDisconnect(player) {
	if (player.userId) {
		userIdToPlayer.delete(player.userId);
		disconnectTimeouts.delete(player.id);
	}

	if (waitingPlayer === player) {
		waitingPlayer = null;
	}

	const room = playerToRoom.get(player);
	if (room) {
		room.handlePlayerLeave(player);
		const otherPlayer = room.playerLeft === player ? room.playerRight : room.playerLeft;
		playerToRoom.delete(player);
		playerToRoom.delete(otherPlayer);
		gameRooms.delete(room.id);

		// If the opponent is still connected, tell them
		if (otherPlayer && otherPlayer.socket.readyState === otherPlayer.socket.OPEN) {
			otherPlayer.send({
				type: "OPPONENT_LEFT",
				payload: { message: "Opponent disconnected" }
			});
		}
	}
}
