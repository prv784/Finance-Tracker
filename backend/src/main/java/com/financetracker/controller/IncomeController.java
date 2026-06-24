package com.financetracker.controller;

import com.financetracker.dto.request.IncomeRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.IncomeResponse;
import com.financetracker.service.impl.IncomeServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/income")
@RequiredArgsConstructor
@Tag(name = "Income")
@SecurityRequirement(name = "bearerAuth")
public class IncomeController {

    private final IncomeServiceImpl incomeService;

    @PostMapping
    @Operation(summary = "Create income entry")
    public ResponseEntity<ApiResponse<IncomeResponse>> create(@Valid @RequestBody IncomeRequest req) {
        return ResponseEntity.ok(ApiResponse.success(incomeService.create(req), "Income added"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update income entry")
    public ResponseEntity<ApiResponse<IncomeResponse>> update(@PathVariable Long id, @Valid @RequestBody IncomeRequest req) {
        return ResponseEntity.ok(ApiResponse.success(incomeService.update(id, req), "Income updated"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete income entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        incomeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Income deleted"));
    }

    @GetMapping
    @Operation(summary = "List income – optional filters: startDate, endDate")
    public ResponseEntity<ApiResponse<List<IncomeResponse>>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(incomeService.getAll(startDate, endDate), "Income fetched"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get income by ID")
    public ResponseEntity<ApiResponse<IncomeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(incomeService.getById(id), "Income fetched"));
    }
}
