package com.financetracker.service.impl;

import com.financetracker.dto.request.CategoryRequest;
import com.financetracker.dto.response.CategoryResponse;
import com.financetracker.entity.Category;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryResponse create(CategoryRequest req) {
        User user = currentUser();
        if (categoryRepository.existsByNameAndUserId(req.getName(), user.getId())) {
            throw new BadRequestException("Category '" + req.getName() + "' already exists.");
        }
        Category cat = Category.builder()
                .name(req.getName()).icon(req.getIcon()).color(req.getColor())
                .type(Category.CategoryType.valueOf(req.getType().toUpperCase()))
                .isDefault(false).user(user).build();
        return toResponse(categoryRepository.save(cat));
    }

    public CategoryResponse update(Long id, CategoryRequest req) {
        User user = currentUser();
        Category cat = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        if (cat.isDefault()) throw new BadRequestException("Cannot modify default categories.");
        cat.setName(req.getName());
        cat.setIcon(req.getIcon());
        cat.setColor(req.getColor());
        cat.setType(Category.CategoryType.valueOf(req.getType().toUpperCase()));
        return toResponse(categoryRepository.save(cat));
    }

    public void delete(Long id) {
        User user = currentUser();
        Category cat = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        if (cat.isDefault()) throw new BadRequestException("Cannot delete default categories.");
        categoryRepository.delete(cat);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        User user = currentUser();
        return categoryRepository.findByIsDefaultTrueOrUserId(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId()).name(c.getName()).icon(c.getIcon())
                .color(c.getColor()).type(c.getType().name()).isDefault(c.isDefault())
                .build();
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
