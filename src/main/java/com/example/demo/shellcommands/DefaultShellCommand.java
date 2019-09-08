package com.example.demo.shellcommands;

import org.springframework.shell.Input;

public interface DefaultShellCommand {
    Object run(Input input);
}
