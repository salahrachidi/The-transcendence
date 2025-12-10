import { IPosition, TInputDirection } from "./types";

export class Paddle {
	private readonly ACCELERATION: number = 0.4;
	private readonly FRICTION: number = 0.85;
	private readonly MIN_VELOCITY: number = 0.1;

	position: IPosition;
	width: number;
	height: number;
	speed: number;
	score: number;
	velocity: number;

	constructor(paddleX: number, paddleY: number, width: number, height: number, speed: number) {
		this.position = {
			x: paddleX,
			y: paddleY
		};
		this.width = width;
		this.height = height;
		this.speed = speed;
		this.score = 0;
		this.velocity = 0;
	}

	moveUp(): void {
		this.velocity -= this.ACCELERATION;
		if (this.velocity < -this.speed)
			this.velocity = -this.speed;
	}

	moveDown(): void {
		this.velocity += this.ACCELERATION;
		if (this.velocity > this.speed)
			this.velocity = this.speed;
	}

	stop(): void {
		this.velocity *= this.FRICTION;
		if (Math.abs(this.velocity) < this.MIN_VELOCITY)
			this.velocity = 0;
	}
	
	update(canvasHeight: number): void {
		const	EDGE_PADDING = 5;

		this.position.y += this.velocity;
		if (this.position.y < EDGE_PADDING) {
			this.position.y = EDGE_PADDING;
			this.velocity = 0;
		}
		if (this.position.y + this.height > canvasHeight - EDGE_PADDING) {
			this.position.y = canvasHeight - this.height - EDGE_PADDING;
			this.velocity = 0;
		}
	}

	getHalfW(): number {
		return (this.width / 2);
	}

	getHalfH(): number {
		return (this.height / 2);
	}

	getCenter(): IPosition {
		return (
			{
				x: this.position.x + this.getHalfW(),
				y: this.position.y + this.getHalfH()
			}
		);
	}

	//	WEBSOCKET PADDLE

	applyInput(direction: TInputDirection): void {
		if (direction === "up")
			this.moveUp();
		else if (direction === "down")
			this.moveDown();
		else
			this.stop();
	}
}