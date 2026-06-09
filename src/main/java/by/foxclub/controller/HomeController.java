package by.foxclub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
    
    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }
    
    @GetMapping("/profile")
    public String profile() {
        return "forward:/profile.html";
    }
    
    @GetMapping("/post-feed")
    public String postFeed() {
        return "forward:/post-feed.html";
    }
    
    @GetMapping("/admin-panel")
    public String adminPanel() {
        return "forward:/admin-panel.html";
    }
    
    @GetMapping("/scanner")
    public String scanner() {
        return "forward:/scanner.html";
    }
}