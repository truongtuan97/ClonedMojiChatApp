import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";

const SentRequest = () => {
  const {sentList} = useFriendStore();

  if (!sentList) {
    return (
      <p className="text-sm text-muted-foreground">
        Ban chua gui moi moi ket ban nao.
      </p>
    );
  }
  return (
    <div className="space-y3 mt-4">
      <>{sentList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          type="sent"
          actions={
            <p className="text-sm text-muted-foreground">Dang cho tra loi...</p>
          }>            
        </FriendRequestItem>
      ))}</>
    </div>
  );
}

export default SentRequest;