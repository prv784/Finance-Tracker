package com.financetracker.service.impl;

import com.financetracker.dto.response.BudgetResponse;
import com.financetracker.dto.response.DashboardResponse;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.ExpenseRepository;
import com.financetracker.repository.IncomeRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl {

    private final ExpenseRepository  expenseRepository;
    private final IncomeRepository   incomeRepository;
    private final BudgetRepository   budgetRepository;
    private final UserRepository     userRepository;
    private final ExpenseServiceImpl expenseService;
    private final IncomeServiceImpl  incomeService;
    private final BudgetServiceImpl  budgetService;

    /**
     * ALGORITHM – Dashboard Analytics
     * ────────────────────────────────
     * 1. Pull total income & total expenses for the selected month via native SUM queries.
     * 2. Savings = income − expenses.
     * 3. Savings Rate = (savings / income) × 100.
     * 4. Category breakdown: native GROUP BY query → percentage per category.
     * 5. Monthly trend: for each month 1‒12 fill income/expense/savings from DB;
     *    missing months default to ZERO so charts render a full year.
     * 6. Recent 10 expenses + 5 incomes for the activity feed.
     * 7. Active budgets for the selected month with live spent/remaining figures.
     */
    public DashboardResponse getDashboard(int year, int month) {
        User user = currentUser();

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = YearMonth.of(year, month).atEndOfMonth();

        // ── Totals ──────────────────────────────────────────────────────────
        BigDecimal totalIncome   = orZero(incomeRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        BigDecimal totalExpenses = orZero(expenseRepository.sumByUserIdAndDateBetween(user.getId(), start, end));
        BigDecimal totalSavings  = totalIncome.subtract(totalExpenses);

        double savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalSavings.divide(totalIncome, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        // ── Category breakdown (pie chart) ──────────────────────────────────
        List<Object[]> catRows = expenseRepository.findCategoryWiseSummary(user.getId(), start, end);
        List<DashboardResponse.CategorySummary> byCategory = buildCategorySummary(catRows, totalExpenses);

        // ── 12-month trend (area + bar charts) ──────────────────────────────
        List<DashboardResponse.MonthlyData> monthly = buildMonthlyData(user.getId(), year);

        // ── Recent transactions ──────────────────────────────────────────────
        var recentExpenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream().limit(10).map(expenseService::toResponse).collect(Collectors.toList());

        var recentIncomes = incomeRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream().limit(5).map(incomeService::toResponse).collect(Collectors.toList());

        // ── Active budgets ──────────────────────────────────────────────────
        List<BudgetResponse> activeBudgets = budgetRepository
                .findByUserIdAndMonthAndYear(user.getId(), month, year)
                .stream().map(budgetService::toResponse).collect(Collectors.toList());

        long totalTx = expenseRepository.countByUserIdAndDateBetween(user.getId(), start, end);

        return DashboardResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .totalSavings(totalSavings)
                .savingsRate(Math.max(savingsRate, 0.0))
                .expenseByCategory(byCategory)
                .monthlyData(monthly)
                .recentExpenses(recentExpenses)
                .recentIncomes(recentIncomes)
                .activeBudgets(activeBudgets)
                .totalTransactions((int) totalTx)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build category pie-chart data.
     * Each row from DB: [categoryName, sumAmount]
     * percentage = (amount / totalExpenses) × 100
     * Colors are deterministically derived from category name hash.
     */
    private List<DashboardResponse.CategorySummary> buildCategorySummary(
            List<Object[]> rows, BigDecimal totalExpenses) {

        String[] COLORS = {
            "#667eea","#764ba2","#f5576c","#f093fb","#4facfe",
            "#43e97b","#fa709a","#fee140","#30cfd0","#a18cd1"
        };

        return rows.stream().map(row -> {
            String name   = (String) row[0];
            BigDecimal amt = new BigDecimal(row[1].toString());
            double pct = totalExpenses.compareTo(BigDecimal.ZERO) > 0
                    ? amt.divide(totalExpenses, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;
            int colorIdx = Math.abs(name.hashCode()) % COLORS.length;
            return DashboardResponse.CategorySummary.builder()
                    .category(name).amount(amt)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .color(COLORS[colorIdx])
                    .build();
        }).sorted(Comparator.comparing(DashboardResponse.CategorySummary::getAmount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Build 12-month trend array.
     * Queries income and expense totals grouped by month for the full year.
     * Fills missing months with ZERO so the frontend chart always has 12 data points.
     */
    private List<DashboardResponse.MonthlyData> buildMonthlyData(Long userId, int year) {
        List<Object[]> expRows = expenseRepository.findMonthlyExpenseSummary(userId, year);
        List<Object[]> incRows = incomeRepository.findMonthlyIncomeSummary(userId, year);

        Map<Integer, BigDecimal> expMap = new HashMap<>();
        Map<Integer, BigDecimal> incMap = new HashMap<>();
        expRows.forEach(r -> expMap.put(((Number) r[0]).intValue(), new BigDecimal(r[1].toString())));
        incRows.forEach(r -> incMap.put(((Number) r[0]).intValue(), new BigDecimal(r[1].toString())));

        List<DashboardResponse.MonthlyData> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal inc = incMap.getOrDefault(m, BigDecimal.ZERO);
            BigDecimal exp = expMap.getOrDefault(m, BigDecimal.ZERO);
            BigDecimal sav = inc.subtract(exp);
            String monthName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            result.add(DashboardResponse.MonthlyData.builder()
                    .month(monthName).monthNumber(m)
                    .income(inc).expenses(exp).savings(sav)
                    .build());
        }
        return result;
    }

    private BigDecimal orZero(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
