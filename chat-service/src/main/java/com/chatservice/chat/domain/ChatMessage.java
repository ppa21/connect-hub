package com.chatservice.chat.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatMessage {
    @Id
    private String id;
    private String sender;
    private String content;
    private LocalDateTime timestamp;
}
