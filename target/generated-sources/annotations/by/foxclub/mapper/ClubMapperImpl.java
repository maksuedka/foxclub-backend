package by.foxclub.mapper;

import by.foxclub.dto.ClubDto;
import by.foxclub.entity.Club;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-16T17:44:46+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.5 (BellSoft)"
)
@Component
public class ClubMapperImpl implements ClubMapper {

    @Override
    public ClubDto toDto(Club club) {
        if ( club == null ) {
            return null;
        }

        ClubDto clubDto = new ClubDto();

        clubDto.setId( club.getId() );
        clubDto.setName( club.getName() );
        clubDto.setAddress( club.getAddress() );
        clubDto.setContacts( club.getContacts() );
        clubDto.setWorkingHours( club.getWorkingHours() );

        return clubDto;
    }

    @Override
    public Club toEntity(ClubDto dto) {
        if ( dto == null ) {
            return null;
        }

        Club club = new Club();

        club.setId( dto.getId() );
        club.setName( dto.getName() );
        club.setAddress( dto.getAddress() );
        club.setContacts( dto.getContacts() );
        club.setWorkingHours( dto.getWorkingHours() );

        return club;
    }
}
