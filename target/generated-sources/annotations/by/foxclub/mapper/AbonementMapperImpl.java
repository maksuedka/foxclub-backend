package by.foxclub.mapper;

import by.foxclub.dto.AbonementDto;
import by.foxclub.entity.Abonement;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-17T00:51:46+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class AbonementMapperImpl implements AbonementMapper {

    @Override
    public AbonementDto toDto(Abonement abonement) {
        if ( abonement == null ) {
            return null;
        }

        AbonementDto abonementDto = new AbonementDto();

        abonementDto.setDate( abonement.getDate() );
        abonementDto.setDuration( abonement.getDuration() );
        abonementDto.setId( abonement.getId() );
        abonementDto.setName( abonement.getName() );
        abonementDto.setPrice( abonement.getPrice() );

        return abonementDto;
    }

    @Override
    public Abonement toEntity(AbonementDto dto) {
        if ( dto == null ) {
            return null;
        }

        Abonement abonement = new Abonement();

        abonement.setDate( dto.getDate() );
        abonement.setDuration( dto.getDuration() );
        abonement.setId( dto.getId() );
        abonement.setName( dto.getName() );
        abonement.setPrice( dto.getPrice() );

        return abonement;
    }
}
