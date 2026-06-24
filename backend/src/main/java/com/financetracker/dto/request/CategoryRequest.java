package com.financetracker.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class CategoryRequest {
    @NotBlank private String name;
    private String icon;
    private String color;
    @NotBlank private String type;
}
