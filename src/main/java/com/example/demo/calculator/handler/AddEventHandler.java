package com.example.demo.calculator.handler;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.calculator.event.AddEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AddEventHandler implements Handler<AddEvent> {

    @Autowired
    Calculator calc;

    @Override
    public void onEvent(AddEvent event) {

        calc.doBiOperation(event.getOperator(), (first, second) -> {
            return first.add(second);
        }, null);
    }
}
