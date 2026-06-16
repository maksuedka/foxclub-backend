package by.foxclub.mapper;

import by.foxclub.dto.ClubDto;
import by.foxclub.entity.Club;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-17T00:51:46+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ClubMapperImpl implements ClubMapper {

    @Override
    public ClubDto toDto(Club club) {
        if ( club == null ) {
            return null;
        }

        ClubDto clubDto = new ClubDto();

        clubDto.setAddress( club.getAddress() );
        clubDto.setContacts( club.getContacts() );
        clubDto.setId( club.getId() );
        clubDto.setName( club.getName() );
        clubDto.setWorkingHours( club.getWorkingHours() );

        return clubDto;
    }

    @Override
    public Club toEntity(ClubDto dto) {
        if ( dto == null ) {
            return null;
        }

        Club club = new Club();

        club.setAddress( dto.getAddress() );
        club.setContacts( dto.getContacts() );
        club.setId( dto.getId() );
        club.setName( dto.getName() );
        club.setWorkingHours( dto.getWorkingHours() );

        return club;
    }
}
