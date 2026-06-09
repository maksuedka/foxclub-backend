package by.foxclub.mapper;

import by.foxclub.dto.PurchasedAbonementDto;
import by.foxclub.entity.PurchasedAbonement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface PurchasedAbonementMapper {

    @Mappings({
            @Mapping(target = "userId", source = "user.id"),
            @Mapping(target = "abonementId", source = "abonement.id"),
            @Mapping(target = "abonementName", source = "abonement.name")
    })
    PurchasedAbonementDto toDto(PurchasedAbonement entity);

    @Mappings({
            @Mapping(target = "user", ignore = true),
            @Mapping(target = "abonement", ignore = true)
    })
    PurchasedAbonement toEntity(PurchasedAbonementDto dto);
}