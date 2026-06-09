package by.foxclub.controller;

import by.foxclub.dto.PostResponse;
import by.foxclub.entity.Post;
import by.foxclub.entity.PostImage;
import by.foxclub.entity.PostStatus;
import by.foxclub.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostsController {

    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        List<Post> posts = postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<PostResponse> response = posts.stream()
                .map(this::toPostResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/moderate")
@Transactional
public ResponseEntity<?> moderate(@PathVariable Integer id,
                                  @RequestBody Map<String, String> body) {
    String statusStr = body.get("status");
    PostStatus newStatus;
    try {
        newStatus = PostStatus.valueOf(statusStr);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Неверный статус: " + statusStr));
    }
    Post post = postRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Пост не найден"));
    post.setStatus(newStatus);
    Post saved = postRepository.save(post);
    return ResponseEntity.ok(Map.of("id", saved.getId(), "status", saved.getStatus().name()));
}

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePost(@PathVariable Integer id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пост не найден"));
        postRepository.delete(post);
        return ResponseEntity.ok().build();
    }

    private PostResponse toPostResponse(Post post) {
        // Инициализируем lazy-поля для безопасного DTO
        List<String> images = post.getImages() == null ? List.of() :
                post.getImages().stream().map(PostImage::getImageUrl).collect(Collectors.toList());

        PostResponse pr = new PostResponse();
        pr.setId(post.getId());
        pr.setAuthorId(post.getAuthor() != null ? post.getAuthor().getId() : null);
        pr.setAuthorFirstName(post.getAuthor() != null ? post.getAuthor().getFirstName() : null);
        pr.setAuthorLastName(post.getAuthor() != null ? post.getAuthor().getLastName() : null);
        pr.setText(post.getText());
        pr.setStatus(post.getStatus());
        pr.setCreatedAt(post.getCreatedAt());
        pr.setImages(images);
        return pr;
    }
}