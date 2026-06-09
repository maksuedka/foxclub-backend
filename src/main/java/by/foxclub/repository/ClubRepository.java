package by.foxclub.repository;

import by.foxclub.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, Integer> {

    boolean existsByName(String name);

    @Query("SELECT c FROM Club c WHERE LOWER(c.address) LIKE LOWER(CONCAT('%', :city, '%'))")
    List<Club> findByCityInAddress(@Param("city") String city);
}