import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component';

const ChatWindowBody = () => {
  const { activeConversationId, conversations, messages: allMessages, fetchMessages } = useChatStore();

  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered")

  const messages = allMessages[activeConversationId!]?.items ?? [];
  
  const reversedMessages = [...messages].reverse();

  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;

  const selectedConvo = conversations.find((c) => c._id === activeConversationId);

  // ref
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const lastMessage = selectedConvo?.lastMessage;
    if (!lastMessage) {
      return;
    }

    const seenBy = selectedConvo?.seenBy ?? [];
    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

  // keo xuong duoi khi load convo
  useLayoutEffect(() => {
    if (!messageEndRef.current) {
      return;
    }

    messageEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end"
    })
  }, [activeConversationId])

  const fetchMoreMessages = async () => {
    if (!activeConversationId) return;

    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.log('Loi xay ra khi fetch them tin ', error);
    }
  }

  if (!selectedConvo) {
    return <ChatWelcomeScreen />
  }

  if (!messages!.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chua co tin nhan nao trong cuoc tro chuyen nay.
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div 
        id="scrollableDiv"
        className="flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar">
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader="<p>Dang tai...</p>"
        >
          {messages.map((message, index) => (
            <MessageItem  
              key={message._id ?? index} 
              message={message}
              index={index}
              messages={messages}
              selectedConvo={selectedConvo}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </InfiniteScroll>
        
        <div ref={messageEndRef}></div>
      </div>
    </div>
  );
}

export default ChatWindowBody;