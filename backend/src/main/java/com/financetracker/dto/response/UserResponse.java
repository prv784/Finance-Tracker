package com.financetracker.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private String role;
    private boolean enabled;
    private LocalDateTime createdAt;
}
