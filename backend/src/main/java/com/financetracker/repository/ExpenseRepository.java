package com.financetracker.repository;

import com.financetracker.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserIdOrderByDateDesc(Long userId);
    List<Expense> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate start, LocalDate end);
    List<Expense> findByUserIdAndCategoryIdOrderByDateDesc(Long userId, Long categoryId);
    List<Expense> findByUserIdAndDateBetweenAndCategoryIdOrderByDateDesc(Long userId, LocalDate start, LocalDate end, Long categoryId);
    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = :userId AND date BETWEEN :start AND :end", nativeQuery = true)
    BigDecimal sumByUserIdAndDateBetween(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = :userId AND category_id = :catId AND date BETWEEN :start AND :end", nativeQuery = true)
    BigDecimal sumByUserIdAndCategoryIdAndDateBetween(@Param("userId") Long userId, @Param("catId") Long catId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT c.name, SUM(e.amount) as total FROM expenses e JOIN categories c ON e.category_id = c.id WHERE e.user_id = :userId AND e.date BETWEEN :start AND :end GROUP BY c.name ORDER BY total DESC", nativeQuery = true)
    List<Object[]> findCategoryWiseSummary(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT EXTRACT(MONTH FROM date) as month, SUM(amount) as total FROM expenses WHERE user_id = :userId AND EXTRACT(YEAR FROM date) = :year GROUP BY EXTRACT(MONTH FROM date) ORDER BY month", nativeQuery = true)
    List<Object[]> findMonthlyExpenseSummary(@Param("userId") Long userId, @Param("year") int year);

    @Query(value = "SELECT COUNT(*) FROM expenses WHERE user_id = :userId AND date BETWEEN :start AND :end", nativeQuery = true)
    long countByUserIdAndDateBetween(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
