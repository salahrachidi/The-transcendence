import { registerWebSocketRoutes } from "../utils/game/utils.wsGame.js";

export default async function gameController( server ) {
	registerWebSocketRoutes(server);
	server.log.info("Game WebSocket routes registerd");
}