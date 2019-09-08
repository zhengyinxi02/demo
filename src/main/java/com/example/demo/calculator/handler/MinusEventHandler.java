package com.example.demo.calculator.handler;

import com.example.demo.calculator.Calculator;
import com.example.demo.calculator.event.MinusEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MinusEventHandler implements Handler<MinusEvent> {

    @Autowired
    Calculator calc;
    @Override
    public Class<MinusEvent> getEventClass() {
        return MinusEvent.class;
    }

    @Override
    public void onEvent(MinusEvent event) {
        calc.doBiOperation(event.getOperator(), (l, r) -> {
            return l.subtract(r);
        });
    }
}
