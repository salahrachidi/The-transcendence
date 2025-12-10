import fastify from "fastify";
import initVault from "./utils/utils.vault.js"
import initDb from "./models/model.db.js";
import initRoutes from "./routes/route.init.js";
import registerPlugins from "./plugins/plugin.register.js";
import CleanupScheduler from "./utils/utils.cleanup.js";

//dotenv.config()
const server = fastify({
	logger: true,
});

// dont touch vault init it should be here . . .
//await initVault();
await registerPlugins(server);
await initDb(server);
await initRoutes(server);
// for healthcheckauto
server.get("/", (_, reply) => {
	reply.status(200).send({ success: true, result: "healthcheck success" });
});

await server.ready();

const cleanupScheduler = new CleanupScheduler(server.db);
await cleanupScheduler.start(4 * 60 * 60 * 1000);

server.listen({ host: "0.0.0.0", port: "5555" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
