package by.foxclub.mapper;

import by.foxclub.dto.AdminDto;
import by.foxclub.entity.Admin;
import by.foxclub.entity.Club;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-13T18:55:30+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
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
        adminDto.setEmail( admin.getEmail() );
        adminDto.setFirstName( admin.getFirstName() );
        adminDto.setId( admin.getId() );
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
        admin.setEmail( dto.getEmail() );
        admin.setFirstName( dto.getFirstName() );
        admin.setId( dto.getId() );
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
