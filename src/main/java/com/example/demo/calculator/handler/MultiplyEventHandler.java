package com.example.demo.calculator.handler;

import com.example.demo.calculator.Calculator;
import com.example.demo.calculator.event.MultiplyEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MultiplyEventHandler implements Handler<MultiplyEvent> {

    @Autowired
    Calculator calc;

    @Override
    public Class<MultiplyEvent> getEventClass() {
        return MultiplyEvent.class;
    }

    @Override
    public void onEvent(MultiplyEvent event) {
        calc.doBiOperation(event.getOperator(), (l, r) -> {
            return l.multiply(r);
        });
    }
}
