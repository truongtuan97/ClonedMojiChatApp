import {create} from 'zustand'
import {toast} from 'sonner'

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  loading: false

  signUp: async (username, password, email, lastname, firstname) => {
    try {
      set({loading: true})

      toast.success('Đăng ký thành công. Bạn sẽ được chuyển sang trang đăng nhập.')
    } catch (error) {
      console.error(error);
      toast.error('Đăng ký không thnhf công.')
    } finally {
      set({loading: false})
    }
  }
}))