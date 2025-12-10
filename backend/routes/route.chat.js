import { paginationSchema } from '../utils/utils.chat.js'
import chatController from '../controllers/controller.chat.js'


async function chatRoutes(server) {

	server.get('/',
		{
			onRequest: [server.auth],
			websocket: true,
		},
		async (socket, req) => {
			await chatController.handleWebSocketConnection(socket, req, server);
		}
	);

	server.get('/online-users',
		{
			onRequest: [server.auth],
		},
		async (req, res) => {
			await chatController.getOnlineUsers(req, res, server);
		}
	);

	server.get('/conversations',
		{
			onRequest: [server.auth],
		},
		async (req, res) => {
			await chatController.getConversations(req, res, server);
		}
	);

	server.get('/conversations/:id/messages',
		{
			onRequest: [server.auth],
			schema: paginationSchema,
		},
		async (req, res) => {
			await chatController.getMessagesByConversation(req, res, server);
		}
	);

	server.post('/messages/seen',
		{
			onRequest: [server.auth],
		},
		async (req, res) => {
			await chatController.markMessagesAsSeen(req, res, server);
		}
	);

	// added by xeloda: HTTP send message
	server.post('/messages',
		{
			onRequest: [server.auth],
		},
		async (req, res) => {
			await chatController.sendMessage_C(req, res, server);
		}
	);

}

export default chatRoutes
