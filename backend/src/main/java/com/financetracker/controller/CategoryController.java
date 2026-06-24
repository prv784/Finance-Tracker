package com.financetracker.controller;

import com.financetracker.dto.request.CategoryRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.CategoryResponse;
import com.financetracker.service.impl.CategoryServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Categories")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CategoryServiceImpl categoryService;

    @PostMapping
    @Operation(summary = "Create custom category")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.create(req), "Category created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update custom category")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.update(id, req), "Category updated"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete custom category")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted"));
    }

    @GetMapping
    @Operation(summary = "List all categories for current user")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAll(), "Categories fetched"));
    }
}
