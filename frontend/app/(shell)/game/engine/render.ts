import type { Ball } from "./ball"
import type { Paddle } from "./paddle";

export function drawBall(ball: Ball, ctx: CanvasRenderingContext2D) {
	// Glowing white ball
	ctx.shadowBlur = 28;
	ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
	ctx.fill();
	
	// Inner glow
	ctx.shadowBlur = 12;
	ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
	ctx.fill();
	
	// Reset shadow
	ctx.shadowBlur = 0;
}

export function drawPaddle(paddle: Paddle, ctx: CanvasRenderingContext2D, side: "left" | "right") {
	// Determine glow color based on side
	const glowColor = side === "left" ? "#38bdf8" : "#ec4899";
	
	// Outer glow
	ctx.shadowBlur = 20;
	ctx.shadowColor = glowColor;
	
	// Gradient fill
	const gradient = ctx.createLinearGradient(
		paddle.position.x,
		paddle.position.y,
		paddle.position.x,
		paddle.position.y + paddle.height
	);
	gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
	gradient.addColorStop(1, "rgba(255, 255, 255, 0.75)");
	
	ctx.fillStyle = gradient;
	
	// Draw rounded rectangle
	const radius = 8;
	ctx.beginPath();
	ctx.moveTo(paddle.position.x + radius, paddle.position.y);
	ctx.lineTo(paddle.position.x + paddle.width - radius, paddle.position.y);
	ctx.quadraticCurveTo(paddle.position.x + paddle.width, paddle.position.y, paddle.position.x + paddle.width, paddle.position.y + radius);
	ctx.lineTo(paddle.position.x + paddle.width, paddle.position.y + paddle.height - radius);
	ctx.quadraticCurveTo(paddle.position.x + paddle.width, paddle.position.y + paddle.height, paddle.position.x + paddle.width - radius, paddle.position.y + paddle.height);
	ctx.lineTo(paddle.position.x + radius, paddle.position.y + paddle.height);
	ctx.quadraticCurveTo(paddle.position.x, paddle.position.y + paddle.height, paddle.position.x, paddle.position.y + paddle.height - radius);
	ctx.lineTo(paddle.position.x, paddle.position.y + radius);
	ctx.quadraticCurveTo(paddle.position.x, paddle.position.y, paddle.position.x + radius, paddle.position.y);
	ctx.closePath();
	ctx.fill();
	
	// Reset shadow
	ctx.shadowBlur = 0;
}
