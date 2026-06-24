package com.financetracker.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.dto.response.AiAnalysisResponse;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.ExpenseRepository;
import com.financetracker.repository.IncomeRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GeminiAiService {

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    @Value("${app.gemini.model}")
    private String geminiModel;

    @Value("${app.gemini.base-url}")
    private String geminiBaseUrl;

    @Value("${app.gemini.max-output-tokens}")
    private int maxOutputTokens;

    public AiAnalysisResponse analyzeSpending(int month, int year) {
        User user = getCurrentUser();
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = YearMonth.of(year, month).atEndOfMonth();

        BigDecimal totalIncome = orZero(incomeRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        BigDecimal totalExpenses = orZero(expenseRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        List<Object[]> categoryData = expenseRepository.findCategoryWiseSummary(user.getId(), start, end);

        double healthScore = calculateHealthScore(totalIncome, totalExpenses, categoryData);
        String healthGrade = healthScore >= 80 ? "A" : healthScore >= 60 ? "B" : healthScore >= 40 ? "C" : "D";

        String context = buildFinancialContext(totalIncome, totalExpenses, categoryData);
        String prompt = """
                You are a professional personal finance advisor. Analyze this user's financial data for %s/%s:
                
                %s
                
                Provide a structured analysis returning objects explicitly matching these exact properties:
                {
                  "summary": "2-3 sentence overview of their financial situation",
                  "insights": ["insight 1", "insight 2"],
                  "suggestions": ["suggestion 1", "suggestion 2"],
                  "warnings": ["warning 1"],
                  "spendingPattern": "Conservative Saver, Balanced Spender, Active Lifestyle, Lifestyle Inflated, or High Risk Spender"
                }
                """.formatted(month, year, context);

        try {
            String rawResponse = callGemini(prompt, true);
            Map<String, Object> parsed = parseJsonResponse(rawResponse);

            return AiAnalysisResponse.builder()
                    .summary(getString(parsed, "summary", "Analysis complete."))
                    .insights(getList(parsed, "insights"))
                    .suggestions(getList(parsed, "suggestions"))
                    .warnings(getList(parsed, "warnings"))
                    .spendingPattern(getString(parsed, "spendingPattern", "Balanced Spender"))
                    .healthScore(Math.round(healthScore * 10.0) / 10.0)
                    .healthGrade(healthGrade)
                    .build();
        } catch (Exception e) {
            log.error("Gemini structured processing exception, rendering standard analysis safety profile: {}", e.getMessage());
            return buildFallbackAnalysis(totalIncome, totalExpenses, categoryData, healthScore, healthGrade);
        }
    }

    public String chat(String userMessage) {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end = YearMonth.now().atEndOfMonth();

        BigDecimal income = orZero(incomeRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        BigDecimal expenses = orZero(expenseRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        BigDecimal savings = income.subtract(expenses);

        String prompt = """
                You are a friendly, expert personal finance assistant named FinanceAI, powered by Google Gemini 3.5.
                Give clear, strategic, and practical budget coaching responses. Keep messages clear and accessible.
                
                User's current snapshot metrics:
                - Income: $%s
                - Expenses: $%s
                - Net Savings: $%s
                - Savings Rate: %s%%
                
                User question: %s
                """.formatted(income, expenses, savings,
                income.compareTo(BigDecimal.ZERO) > 0
                        ? savings.divide(income, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                        : "0.0", userMessage);

        try {
            return callGemini(prompt, false);
        } catch (Exception e) {
            log.error("Gemini context conversational channel communication exception: {}", e.getMessage());
            return "I'm having trouble connecting to Gemini AI right now. Your current net savings total is $" + savings + ". Please trace back in a few seconds.";
        }
    }

    public String categorizeExpense(String title, String description) {
        String prompt = """
                Given this user expense entry:
                Title: "%s"
                Description: "%s"
                
                Identify and return the best fitting structural category tracking label strict from this text array:
                Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Utilities, Housing, Education, Travel, Fitness, Personal Care, Other
                
                Return only the plain textual name string value. No trailing markers, quotes, or formatting markup blocks.
                """.formatted(title, description != null ? description : "");
        try {
            return callGemini(prompt, false).trim().replaceAll("[\"'\\n*`]", "");
        } catch (Exception e) {
            log.warn("Gemini fall-through categorization processor warning: {}", e.getMessage());
            return "Other";
        }
    }

    public List<String> getSmartSavingTips() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end = YearMonth.now().atEndOfMonth();

        List<Object[]> categories = expenseRepository.findCategoryWiseSummary(user.getId(), start, end);
        if (categories.isEmpty()) {
            return List.of(
                    "Track your daily expenses to identify where your money goes.",
                    "Set up automatic transfers to a savings account on payday.",
                    "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings."
            );
        }

        String topCategories = categories.stream().limit(5)
                .map(row -> row[0] + ": $" + row[1])
                .collect(Collectors.joining(", "));

        String prompt = """
                A user's top spending metrics are defined as: %s
                Generate exactly 5 distinct, practical, highly actionable money-saving tips structured cleanly as a flat JSON string array.
                """.formatted(topCategories);

        try {
            String raw = callGemini(prompt, true).trim();
            String cleanJson = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            JsonNode node = objectMapper.readTree(cleanJson);
            List<String> tips = new ArrayList<>();
            if (node.isArray()) {
                node.forEach(n -> tips.add(n.asText()));
            }
            return tips;
        } catch (Exception e) {
            log.warn("Gemini programmatic parsing tip evaluation exception: {}", e.getMessage());
            return List.of(
                    "Reduce dining out — cook at home 3+ times per week.",
                    "Review subscriptions and cancel unused ones.",
                    "Use cashback programs when shopping.",
                    "Batch travel errands to lower transportation costs.",
                    "Set a weekly discretionary limit and track it daily."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI HTTP ROUTING INTEGRATION
    // ─────────────────────────────────────────────────────────────────────────
    private String callGemini(String prompt, boolean forceJson) {
        // Clear potential bracket wrappers or hidden markdown parsed components from config URL setup strings
        String cleanBaseUrl = geminiBaseUrl.replaceAll("[\\[\\]\\(\\)]", "").trim();
        if (cleanBaseUrl.contains(" ")) {
            cleanBaseUrl = cleanBaseUrl.split(" ")[0];
        }

        String url = cleanBaseUrl + "/" + geminiModel + ":generateContent?key=" + geminiApiKey.trim();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build request body safely with mutable Maps instead of immutable Map.of() entries
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> contentsElement = new HashMap<>();
        contentsElement.put("parts", List.of(textPart));

        Map<String, Object> configMap = new HashMap<>();
        configMap.put("maxOutputTokens", maxOutputTokens);
        configMap.put("temperature", forceJson ? 0.1 : 0.7);

        if (forceJson) {
            configMap.put("responseMimeType", "application/json");
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(contentsElement));
        requestBody.put("generationConfig", configMap);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Gemini channel dropped, reporting state code: " + response.getStatusCode());
            }

            List<?> candidates = (List<?>) response.getBody().get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Empty response payloads delivered from Gemini compute framework nodes.");
            }

            Map<?, ?> topCandidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> contentMap = (Map<?, ?>) topCandidate.get("content");
            List<?> parts = (List<?>) contentMap.get("parts");
            Map<?, ?> textObj = (Map<?, ?>) parts.get(0);

            return (String) textObj.get("text");
        } catch (Exception e) {
            log.error("Failed to complete communication loop with Gemini network services: {}", e.getMessage());
            throw new RuntimeException("Gemini execution connection error core routing", e);
        }
    }

    private double calculateHealthScore(BigDecimal income, BigDecimal expenses, List<Object[]> categories) {
        if (income.compareTo(BigDecimal.ZERO) == 0) return 50.0;
        double score = 0;

        double savingsRate = 1.0 - expenses.divide(income, 4, RoundingMode.HALF_UP).doubleValue();
        if (savingsRate >= 0.30) score += 40;
        else if (savingsRate >= 0.20) score += 30;
        else if (savingsRate >= 0.10) score += 20;
        else if (savingsRate >= 0)    score += 10;

        if (!categories.isEmpty() && expenses.compareTo(BigDecimal.ZERO) > 0) {
            double entropy = 0;
            for (Object[] row : categories) {
                double p = new BigDecimal(row[1].toString()).divide(expenses, 6, RoundingMode.HALF_UP).doubleValue();
                if (p > 0) entropy -= p * (Math.log(p) / Math.log(2));
            }
            double maxEntropy = Math.log(categories.size()) / Math.log(2);
            double normalized = maxEntropy > 0 ? entropy / maxEntropy : 0;
            score += normalized * 30;
        }

        score += 20;
        double expRatio = expenses.divide(income, 4, RoundingMode.HALF_UP).doubleValue();
        if (expRatio <= 0.70) score += 10;

        return Math.min(100.0, Math.max(0.0, score));
    }

    private String buildFinancialContext(BigDecimal income, BigDecimal expenses, List<Object[]> categories) {
        StringBuilder sb = new StringBuilder();
        sb.append("Total Income: $").append(income).append("\n");
        sb.append("Total Expenses: $").append(expenses).append("\n");
        sb.append("Net Savings: $").append(income.subtract(expenses)).append("\n");

        if (income.compareTo(BigDecimal.ZERO) > 0) {
            double savingsRate = 1.0 - expenses.divide(income, 4, RoundingMode.HALF_UP).doubleValue();
            sb.append("Savings Rate: ").append(String.format("%.1f%%", savingsRate * 100)).append("\n");
        }
        if (!categories.isEmpty()) {
            sb.append("Category Breakdown Metrics:\n");
            categories.forEach(row -> sb.append(" - ").append(row[0]).append(": $").append(row[1]).append("\n"));
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonResponse(String raw) throws Exception {
        String clean = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        return objectMapper.readValue(clean, Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<String> getList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List) {
            return ((List<?>) val).stream().map(Object::toString).collect(Collectors.toList());
        }
        return new ArrayList<>();
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object val = map.get(key);
        return val != null ? val.toString() : defaultVal;
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private AiAnalysisResponse buildFallbackAnalysis(BigDecimal income, BigDecimal expenses, List<Object[]> categories, double healthScore, String grade) {
        List<String> insights = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        double savingsRate = income.compareTo(BigDecimal.ZERO) > 0
                ? (1.0 - expenses.divide(income, 4, RoundingMode.HALF_UP).doubleValue()) * 100 : 0;

        insights.add(String.format("Calculated savings rate currently sits near %.1f%%.", savingsRate));
        insights.add("Discretionary spending aggregates: $" + expenses + " against an itemized tracking base of $" + income + ".");

        suggestions.add("Aim to scale net savings parameters up closer to standard target ratios.");

        return AiAnalysisResponse.builder()
                .summary("System analytical execution experienced response variance; showing programmatic data projection.")
                .insights(insights)
                .suggestions(suggestions)
                .warnings(Collections.emptyList())
                .spendingPattern("Balanced Spender")
                .healthScore(Math.round(healthScore * 10.0) / 10.0)
                .healthGrade(grade)
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Active secure authorization context mapping expired."));
    }
}