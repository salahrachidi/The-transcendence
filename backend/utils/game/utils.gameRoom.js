import { Ball, Paddle } from "./utils.gameEntities.js";

export class GameRoom {
	id;
	playerLeft;
	playerRight;
	config;
	ball;
	leftPaddle;
	rightPaddle;
	status;
	gameLoop;
	constructor(config, player1, player2, db = null) {
		const canvasWidth = config.canvasWidth;
		const canvasHeight = config.canvasHeight;
		const paddleWidth = config.paddleWidth;
		const paddleHeight = config.paddleHeight;
		const paddleSpeed = config.paddleSpeed;
		const ballRadius = config.ballRadius;
		const ballSpeed = config.ballSpeed;
		this.config = config;
		this.id = this.generateId();
		this.playerLeft = player1;
		this.playerRight = player2;
		this.playerLeft.side = "left";
		this.playerRight.side = "right";
		this.leftPaddle = new Paddle(20, canvasHeight / 2 - paddleHeight / 2, paddleWidth, paddleHeight, paddleSpeed);
		this.rightPaddle = new Paddle(canvasWidth - 20 - paddleWidth, canvasHeight / 2 - paddleHeight / 2, paddleWidth, paddleHeight, paddleSpeed);
		this.ball = new Ball(canvasWidth / 2, canvasHeight / 2, ballRadius, ballSpeed);
		this.status = "playing";
		this.gameLoop = null;
		this.db = db;
		this.startTime = new Date().toISOString();
	}
	generateId() {
		return Math.random().toString(36).substring(2, 11);
	}
	start() {
		this.playerLeft.send({
			type: "GAME_START",
			payload: { side: "left", opponentName: this.playerRight.name }
		});
		this.playerRight.send({
			type: "GAME_START",
			payload: { side: "right", opponentName: this.playerLeft.name }
		});
		this.gameLoop = setInterval(() => this.update(), 1000 / 120);
	}
	update() {
		if (this.status !== "playing")
			return;
		this.updatePaddles();
		this.updateBall();
		this.checkCollisions();
		this.checkScore();
		this.broadcastState();
	}
	updatePaddles() {
		this.leftPaddle.applyInput(this.playerLeft.currentInput);
		this.rightPaddle.applyInput(this.playerRight.currentInput);
		this.leftPaddle.update(this.config.canvasHeight);
		this.rightPaddle.update(this.config.canvasHeight);
	}
	updateBall() {
		this.ball.update(this.config.canvasHeight);
	}
	checkCollisions() {
		const COLLISION_ZONE = this.config.canvasWidth * 0.25;
		if (this.ball.position.x < COLLISION_ZONE && this.ball.velocity.x < 0)
			this.ball.collision(this.leftPaddle);
		if (this.ball.position.x > this.config.canvasWidth - COLLISION_ZONE && this.ball.velocity.x > 0)
			this.ball.collision(this.rightPaddle);
	}
	checkScore() {
		if (this.ball.position.x - this.ball.radius < 0) {
			this.rightPaddle.score++;
			this.ball.reset(this.config.canvasWidth / 2, this.config.canvasHeight / 2);
		}
		else if (this.ball.position.x + this.ball.radius > this.config.canvasWidth) {
			this.leftPaddle.score++;
			this.ball.reset(this.config.canvasWidth / 2, this.config.canvasHeight / 2);
		}
		if (this.leftPaddle.score >= this.config.maxScore || this.rightPaddle.score >= this.config.maxScore)
			this.endGame();
	}
	broadcastState() {
		const state = {
			type: "GAME_STATE",
			payload: {
				ball: { position: { x: this.ball.position.x, y: this.ball.position.y } },
				leftPaddle: { position: { x: this.leftPaddle.position.x, y: this.leftPaddle.position.y } },
				rightPaddle: { position: { x: this.rightPaddle.position.x, y: this.rightPaddle.position.y } },
				scores: { left: this.leftPaddle.score, right: this.rightPaddle.score }
			}
		};
		this.playerLeft.send(state);
		this.playerRight.send(state);
	}
	async endGame() {
		this.status = "finished";
		if (this.gameLoop) {
			clearInterval(this.gameLoop);
			this.gameLoop = null;
		}
		const winner = this.leftPaddle.score >= this.config.maxScore ? "left" : "right";

		await this.saveMatchToDB(winner);

		this.playerLeft.send({
			type: "GAME_END",
			payload: { winner, scores: { left: this.leftPaddle.score, right: this.rightPaddle.score } }
		});
		this.playerRight.send({
			type: "GAME_END",
			payload: { winner, scores: { left: this.leftPaddle.score, right: this.rightPaddle.score } }
		});
	}

	async saveMatchToDB(winner) {
		try {
			const matchModel = (await import("../../models/model.match.js")).default;
			const gameStateModel = (await import("../../models/model.gameState.js")).default;
			const db = this.db;

			if (!db) {
				console.error("Database not available, skipping match save");
				return;
			}

			const player1_id = this.playerLeft.userId;
			const player2_id = this.playerRight.userId;
			const player1_score = this.leftPaddle.score;
			const player2_score = this.rightPaddle.score;
			const winner_id = winner === "left" ? player1_id : player2_id;
			const loser_id = winner === "left" ? player2_id : player1_id;
			const delta = Math.abs(player1_score - player2_score) * 10;

			// Create match record
			const matchId = await matchModel.createMatch(db, {
				created_at: this.startTime || new Date().toISOString(),
				finished_at: new Date().toISOString(),
				player1_id,
				player2_id,
				player1_score,
				player2_score,
				winner_id,
				bestOf: this.config.maxScore,
				delta,
				mode: this.config.mode || "remote"
			});

			if (this.config.mode === 'remote') {
				await gameStateModel.registerWin(db, winner_id);
				await gameStateModel.registerLoss(db, loser_id);
			}
		} catch (error) {
			console.error("Error saving match to database:", error);
		}
	}
	handlePlayerLeave(player) {
		this.status = "finished";
		if (this.gameLoop) {
			clearInterval(this.gameLoop);
			this.gameLoop = null;
		}
		const remainingPlayer = player === this.playerLeft ? this.playerRight : this.playerLeft;
		remainingPlayer.send({
			type: "OPPONENT_LEFT",
			payload: { message: `${player.name} left the game` }
		});
	}
}
