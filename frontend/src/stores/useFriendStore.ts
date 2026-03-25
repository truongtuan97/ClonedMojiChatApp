import {friendService} from '../services/friendService';
import type { FriendState } from '@/types/store';
import {create} from 'zustand';

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  loading: false,
  receivedList: [],
  sentList: [],
  searchUserByUsername: async (username) => {
    try {
      set({loading: true});
      const user = await friendService.searchByUsername(username);

      return user;
    } catch (error) {
      console.error("Loi xay ra khi goi searchByUsername trong useFriendStore ", error);
      return null;
    } finally {
      set({loading: false});
    }
  },
  addFriend: async (to, message) => {
    try {
      set({loading: true});
      const resultMessage = await friendService.sendFriendRequest(to, message);
      return resultMessage;
    } catch (error) {
      console.error("Loi xay ra khi add friend trong useFriendStore ", error);
      return "Loi xay ra khi gui ket ban. Hay thu lai.";
    } finally {
      set({loading: false});
    }
  },
  getAllFriendRequest: async () => {
    try {
      set({loading: true});
      const res = await friendService.getAllFriendRequest();
      if (!res) return;
      const {sent, received} = res;
      set({receivedList: received, sentList: sent}); 
    } catch (error) {
      console.error("Loi xay ra khi goi getAllFriendRequest trong useFriendStore", error);
    } finally {
      set({loading: false});
    }
  },
  acceptRequest: async (requestId) => {
    try {
      set({loading: true});

      await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId)
      }))
    } catch (error) {
      console.error("Loi xay ra khi acceptRequest trong useFriendStore ", error);
    } finally {
      set({loading: false});
    }
  },
  declineRequest: async (requestId) => {
    try {
      set({loading: true});
      await friendService.declineRequest(requestId);
      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId)
      }))
    } catch (error) {
      console.error("Loi xay ra khi declineRequest trong useFriendStore ", error);
    } finally {
      set({loading: false});
    }
  },
  getFriends: async () => {
    try {
      set({loading: true});
      const friends = await friendService.getFriendList();
      set({friends: friends})
    } catch (error) {
      console.error("Co loi khi get friend: ", error);
      set({friends: []});
    } finally {
      set({loading: false});
    }
  }
}))