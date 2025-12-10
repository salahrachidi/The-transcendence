import type { TInputDirection, TPlayerSide, IGameStateMessage, ServerMessage } from "./types";

export class remoteGame {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private ws: WebSocket | null;
	private gameState: IGameStateMessage["payload"] | null;
	private selfSide: TPlayerSide | null;
	private animationId: number | null;
	private keys: { [key: string]: boolean }
	private currentInput: TInputDirection;
	private userId?: number;
	private onScoreUpdate?: (p1: number, p2: number) => void;
	private onGameEnd?: (winner: "left" | "right", score: { p1: number; p2: number }) => void;
	private onWaiting?: () => void;
	private onGameStart?: (opponentName: string) => void;

	constructor(onScoreUpdate?: (p1: number, p2: number) => void, onGameEnd?: (winner: "left" | "right", score: { p1: number; p2: number }) => void, onWaiting?: () => void, onGameStart?: (opponentName: string) => void) {
		this.canvas = null as any;
		this.ctx = null as any;
		this.ws = null;
		this.gameState = null;
		this.selfSide = null;
		this.animationId = null;
		this.keys = {};
		this.currentInput = "stop";
		this.userId = undefined;
		this.onScoreUpdate = onScoreUpdate;
		this.onGameEnd = onGameEnd;
		this.onWaiting = onWaiting;
		this.onGameStart = onGameStart;
	}

	public attachCanvas(canvasId: string, onScoreUpdate?: (p1: number, p2: number) => void, onGameEnd?: (winner: "left" | "right", score: { p1: number; p2: number }) => void): void {
		const canvasElement = document.getElementById(canvasId);
		if (!canvasElement) throw new Error(`Canvas element with id ${canvasId} not found!`);
		this.canvas = canvasElement as HTMLCanvasElement;
		const context = this.canvas.getContext("2d");
		if (!context) throw new Error("Failed to get 2d context");
		this.ctx = context;

		if (onScoreUpdate) this.onScoreUpdate = onScoreUpdate;
		if (onGameEnd) this.onGameEnd = onGameEnd;

		this.setupKeyboardListeners();

		// If game state exists (already started), start loop
		if (this.gameState) {
			this.start();
		}
	}

	public connect(wsURL: string, playerName: string, userId?: number): void {
		this.userId = userId;
		//console.log(`[remoteGame] Attempting to connect to: ${wsURL}`);
		if (this.ws) {
			this.ws.close();
		}
		this.ws = new WebSocket(wsURL);

		this.ws.onopen = () => {
			//console.log("[remoteGame] ✅ Connected to game server");
			//console.log(`[remoteGame] Sending JOIN_GAME for ${playerName} (userId: ${this.userId})`);
			this.send({ type: "JOIN_GAME", payload: { playerName, userId: this.userId } });
		};

		this.ws.onmessage = (event) => {
			//console.log("[remoteGame] 📨 Message received:", event.data);
			const message: ServerMessage = JSON.parse(event.data);
			this.handleMessage(message);
		}

		this.ws.onerror = (error) => {
			// console.error("[remoteGame] WebSocket error (this is normal during connection)");
		};

		this.ws.onclose = (event) => {
			//console.log(`[remoteGame] Disconnected - Code: ${event.code}, Clean: ${event.wasClean}`);
			this.stop();
		};
	}



	private setupKeyboardListeners(): void {
		document.addEventListener("keydown", (e) => this.handleInput(e.key, true, e));
		document.addEventListener("keyup", (e) => this.handleInput(e.key, false, e));
	}

	public handleInput(key: string, pressed: boolean, e?: KeyboardEvent): void {
		const lowerKey = key.toLowerCase();

		if (pressed) {
			if (this.keys[key]) return;
			this.keys[key] = true;

			if (lowerKey === "arrowup") {
				this.sendInput("up");
				e?.preventDefault();
			} else if (lowerKey === "arrowdown") {
				this.sendInput("down");
				e?.preventDefault();
			}
		} else {
			this.keys[key] = false;
			if (lowerKey === "arrowup" || lowerKey === "arrowdown") {
				// Only stop if no other movement keys are pressed
				const upPressed = this.keys["ArrowUp"];
				const downPressed = this.keys["ArrowDown"];

				if (!upPressed && !downPressed) {
					this.sendInput("stop");
				} else if (upPressed) {
					this.sendInput("up");
				} else if (downPressed) {
					this.sendInput("down");
				}
				e?.preventDefault();
			}
		}
	}



	private handleMessage(message: ServerMessage): void {
		switch (message.type) {
			case "WAITING":
				this.onWaiting?.();
				break;
			case "GAME_START":
				this.selfSide = message.payload.side;
				this.onGameStart?.(message.payload.opponentName);
				this.start();
				break;
			case "GAME_STATE":
				this.gameState = message.payload;
				if (this.onScoreUpdate && this.gameState) {
					this.onScoreUpdate(this.gameState.scores.left, this.gameState.scores.right);
				}
				break;
			case "GAME_END":
				if (this.onGameEnd && this.gameState) {
					this.onGameEnd(message.payload.winner, {
						p1: this.gameState.scores.left,
						p2: this.gameState.scores.right
					});
				}
				this.stop();
				break;
			case "OPPONENT_LEFT":
				this.stop();
				break;
			case "ERROR":
				console.error("Game error:", message.payload.message);
				break;
		}
	}

	private send(message: any): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN)
			this.ws.send(JSON.stringify(message));
	}

	private sendInput(direction: TInputDirection): void {
		if (direction === this.currentInput) return;
		this.currentInput = direction;
		this.send({ type: "PLAYER_INPUT", payload: { direction } });
	}

	start(): void {
		if (this.animationId !== null) return;
		this.gameLoop();
	}

	stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	private gameLoop = (): void => {
		this.render();
		this.animationId = requestAnimationFrame(this.gameLoop);
	}

	private render(): void {
		if (!this.gameState || !this.ctx || !this.canvas) return;

		const { ball, leftPaddle, rightPaddle, scores } = this.gameState;
		const canvasW = this.canvas.width;
		const canvasH = this.canvas.height;

		// Gradient background - spread more
		const gradient = this.ctx.createRadialGradient(canvasW * 0.15, canvasH * 0.3, 0, canvasW * 0.15, canvasH * 0.3, canvasW * 1.2);
		gradient.addColorStop(0, "rgba(56, 189, 248, 0.35)");
		gradient.addColorStop(0.7, "rgba(0, 0, 0, 0)");

		const gradient2 = this.ctx.createRadialGradient(canvasW * 0.85, canvasH * 0.7, 0, canvasW * 0.85, canvasH * 0.7, canvasW * 1.2);
		gradient2.addColorStop(0, "rgba(236, 72, 153, 0.35)");
		gradient2.addColorStop(0.7, "rgba(0, 0, 0, 0)");

		this.ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
		this.ctx.fillRect(0, 0, canvasW, canvasH);

		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, canvasW, canvasH);

		this.ctx.fillStyle = gradient2;
		this.ctx.fillRect(0, 0, canvasW, canvasH);

		this.drawCenterLine();

		// Draw ball with glow
		this.ctx.shadowBlur = 28;
		this.ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
		this.ctx.fillStyle = "#fff";
		this.ctx.beginPath();
		this.ctx.arc(ball.position.x, ball.position.y, 8, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.shadowBlur = 12;
		this.ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
		this.ctx.fill();

		this.ctx.shadowBlur = 0;

		// Draw left paddle (blue glow) - rounded
		this.ctx.shadowBlur = 20;
		this.ctx.shadowColor = "#38bdf8";
		const leftGradient = this.ctx.createLinearGradient(
			leftPaddle.position.x,
			leftPaddle.position.y,
			leftPaddle.position.x,
			leftPaddle.position.y + 100
		);
		leftGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
		leftGradient.addColorStop(1, "rgba(255, 255, 255, 0.75)");
		this.ctx.fillStyle = leftGradient;

		const radius = 8;
		this.ctx.beginPath();
		this.ctx.moveTo(leftPaddle.position.x + radius, leftPaddle.position.y);
		this.ctx.lineTo(leftPaddle.position.x + 15 - radius, leftPaddle.position.y);
		this.ctx.quadraticCurveTo(leftPaddle.position.x + 15, leftPaddle.position.y, leftPaddle.position.x + 15, leftPaddle.position.y + radius);
		this.ctx.lineTo(leftPaddle.position.x + 15, leftPaddle.position.y + 100 - radius);
		this.ctx.quadraticCurveTo(leftPaddle.position.x + 15, leftPaddle.position.y + 100, leftPaddle.position.x + 15 - radius, leftPaddle.position.y + 100);
		this.ctx.lineTo(leftPaddle.position.x + radius, leftPaddle.position.y + 100);
		this.ctx.quadraticCurveTo(leftPaddle.position.x, leftPaddle.position.y + 100, leftPaddle.position.x, leftPaddle.position.y + 100 - radius);
		this.ctx.lineTo(leftPaddle.position.x, leftPaddle.position.y + radius);
		this.ctx.quadraticCurveTo(leftPaddle.position.x, leftPaddle.position.y, leftPaddle.position.x + radius, leftPaddle.position.y);
		this.ctx.closePath();
		this.ctx.fill();

		// Draw right paddle (pink glow) - rounded
		this.ctx.shadowColor = "#ec4899";
		const rightGradient = this.ctx.createLinearGradient(
			rightPaddle.position.x,
			rightPaddle.position.y,
			rightPaddle.position.x,
			rightPaddle.position.y + 100
		);
		rightGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
		rightGradient.addColorStop(1, "rgba(255, 255, 255, 0.75)");
		this.ctx.fillStyle = rightGradient;

		this.ctx.beginPath();
		this.ctx.moveTo(rightPaddle.position.x + radius, rightPaddle.position.y);
		this.ctx.lineTo(rightPaddle.position.x + 15 - radius, rightPaddle.position.y);
		this.ctx.quadraticCurveTo(rightPaddle.position.x + 15, rightPaddle.position.y, rightPaddle.position.x + 15, rightPaddle.position.y + radius);
		this.ctx.lineTo(rightPaddle.position.x + 15, rightPaddle.position.y + 100 - radius);
		this.ctx.quadraticCurveTo(rightPaddle.position.x + 15, rightPaddle.position.y + 100, rightPaddle.position.x + 15 - radius, rightPaddle.position.y + 100);
		this.ctx.lineTo(rightPaddle.position.x + radius, rightPaddle.position.y + 100);
		this.ctx.quadraticCurveTo(rightPaddle.position.x, rightPaddle.position.y + 100, rightPaddle.position.x, rightPaddle.position.y + 100 - radius);
		this.ctx.lineTo(rightPaddle.position.x, rightPaddle.position.y + radius);
		this.ctx.quadraticCurveTo(rightPaddle.position.x, rightPaddle.position.y, rightPaddle.position.x + radius, rightPaddle.position.y);
		this.ctx.closePath();
		this.ctx.fill();

		this.ctx.shadowBlur = 0;


	}

	private drawCenterLine() {
		const canvasW = this.canvas.width;
		const canvasH = this.canvas.height;
		const padding = 40; // Padding from top and bottom

		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
		this.ctx.lineWidth = 2; // Thin line
		this.ctx.beginPath();
		this.ctx.moveTo(canvasW / 2, padding);
		this.ctx.lineTo(canvasW / 2, canvasH - padding);
		this.ctx.stroke();
		this.ctx.lineWidth = 1; // Reset line width
	}

	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.stop();
	}
}

