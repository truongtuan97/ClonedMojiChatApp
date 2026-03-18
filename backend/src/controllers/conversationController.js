import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const createConversation = async (req, res) => {
    try {
        const {type, name, memberIds} = req.body;
        const userId = req.user._id;

        if (!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({message: "Ten nhom va danh sach thanh vien la bat buoc."});
        }

        let conversation;
        if (type === 'direct') {
            const participantId = memberIds[0];
            conversation = await Conversation.findOne({
                type: 'direct',
                "participants.userId": {
                    $all: [userId, participantId]
                }
            });

            if (! conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [
                        {
                            userId
                        }, {
                            userId: participantId
                        }
                    ],
                    lastMessageAt: new Date()
                });

                await conversation.save();
            }
        }

        if (type === 'group') {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    {
                        userId
                    },
                    ...memberIds.map((id) => ({userId: id}))
                ],
                group: {
                    name,
                    createdBy: userId
                },
                lastMessageAt: new Date()
            });
            await conversation.save();
        }

        if (! conversation) {
            return res.status(400).json({message: "Conversation type khong hop le."})
        }

        await conversation.populate([
            {
                path: "participants.userId",
                select: "displayName avatarUrl"
            }, {
                path: "seenBy",
                select: "displayName avatarUrl"
            }, {
                path: "lastMessage.senderId",
                select: "displayName avatarUrl"
            }
        ]);

        return res.status(201).json({conversation});
    } catch (error) {
        console.log("Loi khi tao moi conversation: ", error);
        return res.status(500).json({message: "Internal server error"});
    }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId
    }).sort({
      lastMessageAt: -1, updatedAt: -1
    }).populate({ path: "participants.userId", select: "displayName avatarUrl"}).
    populate({ path: "lastMessage.senderId", select: "displayName avatarUrl" }).
    populate({ path: "seenBy", select: "displayName avatarUrl"})

    const formatted = conversations.map((conver) => {
      const participants = (conver.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt
      }));
      return {
        ...conver.toObject(),
        unreadCounts: conver.unreadCounts || {},
        participants
      }
    })

    return res.status(200).json({conversations: formatted});

  } catch (error) {
    console.error("Loi khi lay conversations: ", error);
    return res.status(500).json({message: "Internal server error"});
  }
};

export const getMessages = async (req, res) => {
  try {
    const {conversationId} = req.params;
    const {limit, cursor} = req.query;

    const query = {conversationId};
    if (cursor) {
      query.createdAt = {$lt: new Date(cursor)};
    }

    let messages = await Message.find(query).sort({createdAt: -1}).limit(Number(limit) + 1);
    let nextCursor = null;
    
    if (messages.length > Number(limit)){
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }
    messages = messages.reverse();
    return res.status(200).json({messages, nextCursor});
  } catch (error) {
    console.error("Loi khi lay messages ", error);
    return res.status(500).json({message: "Internal server error"});
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId},
      { _id: 1 }
    )
    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Loi khi fetch conversations ", error);
    return [];
  }
}