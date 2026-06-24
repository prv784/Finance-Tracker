package com.financetracker.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
@Data public class IncomeRequest {
    @NotBlank private String title;
    private String description;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate date;
    private String source;
    private String notes;
    private boolean isRecurring;
    private String recurrenceType;
}
