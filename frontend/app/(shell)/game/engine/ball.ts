import { Paddle } from "./paddle";
import { IPosition, IVelocity, ECollision } from "./types";

export class Ball {
	position: IPosition;
	velocity: IVelocity;
	radius: number;
	speed: number;

	constructor(ballX: number, ballY: number, radius: number, speed: number) {
		this.position = {
			x: ballX,
			y: ballY
		};
		this.velocity = {
			x: 0,
			y: 0
		};
		this.radius = radius;
		this.speed = speed;
		this.setRandomVelocity();
	}

	private setRandomVelocity(): void {
		const toLeft = Math.random() < 0.5;

		if (toLeft) {
			const minAngle = Math.PI * 3 / 4;
			const maxAngle = Math.PI * 5 / 4
			const angle = minAngle + Math.random() * (maxAngle - minAngle);

			this.velocity = {
				x: Math.cos(angle) * this.speed,
				y: Math.sin(angle) * this.speed
			};
		} else {
			const minAngle = -Math.PI / 4;
			const maxAngle = Math.PI / 4;
			const angle = minAngle + Math.random() * (maxAngle - minAngle);

			this.velocity = {
				x: Math.cos(angle) * this.speed,
				y: Math.sin(angle) * this.speed
			}
		}
	}

	update(canvasHeight: number): void {
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		if (this.position.y - this.radius <= 0) {
			this.position.y = this.radius;
			this.reverseY();
		}
		if (this.position.y + this.radius >= canvasHeight) {
			this.position.y = canvasHeight - this.radius;
			this.reverseY();
		}
	}

	checkCollision(paddle: Paddle): ECollision {
		const paddleCenter: IPosition = paddle.getCenter();
		const dx = Math.abs(this.position.x - paddleCenter.x);
		const dy = Math.abs(this.position.y - paddleCenter.y);
		const collision = (dx <= paddle.getHalfW() + this.radius && dy <= paddle.getHalfH() + this.radius);

		if (!collision)
			return ECollision.NONE;

		const penX = (paddle.getHalfW() + this.radius - dx);
		const penY = (paddle.getHalfH() + this.radius - dy);

		const CORNER_THRESHOLD = 5;

		if (penX <= penY || (penX < CORNER_THRESHOLD && penY < CORNER_THRESHOLD))
			return ECollision.FACE;
		else
			return ECollision.EDGE;
	}

	collision(paddle: Paddle): void {
		const collision: ECollision = this.checkCollision(paddle);
			
		if (collision === ECollision.FACE) {
			this.reverseX();

			const paddleCenter = paddle.getCenter();
			const hitOffset = this.position.y - paddleCenter.y;
			const SPIN_FACTOR = 0.03;
			const positionSpin = hitOffset * SPIN_FACTOR;
			const randomSpin = (Math.random() - 0.5) * 0.3;

			this.velocity.y += positionSpin + randomSpin;

			const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
 
			this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
			this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
		} else if (collision === ECollision.EDGE) {
			this.reverseX();
			this.reverseY();
		} else {
			return ;
		}
	}

	reverseX(): void {
		this.velocity.x *= -1;
	}

	reverseY(): void {
		this.velocity.y *= -1;
	}

	reset(x: number, y: number): void {
		this.position.x = x;
		this.position.y = y;
		this.setRandomVelocity();
	}
}