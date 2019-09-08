package com.example.demo.calculator;

import com.example.demo.event.EventDispatcher;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;

@Component
public class CalculatorEventDispatcher extends EventDispatcher {

    @Autowired
    List<Handler> handlers;

    @PostConstruct
    public void register(){
        handlers.stream().forEach(h->{
            super.registerHandler(h.getEventClass(), h);
        });
    }
}
