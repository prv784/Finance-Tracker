package com.financetracker.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class AiChatRequest {
    @NotBlank private String message;
    private String conversationId;
}
