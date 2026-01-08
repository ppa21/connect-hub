package com.chatservice.chat.service;

import com.chatservice.chat.domain.ChatMessage;
import com.chatservice.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SimpMessagingTemplate simpTemplate;

    // 1. Receive from WebSocket -> Save to Mongo -> Push to Kafka
    public void processMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        repository.save(message);
        kafkaTemplate.send("chat-topic", message);
    }

    // 2. Listen to Kafka -> Push to All WebSockets
    @KafkaListener(topics = "chat-topic", groupId = "chat-group")
    public void consumeMessage(ChatMessage message) {
        log.info("Kafka Consumed Message from: {}", message.getSender());
        simpTemplate.convertAndSend("/topic/public", message);
    }

    public List<ChatMessage> getHistory() { return repository.findAll(); }
}
