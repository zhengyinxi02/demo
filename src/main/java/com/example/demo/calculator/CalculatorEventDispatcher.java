package com.example.demo.calculator;

import com.example.demo.calculator.event.AddEvent;
import com.example.demo.calculator.event.ClearEvent;
import com.example.demo.calculator.event.DivideEvent;
import com.example.demo.calculator.event.MinusEvent;
import com.example.demo.calculator.event.MultiplyEvent;
import com.example.demo.calculator.event.NumberEvent;
import com.example.demo.calculator.event.SqrtEvent;
import com.example.demo.calculator.event.UndoEvent;
import com.example.demo.calculator.handler.AddEventHandler;
import com.example.demo.calculator.handler.ClearEventHandler;
import com.example.demo.calculator.handler.DivideEventHandler;
import com.example.demo.calculator.handler.MinusEventHandler;
import com.example.demo.calculator.handler.MultiplyEventHandler;
import com.example.demo.calculator.handler.NumberEventHandler;
import com.example.demo.calculator.handler.SqrtEventHandler;
import com.example.demo.calculator.handler.UndoEventHandler;
import com.example.demo.event.EventDispatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class CalculatorEventDispatcher extends EventDispatcher {
    @Autowired
    ApplicationContext context;

    @PostConstruct
    public void register() {
        registerHandler(AddEvent.class, context.getBean(AddEventHandler.class));
        registerHandler(ClearEvent.class, context.getBean(ClearEventHandler.class));
        registerHandler(DivideEvent.class, context.getBean(DivideEventHandler.class));
        registerHandler(MinusEvent.class, context.getBean(MinusEventHandler.class));
        registerHandler(MultiplyEvent.class, context.getBean(MultiplyEventHandler.class));
        registerHandler(NumberEvent.class, context.getBean(NumberEventHandler.class));
        registerHandler(SqrtEvent.class, context.getBean(SqrtEventHandler.class));
        registerHandler(UndoEvent.class, context.getBean(UndoEventHandler.class));
    }
}
