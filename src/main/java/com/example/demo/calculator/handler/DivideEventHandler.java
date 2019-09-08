package com.example.demo.calculator.handler;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.calculator.event.DivideEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DivideEventHandler implements Handler<DivideEvent> {

    @Autowired
    Calculator calc;

    @Override
    public Class<DivideEvent> getEventClass() {
        return DivideEvent.class;
    }

    @Override
    public void onEvent(DivideEvent event) {
        calc.doBiOperation(event.getOperator(), (l, r) -> {
            return r.divide(l);
        }, (l, r)-> (l.signum() != 0));
    }
}
