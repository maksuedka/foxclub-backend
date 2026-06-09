package by.foxclub.controller;

import by.foxclub.dto.CommentCreateRequest;
import by.foxclub.dto.CommentResponse;
import by.foxclub.dto.PostCreateRequest;
import by.foxclub.dto.PostResponse;
import by.foxclub.entity.*;
import by.foxclub.repository.CommentRepository;
import by.foxclub.repository.PostRepository;
import by.foxclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import by.foxclub.service.ImageKitService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostsController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ImageKitService imageKitService;

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPost(
            @RequestPart("text") String text,
            @RequestPart(name = "images", required = false) List<MultipartFile> images,
            @RequestParam("userId") Integer userId
    ) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (text == null) text = "";
        String trimmed = text.trim();

        if (trimmed.isEmpty() && (images == null || images.isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Текст поста и/или изображения обязательны"));
        }

        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 5) safeImages = safeImages.subList(0, 5);

        Post post = new Post();
        post.setAuthor(author);
        post.setText(trimmed);
        post.setStatus(PostStatus.MODERATION);
        post.setCreatedAt(LocalDateTime.now());

        List<PostImage> postImages = new ArrayList<>();
        for (MultipartFile file : safeImages) {
            if (file == null || file.isEmpty()) continue;
            try {
                String url = imageKitService.uploadAvatar(file);
                PostImage pi = new PostImage();
                pi.setPost(post);
                pi.setImageUrl(url);
                postImages.add(pi);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ошибка загрузки изображения: " + e.getMessage()));
            }
        }
        post.setImages(postImages);

        Post saved = postRepository.save(post);
        return ResponseEntity.ok(toPostResponse(saved));
    }

    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable Integer userId) {
        List<PostStatus> statuses = List.of(PostStatus.MODERATION, PostStatus.APPROVED);
        List<Post> posts = postRepository.findByAuthor_IdAndStatusIn(userId, statuses);
        return ResponseEntity.ok(posts.stream().map(this::toPostResponse).collect(Collectors.toList()));
    }

    @GetMapping("/posts/feed")
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> posts = postRepository.findByStatus(PostStatus.APPROVED, pageable);
        return ResponseEntity.ok(posts.map(this::toPostResponse));
    }

    @PostMapping("/comments")
    public ResponseEntity<?> createComment(@RequestBody CommentCreateRequest request) {
        User author = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Пост не найден"));

        String text = request.getText() == null ? "" : request.getText().trim();
        if (text.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Текст комментария обязателен"));

        Comment comment = new Comment();
        comment.setAuthor(author);
        comment.setPost(post);
        comment.setText(text);
        comment.setCreatedAt(LocalDateTime.now());

        Comment saved = commentRepository.save(comment);
        return ResponseEntity.ok(toCommentResponse(saved));
    }

    @GetMapping("/comments/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Integer postId) {
        List<Comment> comments = commentRepository.findByPost_Id(postId, Sort.by(Sort.Direction.ASC, "createdAt"));
        return ResponseEntity.ok(comments.stream().map(this::toCommentResponse).collect(Collectors.toList()));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Integer id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пост не найден"));
        postRepository.delete(post);
        return ResponseEntity.ok().build();
    }

    private PostResponse toPostResponse(Post post) {
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

    private CommentResponse toCommentResponse(Comment c) {
        CommentResponse cr = new CommentResponse();
        cr.setId(c.getId());
        cr.setPostId(c.getPost() != null ? c.getPost().getId() : null);
        cr.setAuthorId(c.getAuthor() != null ? c.getAuthor().getId() : null);
        cr.setAuthorFirstName(c.getAuthor() != null ? c.getAuthor().getFirstName() : null);
        cr.setAuthorLastName(c.getAuthor() != null ? c.getAuthor().getLastName() : null);
        cr.setText(c.getText());
        cr.setCreatedAt(c.getCreatedAt());
        return cr;
    }
}

