package by.foxclub.mapper;

import by.foxclub.dto.AbonementDto;
import by.foxclub.entity.Abonement;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-10T17:38:20+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.5 (BellSoft)"
)
@Component
public class AbonementMapperImpl implements AbonementMapper {

    @Override
    public AbonementDto toDto(Abonement abonement) {
        if ( abonement == null ) {
            return null;
        }

        AbonementDto abonementDto = new AbonementDto();

        abonementDto.setId( abonement.getId() );
        abonementDto.setName( abonement.getName() );
        abonementDto.setPrice( abonement.getPrice() );
        abonementDto.setDuration( abonement.getDuration() );
        abonementDto.setDate( abonement.getDate() );

        return abonementDto;
    }

    @Override
    public Abonement toEntity(AbonementDto dto) {
        if ( dto == null ) {
            return null;
        }

        Abonement abonement = new Abonement();

        abonement.setId( dto.getId() );
        abonement.setName( dto.getName() );
        abonement.setPrice( dto.getPrice() );
        abonement.setDate( dto.getDate() );
        abonement.setDuration( dto.getDuration() );

        return abonement;
    }
}
