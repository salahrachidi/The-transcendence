import chatModel from "../models/model.chat.js";
import { messageValidtor } from '../utils/utils.chat.js';
import { sendMessage } from "../utils/utils.chat.js";
import userModel from "../models/model.user.js";
import blockModel from "../models/model.blocks.js";

let clients = new Map();

const chatController = {

	async handleWebSocketConnection(socket, req, server) {

		server.metrics.incrementWebSocket('chat');
		const username = req.user?.nickname;
		if (!username) {
			socket.send(JSON.stringify({
				success: false,
				result: 'Unauthorized'
			}));
			socket.close();
			return;
		}

		clients.set(username, socket);
		server.log.info(`User ${username} connected. Total clients: ${clients.size}`);

		socket.on('message', async (message) => {

			try {
				const data = JSON.parse(message.toString());

				if (!messageValidtor(data)) {
					socket.send(JSON.stringify({
						success: false,
						result: 'Invalid message schema',
					}));
					return;
				}

				const sender = await userModel.getUserByName(server.db, data.sender);
				const receiver = await userModel.getUserByName(server.db, data.receiver);

				if (!sender || !receiver) {
					socket.send(JSON.stringify({
						success: false,
						result: 'User not found'
					}));
					return;
				}



				const senderBlockedReceiver = await blockModel.checkBlock(server.db, sender.id, receiver.id);
				const receiverBlockedSender = await blockModel.checkBlock(server.db, receiver.id, sender.id);

				if (senderBlockedReceiver || receiverBlockedSender) {
					socket.send(JSON.stringify({
						success: false,
						result: 'Cannot send message, user is blocked or not found'
					}));
					return;
				}

				await chatModel.addMessage(
					server.db,
					data.sender,
					data.receiver,
					data.message,
					data.timestamp,
					Number(data.is_seen)
				);

				await chatModel.upsertConversation(
					server.db,
					Math.min(sender.id, receiver.id),
					Math.max(sender.id, receiver.id),
					data.message,
					data.timestamp
				);

				const result = await sendMessage(data, clients, server.log);

				if (!result.success) {
					server.log.warn(`Message delivery status: ${result.reason}`);
				}

			} catch (error) {
				server.log.error(error);
				socket.send(JSON.stringify({
					success: false,
					result: 'Invalid message format',
				}));
			}
		});

		socket.on('close', () => {
			server.metrics.decrementWebSocket('chat');
			clients.delete(username);
			server.log.info(`User ${username} disconnected. Total clients: ${clients.size}`);
		});

		socket.on('error', (err) => {
			server.log.error(`WebSocket error for ${username}:`, err);
			clients.delete(username);
		});
	},

	async getOnlineUsers(req, res, server) {
		try {
			const onlineUsernames = [...clients.keys()];

			res.code(200).send({
				success: true,
				result: {
					count: onlineUsernames.length,
					users: onlineUsernames
				}
			});

		} catch (error) {
			server.log.error('Get online users error:', error);
			res.code(500).send({
				success: false,
				result: "Internal server error"
			});
		}
	},

	//added by xeloda: this is why the blocked user should refresh its page to see the changes
	async getConversations(req, res, server) {

		try {
			const nickname = req.user?.nickname;
			const { limit = 10, offset = 0 } = req.query;

			const user = await userModel.getUserByName(server.db, nickname);

			if (!user) {
				return res.code(404).send({
					success: false,
					result: "User not found",
				});
			}
			// server.log.info(user.avatar);
			const conversations = await chatModel.getConversations(
				server.db,
				user.id,
				limit,
				offset
			);

			if (!conversations || conversations.length === 0) {
				return res.code(200).send([]);
			}

			const formattedConversations = conversations.map(conv => ({
				id: conv.id,
				userId: conv.contact_id || 0, // Fallback
				name: conv.contact_name,
				time: conv.last_timestamp,
				preview: conv.last_message,
				avatarUrl: conv.contact_avatar || "https://avatar.iran.liara.run/public/job/designer/male",
				status: clients.has(conv.contact_name) ? "online" : "offline",
				read: false,
				// added by xeloda: map block status
				is_blocked: Boolean(conv.is_blocked_by_me),
				am_i_blocked: Boolean(conv.is_blocked_by_them)
			}));

			res.code(200).send(formattedConversations);

		} catch (error) {
			server.log.error('Get conversations error:', error);
			res.code(500).send({
				success: false,
				result: "Internal server 1337 error"
			});
		}
	},

	async getMessagesByConversation(req, res, server) {

		try {
			const convId = req.params?.id;
			const { limit = 10, offset = 0 } = req.query;

			const conversationUsers = await chatModel.getUsersIdByConvId(server.db, convId);

			if (!conversationUsers) {
				return res.code(404).send({
					success: false,
					result: `Conversation not found with id: ${convId}`
				});
			}

			const { user1_id, user2_id } = conversationUsers;

			const messages = await chatModel.getMessage(
				server.db,
				user1_id,
				user2_id,
				limit,
				offset
			);

			if (!messages || messages.length === 0) {
				return res.code(404).send({
					success: false,
					result: `No messages found for conversation id: ${convId}`
				});
			}

			res.code(200).send(messages);

		} catch (error) {
			server.log.error('Get messages error:', error);
			res.code(500).send({
				success: false,
				result: "Internal server error"
			});
		}
	},

	async markMessagesAsSeen(req, res, server) {
		try {
			const nickname = req.user?.nickname;
			const { senderUsername } = req.body;

			if (!senderUsername) {
				return res.code(400).send({
					success: false,
					result: "senderUsername is required"
				});
			}

			const currentUser = await userModel.getUserByName(server.db, nickname);
			const sender = await userModel.getUserByName(server.db, senderUsername);

			if (!currentUser || !sender) {
				return res.code(404).send({
					success: false,
					result: "User not found"
				});
			}

			const changes = await chatModel.setAsSeen(server.db, sender.id, currentUser.id);

			res.code(200).send({
				success: true,
				result: `Marked ${changes} messages as seen`
			});

		} catch (error) {
			server.log.error('Mark as seen error:', error);
			res.code(500).send({
				success: false,
				result: "Internal server error"
			});
		}
	},

	// added by xeloda: HTTP endpoint to send message
	async sendMessage_C(req, res, server) {
		try {
			const senderNickname = req.user?.nickname;
			const { receiver, message } = req.body;

			if (!message || !receiver) {
				return res.code(400).send({
					success: false,
					result: "Message and receiver are required"
				});
			}

			const sender = await userModel.getUserByName(server.db, senderNickname);
			const receiverUser = await userModel.getUserByName(server.db, receiver);

			if (!sender || !receiverUser) {
				return res.code(404).send({
					success: false,
					result: "User not found"
				});
			}

			const senderBlockedReceiver = await blockModel.checkBlock(server.db, sender.id, receiverUser.id);
			const receiverBlockedSender = await blockModel.checkBlock(server.db, receiverUser.id, sender.id);

			if (senderBlockedReceiver || receiverBlockedSender) {
				return res.code(403).send({
					success: false,
					result: 'Cannot send message, user is blocked'
				});
			}

			const timestamp = new Date().toISOString();

			await chatModel.addMessage(
				server.db,
				senderNickname,
				receiver,
				message,
				timestamp,
				0 // is_seen = false
			);

			await chatModel.upsertConversation(
				server.db,
				Math.min(sender.id, receiverUser.id),
				Math.max(sender.id, receiverUser.id),
				message,
				timestamp
			);

			// Broadcast via WebSocket using utility
			const data = {
				sender: senderNickname,
				receiver: receiver,
				message: message,
				timestamp: timestamp,
				is_seen: false,
				type: "message"
			};

			const result = await sendMessage(data, clients, server.log);

			res.code(200).send({
				success: true,
				result: "Message sent"
			});

		} catch (error) {
			server.log.error('Send message HTTP error:', error);
			res.code(500).send({
				success: false,
				result: "Internal server error"
			});
		}
	}
}

export default chatController
