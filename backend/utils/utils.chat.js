

async function sendMessage(messageJson, clients, logger = console) {
    const { sender, receiver, message, timestamp } = messageJson;
	
	if (sender === receiver) {
		return ;
	}
    try {
        const recSocket = clients.get(receiver);
        
        if (!recSocket) {
            logger.warn(`Receiver ${receiver} is not connected. Message will be stored but not delivered in real-time.`);
            return { success: false, reason: 'receiver_offline' };
        }

        if (recSocket.readyState !== 1) {
            logger.warn(`Receiver ${receiver} socket is not in OPEN state (readyState: ${recSocket.readyState})`);
            return { success: false, reason: 'socket_not_ready' };
        }

        const payload = {
            type: 'message',
            sender,
            receiver,
            message,
            timestamp,
            is_seen: false
        };

        recSocket.send(JSON.stringify(payload));
        logger.info(`Message sent from ${sender} to ${receiver}`);
        
        return { success: true };

    } catch (error) {
        logger.error(`Failed to send message from ${sender} to ${receiver}:`, error);
        return { success: false, reason: 'send_error', error: error.message };
    }
}


import Ajv from 'ajv';


const ajv = new Ajv();

const messageSchema = {

        type: 'object',
        required: ['sender', 'receiver', 'message', 'timestamp', 'is_seen'],
        properties: {
          sender: { type: 'string', minLength: 1, maxLength: 50 },
          receiver: { type: 'string', minLength: 1, maxLength: 50 },
          message: { type: 'string', minLength: 1, maxLength: 5000 },
          timestamp: { type: 'string'},
          is_seen: { type: 'boolean', default: false }
        },
        additionalProperties: false
};

const paginationSchema =  {
        params: {
            type: 'object',
            properties: {
                id: { 
                    type: 'integer',
                    minimum: 1
                }
            },
            required: ['id'],
            additionalProperties: false
        },
        querystring: {
            type: 'object',
            properties: {
                offset: { 
                    type: 'integer',
                    minimum: 0 
                },
                limit: { 
                    type: 'integer',
                    default: 10, 
                    minimum: 1,
                    maximum: 100 
                }
            },
            required: ['offset'],
            additionalProperties: false
        }
};

const messageValidtor = ajv.compile(messageSchema);

// i should use schema instead of this ajv shit

export {
    messageValidtor,
    paginationSchema,
    sendMessage,

}