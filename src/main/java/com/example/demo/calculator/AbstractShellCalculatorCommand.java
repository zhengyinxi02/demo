package com.example.demo.calculator;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.shellcommands.DefaultShellCommand;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import java.util.stream.Collectors;

public abstract class AbstractShellCalculatorCommand implements DefaultShellCommand {

    @Autowired
    @Lazy
    protected Calculator stack;


    public String stackToString() {
     return  String.format("stack: %s",
             String.join(" ", stack.getValues().stream().map(String::valueOf).collect(Collectors.toList())));
    }
}
