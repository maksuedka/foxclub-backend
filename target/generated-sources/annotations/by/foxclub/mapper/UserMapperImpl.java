package by.foxclub.mapper;

import by.foxclub.dto.UserDto;
import by.foxclub.entity.Club;
import by.foxclub.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-13T18:55:30+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDto toDto(User user) {
        if ( user == null ) {
            return null;
        }

        UserDto userDto = new UserDto();

        userDto.setClubId( userClubId( user ) );
        userDto.setAvatarUrl( user.getAvatarUrl() );
        userDto.setEmail( user.getEmail() );
        userDto.setFirstName( user.getFirstName() );
        userDto.setId( user.getId() );
        userDto.setLastName( user.getLastName() );

        return userDto;
    }

    @Override
    public User toEntity(UserDto dto) {
        if ( dto == null ) {
            return null;
        }

        User user = new User();

        user.setAvatarUrl( dto.getAvatarUrl() );
        user.setEmail( dto.getEmail() );
        user.setFirstName( dto.getFirstName() );
        user.setId( dto.getId() );
        user.setLastName( dto.getLastName() );

        return user;
    }

    private Integer userClubId(User user) {
        if ( user == null ) {
            return null;
        }
        Club club = user.getClub();
        if ( club == null ) {
            return null;
        }
        Integer id = club.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
