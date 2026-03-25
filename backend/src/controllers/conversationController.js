import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { io } from '../socket/index.js';

const DEFAULT_MESSAGE_LIMIT = 20;
const MAX_MESSAGE_LIMIT = 100;

const populateConversationFields = [
  { path: 'participants.userId', select: 'displayName avatarUrl' },
  { path: 'seenBy', select: 'displayName avatarUrl' },
  { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },
];

const mapParticipants = (conversation) =>
  (conversation.participants || []).map((participant) => ({
    _id: participant.userId?._id ?? participant.userId,
    displayName: participant.userId?.displayName,
    avatarUrl: participant.userId?.avatarUrl ?? null,
    joinedAt: participant.joinedAt,
  }));

const formatConversation = (conversation) => ({
  ...conversation.toObject(),
  unreadCounts: conversation.unreadCounts || {},
  participants: mapParticipants(conversation),
});

const parseMessageLimit = (limitQuery) => {
  const parsedLimit = Number(limitQuery);
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_MESSAGE_LIMIT;
  }
  return Math.min(parsedLimit, MAX_MESSAGE_LIMIT);
};

const isConversationParticipant = (conversation, userId) => {
  const normalizedUserId = userId.toString();
  return (conversation.participants || []).some(
    (participant) => participant.userId?.toString() === normalizedUserId
  );
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (!type || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'Type va memberIds la bat buoc.' });
    }

    const uniqueMemberIds = [...new Set(memberIds.map((id) => id.toString()))].filter(
      (id) => id !== userId.toString()
    );

    let conversation;
    if (type === 'direct') {
      if (uniqueMemberIds.length !== 1) {
        return res.status(400).json({ message: 'Direct conversation can dung 1 memberId.' });
      }

      const participantId = uniqueMemberIds[0];
      conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [userId, participantId] },
        participants: { $size: 2 },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: 'direct',
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });
        await conversation.save();
      }
    } else if (type === 'group') {
      if (!name?.trim() || uniqueMemberIds.length === 0) {
        return res
          .status(400)
          .json({ message: 'Ten nhom va danh sach thanh vien la bat buoc.' });
      }

      conversation = new Conversation({
        type: 'group',
        participants: [{ userId }, ...uniqueMemberIds.map((id) => ({ userId: id }))],
        group: {
          name: name.trim(),
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });
      await conversation.save();

      uniqueMemberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatConversation(conversation));
      });

    } else {
      return res.status(400).json({ message: 'Conversation type khong hop le.' });
    }

    await conversation.populate(populateConversationFields);
    return res.status(201).json({ conversation: formatConversation(conversation) });
  } catch (error) {
    console.error('Loi khi tao moi conversation: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ 'participants.userId': userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate(populateConversationFields);

    return res.status(200).json({
      conversations: conversations.map(formatConversation),
    });
  } catch (error) {
    console.error('Loi khi lay conversations: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, cursor } = req.query;
    const userId = req.user._id;
    const parsedLimit = parseMessageLimit(limit);

    const conversation = await Conversation.findById(conversationId, { participants: 1 }).lean();
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation khong ton tai.' });
    }
    if (!isConversationParticipant(conversation, userId)) {
      return res.status(403).json({ message: 'Ban khong co quyen truy cap conversation nay.' });
    }

    const query = { conversationId };
    if (cursor) {
      const parsedCursor = new Date(cursor);
      if (Number.isNaN(parsedCursor.getTime())) {
        return res.status(400).json({ message: 'Cursor khong hop le.' });
      }
      query.createdAt = { $lt: parsedCursor };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1);
    let nextCursor = null;

    if (messages.length > parsedLimit) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }
    messages = messages.reverse();
    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.error('Loi khi lay messages ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find({ 'participants.userId': userId }, { _id: 1 });
    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error('Loi khi fetch conversations ', error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation khong ton tai.' });
    }
    if (!isConversationParticipant(conversation, userId)) {
      return res.status(403).json({ message: 'Ban khong co quyen truy cap conversation nay.' });
    }
    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: 'Khong co tin han de mark as seen.' });
    }
    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: 'Sender khong can mark as seen' });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      { new: true }
    );

    io.to(conversationId).emit('read-message', {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage?._id,
        content: updated?.lastMessage?.content,
        createdAt: updated?.lastMessage?.createdAt,
        sender: {
          _id: updated?.lastMessage?.senderId,
        },
      },
    });

    return res.status(200).json({
      message: 'Marked as seen',
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts?.[userId] || 0,
    });
  } catch (error) {
    console.error('Loi khi mark as seen ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
