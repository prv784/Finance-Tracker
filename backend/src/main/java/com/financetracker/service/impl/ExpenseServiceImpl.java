package com.financetracker.service.impl;

import com.financetracker.dto.request.ExpenseRequest;
import com.financetracker.dto.response.CategoryResponse;
import com.financetracker.dto.response.ExpenseResponse;
import com.financetracker.entity.Category;
import com.financetracker.entity.Expense;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.ExpenseRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseServiceImpl {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ExpenseResponse create(ExpenseRequest req) {
        User user = currentUser();
        Expense e = Expense.builder()
                .title(req.getTitle()).description(req.getDescription())
                .amount(req.getAmount()).date(req.getDate())
                .paymentMethod(req.getPaymentMethod()).notes(req.getNotes())
                .isRecurring(req.isRecurring()).user(user)
                .build();
        if (req.getCategoryId() != null) {
            e.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId())));
        }
        if (req.getRecurrenceType() != null && !req.getRecurrenceType().isBlank()) {
            e.setRecurrenceType(Expense.RecurrenceType.valueOf(req.getRecurrenceType().toUpperCase()));
        }
        return toResponse(expenseRepository.save(e));
    }

    public ExpenseResponse update(Long id, ExpenseRequest req) {
        User user = currentUser();
        Expense e = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
        e.setTitle(req.getTitle());
        e.setDescription(req.getDescription());
        e.setAmount(req.getAmount());
        e.setDate(req.getDate());
        e.setPaymentMethod(req.getPaymentMethod());
        e.setNotes(req.getNotes());
        e.setRecurring(req.isRecurring());
        if (req.getCategoryId() != null) {
            e.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId())));
        }
        if (req.getRecurrenceType() != null && !req.getRecurrenceType().isBlank()) {
            e.setRecurrenceType(Expense.RecurrenceType.valueOf(req.getRecurrenceType().toUpperCase()));
        }
        return toResponse(expenseRepository.save(e));
    }

    public void delete(Long id) {
        User user = currentUser();
        Expense e = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
        expenseRepository.delete(e);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAll(LocalDate startDate, LocalDate endDate, Long categoryId) {
        User user = currentUser();
        List<Expense> list;
        if (startDate != null && endDate != null && categoryId != null) {
            list = expenseRepository.findByUserIdAndDateBetweenAndCategoryIdOrderByDateDesc(
                    user.getId(), startDate, endDate, categoryId);
        } else if (startDate != null && endDate != null) {
            list = expenseRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);
        } else if (categoryId != null) {
            list = expenseRepository.findByUserIdAndCategoryIdOrderByDateDesc(user.getId(), categoryId);
        } else {
            list = expenseRepository.findByUserIdOrderByDateDesc(user.getId());
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        User user = currentUser();
        return toResponse(expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id)));
    }

    public ExpenseResponse toResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId()).title(e.getTitle()).description(e.getDescription())
                .amount(e.getAmount()).date(e.getDate())
                .category(e.getCategory() != null ? toCatResponse(e.getCategory()) : null)
                .paymentMethod(e.getPaymentMethod()).notes(e.getNotes())
                .isRecurring(e.isRecurring())
                .recurrenceType(e.getRecurrenceType() != null ? e.getRecurrenceType().name() : null)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                .build();
    }

    public CategoryResponse toCatResponse(Category c) {
        return CategoryResponse.builder().id(c.getId()).name(c.getName())
                .icon(c.getIcon()).color(c.getColor()).type(c.getType().name())
                .isDefault(c.isDefault()).build();
    }

    User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
