package by.foxclub.mapper;

import by.foxclub.dto.AbonementDto;
import by.foxclub.entity.Abonement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AbonementMapper {

    AbonementMapper INSTANCE = Mappers.getMapper(AbonementMapper.class);

    AbonementDto toDto(Abonement abonement);

    Abonement toEntity(AbonementDto dto);
}