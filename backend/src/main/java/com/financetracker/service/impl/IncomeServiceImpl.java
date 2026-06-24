package com.financetracker.service.impl;

import com.financetracker.dto.request.IncomeRequest;
import com.financetracker.dto.response.IncomeResponse;
import com.financetracker.entity.Income;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.IncomeRepository;
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
public class IncomeServiceImpl {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public IncomeResponse create(IncomeRequest req) {
        User user = currentUser();
        Income income = Income.builder()
                .title(req.getTitle()).description(req.getDescription())
                .amount(req.getAmount()).date(req.getDate())
                .source(parseSource(req.getSource()))
                .notes(req.getNotes()).isRecurring(req.isRecurring())
                .user(user).build();
        if (req.getRecurrenceType() != null && !req.getRecurrenceType().isBlank()) {
            income.setRecurrenceType(Income.RecurrenceType.valueOf(req.getRecurrenceType().toUpperCase()));
        }
        return toResponse(incomeRepository.save(income));
    }

    public IncomeResponse update(Long id, IncomeRequest req) {
        User user = currentUser();
        Income income = incomeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income", id));
        income.setTitle(req.getTitle());
        income.setDescription(req.getDescription());
        income.setAmount(req.getAmount());
        income.setDate(req.getDate());
        income.setSource(parseSource(req.getSource()));
        income.setNotes(req.getNotes());
        income.setRecurring(req.isRecurring());
        if (req.getRecurrenceType() != null && !req.getRecurrenceType().isBlank()) {
            income.setRecurrenceType(Income.RecurrenceType.valueOf(req.getRecurrenceType().toUpperCase()));
        }
        return toResponse(incomeRepository.save(income));
    }

    public void delete(Long id) {
        User user = currentUser();
        Income income = incomeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income", id));
        incomeRepository.delete(income);
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> getAll(LocalDate startDate, LocalDate endDate) {
        User user = currentUser();
        List<Income> list = (startDate != null && endDate != null)
                ? incomeRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate)
                : incomeRepository.findByUserIdOrderByDateDesc(user.getId());
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncomeResponse getById(Long id) {
        User user = currentUser();
        return toResponse(incomeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income", id)));
    }

    public IncomeResponse toResponse(Income i) {
        return IncomeResponse.builder()
                .id(i.getId()).title(i.getTitle()).description(i.getDescription())
                .amount(i.getAmount()).date(i.getDate())
                .source(i.getSource().name()).notes(i.getNotes())
                .isRecurring(i.isRecurring())
                .recurrenceType(i.getRecurrenceType() != null ? i.getRecurrenceType().name() : null)
                .createdAt(i.getCreatedAt()).updatedAt(i.getUpdatedAt())
                .build();
    }

    private Income.IncomeSource parseSource(String source) {
        if (source == null || source.isBlank()) return Income.IncomeSource.OTHER;
        try { return Income.IncomeSource.valueOf(source.toUpperCase()); }
        catch (IllegalArgumentException e) { return Income.IncomeSource.OTHER; }
    }

    User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
