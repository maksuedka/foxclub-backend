package by.foxclub.mapper;

import by.foxclub.dto.AdminDto;
import by.foxclub.entity.Admin;
import by.foxclub.entity.Club;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-10T18:30:03+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.5 (BellSoft)"
)
@Component
public class AdminMapperImpl implements AdminMapper {

    @Override
    public AdminDto toDto(Admin admin) {
        if ( admin == null ) {
            return null;
        }

        AdminDto adminDto = new AdminDto();

        adminDto.setClubId( adminClubId( admin ) );
        adminDto.setId( admin.getId() );
        adminDto.setEmail( admin.getEmail() );
        adminDto.setFirstName( admin.getFirstName() );
        adminDto.setLastName( admin.getLastName() );

        return adminDto;
    }

    @Override
    public Admin toEntity(AdminDto dto) {
        if ( dto == null ) {
            return null;
        }

        Admin admin = new Admin();

        admin.setClub( adminDtoToClub( dto ) );
        admin.setId( dto.getId() );
        admin.setEmail( dto.getEmail() );
        admin.setFirstName( dto.getFirstName() );
        admin.setLastName( dto.getLastName() );

        return admin;
    }

    private Integer adminClubId(Admin admin) {
        if ( admin == null ) {
            return null;
        }
        Club club = admin.getClub();
        if ( club == null ) {
            return null;
        }
        Integer id = club.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    protected Club adminDtoToClub(AdminDto adminDto) {
        if ( adminDto == null ) {
            return null;
        }

        Club club = new Club();

        club.setId( adminDto.getClubId() );

        return club;
    }
}
