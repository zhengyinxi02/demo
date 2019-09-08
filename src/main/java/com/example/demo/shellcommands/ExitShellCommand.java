package com.example.demo.shellcommands;

import org.springframework.shell.ExitRequest;
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;

@ShellComponent
public class ExitShellCommand {
    @ShellMethod(value = "Exit the shell.", key = {"quit", "exit"})
    public void quit() {
        throw new ExitRequest();
    }
}
