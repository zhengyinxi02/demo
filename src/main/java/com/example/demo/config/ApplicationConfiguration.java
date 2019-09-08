package com.example.demo.config;

import org.springframework.boot.ExitCodeExceptionMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.shell.ExitRequest;

@Configuration
public class ApplicationConfiguration {

    @Bean
    public ExitCodeExceptionMapper exitCodeExceptionMapper() {
        return exception -> {
            Throwable e = exception;
            while (e != null && !(e instanceof ExitRequest)) {
                e = e.getCause();
            }
            return e == null ? 1 : ((ExitRequest) e).status();
        };
    }

}
