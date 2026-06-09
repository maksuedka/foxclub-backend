package by.foxclub.repository;

import by.foxclub.entity.Abonement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AbonementRepository extends JpaRepository<Abonement, Integer> {

}