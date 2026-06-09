package by.foxclub.repository;

import by.foxclub.entity.Post;
import by.foxclub.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {

    List<Post> findByAuthor_IdAndStatusIn(Integer authorId, List<PostStatus> statuses);

    Page<Post> findByStatus(PostStatus status, Pageable pageable);
}

