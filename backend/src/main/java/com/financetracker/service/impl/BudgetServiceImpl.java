package com.financetracker.service.impl;

import com.financetracker.dto.request.BudgetRequest;
import com.financetracker.dto.response.BudgetResponse;
import com.financetracker.dto.response.CategoryResponse;
import com.financetracker.entity.Budget;
import com.financetracker.entity.Category;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.ExpenseRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BudgetServiceImpl {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final EmailService emailService;

    public BudgetResponse createBudget(BudgetRequest req) {
        User user = currentUser();
        Budget budget = Budget.builder()
                .name(req.getName())
                .amount(req.getAmount())
                .month(req.getMonth())
                .year(req.getYear())
                .alertThreshold(req.getAlertThreshold())
                .user(user)
                .build();
        if (req.getCategoryId() != null) {
            budget.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId())));
        }
        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse updateBudget(Long id, BudgetRequest req) {
        User user = currentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget", id));
        budget.setName(req.getName());
        budget.setAmount(req.getAmount());
        budget.setMonth(req.getMonth());
        budget.setYear(req.getYear());
        budget.setAlertThreshold(req.getAlertThreshold());
        budget.setAlertSent(false);
        if (req.getCategoryId() != null) {
            budget.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId())));
        } else {
            budget.setCategory(null);
        }
        return toResponse(budgetRepository.save(budget));
    }

    public void deleteBudget(Long id) {
        User user = currentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget", id));
        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Integer month, Integer year) {
        User user = currentUser();
        List<Budget> budgets = (month != null && year != null)
                ? budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                : budgetRepository.findByUserIdOrderByYearDescMonthDesc(user.getId());
        return budgets.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id) {
        User user = currentUser();
        return toResponse(budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget", id)));
    }

    // Runs every hour — checks all budgets that haven't sent an alert yet
    @Scheduled(fixedRate = 3_600_000)
    public void checkBudgetAlerts() {
        List<Budget> budgets = budgetRepository.findByAlertSentFalse();
        for (Budget b : budgets) {
            try {
                BigDecimal spent = calcSpent(b);
                if (b.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    double pct = spent.divide(b.getAmount(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();
                    if (pct >= b.getAlertThreshold().doubleValue()) {
                        emailService.sendBudgetAlert(
                                b.getUser().getEmail(), b.getUser().getFirstName(),
                                b.getName(), spent, b.getAmount(), pct);
                        b.setAlertSent(true);
                        budgetRepository.save(b);
                    }
                }
            } catch (Exception e) {
                log.error("Budget alert check failed for id {}: {}", b.getId(), e.getMessage());
            }
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    public BigDecimal calcSpent(Budget b) {
        LocalDate start = LocalDate.of(b.getYear(), b.getMonth(), 1);
        LocalDate end   = YearMonth.of(b.getYear(), b.getMonth()).atEndOfMonth();
        BigDecimal result = (b.getCategory() != null)
                ? expenseRepository.sumByUserIdAndCategoryIdAndDateBetween(b.getUser().getId(), b.getCategory().getId(), start, end)
                : expenseRepository.sumByUserIdAndDateBetween(b.getUser().getId(), start, end);
        return result != null ? result : BigDecimal.ZERO;
    }

    public BudgetResponse toResponse(Budget b) {
        BigDecimal spent     = calcSpent(b);
        BigDecimal remaining = b.getAmount().subtract(spent);
        double pctUsed = b.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? Math.min(spent.divide(b.getAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue(), 100.0)
                : 0.0;
        CategoryResponse cat = b.getCategory() == null ? null : CategoryResponse.builder()
                .id(b.getCategory().getId()).name(b.getCategory().getName())
                .icon(b.getCategory().getIcon()).color(b.getCategory().getColor())
                .type(b.getCategory().getType().name()).isDefault(b.getCategory().isDefault())
                .build();
        return BudgetResponse.builder()
                .id(b.getId()).name(b.getName()).amount(b.getAmount())
                .month(b.getMonth()).year(b.getYear()).category(cat)
                .alertThreshold(b.getAlertThreshold()).alertSent(b.isAlertSent())
                .spent(spent).remaining(remaining).percentageUsed(pctUsed)
                .createdAt(b.getCreatedAt()).build();
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
