import Conversation from './../models/Conversation.js';
import Message from './../models/Message.js';
import { updateConversationAfterCreateMessage } from '../utils/messageHelper.js';

export const sendDirectMessage = async (req, res) => {
    try {
        const {recipientId, content, conversationId} = req.body;
        const senderId = req.user._id;
        let conversation;

        if (!content) {
          return res.status(400).json({message: "Thieu noi dung"})
        }

        if (conversationId) {
          conversation = await Conversation.findById(conversationId)
        }

        if (!conversation) {
          conversation = await Conversation.create({
            type: 'direct',
            participants: [
              { userId: senderId, joinedAt: new Date() },
              { userId: recipientId, joinedAt: new Date() }
            ],
            lastMEssageAt: new Date(),
            unreadCounts: new Map()
          })
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId,
          content
        })

        updateConversationAfterCreateMessage(conversation, message, senderId)

        await conversation.save();
        return res.status(201).json({message});
    } catch (error) {}
};

export const sendGroupMessage = async (req, res) => {};
