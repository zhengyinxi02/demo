package com.example.demo.calculator.handler;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.calculator.event.ClearEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ClearEventHandler implements Handler<ClearEvent> {

    @Autowired
    Calculator calc;

    @Override
    public Class<ClearEvent> getEventClass() {
        return ClearEvent.class;
    }

    @Override
    public void onEvent(ClearEvent event) {
        calc.doClear();
    }
}