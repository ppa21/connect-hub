package com.chatservice.chat.controller;

import com.chatservice.chat.domain.ChatMessage;
import com.chatservice.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // WebSocket Endpoint: /app/sendMessage
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload ChatMessage message) {
        chatService.processMessage(message);
    }

    // REST Endpoint: /api/chat/history
    @GetMapping("/api/chat/history")
    public List<ChatMessage> getHistory() {
        return chatService.getHistory();
    }
}
