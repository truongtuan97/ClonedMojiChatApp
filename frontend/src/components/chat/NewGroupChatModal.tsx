import { useFriendStore } from "@/stores/useFriendStore";
import type { ReactNode } from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import InviteSuggestionList from "./newGroupChat/InviteSuggestionList";
import SelectedUsersList from "./newGroupChat/SelectedUsersList";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";

type NewGroupChatModalProps = {
  trigger?: ReactNode;
};

const NewGroupChatModal = ({ trigger }: NewGroupChatModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const { loading, createConversation } = useChatStore();

  const handleGetFriends = async () => {
    await getFriends();
  }

  const handleSelectFriend = (friend: Friend) => {
    setInvitedUsers([...invitedUsers, friend]);
    setSearch("");
  }

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id));
  }

  const filteredFriends = friends.filter((friend) => friend.displayName.toLowerCase().includes(search.toLowerCase()) && !invitedUsers.some((u) => u._id === friend._id));

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (invitedUsers.length === 0) {
        toast.warning("Ban phai moi it nhat mot thanh vien vao nhom");
        return;
      }

      await createConversation("group", groupName, invitedUsers.map((u) => u._id));
      setSearch("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Loi xay ra trong handleSubmit trong NewGroupChatModal: ", error);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          handleGetFriends();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button 
            variant={"ghost"}
            className="flex z-10 justify-center items-center size-5 rounded-full hover:bg-sidebar-accent transition cursor-pointer"
          >
            <Users className="size-4" />
            <span className="sr-only">Tao nhom</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">tao nhom chat moi</DialogTitle>
          <DialogDescription className="sr-only">
            Dat ten nhom va moi ban be vao nhom chat moi.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* ten nhom */}
          <div className="space-y-2">
            <Label 
              htmlFor="groupName"
              className="text-sm font-semibold">Ten nhom</Label>
            <Input 
              id="groupName" 
              placeholder="Nhap ten nhom..."
              className="glass border-border/50 focus:border-primary/50 transition-smooth"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)} required/>
            
            {/* moi thanh vien */}
            <div className="space-y-2">
              <Label htmlFor="invite" className="font-semibold text-sm">Moi thanh vien</Label>
              <Input id="invite" 
                placeholder="Tim theo ten hien thi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)} />

              {/* danh sach goi y */}
              {search && filteredFriends.length > 0 && (
                <InviteSuggestionList filteredFriends={filteredFriends} onSelect={handleSelectFriend} />
              )}
              
              {/* danh sach user da chon */}
              <SelectedUsersList invitedUsers={invitedUsers} onRemove={handleRemoveFriend}/>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
            >
              {
                loading ? (
                  <span>Dang tao...</span>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    Tao nhom
                  </>
                )
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent> 
    </Dialog>
  );
};

export default NewGroupChatModal;