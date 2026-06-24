package com.financetracker.controller;

import com.financetracker.dto.request.AiChatRequest;
import com.financetracker.dto.response.AiAnalysisResponse;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.service.impl.GeminiAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI – Gemini", description = "Gemini-powered finance AI endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final GeminiAiService geminiAiService;

    @GetMapping("/analyze")
    @Operation(summary = "Full AI spending analysis with health score (Gemini 2.0 Flash)")
    public ResponseEntity<ApiResponse<AiAnalysisResponse>> analyze(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {
        LocalDate now = LocalDate.now();
        int m = month == 0 ? now.getMonthValue() : month;
        int y = year  == 0 ? now.getYear()       : year;
        return ResponseEntity.ok(ApiResponse.success(
                geminiAiService.analyzeSpending(m, y), "Analysis complete"));
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with Gemini AI finance assistant")
    public ResponseEntity<ApiResponse<String>> chat(
            @Valid @RequestBody AiChatRequest req) {
        String reply = geminiAiService.chat(req.getMessage());
        return ResponseEntity.ok(ApiResponse.success(reply, "Response generated"));
    }

    @PostMapping("/categorize")
    @Operation(summary = "AI auto-categorize an expense by title/description")
    public ResponseEntity<ApiResponse<String>> categorize(
            @RequestBody Map<String, String> body) {
        String category = geminiAiService.categorizeExpense(
                body.get("title"), body.get("description"));
        return ResponseEntity.ok(ApiResponse.success(category, "Category suggested"));
    }

    @GetMapping("/saving-tips")
    @Operation(summary = "Get 5 personalized saving tips based on top spending categories")
    public ResponseEntity<ApiResponse<List<String>>> savingTips() {
        return ResponseEntity.ok(ApiResponse.success(
                geminiAiService.getSmartSavingTips(), "Tips generated"));
    }
}
