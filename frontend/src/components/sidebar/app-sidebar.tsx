import * as React from "react"
import {
  Moon,
  Sun,
  UserPlus,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModal from "../chat/NewGroupChatModal"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModal from "../chat/AddFriendModal"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { NavUser } from "./nav-user"
import { useAuthStore } from "@/stores/useAuthStore"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const {user} = useAuthStore();

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="bg-gradient-primary"> 
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Moji</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80"></Sun>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-background/80" />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contetn */}
      <SidebarContent className="beautiful-scrollbar">
        {/* New chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group chat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Nhom Chat
          </SidebarGroupLabel>
          
          <NewGroupChatModal
            trigger={
              <SidebarGroupAction
                title="Tao nhom"
                className="cursor-pointer"
              >
                <Users className="size-4" />
                <span className="sr-only">Tao nhom</span>
              </SidebarGroupAction>
            }
          />

          <SidebarGroupContent>
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Direct message */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Ban be
          </SidebarGroupLabel>
          
          <AddFriendModal
            trigger={
              <SidebarGroupAction
                title="Ket Ban"
                className="cursor-pointer"
              >
                <UserPlus className="size-4" />
                <span className="sr-only">Ket ban</span>
              </SidebarGroupAction>
            }
          />

          <SidebarGroupContent>
            <DirectMessageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {user && <NavUser user={user}/>}
      </SidebarFooter>
    </Sidebar>
  )
}
