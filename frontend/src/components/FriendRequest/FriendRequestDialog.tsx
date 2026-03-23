import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useFriendStore } from "@/stores/useFriendStore";
import SentRequest from "./SentRequest";
import ReceivedRequest from "./ReceivedRequest";

interface FriendRequestDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
const FriendRequestDialog = ({open, setOpen}: FriendRequestDialogProps) => {
  const [tab, setTab] = useState("received");
  const {getAllFriendRequest} = useFriendStore();

  useEffect(() => {
    const loadRequest = async () => {
      try {
        await getAllFriendRequest();
      } catch (error) {
        console.error('Loi xay ra khi load request', error);
      }
    }

    loadRequest();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Loi moi ket ban</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">          
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Đã nhận</TabsTrigger>
            <TabsTrigger value="sent">Đã gửi</TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            <ReceivedRequest />
          </TabsContent>

          <TabsContent value="sent">
            <SentRequest />
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default FriendRequestDialog;