import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const ChatAppPage = () => {
  const user = useAuthStore((s) => s.user);

  const handleOnClick = async () => {
    try {
      await api.get("/users/test", {withCredentials: true})
      toast.success("Ok")
    } catch (error) {
      toast.error("Failed")
      console.error(error)
    }
  }
  return (
    <div>
      {user?.displayName}
      <Logout/>

      <Button onClick={handleOnClick}>Test</Button>
    </div>
  )
}

export default ChatAppPage;