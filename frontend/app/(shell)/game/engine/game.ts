import { Ball } from "./ball";
import { Paddle } from "./paddle";
import type { IGameConfig, TGameStatus } from "./types";
import { drawBall, drawPaddle } from "./render"

export class Game {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private config: IGameConfig;

	private ball: Ball;
	private leftPaddle: Paddle;
	private rightPaddle: Paddle;

	private gameStatus: TGameStatus;
	private animationId: number | null;

	private keys: { [key: string]: boolean };

	constructor(canvasId: string, config: IGameConfig, ball: Ball, leftPaddle: Paddle, rightPaddle: Paddle) {
		const canvasElement = document.getElementById(canvasId);
		if (!canvasElement)
			throw new Error(`Canvas element with id "${canvasId}" not found`);
		this.canvas = canvasElement as HTMLCanvasElement;

		const context = this.canvas.getContext('2d');
		if (!context)
			throw new Error(`Failed to get 2d context`);
		this.ctx = context;

		this.config = config;

		this.canvas.width = config.canvasWidth;
		this.canvas.height = config.canvasHeight;

		this.ball = ball;
		this.leftPaddle = leftPaddle;
		this.rightPaddle = rightPaddle;

		this.gameStatus = "waiting";
		this.animationId = null;
		this.keys = {};

		this.setupKeyboardListeners();
	}

	private setupKeyboardListeners(): void {
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	private cleanupListeners(): void {
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
	}

	private handleKeyDown = (e: KeyboardEvent): void => {
		if (["w", "s", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) {
			e.preventDefault();
		}
		this.keys[e.key.toLowerCase()] = true;
	};
	//Added by xeloda:  The game engine was adding keyboard listeners to the document but wasn't removing them when the game ended or when you navigated away.
	private handleKeyUp = (e: KeyboardEvent): void => {
		if (["w", "s", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) {
			e.preventDefault();
		}
		this.keys[e.key.toLowerCase()] = false;
	};

	public handleInput(key: string, pressed: boolean): void {
		this.keys[key.toLowerCase()] = pressed;
	}

	start(): void {
		this.gameStatus = "playing";
		this.gameLoop();
	}

	private gameLoop = (): void => {
		this.update();
		this.render();
		this.animationId = requestAnimationFrame(this.gameLoop);
	}

	private update(): void {
		const ball = this.ball;
		const paddleL = this.leftPaddle;
		const paddleR = this.rightPaddle;
		const canvasH = this.config.canvasHeight;
		const canvasW = this.config.canvasWidth;
		const maxScore = this.config.maxScore;

		if (this.gameStatus !== "playing")
			return;

		if (this.keys["w"])
			paddleL.moveUp();
		else if (this.keys["s"])
			paddleL.moveDown();
		else
			paddleL.stop();

		if (this.keys["arrowup"])
			paddleR.moveUp();
		else if (this.keys["arrowdown"])
			paddleR.moveDown();
		else
			paddleR.stop();

		paddleL.update(canvasH);
		paddleR.update(canvasH);
		ball.update(canvasH);

		const COLLISION_ZONE = canvasW * 0.25;

		if (ball.position.x < COLLISION_ZONE && ball.velocity.x < 0)
			ball.collision(paddleL);
		if (ball.position.x > canvasW - COLLISION_ZONE && ball.velocity.x > 0)
			ball.collision(paddleR);

		if (ball.position.x - ball.radius < 0) {
			paddleR.score++;
			this.config.onScoreUpdate?.(paddleL.score, paddleR.score);
			ball.reset(canvasW / 2, canvasH / 2);
		}
		if (ball.position.x + ball.radius > canvasW) {
			paddleL.score++;
			this.config.onScoreUpdate?.(paddleL.score, paddleR.score);
			ball.reset(canvasW / 2, canvasH / 2);
		}
		if (paddleL.score >= maxScore || paddleR.score >= maxScore) {
			this.gameStatus = "finished";
			this.config.onGameEnd?.(paddleL.score >= maxScore ? "left" : "right", {
				p1: paddleL.score,
				p2: paddleR.score
			});
		}
	}

	private render(): void {
		const ball = this.ball;
		const paddleL = this.leftPaddle;
		const paddleR = this.rightPaddle;
		const canvasH = this.config.canvasHeight;
		const canvasW = this.config.canvasWidth;
		const maxScore = this.config.maxScore;

		// Gradient background
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

		drawBall(ball, this.ctx);
		drawPaddle(paddleL, this.ctx, "left");
		drawPaddle(paddleR, this.ctx, "right");

		if (this.gameStatus === "waiting")
			this.drawText("Press START to begin", canvasW / 2, canvasH / 2, "24px Arial");
		else if (this.gameStatus === "finished") {
			// handled by React UI overlay
		}
	}

	private drawCenterLine(): void {
		const canvasH = this.config.canvasHeight;
		const canvasW = this.config.canvasWidth;
		const padding = 40;

		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(canvasW / 2, padding);
		this.ctx.lineTo(canvasW / 2, canvasH - padding);
		this.ctx.stroke();
		this.ctx.lineWidth = 1;
	}

	private drawText(text: string, x: number, y: number, font: string): void {
		this.ctx.fillStyle = "white";
		this.ctx.font = font;
		this.ctx.textAlign = "center";
		this.ctx.fillText(text, x, y);
	}

	stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		this.gameStatus = "paused";
		this.cleanupListeners();
	}
}