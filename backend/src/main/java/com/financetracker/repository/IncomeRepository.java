package com.financetracker.repository;

import com.financetracker.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUserIdOrderByDateDesc(Long userId);
    List<Income> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate start, LocalDate end);
    Optional<Income> findByIdAndUserId(Long id, Long userId);

    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = :userId AND date BETWEEN :start AND :end", nativeQuery = true)
    BigDecimal sumByUserIdAndDateBetween(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT EXTRACT(MONTH FROM date) as month, SUM(amount) as total FROM income WHERE user_id = :userId AND EXTRACT(YEAR FROM date) = :year GROUP BY EXTRACT(MONTH FROM date) ORDER BY month", nativeQuery = true)
    List<Object[]> findMonthlyIncomeSummary(@Param("userId") Long userId, @Param("year") int year);

    @Query(value = "SELECT source, SUM(amount) as total FROM income WHERE user_id = :userId AND date BETWEEN :start AND :end GROUP BY source ORDER BY total DESC", nativeQuery = true)
    List<Object[]> findSourceWiseSummary(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
