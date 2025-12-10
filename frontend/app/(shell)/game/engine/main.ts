import { Game } from "./game";
import { Ball } from "./ball";
import { Paddle } from "./paddle";
import type { IGameConfig } from "./types";

export { Game } from "./game";
export * from "./types";

export const DEFAULT_CONFIG: IGameConfig = {
	canvasWidth: 800,
	canvasHeight: 600,
	paddleWidth: 15,
	paddleHeight: 100,
	paddleSpeed: 8,
	ballRadius: 8,
	ballSpeed: 6,
	maxScore: 7
};

export function localGame(canvasId: string, userConfig?: Partial<IGameConfig>): Game {
	const config = {...DEFAULT_CONFIG, ...userConfig};

	const ball = new Ball(
		config.canvasWidth / 2,
		config.canvasHeight / 2,
		config.ballRadius,
		config.ballSpeed
	);
	const leftPaddle = new Paddle(
		20,
		config.canvasHeight / 2 - config.paddleHeight / 2,
		config.paddleWidth,
		config.paddleHeight,
		config.paddleSpeed
	);
	const rightPaddle = new Paddle(
		config.canvasWidth - 20 - config.paddleWidth,
		config.canvasHeight / 2 - config.paddleHeight / 2,
		config.paddleWidth,
		config.paddleHeight,
		config.paddleSpeed
	);

	return new Game(canvasId, config, ball, leftPaddle, rightPaddle);
}