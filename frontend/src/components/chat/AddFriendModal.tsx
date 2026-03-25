import type { ReactNode } from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "../addFriendModel/SearchForm";
import SendFriendRequestForm from "../addFriendModel/SendFriendRequestForm";

export interface IFormValues {
  username: string;
  message: string;
}

type AddFriendModalProps = {
  trigger?: ReactNode;
};

const AddFriendModal = ({ trigger }: AddFriendModalProps) => {
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [searchUser, setSearchUser] = useState<User>();
  const [searchedUsername, setSearchedUsername] = useState<string>("");
  const { loading, searchUserByUsername, addFriend} = useFriendStore();
  
  const {
    register,
    handleSubmit,
    watch,
    reset, formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: {username: "", message: ""}
  });

  const usernameValue = watch("username");

  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim();
    if (!username) return;

    setIsFound(null);
    setSearchedUsername(username);

    try {
      const foundUser = await searchUserByUsername(username);
      if (foundUser) {
        setIsFound(true);
        setSearchUser(foundUser);
      } else {
        setIsFound(false);
      }
    } catch (error) {
      console.error(error);
      setIsFound(false);
    }
  });

  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return;
    try {
      const message = await addFriend(searchUser._id, data.message.trim());
      toast.success(message);

      handleCancel(); //reset sau khi ket ban thanh cong
    } catch (error) {
      console.error("Loi xay ra khi gui request tu form ", error);
    }
  });

  const handleCancel = () => {
    reset();
    setSearchedUsername("");
    setIsFound(null);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <div
            role="button"
            tabIndex={0}
            className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
          >
            <UserPlus className="size-4"></UserPlus>
            <span className="sr-only">Ket ban</span>
          </div>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle>Ket ban</DialogTitle>
        </DialogHeader>

        {!isFound && (
          <>
            <SearchForm
              register={register}
              errors={errors}
              usernameValue={usernameValue}
              loading={loading}
              isFound={isFound}
              searchedUsername={searchedUsername}
              onSubmit={handleSearch}
              onCancel={handleCancel} />  
          </>
        )}

        {isFound && <>
          <SendFriendRequestForm
            register={register}
            loading={loading}
            searchedUsername={searchedUsername}
            onSubmit={handleSend}
            onBack={() => setIsFound(null)} />
        </>}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;