import gameController from "../controllers/controller.game.js";

export default async function gameRoutes( server ){
	await gameController(server);
}