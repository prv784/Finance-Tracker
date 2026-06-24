package com.financetracker.controller;

import com.financetracker.dto.request.BudgetRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.BudgetResponse;
import com.financetracker.service.impl.BudgetServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets")
@SecurityRequirement(name = "bearerAuth")
public class BudgetController {

    private final BudgetServiceImpl budgetService;

    @PostMapping
    @Operation(summary = "Create budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> create(@Valid @RequestBody BudgetRequest req) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.createBudget(req), "Budget created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            @PathVariable Long id, @Valid @RequestBody BudgetRequest req) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.updateBudget(id, req), "Budget updated"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete budget")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted"));
    }

    @GetMapping
    @Operation(summary = "List budgets – optional filters: month, year")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getAll(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgets(month, year), "Budgets fetched"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget by ID")
    public ResponseEntity<ApiResponse<BudgetResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgetById(id), "Budget fetched"));
    }
}
