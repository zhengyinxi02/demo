package com.example.demo.calculator.handler;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.calculator.event.NumberEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class NumberEventHandler implements Handler<NumberEvent> {

    @Autowired
    Calculator calc;
    @Override
    public Class<NumberEvent> getEventClass() {
        return NumberEvent.class;
    }

    @Override
    public void onEvent(NumberEvent event) {
       calc.doNumeric(event.getArg());
    }
}
