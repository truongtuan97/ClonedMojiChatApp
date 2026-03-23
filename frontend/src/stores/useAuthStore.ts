import {create} from 'zustand'
import {toast} from 'sonner'
import {authService} from '@/services/authService'
import type {AuthState}
from '@/types/store'
import {persist} from 'zustand/middleware';
import { useChatStore } from './useChatStore';

export const useAuthStore = create < AuthState > ()(persist((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => {
        set({accessToken: null, user: null, loading: false})
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear();
    },

    signUp: async (username, password, email, lastname, firstname) => {
        try {
            set({loading: true})

            // call api
            await authService.signUp(username, password, email, lastname, firstname)
            toast.success('Đăng ký thành công. Bạn sẽ được chuyển sang trang đăng nhập.')
        } catch (error) {
            console.error(error);
            toast.error('Đăng ký không thành công.')
        } finally {
            set({loading: false})
        }
    },

    signIn: async (username, password) => {
        try {
            get().clearState();
            set({loading: true});

            localStorage.clear();
            useChatStore.getState().reset();
            
            const {accessToken} = await authService.signIn(username, password)

            get().setAccessToken(accessToken);
            await get().fetchMe();

            useChatStore.getState().fetchConversations();
            
            toast.success('Chào mừng bạn quay lại với Mọi')
        } catch (error) {
            console.log(error)
            toast.error("Đăng nhập không thành công.")
        } finally {
            set({loading: false})
        }
    },

    signOut: async () => {
        try {
            get().clearState()
            await authService.signOut();
            toast.success("Logged thành công.")
        } catch (error) {
            console.log("Error: ", error)
            toast.error("Lỗi khi logout, hay thủ lại.")
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true})
            const user = await authService.fetchMe()
            set({user})

        } catch (error) {
            console.log("Error: ", error)
            set({user: null, accessToken: null})
            toast.error("Lỗi khi lấy thông tin người dùng.")
        } finally {
            set({loading: false})
        }
    },

    refresh: async () => {
        try {
            set({loading: true})
            const {user, fetchMe, setAccessToken} = get();
            const accessToken = await authService.refresh();
            setAccessToken(accessToken)

            if (!user) {
                await fetchMe();
            }
        } catch (error) {
            console.log("Error inf refresh: ", error)
            get().clearState()
            toast.error("Phien dang nhap da het han. Vui long dang nhap lai.")
        } finally {
            set({loading: false})
        }
    },

    setAccessToken: (accessToken) => {
        set({accessToken})
    }
}), {
    name: "auth-storage",
    partialize: (state) => (
        {user: state.user}
    ), // chi persist user
}));
