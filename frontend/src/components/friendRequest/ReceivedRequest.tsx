import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Button } from "../ui/button";
import { toast } from "sonner";

const ReceivedRequest = () => {
  const {acceptRequest, declineRequest, loading, receivedList} = useFriendStore();

  if (!receivedList || receivedList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Ban chua co loi moi nao.</p>
    );
  }

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      toast.success("Da dong y ket ban thanh cong.");
    } catch (error) {
      console.error("Loi xay ra khi accept trong handleAccept", error);
    }
  }

  const handleDecline = async (requestId: string)  => {
    try {
      await declineRequest(requestId);
      toast.info("Da tu choi ket ban");
    } catch (error) {
      console.error("Loi xay ra khi decline trong handleDecline", error);
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {
        receivedList.map((req) => (
          <FriendRequestItem 
            key={req._id}
            requestInfo={req}
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant={"primary"}
                  onClick={() => handleAccept(req._id)}
                  disabled={loading}>Chap nhan</Button>
                
                <Button size="sm" variant="destructiveOutline" 
                  onClick={() => handleDecline(req._id)}
                  disabled={loading}>
                    Tu choi
                </Button>
              </div>
            }
            type="received"
          />
        ))
      }
    </div>
  );
}

export default ReceivedRequest;