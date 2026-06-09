package by.foxclub.repository;

import by.foxclub.entity.PurchasedAbonement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchasedAbonementRepository extends JpaRepository<PurchasedAbonement, Integer> {

    List<PurchasedAbonement> findByUserId(Integer userId);

    List<PurchasedAbonement> findByAbonementId(Integer abonementId);

    List<PurchasedAbonement> findByUserIdAndEndDateAfter(Integer userId, LocalDate date);
}