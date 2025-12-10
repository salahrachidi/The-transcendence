//	LOCAL TYPES
export interface IPosition {
	x: number;
	y: number;
}

export interface IVelocity {
	x: number;
	y: number;
}

export interface IGameConfig {
	canvasWidth: number;
	canvasHeight: number;
	paddleWidth: number;
	paddleHeight: number;
	paddleSpeed: number;
	ballRadius: number;
	ballSpeed: number;
	maxScore: number;
	onScoreUpdate?: (p1: number, p2: number) => void;
	onGameEnd?: (winner: TPlayerSide, score: { p1: number; p2: number }) => void;
}

export enum ECollision {
	NONE,
	FACE,
	EDGE
}

export type TGameStatus = "waiting" | "playing" | "paused" | "finished";

export type TPlayerSide = "left" | "right";

//	REMOTE TYPES

//	Client Messages

export interface IJoinGameMessage {
	type: "JOIN_GAME";
	payload: {
		playerName: string;
	};
}

export interface IPlayerInputMessage {
	type: "PLAYER_INPUT";
	payload: {
		direction: TInputDirection;
	};
}

export interface ILeaveGameMessage {
	type: "LEAVE_GAME";
	payload: Record<string, never>;
}

export type ClientMessage = IJoinGameMessage | IPlayerInputMessage | ILeaveGameMessage;

//		Server Messages

export interface IWaitingMessage {
	type: "WAITING";
	payload: {
		message: string;
	};
}

export interface IGameStartMessage {
	type: "GAME_START";
	payload: {
		side: TPlayerSide;
		opponentName: string;
	};
}

export interface IGameStateMessage {
	type: "GAME_STATE";
	payload: {
		ball: {
			position: IPosition;
		};
		leftPaddle: {
			position: IPosition;
		};
		rightPaddle: {
			position: IPosition;
		};
		scores: {
			left: number;
			right: number;
		};
	};
}

export interface IGameEndMessage {
	type: "GAME_END";
	payload: {
		winner: TPlayerSide;
		scores: {
			left: number;
			right: number;
		};
	};
}

export interface IOpponenetLeftMessage {
	type: "OPPONENT_LEFT";
	payload: {
		message: string;
	};
}

export interface IErrorMessage {
	type: "ERROR";
	payload: {
		message: string;
	};
}

export type ServerMessage = IWaitingMessage | IGameStartMessage | IGameStateMessage | IGameEndMessage | IOpponenetLeftMessage | IErrorMessage;

//	User Input

export type TInputDirection = "up" | "down" | "stop";
