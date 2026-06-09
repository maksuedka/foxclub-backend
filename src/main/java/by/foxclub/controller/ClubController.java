package by.foxclub.controller;

import by.foxclub.dto.ClubDto;
import by.foxclub.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @GetMapping(params = "city")
    public ResponseEntity<List<ClubDto>> getByCity(@RequestParam String city) {
        return ResponseEntity.ok(clubService.getClubsByCity(city));
    }

    @GetMapping
    public ResponseEntity<List<ClubDto>> getAll() {
        return ResponseEntity.ok(clubService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(clubService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ClubDto> create(@RequestBody ClubDto dto) {
        return ResponseEntity.ok(clubService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClubDto> update(@PathVariable Integer id,
                                          @RequestBody ClubDto dto) {
        return ResponseEntity.ok(clubService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        clubService.delete(id);
        return ResponseEntity.ok().build();
    }
}