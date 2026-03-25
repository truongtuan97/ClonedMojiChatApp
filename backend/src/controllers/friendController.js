import Friend from './../models/Friend.js';
import User from './../models/User.js';
import FriendRequest from './../models/FriendRequest.js';


export const sendFriendRequest = async (req, res) => {
    try {
        const {to, message} = req.body;
        const from = req.user._id;
        if (from === to) {
            return res.status(400).json({message: "Khong the gui loi moi ket ban cho chinh minh."})
        }
        const userExists = await User.exists({_id: to})

        if (! userExists) {
            return res.status(404).json({message: "Nguoi dung khong ton tai"})
        }

        let userA = from.toString();
        let userB = to.toString();

        if (userA > userB) {
            [userA, userB] = [userB, userA];
        }

        const [alreadyFriends, existingRequest] = await Promise.all([
            Friend.findOne(
                {userA, userB}
            ),
            FriendRequest.findOne(
                {
                    $or: [
                        {
                            from,
                            to
                        }, {
                            from: to,
                            to: from
                        }
                    ]
                }
            )
        ])

        if (alreadyFriends) {
            return res.status(400).json({message: "Hai nguoi da la ban be"})
        }

        if (existingRequest) {
            return res.status(400).json({message: "Da co loi moi ket ban dang cho"})
        }

        const request = await FriendRequest.create({from, to, message})

        return res.status(201).json({message: "Gui loi moi ket ban thanh cong.", request})
    } catch (error) {
        console.error("Loi khi gui yeu cau ket ban.", error)
        return res.status(500).json({message: "Internal server error."})
    }
}

export const acceptFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId)

        if (! request) {
            return res.status(404).json({message: "Khong tim thay loi moi ket ban"})
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({message: "Ban khong co quyen chap nhan loi moi nay."})
        }

        const friend = Friend.create({userA: request.from, userB: request.to})

        await FriendRequest.findByIdAndDelete(requestId)

        const from = await User.findById(request.from).select("_id displayName avatarUrl").lean();

        return res.status(200).json({
            message: "Chap nhan loi moi ket ban thanh cong.",
            newFriend: {
                _id: from ?. _id,
                displayName: from ?. displayName,
                avatarUrl: from ?. avatarUrl
            }
        })
    } catch (error) {
        console.error("Loi khi chap nhan ket ban.", error)
        return res.status(500).json({message: "Internal server error."})
    }
}

export const declineFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;
        const request = await FriendRequest.findById(requestId)

        if (! request) {
            return res.status(404).json({message: "Khong tim thay loi moi ket ban"})
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({message: "Ban khong co quyen tu choi loi moi nay."})
        }

        await FriendRequest.findByIdAndDelete(requestId);

        return res.sendStatus(204);
    } catch (error) {
        console.error("Loi khi tu choi ket ban.", error)
        return res.status(500).json({message: "Internal server error."})
    }
}

export const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id;

        const friendShips = await Friend.find({
            $or: [
                {
                    userA: userId
                }, {
                    userB: userId
                }
            ]
        }).populate("userA", "_id displayName avatarUrl").populate("userB", "_id displayName avatarUrl username").lean();

        if (! friendShips) {
            return res.status(200).json({friends: []})
        }

        const friends = friendShips.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA)

        return res.status(200).json({ friends });
    } catch (error) {
        console.error("Loi khi lay danh sach ban be.", error)
        return res.status(500).json({message: "Internal server error."})
    }
}

export const getAllFriendRequests = async (req, res) => {
    try {
      const userId = req.user._id;

      const populateFields = '_id username displayName avatarUrl username'

      const [sent, received] = await Promise.all([
        FriendRequest.find({from: userId}).populate("to", populateFields),
        FriendRequest.find({to: userId}).populate("from", populateFields)
      ]);

      res.status(200).json({sent, received})
    } catch (error) {
        console.error("Loi khi lay danh sach yeu cau ket ban.", error)
        return res.status(500).json({message: "Internal server error."})
    }
}
