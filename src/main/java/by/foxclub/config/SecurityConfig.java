package by.foxclub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // отключаем CSRF для REST API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**", "/css/**", "/js/**", "/assets/**", "/login.html", "/index.html", "/profile.html", "/post-feed.html", "/admin-panel.html", "/scanner.html", "/*.html").permitAll()
                .anyRequest().permitAll()   // разрешаем всё, авторизация через наш собственный механизм
            )
            .formLogin(form -> form.disable())   // отключаем стандартную страницу логина
            .httpBasic(basic -> basic.disable()); // отключаем basic-аутентификацию
        return http.build();
    }
}