package by.foxclub.service;

import by.foxclub.dto.PurchasedAbonementDto;
import by.foxclub.entity.Abonement;
import by.foxclub.entity.PurchasedAbonement;
import by.foxclub.entity.User;
import by.foxclub.mapper.PurchasedAbonementMapper;
import by.foxclub.repository.AbonementRepository;
import by.foxclub.repository.PurchasedAbonementRepository;
import by.foxclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchasedAbonementService {

    private final PurchasedAbonementRepository repository;
    private final UserRepository userRepository;
    private final AbonementRepository abonementRepository;
    private final PurchasedAbonementMapper mapper;

    public List<PurchasedAbonementDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public PurchasedAbonementDto getById(Integer id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new RuntimeException("Purchased abonement not found"));
    }

    public List<PurchasedAbonementDto> getByUserId(Integer userId) {
        return repository.findAll().stream()
                .filter(p -> p.getUser() != null && userId.equals(p.getUser().getId()))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public List<PurchasedAbonementDto> getActiveByUserId(Integer userId) {
        LocalDate now = LocalDate.now();
        return repository.findAll().stream()
                .filter(p -> p.getUser() != null && userId.equals(p.getUser().getId()))
                .filter(p -> p.getEndDate() != null && p.getEndDate().isAfter(now))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PurchasedAbonementDto create(PurchasedAbonementDto dto) {
        log.info("Creating purchased abonement: {}", dto);

        if (dto.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }
        if (dto.getAbonementId() == null) {
            throw new RuntimeException("Abonement ID is required");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));

        Abonement abonement = abonementRepository.findById(dto.getAbonementId())
                .orElseThrow(() -> new RuntimeException("Abonement not found with id: " + dto.getAbonementId()));

        PurchasedAbonement entity = new PurchasedAbonement();
        entity.setUser(user);
        entity.setAbonement(abonement);
        entity.setPurchaseDate(dto.getPurchaseDate() != null ? dto.getPurchaseDate() : LocalDate.now());
        entity.setStartDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now());
        entity.setEndDate(dto.getEndDate());
        entity.setPriceAtPurchase(dto.getPriceAtPurchase() != null ? dto.getPriceAtPurchase() : abonement.getPrice());

        PurchasedAbonement saved = repository.save(entity);
        log.info("Saved purchased abonement with id: {}", saved.getId());

        return mapper.toDto(saved);
    }

    @Transactional
    public PurchasedAbonementDto update(Integer id, PurchasedAbonementDto dto) {
        PurchasedAbonement existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchased abonement not found"));

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existing.setUser(user);
        }

        if (dto.getAbonementId() != null) {
            Abonement abonement = abonementRepository.findById(dto.getAbonementId())
                    .orElseThrow(() -> new RuntimeException("Abonement not found"));
            existing.setAbonement(abonement);
        }

        if (dto.getPurchaseDate() != null) existing.setPurchaseDate(dto.getPurchaseDate());
        if (dto.getStartDate() != null) existing.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) existing.setEndDate(dto.getEndDate());
        if (dto.getPriceAtPurchase() != null) existing.setPriceAtPurchase(dto.getPriceAtPurchase());

        PurchasedAbonement saved = repository.save(existing);
        return mapper.toDto(saved);
    }

    @Transactional
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}